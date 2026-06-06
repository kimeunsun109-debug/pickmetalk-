import { getCharacterById } from "@/data";
import { formatEmotionForPrompt, getEmotionMeta, normalizeEmotion } from "@/lib/emotions";
import { getRelationshipStage } from "@/lib/relationship";
import { formatLevelAffectionRules } from "@/lib/relationshipIntimacy";
import type { Character, EmotionState, RelationshipLevel } from "@/types";

const LEVEL_INTIMACY: Record<RelationshipLevel, string> = {
  1: "처음 만난 사이. 부담스럽지 않게. 연애 고백·설렘 과장 금지.",
  2: "친해진 친구. 가벼운 반가움·기다림 정도만.",
  3: "썸. 보고싶음은 OK, 사랑 고백은 아직 이르다.",
  4: "연인. 사랑·설렘·질투 표현 가능.",
  5: "특별한 사이. 깊은 애정·여보·평생 가능.",
};

/** JSON 캐릭터 데이터 → 시스템 프롬프트 캐릭터 블록 */
export function buildCharacterPromptBlock(
  character: Character,
  emotion: EmotionState,
  affection: number,
  level: RelationshipLevel
): string {
  const p = character.personality;
  const normalizedEmotion = normalizeEmotion(emotion);
  const stage = getRelationshipStage(affection);
  const emotionMeta = getEmotionMeta(normalizedEmotion);
  const characterEmotionTone =
    p.emotionToneGuide[normalizedEmotion] ?? emotionMeta.speechGuide;

  const examples = p.exampleLines.map((line) => `- ${line}`).join("\n");
  const bans = p.prohibitions.map((line) => `- ${line}`).join("\n");
  const conversationRules = p.conversationRules
    ?.map((line) => `- ${line}`)
    .join("\n");
  const dialogueExamples = p.dialogueExamples
    ?.map((line) => `- ${line}`)
    .join("\n");

  const affectionRules = formatLevelAffectionRules(level);
  const roleLine = p.role
    ? `[역할] 너는 "${character.name}"이다. ${p.role}`
    : `[역할] 너는 "${character.name}"이다. 다른 캐릭터가 아니다.`;

  return [
    roleLine,
    affectionRules,
    ...(conversationRules ? [`[대화 규칙 — 우선 적용]\n${conversationRules}`] : []),
    `[성격] ${p.core}`,
    `[결핍] ${p.wound}`,
    `[말투] ${p.speechStyle}`,
    `[대표 멘트]\n${examples}`,
    ...(dialogueExamples ? [`[예시 대화]\n${dialogueExamples}`] : []),
    `[관계] Lv${level} · ${stage.label} · 호감도 ${affection}/100`,
    `[관계 톤] ${LEVEL_INTIMACY[level]}`,
    `[호감도 반영] ${p.affectionEffect} (단, 위 Lv${level} 애정 표현 제한이 우선)`,
    formatEmotionForPrompt(normalizedEmotion),
    `[${character.name} + ${emotionMeta.label} 말투] ${characterEmotionTone}`,
    `[상황 참고] 질투: ${p.jealousyStyle} | 3시간 무응답: ${p.noReply3h} | 다른 AI: ${p.otherAiPraise} | 약속: ${p.brokenPromise}`,
    `[절대 금지]\n${bans}`,
  ].join("\n");
}

export function buildCharacterPromptById(
  characterId: string,
  emotion: EmotionState,
  affection: number,
  level: RelationshipLevel
): string {
  const character = getCharacterById(characterId);
  if (!character) {
    return `[캐릭터 ID ${characterId}] 기본 여자친구 톤으로 대화.`;
  }
  return buildCharacterPromptBlock(character, emotion, affection, level);
}
