import { getCharacterById } from "@/data";
import {
  buildDialogueEngineRules,
  buildRecentDialogueGuard,
  buildSessionContinuityRules,
  generateBaseSystemPrompt,
  MEMORY_PROMPT_RULES,
} from "./base";
import { buildCharacterToppingBlock } from "./characterToppings";
import { buildCharacterPromptById } from "./characterPrompt";
import {
  buildCharacterTopicGuides,
  buildMealAndContextRules,
} from "./topicGuides";
import { buildKickLineHint } from "./kickLines";
import { buildVoiceAbOverlay, type VoiceAbVariant } from "./voiceAbVariants";
import { getContextMemoryPrompt } from "@/services/memory";
import { buildSpeechStylePromptBlock } from "@/services/speechStyle";
import type { UserSpeechProfile } from "@/services/speechStyle";
import type { TimeAwareContext } from "@/services/timeContext";
import type { EmotionState, Message, RelationshipLevel } from "@/types";

export interface BuildSystemPromptOptions {
  voiceAbVariant?: VoiceAbVariant | null;
}

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
  timeContext: TimeAwareContext | null = null,
  options?: BuildSystemPromptOptions
): string {
  const character = getCharacterById(characterId);
  const characterBlock = buildCharacterPromptById(
    characterId,
    emotion,
    affection,
    level
  );
  const baseBlock = generateBaseSystemPrompt({
    characterId,
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
  const dialogueEngineRules = buildDialogueEngineRules(
    characterId,
    character?.name ?? "캐릭터"
  );
  const speechStyleBlock = buildSpeechStylePromptBlock(speechProfile);
  const toppingBlock = buildCharacterToppingBlock(characterId);
  const kickLineHint = buildKickLineHint({
    characterId,
    userMessage: latestUserMessage,
    turnCount: userMessageCount,
  });

  const topicGuides = buildCharacterTopicGuides(characterId);
  const mealContextRules = buildMealAndContextRules();
  const voiceAbBlock = buildVoiceAbOverlay(options?.voiceAbVariant);

  return [
    dynamicContextBlock,
    dialogueEngineRules,
    mealContextRules,
    voiceAbBlock,
    characterBlock,
    toppingBlock,
    topicGuides,
    baseBlock,
    speechStyleBlock,
    sessionContinuityRules,
    recentDialogueGuard,
    kickLineHint,
    memoryPriorityHints,
    memory,
  ]
    .filter(Boolean)
    .join("\n\n");
}
