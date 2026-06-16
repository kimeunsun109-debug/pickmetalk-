import type { SupabaseClient } from "@supabase/supabase-js";

export interface LastMessagePreview {
  conversationId: string;
  content: string;
  role: "user" | "assistant";
}

/** Fetch the latest message per conversation (batch). */
export async function fetchLastMessagePreviews(
  supabase: SupabaseClient,
  userId: string,
  conversationIds: string[]
): Promise<Map<string, LastMessagePreview>> {
  const map = new Map<string, LastMessagePreview>();
  if (conversationIds.length === 0) return map;

  const { data, error } = await supabase
    .from("messages")
    .select("conversation_id, content, role, created_at")
    .eq("user_id", userId)
    .in("conversation_id", conversationIds)
    .in("role", ["user", "assistant"])
    .order("created_at", { ascending: false });

  if (error || !data) return map;

  for (const row of data) {
    const convId = row.conversation_id as string;
    if (!convId || map.has(convId)) continue;
    map.set(convId, {
      conversationId: convId,
      content: row.content as string,
      role: row.role as "user" | "assistant",
    });
  }

  return map;
}
