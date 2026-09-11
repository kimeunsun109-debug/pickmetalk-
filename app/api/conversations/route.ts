import { getCharacterById } from "@/lib/characters/full";
import {
  createConversation,
  deleteAllUserConversations,
  touchCharacterSelection,
} from "@/lib/db/conversations";
import { updateConversationLastMessage } from "@/lib/db/updateConversationPreview";
import { mapConversation } from "@/lib/db/mappers";
import { createClient } from "@/lib/supabase/server";
import { generateNewConversationGreeting } from "@/services/newConversationGreeting";
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

    // 캐릭터가 먼저 인사를 건넨다 (Proactive Behavior).
    // 이전 대화 기억이 있으면 LLM으로 맞춤 인사, 없으면 캐릭터 기본 인사(즉시 반환).
    try {
      const { message: greetMsg, emotion: greetEmotion } =
        await generateNewConversationGreeting(
          supabase,
          user.id,
          characterId,
          conversation.id
        );
      const now = new Date().toISOString();
      await supabase.from("messages").insert({
        user_id: user.id,
        character_id: characterId,
        conversation_id: conversation.id,
        role: "assistant",
        content: greetMsg,
        emotion: greetEmotion,
      });
      await updateConversationLastMessage(
        supabase,
        conversation.id,
        user.id,
        greetMsg,
        "assistant",
        now
      );
    } catch {
      // 인사 생성 실패해도 대화방은 정상 동작
    }

    return NextResponse.json({ conversation });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "대화방 생성 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** DELETE — 전체 대화 삭제 (?all=true) */
export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  if (searchParams.get("all") !== "true") {
    return NextResponse.json(
      { error: "전체 삭제는 ?all=true 가 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const result = await deleteAllUserConversations(supabase, user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "대화 삭제 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
