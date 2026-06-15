import { normalizeEmotion } from "@/lib/emotions";
import type {
  Conversation,
  ExpressionState,
  Message,
  RelationshipLevel,
  UserCharacterState,
  UserProfile,
} from "@/types";

// ─────────────────────────────────────────────
// characters 마스터 테이블 row 타입
// ─────────────────────────────────────────────

export interface CharacterRow {
  id: string;
  name: string;
  tagline: string;
  avatar_url: string;
  default_emotion: string;
  default_expression: string;
  is_active: boolean;
  is_premium_only: boolean;
  sort_order: number;
}

/** Supabase characters 테이블 row → 앱 표시용 DTO */
export function mapCharacter(row: CharacterRow) {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    avatarUrl: row.avatar_url,
    defaultEmotion: normalizeEmotion(row.default_emotion),
    defaultExpression: (row.default_expression ?? "smile") as ExpressionState,
    isActive: row.is_active,
    isPremiumOnly: row.is_premium_only,
    sortOrder: row.sort_order,
  };
}

export type MappedCharacter = ReturnType<typeof mapCharacter>;

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
    promiseKeptCount: (row.promise_kept_count as number) ?? 0,
    promiseBrokenCount: (row.promise_broken_count as number) ?? 0,
    lastPushSentAt: (row.last_push_sent_at as string | null) ?? null,
    createdAt: row.created_at as string,
  };
}

export function mapUserProfile(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    email: row.email as string,
    displayName: (row.display_name as string | null) ?? null,
    trialEndsAt: (row.trial_ends_at as string | null) ?? null,
    isPremium: (row.is_premium as boolean) ?? false,
    dailyMessageCount: (row.daily_message_count as number) ?? 0,
    dailyMessageResetAt: row.daily_message_reset_at as string,
    userContext: (row.user_context as Record<string, string>) ?? {},
  };
}

export function mapConversation(row: Record<string, unknown>): Conversation {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    characterId: row.character_id as string,
    title: row.title as string,
    summary: (row.summary as string | null) ?? null,
    emotion: normalizeEmotion(row.emotion as string),
    affection: (row.affection as number) ?? 0,
    relationshipLevel: (row.relationship_level as RelationshipLevel) ?? 1,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    lastMessageAt: (row.last_message_at as string | null) ?? null,
  };
}

export function mapMessage(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    characterId: row.character_id as string,
    conversationId: (row.conversation_id as string | null) ?? undefined,
    role: row.role as Message["role"],
    content: row.content as string,
    emotion: row.emotion
      ? normalizeEmotion(row.emotion as string)
      : undefined,
    createdAt: row.created_at as string,
  };
}
