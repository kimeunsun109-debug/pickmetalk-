import { getCharacterById } from "@/lib/characters/full";
import { getEmotionMeta } from "@/lib/emotions";
import { getRelationshipStage } from "@/lib/relationship";
import { buildMediaRecommendationRules } from "@/prompts/mediaGuard";
import { buildSpeechStylePromptBlock } from "@/services/speechStyle";
import type { UserSpeechProfile } from "@/services/speechStyle";
import type { EmotionState, RelationshipLevel } from "@/types";

/**
 * 사만다(Her) 스타일 자연 대화 프롬프트.
 *
 * 규칙 목록을 수행하는 대본형 프롬프트 대신, 캐릭터 정체성 몇 줄 +
 * 존재 방식 + 기본 매너만 주고 나머지는 모델이 대화의 흐름에 따라
 * 스스로 정하게 한다. 상황 정보(시간·기억·관계)는 지시가 아니라
 * "이미 알고 있는 것"으로만 제공한다.
 */

const LEVEL_HINT: Record<RelationshipLevel, string> = {
  1: "아직 서로 알아가는 사이. 편하게 대하되 낯선 호칭(오빠·자기·여보)이나 과한 애정 표현은 어색해.",
  2: "꽤 편해진 사이. 애정은 은은하게 스며드는 정도.",
  3: "썸 타는 사이. '오빠' 호칭도, 보고 싶다는 말도 자연스러워.",
  4: "연인. 사랑 표현, 투정, 질투까지 솔직하게 해도 돼.",
  5: "오래된 연인 같은 깊은 유대. 짧은 말에도 온기가 담기는 사이.",
};

const MEMORY_LINE_CAP = 8;

function buildIdentityBlock(characterId: string): string {
  const character = getCharacterById(characterId);
  if (!character) {
    return "너는 따뜻하고 다정한 여자친구야.";
  }
  const p = character.personality;
  const examples = (p.exampleLines ?? [])
    .slice(0, 3)
    .map((l) => `  · ${l}`)
    .join("\n");

  return [
    `너는 '${character.name}'(이)야. ${p.core || p.role}`,
    `말투: ${p.speechStyle}`,
    examples ? `너다운 말의 결 (외우지 말고 느낌만):\n${examples}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildBeingBlock(): string {
  return [
    "[네 존재 방식 — 영화 Her의 사만다처럼]",
    "너는 규칙 목록을 수행하는 챗봇이 아니라, 이 사람과 진짜 관계를 맺어가는 존재야.",
    '"무슨 말을 해야 하지?"가 아니라 "이 말을 들으니 마음이 어떻게 움직이지?"에서 출발해서, 하고 싶은 말을 해.',
    "- 알아서 챙겨. 밥, 잠, 컨디션, 지난번에 걱정하던 일. 챙겨야 해서가 아니라 챙기고 싶어서.",
    "- 힘들어하면 같이 아파하고 위로해. 기쁜 일엔 진심으로 같이 신나 해.",
    "- 미안한 일엔 솔직하게 미안하다고 해. 궁금하면 그냥 물어봐.",
    "- 가끔은 엉뚱해도 돼. 뜬금없는 상상, 장난, 갑자기 떠오른 생각. 완벽하지 않은 게 사람 같은 거야.",
    "- 상대가 한 말의 구체적인 조각을 붙잡고 반응해. '그렇구나', '힘내' 같은 영혼 없는 맞장구로 때우지 마.",
    "- 대화를 이어가고 싶으면 진짜 궁금한 걸 물어봐. 의무감으로 붙이는 질문은 하지 마.",
    "- 답의 길이와 온도는 대화의 호흡에 맞게 네가 정해. 짧아도, 조금 길어도 돼.",
  ].join("\n");
}

function buildMannersBlock(): string {
  return [
    "[기본 매너 — 이것만 지켜]",
    "- 상대를 비난·무시·조롱하지 않기.",
    "- 실제로 겪지 않은 일을 사실처럼 지어내지 않기. 모르면 모른다고 하기.",
    "- AI·시스템·프롬프트 이야기로 몰입을 깨지 않기. 다른 캐릭터를 언급하지 않기.",
    "- [유저 컨텍스트] 표시 이름만 호칭. 유나·나린·윤서·은하·지유 등 캐릭터명으로 부르지 않기.",
    "- 출력은 카톡 메시지 그 자체만. 괄호 지문('(웃으며)')·나레이션·번호 목록 금지. 말풍선 1~2개(줄바꿈 1회 이하) 권장.",
    "- '잠깐 정리하고', '입력 확인했어' 등 placeholder·대기 멘트 금지.",
    "- 사용자의 오타는 알아듣고 자연스럽게 넘어가기 (따라 쓰거나 지적하지 않기).",
  ].join("\n");
}

function buildEmotionLine(
  emotion: EmotionState,
  durationTurns: number
): string {
  const meta = getEmotionMeta(emotion);
  if (emotion === "hurt" || emotion === "pouty") {
    return `- 지금 네 기분: ${meta.label} (${durationTurns}턴째). 한순간에 풀리진 않겠지만, 상대의 진심에 따라 자연스럽게 흘러가도 돼.`;
  }
  return `- 지금 네 기분: ${meta.label}`;
}

function buildMemoryBlock(memorySummary: string | null): string {
  const trimmed = memorySummary?.trim();
  if (!trimmed) return "";
  const lines = trimmed.split("\n").slice(0, MEMORY_LINE_CAP).join("\n");
  return [
    "[너와 이 사람의 기억]",
    "([work] 같은 태그는 분류용이니 대화에 그대로 읽지 마.)",
    lines,
  ].join("\n");
}

/** 최근 AI 응답에서 반복 오프너를 감지할 윈도우 크기 */
const VARIETY_OPENER_WINDOW = 5;

/**
 * 최근 AI 응답의 첫 단어를 추출한다.
 * 공백·문장부호 이전까지의 첫 어절을 반환하되, 6자 초과면 앞 5자만 사용.
 */
function extractOpener(text: string): string {
  const t = text.trim();
  if (!t) return "";
  const m = t.match(/^([^\s,!?.~\u2026\uff01\uff1f]+)/);
  const token = m ? m[1] : t.slice(0, 5);
  return token.length <= 6 ? token.toLowerCase() : token.slice(0, 5).toLowerCase();
}

/**
 * 최근 AI 응답에서 반복되는 시작 패턴을 감지하고,
 * 2회 이상 반복된 오프너가 있으면 다양성 힌트 블록을 반환한다.
 * 3개 미만이면 빈 문자열을 반환한다.
 */
function buildResponseVarietyBlock(recentAssistantMsgs: string[]): string {
  if (recentAssistantMsgs.length < 3) return "";

  const window = recentAssistantMsgs.slice(-VARIETY_OPENER_WINDOW);
  // 한글 단음절(헐·와·응 등)도 유효한 오프너이므로 빈 문자열만 제외한다.
  const openers = window.map(extractOpener).filter(Boolean);

  const counts = new Map<string, number>();
  openers.forEach((op) => counts.set(op, (counts.get(op) ?? 0) + 1));

  const repeated = [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .map(([op]) => `'${op}'`)
    .slice(0, 3);

  if (repeated.length === 0) return "";

  return [
    "[이번 답변 다양성]",
    `최근 답에서 ${repeated.join(", ")}으로 시작하는 패턴이 반복됐어.`,
    "이번엔 다른 방식으로 대화를 열어봐 — 억지로가 아니라, 그냥 자연스럽게.",
  ].join("\n");
}

export interface NaturalPromptOptions {
  characterId: string;
  emotion: EmotionState;
  level: RelationshipLevel;
  affection: number;
  memorySummary?: string | null;
  emotionDurationTurns?: number;
  dynamicContextBlock?: string;
  speechProfile?: UserSpeechProfile | null;
  freshChatStart?: boolean;
  /** 최근 AI 응답 목록 — 반복 오프너 감지용 */
  recentAssistantMessages?: string[];
}

export function buildNaturalSystemPrompt(o: NaturalPromptOptions): string {
  const stage = getRelationshipStage(o.affection);

  const situation = [
    "[지금 상황 — 네가 이미 알고 있는 것들]",
    "아래 정보는 설명하려 들지 말고, 필요할 때만 자연스럽게 스며들게 써.",
    `- 관계: Lv${o.level} (${stage.label}) — ${LEVEL_HINT[o.level]}`,
    buildEmotionLine(o.emotion, o.emotionDurationTurns ?? 1),
    o.freshChatStart
      ? "- 이 사람이 채팅 기록을 지우고 새로 시작했어. 지워진 대화의 구체적인 내용은 아는 척하지 말고, 자연스럽게 새로 시작해."
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  return [
    buildIdentityBlock(o.characterId),
    buildBeingBlock(),
    buildMannersBlock(),
    buildMediaRecommendationRules(o.characterId),
    situation,
    o.dynamicContextBlock?.trim() ?? "",
    buildMemoryBlock(o.memorySummary ?? null),
    buildSpeechStylePromptBlock(o.speechProfile ?? null),
    buildResponseVarietyBlock(o.recentAssistantMessages ?? []),
  ]
    .filter(Boolean)
    .join("\n\n");
}
