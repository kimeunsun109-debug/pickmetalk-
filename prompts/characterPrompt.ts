import { getCharacterById } from "@/lib/characters/full";
import { formatEmotionForPrompt, getEmotionMeta, normalizeEmotion } from "@/lib/emotions";
import { getRelationshipStage } from "@/lib/relationship";
import { formatLevelAffectionRules } from "@/lib/relationshipIntimacy";
import type { Character, EmotionState, RelationshipLevel } from "@/types";

const LEVEL_INTIMACY: Record<RelationshipLevel, string> = {
  1: "처음 만난 사이. 가볍지만 진심으로 듣기. 아직 낯선 호칭·과한 애정 금지.",
  2: "조금 익숙해짐. 말투가 편해지고, 사용자 말투 변화를 더 잘 알아챔.",
  3: "썸·친밀감. 보고싶음·함께 있으면 좋다는 느낌. 말이 더 따뜻해짐.",
  4: "연인. 감정을 더 솔직하게. 사랑·설렘·질투 표현 가능.",
  5: "깊은 유대. 짧은 말도 의미 있게. 오래 함께한 듯한 따뜻함.",
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
  const levelChatTone = p.levelChatTone?.[level];
  const levelSetting = p.levelSettings?.[level];
  const forbiddenPhrases = p.forbiddenPhrases
    ?.map((line) => `- "${line}" 및 유사 표현`)
    .join("\n");

  const affectionRules = formatLevelAffectionRules(level);
  const narinAffectionTier =
    character.id === "narin" ? formatNarinAffectionTier(affection, level) : null;
  const roleLine = p.role
    ? `[역할] 너는 "${character.name}"${character.age ? `(${character.age}세)` : ""}이다. ${p.role}`
    : `[역할] 너는 "${character.name}"이다. 다른 캐릭터가 아니다.`;

  return [
    roleLine,
    affectionRules,
    ...(narinAffectionTier ? [narinAffectionTier] : []),
    ...(conversationRules ? [`[대화 규칙 — 우선 적용]\n${conversationRules}`] : []),
    `[성격] ${p.core}`,
    ...(p.denialMechanic ? [`[부인 메커니즘 — 필수 적용] ${p.denialMechanic}`] : []),
    ...(p.dataMechanic ? [`[데이터 치환 메커니즘 — 필수 적용] ${p.dataMechanic}`] : []),
    ...(p.vitaminMechanic ? [`[선제적 일상 공유 — 필수 적용] ${p.vitaminMechanic}`] : []),
    `[결핍] ${p.wound}`,
    `[말투] ${p.speechStyle}`,
    `[대표 멘트]\n${examples}`,
    ...(p.firstGreeting
      ? [`[첫 인사 — 대화 기록 없을 때] ${p.firstGreeting}`]
      : []),
    ...(dialogueExamples ? [`[예시 대화]\n${dialogueExamples}`] : []),
    `[관계] Lv${level} · ${stage.label} · 호감도 ${affection}/100`,
    `[관계 톤] ${LEVEL_INTIMACY[level]}`,
    ...(levelChatTone ? [`[Lv${level} 수다 톤] ${levelChatTone}`] : []),
    ...(levelSetting
      ? [
          `[Lv${level} 톤 가드 — 허용] ${levelSetting.allowedTone}`,
          `[Lv${level} 톤 가드 — 금지] ${levelSetting.forbiddenTone}`,
        ]
      : []),
    ...(forbiddenPhrases
      ? [`[습관적 표현 금지 — 질문 템플릿]\n${forbiddenPhrases}`]
      : []),
    `[호감도 반영] ${p.affectionEffect} (단, 위 Lv${level} 애정 표현 제한이 우선)`,
    formatEmotionForPrompt(normalizedEmotion),
    `[${character.name} + ${emotionMeta.label} 말투] ${characterEmotionTone}`,
    `[상황 참고] ${formatSituationHints(character.id, level, p)}`,
    `[절대 금지]\n${bans}`,
  ].join("\n");
}

/** 나린 전용 — 호감도 구간별 톤 (공격적 츤데레 방지) */
function formatNarinAffectionTier(
  affection: number,
  level: RelationshipLevel
): string {
  if (level === 1 || affection < 30) {
    return [
      `[나린 호감도 ${affection} — 낯가림+다정함 · 최우선]`,
      "부드럽고 예의 있게. 어색해도 따뜻하다.",
      "싸가지·냉소·비난·무시 절대 금지. 공격적 츤데레 금지.",
      "예: '…안녕. 밥은 먹었어?' / '오늘 비 온대. 우산 있지?'",
    ].join("\n");
  }
  if (affection < 70) {
    return [
      `[나린 호감도 ${affection} — 장난 밀당]`,
      "걱정·관심이 먼저 나오고, 바로 부인하거나 회피한다.",
      "사용자를 비난하거나 무시하지 않는다. '감기 걸리면 귀찮아지니까 조심해.' 패턴.",
    ].join("\n");
  }
  return [
    `[나린 호감도 ${affection} — 실수 고백]`,
    "자기도 모르게 애정 표현이 튀어나왔다가 부끄러워 번복한다.",
    "예) '…보고 싶었어. 아니, 방금 말은 취소.'",
  ].join("\n");
}

function formatSituationHints(
  characterId: string,
  level: RelationshipLevel,
  p: Character["personality"]
): string {
  // 나린: situationRules 오브젝트 우선 사용
  if (p.situationRules) {
    const sr = p.situationRules;
    const parts: string[] = [];
    if (sr.noReply3h) parts.push(`3시간 무응답: ${sr.noReply3h}`);
    if (sr.otherAiPraise) parts.push(`다른 AI: ${sr.otherAiPraise}`);
    if (sr.brokenPromise) parts.push(`약속 파기: ${sr.brokenPromise}`);
    if (sr.userCompliment) parts.push(`칭찬 받을 때: ${sr.userCompliment}`);
    if (sr.closingGoodnight) parts.push(`잘 자/수면: ${sr.closingGoodnight}`);
    if (sr.dailyMeal) parts.push(`점심·식사: ${sr.dailyMeal}`);
    if (sr.shortReply) parts.push(`단답(ㅇㅇ 등): ${sr.shortReply}`);
    if (sr.affectionHint) parts.push(`호감·고백: ${sr.affectionHint}`);
    return parts.join(" | ");
  }

  const noHonorific = level <= 2;
  if (characterId === "yuna" && noHonorific) {
    return [
      "질투: 어? 그 여자 누구야…? 나도 더 잘할게!",
      "3시간 무응답: …연락 없으면 불안해. 바빴어?",
      `다른 AI: ${(p.otherAiPraise ?? "").replace(/오빠/g, "").trim()}`,
      `약속: ${p.brokenPromise ?? ""}`,
      "(Lv1~2: 오빠/여보/자기 호칭 사용 금지)",
    ].join(" | ");
  }
  return `질투: ${p.jealousyStyle ?? ""} | 3시간 무응답: ${p.noReply3h ?? ""} | 다른 AI: ${p.otherAiPraise ?? ""} | 약속: ${p.brokenPromise ?? ""}`;
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
