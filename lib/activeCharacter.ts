import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * 활성 캐릭터 조회 — last_seen_at 기준 (선택·채팅 모두 갱신).
 */
export function activeCharacterQuery(
  supabase: SupabaseClient,
  userId: string
) {
  return supabase
    .from("user_character_states")
    .select("*")
    .eq("user_id", userId)
    .order("last_seen_at", { ascending: false })
    .limit(1);
}

/** 가장 최근 대화방 */
export function recentConversationQuery(
  supabase: SupabaseClient,
  userId: string,
  characterId?: string
) {
  let query = supabase
    .from("conversations")
    .select("*")
    .eq("user_id", userId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(1);

  if (characterId) {
    query = query.eq("character_id", characterId);
  }

  return query;
}
