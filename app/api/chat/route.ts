import { getCharacterById } from "@/data";
import { streamDeepSeekChat } from "@/lib/ai/deepseek";
import { getConversationForUser } from "@/lib/db/conversations";
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
import type { ChatRequestBody } from "@/types/api";
import type { Message, UserCharacterState } from "@/types";
import { NextResponse } from "next/server";

const CONTEXT_LIMIT = CHAT_CONTEXT_TURNS;
const HISTORY_FETCH_LIMIT = 40;

/**
 * POST /api/chat — DeepSeek 스트리밍 + 대화방별 메시지·호감도 저장
 * Body: { conversationId, message }
 *
 * TTFB: auth·body 검증 직후 SSE Response 반환.
 * DB·프롬프트·LLM은 stream.start() 안에서 처리한다.
 */
export async function POST(request: Request) {
  const trace = new ServerPerfTrace("AI Response");

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

  const userText = message.trim();
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

      try {
        send({ streaming: true });

        const supabase = await createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const user = session?.user ?? null;
        trace.mark("Auth getSession");

        if (!user) {
          send({ error: "로그인이 필요합니다.", done: true });
          return;
        }

        const userId = user.id;
        const conversation = await trace.span("Load Conversation", () =>
          getConversationForUser(supabase, userId, conversationId)
        );
        if (!conversation) {
          send({ error: "대화방을 찾을 수 없습니다.", done: true });
          return;
        }

        const characterId = conversation.characterId;
        const character = getCharacterById(characterId);
        trace.mark("Load Character", `${characterId}`);
        if (!character) {
          send({ error: "캐릭터 없음", done: true });
          return;
        }

        const now = new Date().toISOString();

        const { data: userMessageRow, error: userMsgError } = await trace.span(
          "DB Save — user message",
          () =>
            supabase
              .from("messages")
              .insert({
                user_id: userId,
                character_id: characterId,
                conversation_id: conversationId,
                role: "user",
                content: userText,
              })
              .select("id")
              .single()
        );

        if (userMsgError) {
          send({ error: userMsgError.message, done: true });
          return;
        }

        const userMessageId = userMessageRow?.id ?? null;
        send({ userMessageId });

        void updateConversationLastMessage(
          supabase,
          conversationId,
          userId,
          userText,
          "user",
          now
        ).catch(() => undefined);

        const [profileResult, historyResult, ucsResult, shortTermMemoryBlock] =
          await trace.span("Parallel DB + short-term memory", async () => {
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
                .select("*")
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
          buildSystemPrompt(
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
          )
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
          if (!gotModelChunk) {
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
          if (!fallbackUsed) {
            send({ content: chunk });
          }
        }

        if (streamTimeout) clearTimeout(streamTimeout);

        if (!gotModelChunk && !fallbackUsed) {
          fallbackUsed = true;
          send({ content: getStreamFallback(characterId, userText) });
        }

        const { text: trimmed, follow_up } = trace.sync("Response Parse", () =>
          postProcessAssistantReply(
            fullReply || getStreamFallback(characterId, userText)
          )
        );

        if (fallbackUsed || trimmed !== fullReply.trim()) {
          send({ content: trimmed, replace: true });
        }

        const newAffection = newAffectionPreview;
        const newLevel = newLevelPreview;

        const { data: assistantRow } = await trace.span(
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
            ]);

            void updateConversationLastMessage(
              supabase,
              conversationId,
              userId,
              trimmed,
              "assistant",
              now
            ).catch(() => undefined);
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
