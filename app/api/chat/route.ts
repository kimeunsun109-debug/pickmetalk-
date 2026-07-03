import { getCharacterById } from "@/data";
import { streamDeepSeekChat } from "@/lib/ai/deepseek";
import { getConversationForUser } from "@/lib/db/conversations";
import { getDailyPatternsForUser } from "@/lib/db/dailyPatterns";
import { mapCharacterState, mapMessage, mapUserProfile } from "@/lib/db/mappers";
import { createClient } from "@/lib/supabase/server";
import { buildSystemPrompt } from "@/prompts";
import { affectionToLevel, clampAffection } from "@/services/affection";
import { runDeferredChatSideEffects } from "@/services/chatSideEffects";
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
import {
  ENABLE_SHORT_TERM_MEMORY,
  CHAT_CONTEXT_TURNS,
  CHAT_STREAM_FIRST_CHUNK_MS,
} from "@/lib/constants";
import { getSearchContextForMessage } from "@/services/search";
import { getStreamFallback } from "@/services/chatFallback";
import { postProcessAssistantReply } from "@/services/responsePostProcess";
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
import { buildDailyPatternPromptBlock } from "@/prompts/patternNudges";
import type { ChatRequestBody } from "@/types/api";
import type { Message, UserCharacterState } from "@/types";
import { NextResponse } from "next/server";

const CONTEXT_LIMIT = CHAT_CONTEXT_TURNS;
const HISTORY_FETCH_LIMIT = 40;

/**
 * POST /api/chat — DeepSeek 스트리밍 + 대화방별 메시지·호감도 저장
 * Body: { conversationId, message }
 *
 * TTFB 최적화: 사용자 메시지 저장 직후 SSE Response를 반환하고,
 * 프롬프트 준비·LLM 호출은 stream.start() 안에서 처리한다.
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

  const userMessageId = userMessageRow?.id ?? null;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: object) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
        );
      };

      let gotModelChunk = false;
      let fallbackUsed = false;
      let streamTimeout: ReturnType<typeof setTimeout> | undefined;

      try {
        const [
          profileResult,
          historyResult,
          ucsResult,
          searchBlock,
          inferredPatterns,
        ] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
          supabase
            .from("messages")
            .select("*")
            .eq("conversation_id", conversationId)
            .in("role", ["user", "assistant"])
            .order("created_at", { ascending: true })
            .limit(HISTORY_FETCH_LIMIT),
          supabase
            .from("user_character_states")
            .select("*")
            .eq("user_id", user.id)
            .eq("character_id", characterId)
            .maybeSingle(),
          getSearchContextForMessage(userText).catch(() => ""),
          getDailyPatternsForUser(supabase, user.id, 40).catch(() => []),
        ]);

        const profile = profileResult.data
          ? mapUserProfile(profileResult.data)
          : null;
        const history: Message[] = (historyResult.data ?? []).map((r) =>
          mapMessage(r)
        );
        const userContents = history
          .filter((m) => m.role === "user")
          .map((m) => m.content);
        const isFirstUserMessage = userContents.length === 1;

        const sessionSpeech = analyzeSpeechFromMessages(userContents.slice(-12));
        const storedSpeech = parseSpeechProfile(profile?.speechProfile ?? null);
        const speechProfile = mergeSpeechProfile(storedSpeech, sessionSpeech);

        const updatedMemory = updateMemorySummary(
          conversation.summary,
          userContents
        );
        const { recent, summary } = pickMessagesForContext(
          history,
          updatedMemory
        );

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

        const emotionDurationTurns = countEmotionDurationTurns(
          history,
          newEmotion
        );

        const characterState: UserCharacterState | null = ucsResult.data
          ? mapCharacterState(ucsResult.data)
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
            /* 단기기억 비활성 */
          }
        }

        let characterCtxBlock = "";
        if (characterId === "yoonseo" && characterState) {
          const yoonseoStats = computeYoonseoStats(history, characterState);
          characterCtxBlock = buildYoonseoStatsBlock(yoonseoStats);
        }

        const dailyPatternPromptBlock = buildDailyPatternPromptBlock(
          inferredPatterns.filter((pattern) => pattern.evidenceCount >= 2)
        );

        const dynamicContextBlock = [
          timeContextBlock,
          searchBlock,
          dailyPatternPromptBlock,
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

        let fullReply = "";

        streamTimeout = setTimeout(() => {
          if (!gotModelChunk) {
            fallbackUsed = true;
            send({ content: getStreamFallback(characterId, userText) });
          }
        }, CHAT_STREAM_FIRST_CHUNK_MS);

        for await (const chunk of streamDeepSeekChat(aiMessages)) {
          gotModelChunk = true;
          if (streamTimeout) clearTimeout(streamTimeout);
          fullReply += chunk;
          if (!fallbackUsed) {
            send({ content: chunk });
          }
        }

        if (streamTimeout) clearTimeout(streamTimeout);

        if (!gotModelChunk && !fallbackUsed) {
          fallbackUsed = true;
          send({ content: getStreamFallback(characterId, userText) });
        }

        const { text: trimmed, follow_up } = postProcessAssistantReply(
          fullReply || getStreamFallback(characterId, userText)
        );

        if (fallbackUsed || trimmed !== fullReply.trim()) {
          send({ content: trimmed, replace: true });
        }

        const newAffection = newAffectionPreview;
        const newLevel = newLevelPreview;

        const { data: assistantRow } = await supabase
          .from("messages")
          .insert({
            user_id: user.id,
            character_id: characterId,
            conversation_id: conversationId,
            role: "assistant",
            content: trimmed,
            emotion: newEmotion,
          })
          .select("id, created_at")
          .single();

        await Promise.all([
          supabase
            .from("conversations")
            .update({
              affection: newAffection,
              relationship_level: newLevel,
              emotion: newEmotion,
              summary: updatedMemory,
              last_message_at: now,
              updated_at: now,
            })
            .eq("id", conversationId),
          supabase
            .from("user_character_states")
            .update({
              last_chat_at: now,
              last_seen_at: now,
            })
            .eq("user_id", user.id)
            .eq("character_id", characterId),
        ]);

        send({
          done: true,
          affection: newAffection,
          relationshipLevel: newLevel,
          emotion: newEmotion,
          follow_up,
          should_stream: true,
          assistantMessageId: assistantRow?.id,
          assistantCreatedAt: assistantRow?.created_at,
        });

        void runDeferredChatSideEffects({
          supabase,
          userId: user.id,
          characterId,
          conversationId,
          userText,
          now,
          userMessageId,
          profile,
          userContents,
          conversationTitle: conversation.title,
          isFirstUserMessage,
        });
      } catch (err) {
        if (streamTimeout) clearTimeout(streamTimeout);
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
