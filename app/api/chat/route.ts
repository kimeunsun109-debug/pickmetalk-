import { getCharacterById } from "@/data";
import { streamDeepSeekChat } from "@/lib/ai/deepseek";
import { mapCharacterState, mapMessage } from "@/lib/db/mappers";
import { createClient } from "@/lib/supabase/server";
import { buildSystemPrompt } from "@/prompts";
import { affectionToLevel, clampAffection } from "@/services/affection";
import { resolveCharacterEmotion } from "@/services/emotion";
import { pickMessagesForContext } from "@/services/memory";
import type { ChatRequestBody } from "@/types/api";
import type { Message } from "@/types";
import { NextResponse } from "next/server";

const CONTEXT_LIMIT = 12;

/**
 * POST /api/chat — DeepSeek 스트리밍 + 메시지·호감도 저장
 * Body: { characterId, message }
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const { characterId, message } = body;
  if (!characterId || !message?.trim()) {
    return NextResponse.json(
      { error: "characterId와 message가 필요합니다." },
      { status: 400 }
    );
  }

  const character = getCharacterById(characterId);
  if (!character) {
    return NextResponse.json({ error: "캐릭터 없음" }, { status: 404 });
  }

  const { data: stateRow, error: stateError } = await supabase
    .from("user_character_states")
    .select("*")
    .eq("user_id", user.id)
    .eq("character_id", characterId)
    .maybeSingle();

  if (stateError || !stateRow) {
    return NextResponse.json(
      { error: "캐릭터를 먼저 선택해 주세요." },
      { status: 400 }
    );
  }

  const state = mapCharacterState(stateRow);
  const userText = message.trim();
  const now = new Date().toISOString();

  const { error: userMsgError } = await supabase.from("messages").insert({
    user_id: user.id,
    character_id: characterId,
    role: "user",
    content: userText,
  });

  if (userMsgError) {
    return NextResponse.json({ error: userMsgError.message }, { status: 500 });
  }

  const { data: historyRows } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", user.id)
    .eq("character_id", characterId)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: true })
    .limit(30);

  const history: Message[] = (historyRows ?? []).map((r) => mapMessage(r));
  const { recent, summary } = pickMessagesForContext(
    history,
    state.memorySummary
  );

  const newAffectionPreview = clampAffection(state.affection + 1);
  const newLevelPreview = affectionToLevel(newAffectionPreview);

  const newEmotion = resolveCharacterEmotion({
    userMessage: userText,
    lastChatAt: state.lastChatAt,
    lastSeenAt: state.lastSeenAt,
    currentEmotion: state.emotion,
    affectionWillIncrease: true,
  });

  const systemPrompt = buildSystemPrompt(
    characterId,
    newEmotion,
    newLevelPreview,
    newAffectionPreview,
    summary
  );

  const aiMessages = [
    { role: "system" as const, content: systemPrompt },
    ...recent.slice(-CONTEXT_LIMIT).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  const encoder = new TextEncoder();
  let fullReply = "";

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        );
      };

      try {
        for await (const chunk of streamDeepSeekChat(aiMessages)) {
          fullReply += chunk;
          send({ content: chunk });
        }

        const trimmed = fullReply.trim() || "…";
        const newAffection = newAffectionPreview;
        const newLevel = newLevelPreview;

        await supabase.from("messages").insert({
          user_id: user.id,
          character_id: characterId,
          role: "assistant",
          content: trimmed,
          emotion: newEmotion,
        });

        await supabase
          .from("user_character_states")
          .update({
            affection: newAffection,
            relationship_level: newLevel,
            emotion: newEmotion,
            last_chat_at: now,
            last_seen_at: now,
          })
          .eq("user_id", user.id)
          .eq("character_id", characterId);

        send({
          done: true,
          affection: newAffection,
          relationshipLevel: newLevel,
          emotion: newEmotion,
        });
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "채팅 처리 중 오류";
        send({ error: msg, done: true });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
