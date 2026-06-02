import { getCharacterById } from "@/data";
import { mapCharacterState } from "@/lib/db/mappers";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** POST — 캐릭터 선택 후 user_character_states 저장 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = (await request.json()) as { characterId?: string };
  const characterId = body.characterId;

  if (!characterId) {
    return NextResponse.json({ error: "characterId 필요" }, { status: 400 });
  }

  const character = getCharacterById(characterId);
  if (!character) {
    return NextResponse.json({ error: "캐릭터를 찾을 수 없습니다." }, { status: 404 });
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("user_character_states")
    .upsert(
      {
        user_id: user.id,
        character_id: characterId,
        emotion: character.defaultEmotion,
        expression: character.defaultExpression,
        last_seen_at: now,
      },
      { onConflict: "user_id,character_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ state: mapCharacterState(data) });
}
