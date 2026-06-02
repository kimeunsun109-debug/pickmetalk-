import { EMOTION_META } from "@/lib/emotions";
import type { EmotionState } from "@/types";

/** @deprecated lib/emotions.ts EMOTION_META 사용 — 하위 호환 */
export const EMOTION_PROMPTS: Record<EmotionState, string> = Object.fromEntries(
  Object.entries(EMOTION_META).map(([key, meta]) => [key, meta.hint])
) as Record<EmotionState, string>;
