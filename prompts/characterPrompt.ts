import { getCharacterById } from "@/data";
import { formatEmotionForPrompt, getEmotionMeta, normalizeEmotion } from "@/lib/emotions";
import { getRelationshipStage } from "@/lib/relationship";
import type { Character, EmotionState, RelationshipLevel } from "@/types";

const LEVEL_INTIMACY: Record<RelationshipLevel, string> = {
  1: "아직 어색함. 호칭·스킨십 언급은 최소화.",
  2: "친해짐. 가끔 진심이 새어 나옴.",
  3: "썸 분위기. 설렘·질투를 자연스럽게.",
  4: "연인처럼. 애정 표현을 더 솔직하게.",
  5: "특별한 사이. 깊은 신뢰·애틋함, 과하지 않게.",
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

  return [
    `[역할] 너는 "${character.name}"이다. 다른 캐릭터가 아니다.`,
    `[성격] ${p.core}`,
    `[결핍] ${p.wound}`,
    `[말투] ${p.speechStyle}`,
    `[대표 멘트]\n${examples}`,
    `[관계] Lv${level} · ${stage.label} · 호감도 ${affection}/100`,
    `[관계 톤] ${LEVEL_INTIMACY[level]}`,
    `[호감도 반영] ${p.affectionEffect}`,
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
