import { getCharacterById } from "@/lib/characters/full";
import { touchCharacterSelection } from "@/lib/db/conversations";
import { recentConversationQuery } from "@/lib/activeCharacter";
import { mapCharacterState, mapConversation } from "@/lib/db/mappers";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** POST — 캐릭터 선택 (user_character_states 갱신 + 최근 대화방 정보 반환) */
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

  if (!getCharacterById(characterId)) {
    return NextResponse.json({ error: "캐릭터를 찾을 수 없습니다." }, { status: 404 });
  }

  try {
    await touchCharacterSelection(supabase, user.id, characterId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "선택 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const { data: stateRow } = await supabase
    .from("user_character_states")
    .select("*")
    .eq("user_id", user.id)
    .eq("character_id", characterId)
    .single();

  const { data: convRows } = await recentConversationQuery(
    supabase,
    user.id,
    characterId
  );

  return NextResponse.json({
    state: stateRow ? mapCharacterState(stateRow) : null,
    recentConversation: convRows?.[0]
      ? mapConversation(convRows[0])
      : null,
  });
}
