import { normalizeEmotion } from "@/lib/emotions";
import type { EmotionState, ExpressionState, Message, RelationshipLevel, UserCharacterState } from "@/types";

/** Supabase snake_case → 앱 타입 */
export function mapCharacterState(row: Record<string, unknown>): UserCharacterState {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    characterId: row.character_id as string,
    affection: row.affection as number,
    relationshipLevel: row.relationship_level as RelationshipLevel,
    emotion: normalizeEmotion(row.emotion as string),
    expression: row.expression as ExpressionState,
    nicknameForUser: (row.nickname_for_user as string | null) ?? null,
    lastSeenAt: row.last_seen_at as string,
    lastChatAt: (row.last_chat_at as string | null) ?? null,
    memorySummary: (row.memory_summary as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapMessage(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    characterId: row.character_id as string,
    role: row.role as Message["role"],
    content: row.content as string,
    emotion: row.emotion
      ? normalizeEmotion(row.emotion as string)
      : undefined,
    createdAt: row.created_at as string,
  };
}
