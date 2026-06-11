import { getCharacterById } from "@/data";
import { activeCharacterQuery, recentConversationQuery } from "@/lib/activeCharacter";
import { mapCharacterState, mapConversation } from "@/lib/db/mappers";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** GET — 현재 활성 캐릭터 + 최근 대화방 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: rows, error } = await activeCharacterQuery(supabase, user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!rows?.length) {
    return NextResponse.json({ state: null, character: null, conversation: null });
  }

  const state = mapCharacterState(rows[0]);
  const character = getCharacterById(state.characterId);

  const { data: convRows } = await recentConversationQuery(
    supabase,
    user.id,
    state.characterId
  );

  return NextResponse.json({
    state,
    character: character ?? null,
    conversation: convRows?.[0] ? mapConversation(convRows[0]) : null,
  });
}
