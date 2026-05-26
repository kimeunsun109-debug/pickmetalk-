import { BASE_SYSTEM_PROMPT } from "./base";
import { EMOTION_PROMPTS } from "./emotions";
import { YUNA_PROMPT } from "./characters/yuna";
import { NARIN_PROMPT } from "./characters/narin";
import { YOONSEO_PROMPT } from "./characters/yoonseo";
import { EUNHA_PROMPT } from "./characters/eunha";
import { JIYU_PROMPT } from "./characters/jiyu";
import type { EmotionState, RelationshipLevel } from "@/types";

const CHARACTER_PROMPTS: Record<string, string> = {
  yuna: YUNA_PROMPT,
  narin: NARIN_PROMPT,
  yoonseo: YOONSEO_PROMPT,
  eunha: EUNHA_PROMPT,
  jiyu: JIYU_PROMPT,
};

/** 최종 시스템 프롬프트 조합 — OpenAI 교체 시에도 동일 인터페이스 */
export function buildSystemPrompt(
  characterId: string,
  emotion: EmotionState,
  level: RelationshipLevel,
  memorySummary?: string | null
): string {
  const char = CHARACTER_PROMPTS[characterId] ?? "";
  const emotionHint = EMOTION_PROMPTS[emotion];
  const memory = memorySummary
    ? `\n[기억 요약]\n${memorySummary}`
    : "";
  return [
    BASE_SYSTEM_PROMPT,
    char,
    `\n현재 감정: ${emotionHint}`,
    `\n관계 레벨: Lv${level}`,
    memory,
  ].join("\n");
}
