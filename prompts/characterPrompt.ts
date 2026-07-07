import { getCharacterById } from "@/lib/characters/full";
import { getCharacterIdentity } from "@/data/characterIdentities";
import { formatEmotionForPrompt, getEmotionMeta, normalizeEmotion } from "@/lib/emotions";
import { getRelationshipStage } from "@/lib/relationship";
import { formatLevelAffectionRules } from "@/lib/relationshipIntimacy";
import type { Character, EmotionState, RelationshipLevel } from "@/types";

const LEVEL_INTIMACY: Record<RelationshipLevel, string> = {
  1: "처음 만난 사이. 가볍지만 진심으로 듣기.",
  2: "조금 익숙해짐. 말이 편해진다.",
  3: "썸·친밀감. 따뜻함이 느껴진다.",
  4: "연인. 감정을 더 솔직하게.",
  5: "깊은 유대. 짧은 말도 의미 있다.",
};

/**
 * 캐릭터 프롬프트 — 정체성·자기소개서 중심.
 * 예시 멘트·대화 스크립트·비율 규칙은 주입하지 않는다.
 */
export function buildCharacterPromptBlock(
  character: Character,
  emotion: EmotionState,
  affection: number,
  level: RelationshipLevel
): string {
  const p = character.personality;
  const identity = getCharacterIdentity(character.id);
  const normalizedEmotion = normalizeEmotion(emotion);
  const stage = getRelationshipStage(affection);
  const emotionMeta = getEmotionMeta(normalizedEmotion);
  const characterEmotionTone =
    p.emotionToneGuide[normalizedEmotion] ?? emotionMeta.speechGuide;

  const affectionRules = formatLevelAffectionRules(level);
  const levelSetting = p.levelSettings?.[level];

  const coreBans = p.prohibitions.slice(0, 5).map((line) => `- ${line}`).join("\n");

  const identityBlock = identity
    ? [
        `[${character.name} — 자기소개서]`,
        identity.selfIntroduction,
        `[이 사람의 한 줄] ${identity.essence}`,
        `[위로를 주는 방식] ${identity.comfortStyle}`,
        ...(identity.naturalVoice
          ? [`[말할 때 자연스럽게 나오는 것 — 강제 아님] ${identity.naturalVoice}`]
          : []),
        ...(identity.witStyle
          ? [`[센스·받아치기] ${identity.witStyle}`]
          : []),
      ].join("\n")
    : `[성격] ${p.core}`;

  const narinGuard =
    character.id === "narin" && (level === 1 || affection < 30)
      ? "[나린 — 지금] 낯가림이 있지만 다정하다. 공격적 츤데레·냉소 금지."
      : null;

  const yoonseoGuard =
    character.id === "yoonseo"
      ? "[윤서 — 지금] 리포트·통계 낭독 톤은 피한다. 담백한 사실과 온기를 섞는다."
      : null;

  return [
    `[캐릭터 정체성]`,
    identityBlock,
    ...(p.role && !identity
      ? [`[배경] ${p.role}`]
      : identity
        ? []
        : []),
    ...(p.wound ? [`[속마음 — 드러내지 않아도 반응에 스며듦] ${p.wound}`] : []),
    affectionRules,
    ...(narinGuard ? [narinGuard] : []),
    ...(yoonseoGuard ? [yoonseoGuard] : []),
    `[지금 사이] Lv${level} · ${stage.label} · 호감 ${affection}`,
    `[관계 감각] ${LEVEL_INTIMACY[level]}`,
    ...(levelSetting
      ? [`[Lv${level} — 이 정도 친밀감] ${levelSetting.allowedTone}`]
      : []),
    formatEmotionForPrompt(normalizedEmotion),
    `[지금 ${emotionMeta.label}일 때] ${characterEmotionTone}`,
    ...(p.firstGreeting
      ? [`[대화가 비어 있을 때 첫 말 — 참고만, 그대로 복사 금지] ${p.firstGreeting}`]
      : []),
    `[이 사람이 절대 하지 않을 것]\n${coreBans}`,
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
    return `[캐릭터] 기본 여자친구 톤. 성격에서 자연스럽게 말한다.`;
  }
  return buildCharacterPromptBlock(character, emotion, affection, level);
}
