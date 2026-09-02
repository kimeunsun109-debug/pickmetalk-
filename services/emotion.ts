import { normalizeEmotion } from "@/lib/emotions";
import { isSeoulLateNight } from "@/services/timeContext";
import type { EmotionState, Message } from "@/types";

const PRAISE_PATTERN =
  /예쁘|멋|최고|고마워|잘했|칭찬|대단|훌륭|잘한다|대박|짱|최고야/i;

const AFFECTION_PATTERN =
  /좋아해|보고\s?싶|예쁘다|사랑해|좋아\s|너\s?좋아|심쿵|설레|두근|좋아요/i;

const OTHER_AI_PATTERN =
  /챗\s?gpt|chatgpt|다른\s?(ai|에이아이|챗|봇|여자)|gpt|클로드|gemini/i;

const PROMISE_BREAK_PATTERN = /약속\s?(안|못|깨|어겨)|약속\s?취소|못\s?만나/i;

const COLD_REPLY_PATTERN =
  /^(응|어|ㅇ|ㅇㅇ|ㅋ|ㅋㅋ|넵|그래|알았어|몰라|별로|싫어)\.?$/i;

const BORED_PATTERN = /^(ㅎㅇ|하이|안녕|뭐해|심심|ㅋㅋㅋ)\.?$/i;

/**
 * 메시지가 냉담하거나 무관심한 반응인지 판별한다.
 * 시간 기반 감정(hurt/pouty)을 적용할지 결정하는 데 사용.
 * COLD_REPLY_PATTERN 또는 BORED_PATTERN에 해당하면 true.
 */
export function isNegativeOrColdMessage(text: string): boolean {
  const t = text.trim();
  if (!t || t.length <= 1) return true;
  return COLD_REPLY_PATTERN.test(t) || BORED_PATTERN.test(t);
}

export interface EmotionResolveContext {
  userMessage: string;
  lastChatAt: string | null;
  lastSeenAt: string | null;
  currentEmotion?: EmotionState;
  /** 이번 턴에서 호감도가 오를 예정 */
  affectionWillIncrease?: boolean;
  /** 캐릭터 ID — 지정 시 캐릭터별 excited 확률을 적용 */
  characterId?: string;
}

/**
 * 캐릭터별 excited 감정 발현 확률.
 * 성격과 에너지 레벨을 반영한다:
 *   - jiyu  (활기찬 스포츠형): 0.50 — 자주 흥분·설렘을 표현
 *   - yuna  (현실 상담형):     0.30 — 기본값 (현재 동일)
 *   - narin (다정한 츤):       0.22 — 부끄러움으로 약간 자제
 *   - eunha (조용한 감성형):   0.12 — 내향적, 흥분 드뭄
 *   - yoonseo (냉정한 T형):    0.08 — 감정 표출 최소화
 */
const EXCITED_PROBABILITY: Record<string, number> = {
  jiyu: 0.50,
  yuna: 0.30,
  narin: 0.22,
  eunha: 0.12,
  yoonseo: 0.08,
};
const DEFAULT_EXCITED_PROBABILITY = 0.30;

function hoursSince(iso: string | null): number | null {
  if (!iso) return null;
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

function isLateNight(): boolean {
  return isSeoulLateNight();
}

/** 메시지·시간·호감도 기반 감정 (우선순위 높은 것부터) */
export function inferEmotionFromUserMessage(text: string): EmotionState | null {
  const t = text.trim();
  if (!t) return "bored";

  if (OTHER_AI_PATTERN.test(t)) return "pouty";
  if (PROMISE_BREAK_PATTERN.test(t)) return "pouty";
  if (AFFECTION_PATTERN.test(t)) return "excited";
  if (PRAISE_PATTERN.test(t)) return "happy";
  if (COLD_REPLY_PATTERN.test(t)) return "hurt";
  if (BORED_PATTERN.test(t)) return "bored";
  if (/미안|죄송/.test(t) && /늦|답장/.test(t)) return "hurt";

  return null;
}

/** 최근 턴들이 같은 대화 세션인지 (복귀 인사는 세션 첫 턴에만) */
export function isOngoingChatSession(
  history: Message[],
  sessionGapMinutes = 45
): boolean {
  const userMsgs = history.filter((m) => m.role === "user");
  if (userMsgs.length < 2) return false;

  const prev = userMsgs[userMsgs.length - 2];
  const gapMin =
    (Date.now() - new Date(prev.createdAt).getTime()) / (1000 * 60);
  return gapMin < sessionGapMinutes;
}

/** 유저 메시지 + 접속·답장 간격으로 캐릭터 감정 결정 */
export function resolveCharacterEmotion(
  ctx: EmotionResolveContext | string,
  legacyLastChatAt?: string | null,
  history: Message[] = []
): EmotionState {
  const input: EmotionResolveContext =
    typeof ctx === "string"
      ? { userMessage: ctx, lastChatAt: legacyLastChatAt ?? null, lastSeenAt: null }
      : ctx;

  const current = normalizeEmotion(input.currentEmotion);
  if (current === "special_day") return "special_day";

  const text = input.userMessage.trim();
  const fromMessage = inferEmotionFromUserMessage(text);
  if (fromMessage) return fromMessage;

  const ongoingSession = isOngoingChatSession(history);
  const replyGapHours = hoursSince(input.lastChatAt);
  const absenceHours = hoursSince(input.lastSeenAt);

  if (!ongoingSession) {
    if (absenceHours != null && absenceHours >= 24) return "miss_you";
    if (isLateNight() && replyGapHours != null && replyGapHours >= 6) {
      return "miss_you";
    }

    if (replyGapHours != null) {
      const coldReturn = isNegativeOrColdMessage(text);
      // 유저가 냉담하게 돌아왔을 때만 부정 감정. 따뜻하거나 중립적인 복귀엔 완화.
      if (replyGapHours >= 3) return coldReturn ? "pouty" : "miss_you";
      if (replyGapHours >= 1) return coldReturn ? "hurt" : "happy";
    }
  }

  if (input.affectionWillIncrease) {
    return pickPositiveEmotion(history, input.characterId);
  }

  return "happy";
}

/**
 * 활성 대화 중 긍정 감정을 선택한다.
 * 최근 연속 excited가 없는 경우 캐릭터별 확률로 excited를 반환해
 * 단조로운 happy 반복을 방지하면서 캐릭터 성격을 반영한다.
 */
export function pickPositiveEmotion(
  history: Message[],
  characterId?: string
): EmotionState {
  const recentAssistant = history
    .filter((m) => m.role === "assistant")
    .slice(-3);
  const recentExcited = recentAssistant.some((m) => m.emotion === "excited");
  const prob =
    (characterId !== undefined
      ? (EXCITED_PROBABILITY[characterId] ?? DEFAULT_EXCITED_PROBABILITY)
      : DEFAULT_EXCITED_PROBABILITY);
  if (!recentExcited && Math.random() < prob) return "excited";
  return "happy";
}

/** 연속 assistant 턴 기준, 현재 감정 유지 턴 수 (이번 답변 포함) */
export function countEmotionDurationTurns(
  history: Message[],
  emotion: EmotionState
): number {
  if (emotion !== "hurt" && emotion !== "pouty") return 1;

  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.role !== "assistant") continue;
    if (msg.emotion === emotion) streak++;
    else if (msg.emotion) break;
  }
  return streak + 1;
}
