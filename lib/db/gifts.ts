import { updateConversationLastMessage } from "@/lib/db/updateConversationPreview";
import type { GiftReaction } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface SendGiftParams {
  userId: string;
  characterId: string;
  conversationId: string;
  giftId: string;
  affectionDelta: number;
  reaction: GiftReaction;
  newAffection: number;
  newRelationshipLevel: number;
}

export interface SendGiftResult {
  messageId: string;
  createdAt: string;
}

/** gift_logs 기록 + assistant 메시지 + 대화방 호감도·감정 갱신 */
export async function sendGiftToCharacter(
  supabase: SupabaseClient,
  params: SendGiftParams
): Promise<SendGiftResult> {
  const now = new Date().toISOString();
  const {
    userId,
    characterId,
    conversationId,
    giftId,
    affectionDelta,
    reaction,
    newAffection,
    newRelationshipLevel,
  } = params;

  const { error: logError } = await supabase.from("gift_logs").insert({
    user_id: userId,
    character_id: characterId,
    gift_id: giftId,
    affection_delta: affectionDelta,
  });

  if (logError) {
    throw new Error(logError.message);
  }

  const { data: messageRow, error: messageError } = await supabase
    .from("messages")
    .insert({
      user_id: userId,
      character_id: characterId,
      conversation_id: conversationId,
      role: "assistant",
      content: reaction.message,
      emotion: reaction.emotion,
    })
    .select("id, created_at")
    .single();

  if (messageError || !messageRow) {
    throw new Error(messageError?.message ?? "선물 반응 메시지 저장 실패");
  }

  await Promise.all([
    supabase
      .from("conversations")
      .update({
        affection: newAffection,
        relationship_level: newRelationshipLevel,
        emotion: reaction.emotion,
        updated_at: now,
      })
      .eq("id", conversationId)
      .eq("user_id", userId),
    updateConversationLastMessage(
      supabase,
      conversationId,
      userId,
      reaction.message,
      "assistant",
      now
    ),
    supabase
      .from("user_character_states")
      .update({
        emotion: reaction.emotion,
        last_chat_at: now,
        last_seen_at: now,
      })
      .eq("user_id", userId)
      .eq("character_id", characterId),
  ]);

  return {
    messageId: messageRow.id as string,
    createdAt: messageRow.created_at as string,
  };
}
