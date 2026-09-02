import {
  isDefaultConversationTitle,
  titleFromFirstMessage,
} from "@/lib/conversationTitle";
import {
  getDailyPatternByType,
  getDailyPatternsForUser,
  upsertDailyPattern,
} from "@/lib/db/dailyPatterns";
import { ENABLE_SHORT_TERM_MEMORY } from "@/lib/constants";
import {
  inferDailyPatternObservations,
  mergePatternObservation,
} from "@/services/dailyPatternInference";
import { refreshPatternAlertPlans } from "@/services/patternAlertPlanner";
import {
  analyzeSpeechFromMessages,
  mergeSpeechProfile,
  parseSpeechProfile,
} from "@/services/speechStyle";
import type { UserProfile } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/** AI 응답과 무관 — 스트림 시작 후 백그라운드에서 처리 */
export async function runDeferredChatSideEffects(options: {
  supabase: SupabaseClient;
  userId: string;
  characterId: string;
  conversationId: string;
  userText: string;
  now: string;
  userMessageId: string | null;
  profile: UserProfile | null;
  userContents: string[];
  conversationTitle: string;
  isFirstUserMessage: boolean;
}): Promise<void> {
  const {
    supabase,
    userId,
    characterId,
    conversationId,
    userText,
    now,
    userMessageId,
    profile,
    userContents,
    conversationTitle,
    isFirstUserMessage,
  } = options;

  const tasks: Promise<unknown>[] = [];

  if (isFirstUserMessage && isDefaultConversationTitle(conversationTitle)) {
    tasks.push(
      (async () => {
        await supabase
          .from("conversations")
          .update({
            title: titleFromFirstMessage(userText),
            updated_at: now,
          })
          .eq("id", conversationId);
      })()
    );
  }

  if (profile) {
    const sessionSpeech = analyzeSpeechFromMessages(userContents.slice(-12));
    const storedSpeech = parseSpeechProfile(profile.speechProfile ?? null);
    const speechProfile = mergeSpeechProfile(storedSpeech, sessionSpeech);
    tasks.push(
      (async () => {
        try {
          await supabase
            .from("profiles")
            .update({
              speech_profile: speechProfile,
              speech_profile_session: sessionSpeech,
            })
            .eq("id", userId);
        } catch {
          /* speech_profile 컬럼 미마이그레이션 시 무시 */
        }
      })()
    );
  }

  tasks.push(
    (async () => {
      try {
        const observations = inferDailyPatternObservations(
          userText,
          new Date(now)
        );
        for (const observation of observations) {
          const existing = await getDailyPatternByType(
            supabase,
            userId,
            observation.patternType
          );
          const merged = mergePatternObservation({
            existing,
            observation,
            observedAt: now,
            messageId: userMessageId,
          });
          await upsertDailyPattern(supabase, {
            userId,
            patternType: merged.patternType,
            timeStartMinute: merged.timeStartMinute,
            timeEndMinute: merged.timeEndMinute,
            confidence: merged.confidence,
            evidenceCount: merged.evidenceCount,
            timezone: merged.timezone,
            observedAt: merged.observedAt,
            messageId: merged.messageId,
          });
        }
        const inferredPatterns = await getDailyPatternsForUser(
          supabase,
          userId,
          40
        );
        await refreshPatternAlertPlans(
          supabase,
          userId,
          inferredPatterns,
          now
        );
      } catch {
        /* 생활 패턴 추론 실패 시 무시 */
      }
    })()
  );

  if (ENABLE_SHORT_TERM_MEMORY) {
    tasks.push(
      (async () => {
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

          await expireShortTermMemories(supabase, userId, now).catch(() => {});

          // 완료 감지와 신규 추출을 동시에 처리한다.
          // 예: "약 먹었어 그리고 내일 병원 가야 해" → 약 완료 + 병원 신규 생성
          const isCompletion = isShortTermCompletionMessage(userText);
          if (isCompletion) {
            await completeMostRelevantShortTermMemory(
              supabase,
              userId,
              userText,
              now
            );
          }

          // 완료 메시지여도 미래 일정이 포함된 경우 새 단기기억을 추가한다.
          // extractShortTermMemory 내부에서 '짧은 완료 메시지'는 자체 억제한다.
          const extractedShortTermMemory = extractShortTermMemory(
            userText,
            new Date(now)
          );
          if (extractedShortTermMemory) {
            await createShortTermMemory(supabase, {
              userId,
              conversationId,
              characterId,
              memoryType: extractedShortTermMemory.memoryType,
              content: extractedShortTermMemory.content,
              dueDate: extractedShortTermMemory.dueDate,
              expiresAt: extractedShortTermMemory.expiresAt,
              priority: extractedShortTermMemory.priority,
              sourceMessageId: userMessageId,
            });
          }
        } catch {
          /* 단기기억 비활성 */
        }
      })()
    );
  }

  await Promise.allSettled(tasks);
}
