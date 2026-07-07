import { truncatePreview } from "@/lib/formatMessageTime";
import type { SupabaseClient } from "@supabase/supabase-js";

/** conversations.last_message_preview / last_message_role 갱신 */
export async function updateConversationLastMessage(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
  content: string,
  role: "user" | "assistant",
  now: string,
  extra?: Record<string, unknown>
): Promise<void> {
  await supabase
    .from("conversations")
    .update({
      last_message_preview: truncatePreview(content, 200),
      last_message_role: role,
      last_message_at: now,
      updated_at: now,
      ...extra,
    })
    .eq("id", conversationId)
    .eq("user_id", userId);
}
