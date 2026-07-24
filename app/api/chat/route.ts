import { getCharacterById } from "@/lib/characters/full";
import { streamDeepSeekChat } from "@/lib/ai/deepseek";
import { getConversationForUser } from "@/lib/db/conversations";
import { MESSAGE_LIST_COLUMNS } from "@/lib/db/messages";
import { updateConversationLastMessage } from "@/lib/db/updateConversationPreview";
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
import { ServerPerfTrace } from "@/lib/perf/trace";
import {
  canSendChatMessage,
  ensureDailyUsageFresh,
  releaseDailyMessageSlot,
  tryReserveDailyMessageSlot,
} from "@/services/dailyMessageLimit";
import { NextResponse } from "next/server";
import type { ChatRequestBody } from "@/types/api";
import type { Message, UserCharacterState } from "@/types";
import { ageFromBirthDate } from "@/lib/userAge";
import { markPhotoDeliveryReplied } from "@/services/photoPush/followup";
import type {
  PostgrestResponse,
  PostgrestSingleResponse,
} from "@supabase/supabase-js";

const CONTEXT_LIMIT = CHAT_CONTEXT_TURNS;
const HISTORY_FETCH_LIMIT = 40;

/**
 * POST /api/chat — DeepSeek 스트리밍 + 대화방별 메시지·호감도 저장
 * Body: { conversationId, message }
 *
 * TTFB: pre-stream await 없이 즉시 SSE Response 반환.
 * body 파싱·auth·DB·프롬프트·LLM은 stream.start() 안에서 처리한다.
 */
export async function POST(request: Request) {
  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const { conversationId, message, resend } = body;
  if (!conversationId || !message?.trim()) {
    return NextResponse.json(
      { error: "conversationId와 message가 필요합니다." },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub as string | undefined;
  if (!userId) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  let reservedDailyCount: number | null = null;

  if (!resend) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!profileRow) {
      return NextResponse.json(
        { error: "프로필을 찾을 수 없습니다." },
        { status: 403 }
      );
    }

    const profile = mapUserProfile(profileRow);
    const { count, isPremium } = await ensureDailyUsageFresh(
      supabase,
      userId,
      profile
    );
    if (!isPremium) {
      if (!canSendChatMessage(profile, count)) {
        return NextResponse.json(
          {
            error: "오늘 무료 대화를 모두 사용했어요.",
            code: "DAILY_LIMIT_REACHED",
          },
          { status: 429 }
        );
      }
      reservedDailyCount = await tryReserveDailyMessageSlot(
        supabase,
        userId,
        count
      );
      if (reservedDailyCount == null) {
        return NextResponse.json(
          {
            error: "오늘 무료 대화를 모두 사용했어요.",
            code: "DAILY_LIMIT_REACHED",
          },
          { status: 429 }
        );
      }
    }
  }

  const trace = new ServerPerfTrace("AI Response");
  const encoder = new TextEncoder();
  trace.mark("Pre-stream setup", "SSE Response 반환 직전");

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
      let chunkBuffer = "";
      let flushTimer: ReturnType<typeof setTimeout> | null = null;

      const flushChunkBuffer = () => {
        if (chunkBuffer && !fallbackUsed) {
          send({ content: chunkBuffer });
          chunkBuffer = "";
        }
        if (flushTimer) {
          clearTimeout(flushTimer);
          flushTimer = null;
        }
      };

      const enqueueChunk = (chunk: string) => {
        if (fallbackUsed) return;
        chunkBuffer += chunk;
        if (!flushTimer) {
          flushTimer = setTimeout(flushChunkBuffer, 50);
        }
      };

      let userMessageId: string | null = null;
      let userMessagePersisted = false;

      const releaseReservedSlot = async () => {
        if (reservedDailyCount != null && !userMessagePersisted) {
          await releaseDailyMessageSlot(
            supabase,
            userId,
            reservedDailyCount
          );
          reservedDailyCount = null;
        }
      };

      try {
        send({ streaming: true });

        const userText = message.trim();
        trace.mark("Auth getClaims");

        const conversation = await trace.span("Load Conversation", () =>
          getConversationForUser(supabase, userId, conversationId)
        );

        if (!conversation) {
          await releaseReservedSlot();
          send({ error: "대화방을 찾을 수 없습니다.", done: true });
          return;
        }

        const characterId = conversation.characterId;
        const character = getCharacterById(characterId);
        trace.mark("Load Character", `${characterId}`);
        if (!character) {
          await releaseReservedSlot();
          send({ error: "캐릭터 없음", done: true });
          return;
        }

        const now = new Date().toISOString();

        const [
          profileResult,
          historyResult,
          ucsResult,
          shortTermMemoryBlock,
        ] = await trace.span<
          [
            PostgrestSingleResponse<Record<string, unknown>>,
            PostgrestResponse<Record<string, unknown>>,
            PostgrestSingleResponse<Record<string, unknown>>,
            string,
          ]
        >("Parallel DB — context load", async () => {
          const shortTermPromise = (async (): Promise<string> => {
            if (!ENABLE_SHORT_TERM_MEMORY) return "";
            try {
              const {
                buildShortTermMemoryContextBlock,
                getActiveShortTermMemories,
              } = await import("@/lib/db/shortTermMemories");
              const activeShortTermMemories = await getActiveShortTermMemories(
                supabase,
                userId,
                now
              );
              return buildShortTermMemoryContextBlock(activeShortTermMemories);
            } catch {
              return "";
            }
          })();

          return Promise.all([
            supabase
              .from("profiles")
              .select("*")
              .eq("id", userId)
              .maybeSingle(),
            supabase
              .from("messages")
              .select(MESSAGE_LIST_COLUMNS)
              .eq("conversation_id", conversationId)
              .in("role", ["user", "assistant"])
              .order("created_at", { ascending: true })
              .limit(HISTORY_FETCH_LIMIT),
            supabase
              .from("user_character_states")
              .select("*")
              .eq("user_id", userId)
              .eq("character_id", characterId)
              .maybeSingle(),
            shortTermPromise,
          ]);
        });

        if (!resend) {
          const { data: userMessageRow, error: userMsgError } = await supabase
            .from("messages")
            .insert({
              user_id: userId,
              character_id: characterId,
              conversation_id: conversationId,
              role: "user",
              content: userText,
            })
            .select("id")
            .single();

          if (userMsgError) {
            await releaseReservedSlot();
            send({ error: userMsgError.message, done: true });
            return;
          }

          userMessageId = userMessageRow?.id ?? null;
          userMessagePersisted = Boolean(userMessageId);

          void markPhotoDeliveryReplied(supabase, conversationId, userId);
        }
        send({ userMessageId });

        if (!resend) {
          void updateConversationLastMessage(
            supabase,
            conversationId,
            userId,
            userText,
            "user",
            now
          );
        }

        trace.mark(
          "Memory/History load",
          `${(historyResult.data ?? []).length} messages`
        );

        const profile = profileResult.data
          ? mapUserProfile(profileResult.data)
          : null;
        const history: Message[] = (historyResult.data ?? []).map((r) =>
          mapMessage(r)
        );
        if (userMessageId && !history.some((m) => m.id === userMessageId)) {
          history.push({
            id: userMessageId,
            userId,
            characterId,
            conversationId,
            role: "user",
            content: userText,
            createdAt: now,
          });
        } else if (resend) {
          const lastUser = [...history].reverse().find((m) => m.role === "user");
          userMessageId = lastUser?.id ?? null;
        }
        const userContents = history
          .filter((m) => m.role === "user")
          .map((m) => m.content);
        const isFirstUserMessage = userContents.length === 1;

        const sessionSpeech = analyzeSpeechFromMessages(userContents.slice(-12));
        const storedSpeech = parseSpeechProfile(profile?.speechProfile ?? null);
        const speechProfile = mergeSpeechProfile(storedSpeech, sessionSpeech);

        const updatedMemory = updateMemorySummary(
          conversation.summary,
          userText
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

        const derivedAge = ageFromBirthDate(
          profile?.birthDate ?? profile?.userContext?.birthDate
        );
        const profileCtx = {
          ...(profile?.userContext ?? {}),
          nickname:
            profile?.displayName ??
            profile?.userContext?.nickname ??
            profile?.userContext?.name,
          age:
            profile?.userContext?.age ??
            (derivedAge != null ? String(derivedAge) : undefined),
          gender: profile?.gender ?? profile?.userContext?.gender,
          birthDate: profile?.birthDate ?? profile?.userContext?.birthDate,
          mbti: profile?.mbti ?? profile?.userContext?.mbti,
          idealType: profile?.idealType ?? profile?.userContext?.idealType,
        };
        const userCtx = extractUserContext(updatedMemory, profileCtx);
        const commonCtxBlock = buildCommonContextBlock(userCtx);

        const freshChatStart = Boolean(
          profile?.chatHistoryResetAt &&
            Date.now() - new Date(profile.chatHistoryResetAt).getTime() <
              7 * 24 * 60 * 60 * 1000 &&
            userContents.length <= 4
        );

        let characterCtxBlock = "";
        if (characterId === "yoonseo" && characterState) {
          const yoonseoStats = computeYoonseoStats(history, characterState);
          characterCtxBlock = buildYoonseoStatsBlock(yoonseoStats);
        }

        const dynamicContextBlock = [
          timeContextBlock,
          shortTermMemoryBlock,
          commonCtxBlock,
          characterCtxBlock,
        ]
          .filter(Boolean)
          .join("\n\n");

        const systemPrompt = trace.sync("Prompt Build", () =>
          buildSystemPrompt({
            characterId,
            emotion: newEmotion,
            level: newLevelPreview,
            affection: newAffectionPreview,
            memorySummary: summary,
            emotionDurationTurns,
            dynamicContextBlock,
            speechProfile,
            freshChatStart,
          })
        );
        trace.mark("Prompt length", `${systemPrompt.length} chars`);

        const aiMessages = [
          { role: "system" as const, content: systemPrompt },
          ...recent.slice(-CONTEXT_LIMIT).map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ];

        let fullReply = "";
        const llmStart = process.hrtime.bigint();

        streamTimeout = setTimeout(() => {
          if (!gotModelChunk && fullReply.length === 0) {
            fallbackUsed = true;
            send({ content: getStreamFallback(characterId, userText) });
          }
        }, CHAT_STREAM_FIRST_CHUNK_MS);

        for await (const chunk of streamDeepSeekChat(aiMessages)) {
          if (!gotModelChunk) {
            const llmTtfb = Math.round(
              Number(process.hrtime.bigint() - llmStart) / 1_000_000
            );
            trace.mark("DeepSeek API — first chunk", `${llmTtfb}ms`);
          }
          gotModelChunk = true;
          if (streamTimeout) clearTimeout(streamTimeout);
          fullReply += chunk;
          if (fallbackUsed) {
            // 폴백 문장이 이미 나갔어도 실제 답변이 오면 즉시 교체하고
            // 스트리밍을 재개한다. (교체 없이 완주를 기다리면 체감 지연이 1분+로 늘어난다)
            fallbackUsed = false;
            send({ content: fullReply, replace: true, clearFallback: true });
          } else {
            enqueueChunk(chunk);
          }
        }

        if (streamTimeout) clearTimeout(streamTimeout);
        flushChunkBuffer();

        if (!gotModelChunk && !fallbackUsed) {
          fallbackUsed = true;
          send({ content: getStreamFallback(characterId, userText) });
        }

        const { text: trimmed, follow_up } = trace.sync("Response Parse", () =>
          postProcessAssistantReply(
            fullReply || getStreamFallback(characterId, userText)
          )
        );

        if (fallbackUsed) {
          send({ content: trimmed, replace: true, clearFallback: true });
        } else {
          const streamed = fullReply.trim();
          if (trimmed.length > streamed.length && trimmed.startsWith(streamed)) {
            send({ content: trimmed.slice(streamed.length) });
          } else if (trimmed !== streamed) {
            send({ content: trimmed, replace: true });
          }
        }

        const newAffection = newAffectionPreview;
        const newLevel = newLevelPreview;

        const { data: assistantRow } = await trace.span<{
          data: { id: string; created_at: string } | null;
        }>(
          "DB Save — assistant + conversation",
          async () => {
            const { data: row } = await supabase
              .from("messages")
              .insert({
                user_id: userId,
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
                .eq("user_id", userId)
                .eq("character_id", characterId),
              updateConversationLastMessage(
                supabase,
                conversationId,
                userId,
                trimmed,
                "assistant",
                now
              ),
            ]);
            return { data: row };
          }
        );

        send({
          done: true,
          userMessageId: userMessageId ?? undefined,
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
          userId,
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

        trace.end("stream complete");
      } catch (err) {
        if (streamTimeout) clearTimeout(streamTimeout);
        await releaseReservedSlot();
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
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
