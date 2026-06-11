import { getCharacterById } from "@/data";
import {
  createConversation,
  touchCharacterSelection,
} from "@/lib/db/conversations";
import { mapConversation } from "@/lib/db/mappers";
import { createClient } from "@/lib/supabase/server";
import type { CreateConversationBody } from "@/types/api";
import { NextResponse } from "next/server";

/** GET — 대화방 목록 (?characterId= 필터 가능) */
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const characterId = searchParams.get("characterId");

  let query = supabase
    .from("conversations")
    .select("*")
    .eq("user_id", user.id)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false });

  if (characterId) {
    query = query.eq("character_id", characterId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const conversations = (data ?? []).map((row) => mapConversation(row));

  return NextResponse.json({ conversations });
}

/** POST — 새 대화방 생성 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: CreateConversationBody;
  try {
    body = (await request.json()) as CreateConversationBody;
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const { characterId, title } = body;
  if (!characterId) {
    return NextResponse.json({ error: "characterId 필요" }, { status: 400 });
  }

  if (!getCharacterById(characterId)) {
    return NextResponse.json({ error: "캐릭터를 찾을 수 없습니다." }, { status: 404 });
  }

  try {
    await touchCharacterSelection(supabase, user.id, characterId);
    const conversation = await createConversation(
      supabase,
      user.id,
      characterId,
      title?.trim() || "새 대화"
    );
    return NextResponse.json({ conversation });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "대화방 생성 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
