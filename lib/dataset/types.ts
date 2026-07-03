/** 분석 태그 — 문장 단위 분류 */
export const SENTENCE_TAGS = [
  "상황",
  "감정",
  "공감",
  "센스",
  "드립",
  "생활밀착",
  "관심",
  "질문",
  "마무리",
  "행동유도",
  "명대사",
] as const;

export type SentenceTag = (typeof SENTENCE_TAGS)[number];

/** 리액션 수집 우선 (단독 태그) */
export const REACTION_PATTERNS =
  /^(와\.?|헐\.?|아\s?진짜\??|대박인데\??|잠깐ㅋㅋ|미쳤다ㅋㅋ|ㅋㅋㅋ+|ㅎㅎ+|헐\s?대박)/u;

export type DaySlot = "morning" | "lunch" | "evening" | "dawn";

export type ScoreStars = 1 | 2 | 3 | 4 | 5;

export interface AnalyzedSentence {
  id: string;
  date: string;
  slot: DaySlot;
  sessionId: string;
  turn: number;
  characterId: string;
  role: "user" | "assistant";
  text: string;
  /** 주 분류 태그 */
  primaryTag: SentenceTag | "리액션";
  tags: string[];
  situation: string;
  userEmotion: string;
  aiEmotion: string;
  dialoguePurpose: string;
  isQuestion: boolean;
  hasEmpathy: boolean;
  hasLifeClose: boolean;
  isKickLine: boolean;
  isReaction: boolean;
  score: ScoreStars;
  scoreLabel: string;
}

export interface ConversationTurn {
  turn: number;
  user: string;
  assistant: string;
  characterId: string;
}

export interface DailySession {
  id: string;
  slot: DaySlot;
  scenarioId: string;
  scenarioTitle: string;
  characterId: string;
  startedAt: string;
  turns: ConversationTurn[];
  sentences: AnalyzedSentence[];
}

export interface DailyLog {
  date: string;
  sessions: DailySession[];
  meta: {
    totalTurns: number;
    totalSentences: number;
    fiveStarCount: number;
  };
}

export interface BestLineEntry extends AnalyzedSentence {
  category: string;
  savedAt: string;
}

export interface ScoreStatistics {
  updatedAt: string;
  byDate: Record<
    string,
    {
      totalSentences: number;
      avgScore: number;
      fiveStar: number;
      byCharacter: Record<string, number>;
      byTag: Record<string, number>;
    }
  >;
  allTime: {
    totalSentences: number;
    avgScore: number;
    fiveStar: number;
  };
}
