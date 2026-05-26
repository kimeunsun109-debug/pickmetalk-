/** 감정 상태 — 캐릭터 말투·표정·인사에 반영 */
export type EmotionState =
  | "happy"
  | "pouty"
  | "hurt"
  | "excited"
  | "jealous"
  | "miss_you";

/** 관계 레벨 1~5 */
export type RelationshipLevel = 1 | 2 | 3 | 4 | 5;

/** 캐릭터 표정 (UI 아바타용) */
export type ExpressionState =
  | "neutral"
  | "smile"
  | "blush"
  | "tear"
  | "angry"
  | "wink";

export interface CharacterPersonality {
  traits: string[];
  speechStyle: string;
  jealousyStyle: string;
  noReply3h: string;
  otherAiPraise: string;
  brokenPromise: string;
  affectionEffect: string;
  premiumHook: string;
}

export interface Character {
  id: string;
  name: string;
  tagline: string;
  avatar: string;
  personality: CharacterPersonality;
  /** AI 시스템 프롬프트 핵심 (prompts/ 에서 조합) */
  systemPromptKey: string;
  defaultEmotion: EmotionState;
  defaultExpression: ExpressionState;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string | null;
  trialEndsAt: string | null;
  isPremium: boolean;
  dailyMessageCount: number;
  dailyMessageResetAt: string;
}

export interface UserCharacterState {
  id: string;
  userId: string;
  characterId: string;
  affection: number;
  relationshipLevel: RelationshipLevel;
  emotion: EmotionState;
  expression: ExpressionState;
  nicknameForUser: string | null;
  lastSeenAt: string;
  lastChatAt: string | null;
  memorySummary: string | null;
  createdAt: string;
}

export interface Message {
  id: string;
  userId: string;
  characterId: string;
  role: "user" | "assistant" | "system";
  content: string;
  emotion?: EmotionState;
  createdAt: string;
}

export interface Gift {
  id: string;
  name: string;
  emoji: string;
  affectionBonus: number;
  description: string;
}

export interface GiftReaction {
  message: string;
  emotion: EmotionState;
  affectionBonus: number;
}

export interface ChatContext {
  character: Character;
  state: UserCharacterState;
  recentMessages: Message[];
  memorySummary: string | null;
  timeOfDay: "morning" | "afternoon" | "evening" | "night" | "dawn";
  daysSinceLastVisit: number;
  isReturningAfterAbsence: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  priceMonthly: number;
  features: string[];
}
