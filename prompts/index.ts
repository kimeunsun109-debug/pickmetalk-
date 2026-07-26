import {
  buildNaturalSystemPrompt,
  type NaturalPromptOptions,
} from "./natural";

/**
 * 채팅 시스템 프롬프트 — 사만다(Her) 스타일 자연 대화 모드.
 *
 * 이전의 Tier 기반 규칙 대본(비율 가이드·킥라인·토픽 가이드·금지어 목록 등)은
 * "짜내서 말하는" 느낌을 만들어 폐기했다. 캐릭터 정체성 + 존재 방식 + 기본 매너 +
 * 상황 데이터만 전달한다. 이전 빌더들은 prompts/base.ts 등에 남아 있다.
 */
export type { NaturalPromptOptions as BuildSystemPromptOptions };

export function buildSystemPrompt(options: NaturalPromptOptions): string {
  return buildNaturalSystemPrompt(options);
}
