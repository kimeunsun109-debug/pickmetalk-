import { getCharacterById } from "@/data";
import {
  buildRecentDialogueGuard,
  buildSessionContinuityRules,
  generateBaseSystemPrompt,
  MEMORY_PROMPT_RULES,
} from "./base";
import { buildCharacterToppingBlock } from "./characterToppings";
import { buildCharacterPromptById } from "./characterPrompt";
import { buildKickLineHint } from "./kickLines";
import { getContextMemoryPrompt } from "@/services/memory";
import { buildSpeechStylePromptBlock } from "@/services/speechStyle";
import type { UserSpeechProfile } from "@/services/speechStyle";
import type { TimeAwareContext } from "@/services/timeContext";
import type { EmotionState, Message, RelationshipLevel } from "@/types";

/**
 * 최종 시스템 프롬프트 — 캐릭터 + 감정 + 호감도 + 관계 레벨 + 동적 컨텍스트
 *
 * 주입 순서 (LLM이 먼저 읽는 것이 가장 중요):
 * 1. dynamicContextBlock  — 유저 메타 + 캐릭터별 스탯 (매 턴 최신화)
 * 2. memoryPriorityHints  — work/hobby 필수 회수 힌트
 * 3. baseBlock            — 공통 정체성·규칙
 * 4. characterBlock       — 캐릭터 개별 성격·규칙
 * 5. memory               — 기억 요약 원본
 */
export function buildSystemPrompt(
  characterId: string,
  emotion: EmotionState,
  level: RelationshipLevel,
  affection: number,
  memorySummary?: string | null,
  emotionDurationTurns = 1,
  userMessageCount = 0,
  dynamicContextBlock = "",
  ongoingSession = false,
  recentMessages: Message[] = [],
  speechProfile: UserSpeechProfile | null = null,
  latestUserMessage = "",
  timeContext: TimeAwareContext | null = null
): string {
  const character = getCharacterById(characterId);
  const characterBlock = buildCharacterPromptById(
    characterId,
    emotion,
    affection,
    level
  );
  const baseBlock = generateBaseSystemPrompt({
    characterName: character?.name ?? "캐릭터",
    emotion,
    emotionDurationTurns,
    relationshipLevel: level,
  });
  const memoryPriorityHints = getContextMemoryPrompt(memorySummary ?? null, {
    userMessageCount,
    emotion,
    emotionDurationTurns,
    ongoingSession,
  });
  const memory = memorySummary?.trim()
    ? `${MEMORY_PROMPT_RULES}\n\n[기억 요약]\n${memorySummary.trim()}`
    : "";

  const sessionContinuityRules = buildSessionContinuityRules({
    ongoingSession,
    userMessageCount,
    absenceTier: timeContext?.absence.tier,
    narrativePauseReturn: timeContext?.absence.narrativePauseReturn,
  });
  const recentDialogueGuard = buildRecentDialogueGuard(recentMessages);
  const speechStyleBlock = buildSpeechStylePromptBlock(speechProfile);
  const toppingBlock = buildCharacterToppingBlock(characterId);
  const kickLineHint = buildKickLineHint({
    userMessage: latestUserMessage,
    turnCount: userMessageCount,
  });

  return [
    dynamicContextBlock,
    speechStyleBlock,
    sessionContinuityRules,
    recentDialogueGuard,
    kickLineHint,
    memoryPriorityHints,
    baseBlock,
    toppingBlock,
    characterBlock,
    memory,
  ]
    .filter(Boolean)
    .join("\n\n");
}
