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
import { getContextMemoryPrompt } from "@/services/memory";
import { buildSpeechStylePromptBlock } from "@/services/speechStyle";
import type { UserSpeechProfile } from "@/services/speechStyle";
import type { TimeAwareContext } from "@/services/timeContext";
import type { EmotionState, Message, RelationshipLevel } from "@/types";

const MEMORY_SUMMARY_LINE_CAP = 5;
const MEMORY_SUMMARY_LINE_THRESHOLD = 10;

function limitMemorySummaryBlock(memorySummary: string | null): string {
  if (!memorySummary?.trim()) return "";
  const lines = memorySummary.trim().split("\n");
  const body =
    lines.length > MEMORY_SUMMARY_LINE_THRESHOLD
      ? lines.slice(0, MEMORY_SUMMARY_LINE_CAP).join("\n")
      : memorySummary.trim();
  return `${MEMORY_PROMPT_RULES}\n\n[기억 요약]\n${body}`;
}

/**
 * Tier 기반 시스템 프롬프트 — 필수 블록 우선, 조건부·선택 블록으로 토큰 절감
 *
 * Tier 1: base + character + dialogue guard (필수)
 * Tier 2: 감정·세션·동적 컨텍스트·기억 힌트 (조건부)
 * Tier 3: 토핑·토픽·킥라인 (초반·맥락 필요 시)
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
  const characterName = character?.name ?? "캐릭터";
  const inAcuteEmotion = emotion === "hurt" || emotion === "pouty";

  const characterBlock = buildCharacterPromptById(
    characterId,
    emotion,
    affection,
    level
  );
  const baseBlock = generateBaseSystemPrompt({
    characterId,
    characterName,
    emotion,
    emotionDurationTurns,
    relationshipLevel: level,
  });

  const tier1 = [
    baseBlock,
    characterBlock,
    buildDialogueEngineRules(characterId, characterName),
    buildRecentDialogueGuard(recentMessages),
  ];

  const tier2: string[] = [];
  const trimmedDynamic = dynamicContextBlock.trim();
  if (trimmedDynamic) {
    tier2.push(trimmedDynamic);
  }

  if (inAcuteEmotion || ongoingSession) {
    tier2.push(
      buildSessionContinuityRules({
        ongoingSession,
        userMessageCount,
        absenceTier: timeContext?.absence.tier,
        narrativePauseReturn: timeContext?.absence.narrativePauseReturn,
      })
    );
  }

  const speechStyleBlock = buildSpeechStylePromptBlock(speechProfile);
  if (speechStyleBlock) tier2.push(speechStyleBlock);

  const memoryPriorityHints = getContextMemoryPrompt(memorySummary ?? null, {
    userMessageCount,
    emotion,
    emotionDurationTurns,
    ongoingSession,
  });
  if (memoryPriorityHints) tier2.push(memoryPriorityHints);

  const tier3: string[] = [];
  if (userMessageCount < 12) {
    tier3.push(buildMealAndContextRules());
    const topping = buildCharacterToppingBlock(characterId);
    if (topping) tier3.push(topping);
  }

  if (userMessageCount <= 10) {
    const kickLineHint = buildKickLineHint({
      characterId,
      userMessage: latestUserMessage,
      turnCount: userMessageCount,
    });
    if (kickLineHint) tier3.push(kickLineHint);
  }

  if (userMessageCount >= 2) {
    const topicGuides = buildCharacterTopicGuides(characterId);
    if (topicGuides) tier3.push(topicGuides);
  }

  const memory = limitMemorySummaryBlock(memorySummary ?? null);

  return [...tier1, ...tier2, ...tier3, memory].filter(Boolean).join("\n\n");
}
