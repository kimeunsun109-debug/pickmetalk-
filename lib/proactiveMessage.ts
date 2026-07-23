import { getConversationForUser } from "@/lib/db/conversations";
import { updateConversationLastMessage } from "@/lib/db/updateConversationPreview";
import { PROACTIVE_MIN_GAP_HOURS } from "@/lib/constants";
import { mapCharacterState } from "@/lib/db/mappers";
import { getAbsenceTier, getReturnVisitData } from "@/lib/returnVisit";
import { checkAbsenceTrigger, PUSH_COOLDOWN_HOURS } from "@/services/absenceEvent";
import type { Conversation } from "@/types";
import type { EmotionState } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ProactiveCandidate {
  message: string;
  emotion: EmotionState;
  source: "absence_trigger" | "return_visit" | "new_conversation_greeting";
}

function hoursSince(iso: string | null): number | null {
  if (!iso) return null;
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

export function resolveProactiveCandidate(
  characterId: string,
  lastChatAt: string | null,
  absenceEvent: ReturnType<typeof checkAbsenceTrigger>
): ProactiveCandidate | null {
  if (absenceEvent && absenceEvent.characterId === characterId) {
    return {
      message: absenceEvent.message,
      emotion: absenceEvent.emotion,
      source: "absence_trigger",
    };
  }

  const gapHours = hoursSince(lastChatAt);
  if (gapHours === null) return null;

  const tier = getAbsenceTier(gapHours);
  if (!tier) return null;

  const visit = getReturnVisitData(characterId, tier);
  return {
    message: `${visit.message} ${visit.subMessage}`.trim(),
    emotion: tier === "tier1" ? "happy" : "miss_you",
    source: "return_visit",
  };
}

/** conversations denormalized 필드로 messages 조회 없이 skip 판단 */
export function shouldSkipProactiveFromConversation(
  conversation: Conversation,
  candidate: ProactiveCandidate
): boolean {
  if (conversation.lastMessageRole === "user") return true;

  const lastAt = conversation.lastMessageAt;
  if (!lastAt) return false;

  if (
    conversation.lastMessageRole === "assistant" &&
    conversation.lastMessagePreview &&
    candidate.message.startsWith(
      conversation.lastMessagePreview.slice(0, 32)
    )
  ) {
    return true;
  }

  const hoursSinceLast = hoursSince(lastAt);
  return hoursSinceLast !== null && hoursSinceLast < PUSH_COOLDOWN_HOURS;
}

export async function shouldSkipProactiveInsert(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
  candidate: ProactiveCandidate,
  conversation?: Conversation | null
): Promise<boolean> {
  if (conversation && shouldSkipProactiveFromConversation(conversation, candidate)) {
    return true;
  }

  const { data: lastRow } = await supabase
    .from("messages")
    .select("role, content, created_at")
    .eq("user_id", userId)
    .eq("conversation_id", conversationId)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastRow) return false;

  if (lastRow.role === "user") return true;

  if (lastRow.content === candidate.message) return true;

  const hoursSinceLast =
    (Date.now() - new Date(lastRow.created_at as string).getTime()) /
    (1000 * 60 * 60);

  return hoursSinceLast < PUSH_COOLDOWN_HOURS;
}

export async function insertProactiveMessage(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
  characterId: string,
  candidate: ProactiveCandidate
) {
  const now = new Date().toISOString();

  const { data: inserted, error } = await supabase
    .from("messages")
    .insert({
      user_id: userId,
      character_id: characterId,
      conversation_id: conversationId,
      role: "assistant",
      content: candidate.message,
      emotion: candidate.emotion,
    })
    .select("id, role, content, created_at")
    .single();

  if (error || !inserted) {
    throw new Error(error?.message ?? "선제 메시지 저장 실패");
  }

  await updateConversationLastMessage(
    supabase,
    conversationId,
    userId,
    candidate.message,
    "assistant",
    now,
    { emotion: candidate.emotion }
  ).catch(() => undefined);

  await supabase
    .from("user_character_states")
    .update({
      last_chat_at: now,
      last_seen_at: now,
      last_push_sent_at: now,
      emotion: candidate.emotion,
    })
    .eq("user_id", userId)
    .eq("character_id", characterId);

  return inserted;
}

export async function runProactiveMessageFlow(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string
) {
  const conversation = await getConversationForUser(
    supabase,
    userId,
    conversationId
  );
  if (!conversation) {
    return { inserted: false as const, reason: "not_found" };
  }

  if (conversation.lastMessageRole === "user") {
    return { inserted: false as const, reason: "last_from_user" };
  }

  const lastChatAt = conversation.lastMessageAt;
  const gapHours = hoursSince(lastChatAt);

  if (!lastChatAt) {
    // 새(빈) 대화방 — 캐릭터가 먼저 말을 건다. 이전 대화방 기억이 있으면 언급.
    const { generateNewConversationGreeting } = await import(
      "@/services/newConversationGreeting"
    );
    const greeting = await generateNewConversationGreeting(
      supabase,
      userId,
      conversation.characterId,
      conversationId
    );
    const candidate: ProactiveCandidate = {
      message: greeting.message,
      emotion: greeting.emotion,
      source: "new_conversation_greeting",
    };

    if (
      await shouldSkipProactiveInsert(
        supabase,
        userId,
        conversationId,
        candidate,
        conversation
      )
    ) {
      return { inserted: false as const, reason: "skipped" };
    }

    const row = await insertProactiveMessage(
      supabase,
      userId,
      conversationId,
      conversation.characterId,
      candidate
    );

    return {
      inserted: true as const,
      message: {
        id: row.id as string,
        role: "assistant" as const,
        content: row.content as string,
        createdAt: row.created_at as string,
      },
      source: candidate.source,
      emotion: candidate.emotion,
    };
  }

  if (gapHours !== null && gapHours < PROACTIVE_MIN_GAP_HOURS) {
    return { inserted: false as const, reason: "recent_activity" };
  }

  const needsAbsenceCheck =
    gapHours === null || gapHours >= PROACTIVE_MIN_GAP_HOURS;

  let absenceEvent: ReturnType<typeof checkAbsenceTrigger> = null;
  if (needsAbsenceCheck) {
    const { data: ucsRow } = await supabase
      .from("user_character_states")
      .select("*")
      .eq("user_id", userId)
      .eq("character_id", conversation.characterId)
      .maybeSingle();

    const ucs = ucsRow ? mapCharacterState(ucsRow) : null;
    absenceEvent = ucs ? checkAbsenceTrigger(ucs) : null;
  }

  const candidate = resolveProactiveCandidate(
    conversation.characterId,
    lastChatAt,
    absenceEvent
  );

  if (!candidate) {
    return { inserted: false as const, reason: "no_trigger" };
  }

  if (
    await shouldSkipProactiveInsert(
      supabase,
      userId,
      conversationId,
      candidate,
      conversation
    )
  ) {
    return { inserted: false as const, reason: "skipped" };
  }

  const row = await insertProactiveMessage(
    supabase,
    userId,
    conversationId,
    conversation.characterId,
    candidate
  );

  return {
    inserted: true as const,
    message: {
      id: row.id as string,
      role: "assistant" as const,
      content: row.content as string,
      createdAt: row.created_at as string,
    },
    source: candidate.source,
    emotion: candidate.emotion,
  };
}
