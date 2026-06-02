import { BASE_SYSTEM_PROMPT } from "./base";
import { buildCharacterPromptById } from "./characterPrompt";
import type { EmotionState, RelationshipLevel } from "@/types";

/**
 * 최종 시스템 프롬프트 — 캐릭터 + 감정 + 호감도 + 관계 레벨
 */
export function buildSystemPrompt(
  characterId: string,
  emotion: EmotionState,
  level: RelationshipLevel,
  affection: number,
  memorySummary?: string | null
): string {
  const characterBlock = buildCharacterPromptById(
    characterId,
    emotion,
    affection,
    level
  );
  const memory = memorySummary
    ? `\n[기억 요약]\n${memorySummary}`
    : "";

  return [BASE_SYSTEM_PROMPT, characterBlock, memory].join("\n\n");
}
