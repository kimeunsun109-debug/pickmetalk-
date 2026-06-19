import { getCharacterById } from "@/data";
import { streamDeepSeekChat } from "@/lib/ai/deepseek";
import { getConversationForUser } from "@/lib/db/conversations";
import { mapCharacterState, mapMessage, mapUserProfile } from "@/lib/db/mappers";
import {
  isDefaultConversationTitle,
  titleFromFirstMessage,
} from "@/lib/conversationTitle";
import { createClient } from "@/lib/supabase/server";
import { buildSystemPrompt } from "@/prompts";
import { affectionToLevel, clampAffection } from "@/services/affection";
import {
  countEmotionDurationTurns,
  isOngoingChatSession,
  resolveCharacterEmotion,
} from "@/services/emotion";
import { pickMessagesForContext, updateMemorySummary } from "@/services/memory";
import {
  analyzeSpeechFromMessages,
  mergeSpeechProfile,
  parseSpeechProfile,
} from "@/services/speechStyle";
import { ENABLE_SHORT_TERM_MEMORY } from "@/lib/constants";
import { getSearchContextForMessage } from "@/services/search";
import {
  extractUserContext,
  buildCommonContextBlock,
  computeYoonseoStats,
  buildYoonseoStatsBlock,
} from "@/services/context";
import {
  buildTimeAwareContext,
  buildTimeContextPromptBlock,
} from "@/services/timeContext";
import type { ChatRequestBody } from "@/types/api";
import type { Message, UserCharacterState } from "@/types";
import { NextResponse } from "next/server";

const CONTEXT_LIMIT = 20;
const HISTORY_FETCH_LIMIT = 40;

/**
 * POST /api/chat — DeepSeek 스트리밍 + 대화방별 메시지·호감도 저장
 * Body: { conversationId, message }
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

  const { conversationId, message } = body;
  if (!conversationId || !message?.trim()) {
    return NextResponse.json(
      { error: "conversationId와 message가 필요합니다." },
      { status: 400 }
    );
  }

  const conversation = await getConversationForUser(
    supabase,
    user.id,
    conversationId
  );
  if (!conversation) {
    return NextResponse.json({ error: "대화방을 찾을 수 없습니다." }, { status: 404 });
  }

  const characterId = conversation.characterId;
  const character = getCharacterById(characterId);
  if (!character) {
    return NextResponse.json({ error: "캐릭터 없음" }, { status: 404 });
  }

  const userText = message.trim();
  const now = new Date().toISOString();

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  const profile = profileRow ? mapUserProfile(profileRow) : null;

  const { data: userMessageRow, error: userMsgError } = await supabase
    .from("messages")
    .insert({
      user_id: user.id,
      character_id: characterId,
      conversation_id: conversationId,
      role: "user",
      content: userText,
    })
    .select("id")
    .single();

  if (userMsgError) {
    return NextResponse.json({ error: userMsgError.message }, { status: 500 });
  }

  if (ENABLE_SHORT_TERM_MEMORY) {
    try {
      const {
        completeMostRelevantShortTermMemory,
        createShortTermMemory,
        expireShortTermMemories,
      } = await import("@/lib/db/shortTermMemories");
      const {
        extractShortTermMemory,
        isShortTermCompletionMessage,
      } = await import("@/services/shortTermMemory");

      await expireShortTermMemories(supabase, user.id, now).catch(() => {});

      if (isShortTermCompletionMessage(userText)) {
        await completeMostRelevantShortTermMemory(
          supabase,
          user.id,
          userText,
          now
        );
      } else {
        const extractedShortTermMemory = extractShortTermMemory(
          userText,
          new Date(now)
        );
        if (extractedShortTermMemory) {
          await createShortTermMemory(supabase, {
            userId: user.id,
            conversationId,
            characterId,
            memoryType: extractedShortTermMemory.memoryType,
            content: extractedShortTermMemory.content,
            dueDate: extractedShortTermMemory.dueDate,
            expiresAt: extractedShortTermMemory.expiresAt,
            priority: extractedShortTermMemory.priority,
            sourceMessageId: userMessageRow?.id ?? null,
          });
        }
      }
    } catch {
      /* 단기기억 비활성 — 채팅은 계속 */
    }
  }

  // 첫 메시지면 제목 자동 생성
  const { count: msgCount } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .eq("role", "user");

  if (
    msgCount === 1 &&
    isDefaultConversationTitle(conversation.title)
  ) {
    await supabase
      .from("conversations")
      .update({
        title: titleFromFirstMessage(userText),
        updated_at: now,
      })
      .eq("id", conversationId);
  }

  const { data: historyRows } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: true })
    .limit(HISTORY_FETCH_LIMIT);

  const history: Message[] = (historyRows ?? []).map((r) => mapMessage(r));
  const userContents = history
    .filter((m) => m.role === "user")
    .map((m) => m.content);

  const sessionSpeech = analyzeSpeechFromMessages(userContents.slice(-12));
  const storedSpeech = parseSpeechProfile(profile?.speechProfile ?? null);
  const speechProfile = mergeSpeechProfile(storedSpeech, sessionSpeech);

  if (profile) {
    try {
      await supabase
        .from("profiles")
        .update({
          speech_profile: speechProfile,
          speech_profile_session: sessionSpeech,
        })
        .eq("id", user.id);
    } catch {
      /* speech_profile 컬럼 미마이그레이션 시 무시 */
    }
  }

  const updatedMemory = updateMemorySummary(
    conversation.summary,
    userContents
  );
  const { recent, summary } = pickMessagesForContext(history, updatedMemory);

  const newAffectionPreview = clampAffection(conversation.affection + 1);
  const newLevelPreview = affectionToLevel(newAffectionPreview);

  const ongoingSession = isOngoingChatSession(history);

  const newEmotion = resolveCharacterEmotion(
    {
      userMessage: userText,
      lastChatAt: conversation.lastMessageAt,
      lastSeenAt: conversation.updatedAt,
      currentEmotion: conversation.emotion,
      affectionWillIncrease: true,
    },
    undefined,
    history
  );

  const emotionDurationTurns = countEmotionDurationTurns(history, newEmotion);

  const { data: ucsRow } = await supabase
    .from("user_character_states")
    .select("*")
    .eq("user_id", user.id)
    .eq("character_id", characterId)
    .maybeSingle();
  const characterState: UserCharacterState | null = ucsRow
    ? mapCharacterState(ucsRow)
    : null;

  const timeAwareCtx = buildTimeAwareContext({
    history,
    ongoingSession,
    conversationSummary: summary,
    lastSeenAt: characterState?.lastSeenAt ?? null,
    lastChatAt:
      characterState?.lastChatAt ?? conversation.lastMessageAt ?? null,
    now: new Date(now),
  });
  const timeContextBlock = buildTimeContextPromptBlock(
    timeAwareCtx,
    characterId
  );

  const userCtx = extractUserContext(
    updatedMemory,
    profile?.userContext ?? {}
  );
  const commonCtxBlock = buildCommonContextBlock(userCtx);
  let shortTermMemoryBlock = "";
  if (ENABLE_SHORT_TERM_MEMORY && !ongoingSession) {
    try {
      const {
        buildShortTermMemoryContextBlock,
        getActiveShortTermMemories,
      } = await import("@/lib/db/shortTermMemories");
      const activeShortTermMemories = await getActiveShortTermMemories(
        supabase,
        user.id,
        now
      );
      shortTermMemoryBlock = buildShortTermMemoryContextBlock(
        activeShortTermMemories
      );
    } catch {
      /* 단기기억 비활성 — 채팅은 계속 */
    }
  }

  let characterCtxBlock = "";
  if (characterId === "yoonseo" && characterState) {
    const yoonseoStats = computeYoonseoStats(history, characterState);
    characterCtxBlock = buildYoonseoStatsBlock(yoonseoStats);
  }

  const dynamicContextBlock = [
    timeContextBlock,
    await getSearchContextForMessage(userText).catch(() => ""),
    shortTermMemoryBlock,
    commonCtxBlock,
    characterCtxBlock,
  ]
    .filter(Boolean)
    .join("\n\n");

  const systemPrompt = buildSystemPrompt(
    characterId,
    newEmotion,
    newLevelPreview,
    newAffectionPreview,
    summary,
    emotionDurationTurns,
    userContents.length,
    dynamicContextBlock,
    ongoingSession,
    recent,
    speechProfile,
    userText,
    timeAwareCtx
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
          conversation_id: conversationId,
          role: "assistant",
          content: trimmed,
          emotion: newEmotion,
        });

        await supabase
          .from("conversations")
          .update({
            affection: newAffection,
            relationship_level: newLevel,
            emotion: newEmotion,
            summary: updatedMemory,
            last_message_at: now,
            updated_at: now,
          })
          .eq("id", conversationId);

        await supabase
          .from("user_character_states")
          .update({
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
