import { getCharacterById } from "@/data";
import { mapCharacterState } from "@/lib/db/mappers";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** GET — 현재 활성 캐릭터 (가장 최근 대화/선택) */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { data: rows, error } = await supabase
    .from("user_character_states")
    .select("*")
    .eq("user_id", user.id)
    .order("last_chat_at", { ascending: false, nullsFirst: false })
    .order("last_seen_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!rows?.length) {
    return NextResponse.json({ state: null, character: null });
  }

  const state = mapCharacterState(rows[0]);
  const character = getCharacterById(state.characterId);

  return NextResponse.json({ state, character: character ?? null });
}
