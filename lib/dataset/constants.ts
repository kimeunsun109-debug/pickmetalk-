import { REACTION_PATTERNS, type ScoreStars } from "./types";

export const SCORE_LABELS: Record<ScoreStars, string> = {
  5: "★★★★★",
  4: "★★★★☆",
  3: "★★★☆☆",
  2: "★★☆☆☆",
  1: "★☆☆☆☆",
};

export const BEST_LINE_CATEGORY_MAP: Record<string, string> = {
  공감: "empathy",
  센스: "humor",
  드립: "humor",
  명대사: "kick_lines",
  생활밀착: "life",
  감정: "romance",
  관심: "compliments",
  마무리: "comfort",
  질문: "questions",
  리액션: "reactions",
};

export function starsFromScore(score: number): ScoreStars {
  const s = Math.min(5, Math.max(1, Math.round(score))) as ScoreStars;
  return s;
}

export function isReactionLine(text: string): boolean {
  const t = text.trim();
  return REACTION_PATTERNS.test(t) || /^ㅋ{2,}|^ㅎ{2,}|^헐|^와[.!~]?$/u.test(t);
}

export const DATASET_ROOT = "dataset";

export const MIN_DAILY_TURNS = 30;

export const TURNS_PER_SLOT = 10;
