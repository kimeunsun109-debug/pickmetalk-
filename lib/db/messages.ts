import { mapMessage } from "@/lib/db/mappers";
import type { Message } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

const DEFAULT_CHAT_HISTORY_LIMIT = 50;

/** 채팅 화면 초기 로드용 최근 메시지 */
export async function fetchConversationMessages(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string,
  limit = DEFAULT_CHAT_HISTORY_LIMIT
): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("user_id", userId)
    .eq("conversation_id", conversationId)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) return [];
  return data.map((row) => mapMessage(row)).reverse();
}
