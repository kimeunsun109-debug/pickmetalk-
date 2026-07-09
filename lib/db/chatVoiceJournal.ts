import { classifyTimeOfDay, getSeoulTimeContext } from "@/services/timeContext";
import type { ChatFollowUp } from "@/types/api";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface ChatVoiceJournalEntry {
  userId: string;
  conversationId: string;
  characterId: string;
  userMessage: string;
  assistantReply: string;
  followUp?: ChatFollowUp;
  createdAt?: string;
}

function mapTimeSlot(timeOfDay: ReturnType<typeof classifyTimeOfDay>): string {
  if (timeOfDay === "late_night") return "dawn";
  if (timeOfDay === "morning") return "morning";
  if (timeOfDay === "lunch") return "lunch";
  return "evening";
}

/** 앱 채팅 1턴을 voice 저널에 기록 (마이그레이션 없으면 조용히 스킵) */
export async function appendChatVoiceJournal(
  supabase: SupabaseClient,
  entry: ChatVoiceJournalEntry
): Promise<void> {
  const seoul = getSeoulTimeContext(
    entry.createdAt ? new Date(entry.createdAt) : new Date()
  );
  const timeSlot = mapTimeSlot(seoul.timeOfDay);

  const { error } = await supabase.from("chat_voice_journal").insert({
    user_id: entry.userId,
    conversation_id: entry.conversationId,
    character_id: entry.characterId,
    user_message: entry.userMessage,
    assistant_reply: entry.assistantReply,
    time_slot: timeSlot,
    follow_up: entry.followUp ?? "none",
    created_at: entry.createdAt ?? new Date().toISOString(),
  });

  if (error) {
    console.warn("[chat_voice_journal] insert skipped:", error.message);
  }
}

export interface VoiceJournalRow {
  id: string;
  user_id: string;
  conversation_id: string | null;
  character_id: string;
  user_message: string;
  assistant_reply: string;
  time_slot: string | null;
  follow_up: string | null;
  created_at: string;
}

/** jsonl 분석 스크립트용 형식으로 변환 */
export function toJournalJsonlLine(row: VoiceJournalRow): string {
  return JSON.stringify({
    ts: row.created_at,
    date: row.created_at.slice(0, 10),
    source: "app",
    characterId: row.character_id,
    variant: null,
    slot: row.time_slot ?? "unknown",
    variantLabel: "앱 실사용",
    userMessage: row.user_message,
    reply: row.assistant_reply,
    followUp: row.follow_up,
  });
}
