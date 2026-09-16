import { getCharacterById } from "@/lib/characters/full";
import {
  buildCharacterSpecificQaGuards,
  buildDialogueEngineRules,
  buildQaGuardRules,
} from "./base";
import {
  buildNaturalSystemPrompt,
  type NaturalPromptOptions,
} from "./natural";

/**
 * 채팅 시스템 프롬프트 — Her 스타일 자연 대화 + QA 가드.
 *
 * 자연 대화(정체성·존재 방식) 위에 base.ts QA 규칙(이름 바인딩·공감 우선·
 * 조언 루프 금지 등)을 얹어 QA 이슈를 줄인다.
 */
export type { NaturalPromptOptions as BuildSystemPromptOptions };

export function buildSystemPrompt(options: NaturalPromptOptions): string {
  const character = getCharacterById(options.characterId);
  const characterName = character?.name ?? options.characterId;

  const qaLayer = [
    buildDialogueEngineRules(options.characterId, characterName),
    buildQaGuardRules(),
    buildCharacterSpecificQaGuards(options.characterId, characterName),
  ].join("\n\n");

  return [buildNaturalSystemPrompt(options), qaLayer].filter(Boolean).join("\n\n");
}
