import type { Message } from "@/types";

const RECENT_MESSAGE_LIMIT = 12;

/**
 * 비용 최적화: 최근 N개 + DB 요약만 AI에 전달
 * 주기적으로 긴 대화는 요약해 user_character_states.memory_summary 갱신
 */
export function pickMessagesForContext(
  messages: Message[],
  summary: string | null
): { recent: Message[]; summary: string | null } {
  const recent = messages.slice(-RECENT_MESSAGE_LIMIT);
  return { recent, summary };
}
