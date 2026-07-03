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
import type { UserProfile, UserDailyPattern } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/** 현재 턴 사용자 메시지 반영 — 시스템 프롬프트 구성 전에 await */
export async function applySameTurnPromptSideEffects(options: {
  supabase: SupabaseClient;
  userId: string;
  characterId: string;
  conversationId: string;
  userText: string;
  now: string;
  userMessageId: string | null;
}): Promise<UserDailyPattern[]> {
  const {
    supabase,
    userId,
    characterId,
    conversationId,
    userText,
    now,
    userMessageId,
  } = options;

  try {
    const observations = inferDailyPatternObservations(userText, new Date(now));
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
  } catch {
    /* 생활 패턴 추론 실패 시 채팅은 계속 */
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

      await expireShortTermMemories(supabase, userId, now).catch(() => {});

      if (isShortTermCompletionMessage(userText)) {
        await completeMostRelevantShortTermMemory(
          supabase,
          userId,
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
      }
    } catch {
      /* 단기기억 비활성 */
    }
  }

  return getDailyPatternsForUser(supabase, userId, 40).catch(() => []);
}

/** AI 응답과 무관 — 응답 전송 후 백그라운드에서 처리 */
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
    conversationId,
    userText,
    now,
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
        /* 생활 패턴 알림 갱신 실패 시 무시 */
      }
    })()
  );

  await Promise.allSettled(tasks);
}
