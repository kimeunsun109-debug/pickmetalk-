/** 감정 상태 — 캐릭터 말투·표정·UI에 반영 */
export type EmotionState =
  | "happy"
  | "excited"
  | "hurt"
  | "pouty"
  | "miss_you"
  | "bored"
  | "special_day";

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

/** 감정별 이 캐릭터만의 말투 힌트 */
export type CharacterEmotionToneGuide = Partial<
  Record<EmotionState, string>
>;

export interface CharacterPersonality {
  /** 프롬프트 [역할] 한 줄 (선택) */
  role?: string;
  /** 한 줄 성격 (예: 귀엽고 다정한 연하녀) */
  core: string;
  /** 결핍·상처 */
  wound: string;
  speechStyle: string;
  exampleLines: string[];
  emotionToneGuide: CharacterEmotionToneGuide;
  prohibitions: string[];
  /** 메시지 유형별 대화 규칙 (선택) */
  conversationRules?: string[];
  /** 멀티턴 예시 대화 (선택) */
  dialogueExamples?: string[];
  /** 첫 대화 시 인사말 (대화 기록 없을 때) */
  firstGreeting?: string;
  /** 관계 Lv별 수다·말투 힌트 (선택) */
  levelChatTone?: Partial<Record<RelationshipLevel, string>>;
  /** 습관적 질문·표현 금지 (선택) */
  forbiddenPhrases?: string[];
  /** Lv별 톤 허용·금지 격리 (선택) */
  levelSettings?: Partial<
    Record<
      RelationshipLevel,
      { allowedTone: string; forbiddenTone: string }
    >
  >;
  /** 부인(Denial) 메커니즘 설명 (나린 전용, 선택) */
  denialMechanic?: string;
  /** 데이터·수치 언어 치환 메커니즘 (윤서 전용, 선택) */
  dataMechanic?: string;
  /** 선제적 일상 공유 메커니즘 (지유 전용, 선택) */
  vitaminMechanic?: string;
  /** 상황별 반응 룰 오브젝트 (나린 전용, 선택) */
  situationRules?: {
    noReply3h?: string;
    otherAiPraise?: string;
    brokenPromise?: string;
    userCompliment?: string;
    closingGoodnight?: string;
    dailyMeal?: string;
    shortReply?: string;
    affectionHint?: string;
  };
  /** 하위 호환·상황별 예시 멘트 */
  traits: string[];
  jealousyStyle?: string;
  noReply3h?: string;
  otherAiPraise?: string;
  brokenPromise?: string;
  affectionEffect: string;
  premiumHook: string;
}

export interface Character {
  id: string;
  name: string;
  /** 캐릭터 나이 (프롬프트·UI 참고, 선택) */
  age?: number;
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
  /** profiles.user_context JSONB — 유저 이름·나이·직업 등 명시적 메타 */
  userContext: Record<string, string>;
  /** profiles.speech_profile JSONB — 사용자 말투 학습 */
  speechProfile: Record<string, unknown> | null;
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
  /** 윤서 전용 — 약속 이행 횟수 */
  promiseKeptCount: number;
  /** 윤서 전용 — 약속 불이행 횟수 */
  promiseBrokenCount: number;
  /** 마지막 부재 푸시 발송 시각 (쿨다운 체크용) */
  lastPushSentAt: string | null;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Absence Push Event
// ─────────────────────────────────────────────

export type PushTriggerType =
  | "no_reply_3h"       // 나린 — 3시간 무응답
  | "no_reply_24h"      // 유나 — 24시간 미접속
  | "morning_workout"   // 지유 — 오전 7시 운동 타임
  | "evening_workout"   // 지유 — 오후 8시 운동 타임
  | "night_quiet"       // 은하 — 오후 10시 야심한 밤
  | "data_gap_yoonseo"; // 윤서 — 정밀 시간 간격 고지

export interface PushEvent {
  characterId: string;
  triggerType: PushTriggerType;
  message: string;
  emotion: EmotionState;
}

export interface Conversation {
  id: string;
  userId: string;
  characterId: string;
  title: string;
  summary: string | null;
  emotion: EmotionState;
  affection: number;
  relationshipLevel: RelationshipLevel;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string | null;
  /** Server-enriched preview for conversation list */
  lastMessagePreview?: string | null;
}

export interface Message {
  id: string;
  userId: string;
  characterId: string;
  conversationId?: string;
  role: "user" | "assistant" | "system";
  content: string;
  emotion?: EmotionState;
  createdAt: string;
}

export type ShortTermMemoryType =
  | "reminder"
  | "mission"
  | "purchase"
  | "health"
  | "weather"
  | "gratitude"
  | "follow_up";

export type ShortTermMemoryStatus =
  | "active"
  | "completed"
  | "expired"
  | "dismissed";

export interface ShortTermMemory {
  id: string;
  userId: string;
  conversationId: string | null;
  characterId: string | null;
  memoryType: ShortTermMemoryType;
  content: string;
  dueDate: string | null;
  expiresAt: string;
  status: ShortTermMemoryStatus;
  priority: number;
  sourceMessageId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type DailyPatternType =
  | "wake"
  | "work_start"
  | "lunch"
  | "work_end"
  | "exercise"
  | "sleep";

export interface UserDailyPattern {
  id: string;
  userId: string;
  patternType: DailyPatternType;
  timeStartMinute: number;
  timeEndMinute: number;
  confidence: number;
  evidenceCount: number;
  timezone: string;
  lastObservedAt: string;
  lastUpdatedAt: string;
  updatedFromMessageId: string | null;
}

export interface PatternAlertPlan {
  id: string;
  userId: string;
  patternType: DailyPatternType;
  offsetMinutes: number;
  enabled: boolean;
  nextTriggerAt: string | null;
  lastComputedAt: string | null;
  createdAt: string;
  updatedAt: string;
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
