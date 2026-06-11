import { getCharacterById } from "@/data";
import { recentConversationQuery } from "@/lib/activeCharacter";
import { mapConversation } from "@/lib/db/mappers";
import type { Conversation } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/** 본인 대화방 조회 — 없으면 null */
export async function getConversationForUser(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string
): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return null;
  return mapConversation(data);
}

/** 새 대화방 생성 */
export async function createConversation(
  supabase: SupabaseClient,
  userId: string,
  characterId: string,
  title = "새 대화"
): Promise<Conversation> {
  const character = getCharacterById(characterId);
  if (!character) {
    throw new Error("캐릭터를 찾을 수 없습니다.");
  }

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      character_id: characterId,
      title,
      emotion: character.defaultEmotion,
      affection: 0,
      relationship_level: 1,
      updated_at: now,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "대화방 생성 실패");
  }

  return mapConversation(data);
}

/** 캐릭터의 최근 대화방 조회 — 없으면 새로 생성 */
export async function getOrCreateRecentConversation(
  supabase: SupabaseClient,
  userId: string,
  characterId: string
): Promise<Conversation> {
  const { data: rows } = await recentConversationQuery(
    supabase,
    userId,
    characterId
  );

  if (rows?.[0]) {
    return mapConversation(rows[0]);
  }

  return createConversation(supabase, userId, characterId);
}

/**
 * 캐릭터 + 대화방 ID로 조회 — characterId 불일치 시 null (다른 캐릭터 대화방 재사용 방지)
 */
export async function getConversationForCharacter(
  supabase: SupabaseClient,
  userId: string,
  characterId: string,
  conversationId: string
): Promise<Conversation | null> {
  const conv = await getConversationForUser(supabase, userId, conversationId);
  if (!conv || conv.characterId !== characterId) return null;
  return conv;
}

/** 캐릭터 선택 기록 갱신 (대화방과 별개) */
export async function touchCharacterSelection(
  supabase: SupabaseClient,
  userId: string,
  characterId: string
): Promise<void> {
  const character = getCharacterById(characterId);
  if (!character) return;

  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("user_character_states")
    .select("id")
    .eq("user_id", userId)
    .eq("character_id", characterId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("user_character_states")
      .update({ last_seen_at: now })
      .eq("user_id", userId)
      .eq("character_id", characterId);
  } else {
    await supabase.from("user_character_states").insert({
      user_id: userId,
      character_id: characterId,
      emotion: character.defaultEmotion,
      expression: character.defaultExpression,
      last_seen_at: now,
    });
  }
}
