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
 * 사과·달래기 패턴 — hurt/pouty 상태에서 이 메시지를 받으면 회복 트리거.
 * "미안해", "잘못했어", "용서해줘", "화 풀어" 등.
 */
const APOLOGY_RECOVERY_PATTERN =
  /미안|죄송|잘못했|용서|화\s?풀|달래|삐쳤|삐졌/i;

/**
 * 캐릭터별 hurt/pouty 자동 회복 임계값 (assistant 턴 수).
 * 해당 턴 이상 지속되면 neutral 메시지에도 자동으로 happy로 회복.
 * 성격이 활발할수록 낮고, 츤데레·냉담할수록 높다.
 */
const HURT_RECOVERY_TURNS: Record<string, number> = {
  jiyu:    2,   // 지유: 활발·쾌활 — 금방 풀림
  yuna:    3,   // 유나: 균형적 — 보통
  narin:   4,   // 나린: 차분·섬세 — 조금 느림
  eunha:   5,   // 은하: 차가운 외면 — 느림
  yoonseo: 5,   // 윤서: 츤데레 — 느림
};

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
  /** 캐릭터 ID — hurt/pouty 회복 속도 분기에 사용 */
  characterId?: string;
}

function hoursSince(iso: string | null): number | null {
  if (!iso) return null;
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

function isLateNight(): boolean {
  return isSeoulLateNight();
}

/**
 * 히스토리에서 가장 최근 assistant 턴부터 역순으로
 * 동일 hurt/pouty 감정이 연속된 턴 수를 반환한다 (이번 턴 미포함).
 * countEmotionDurationTurns와 달리 이번 턴을 더하지 않으므로
 * "지금까지 몇 턴 지속됐는가"를 판별할 때 사용한다.
 */
function countPreviousHurtStreak(
  history: Message[],
  emotion: "hurt" | "pouty"
): number {
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.role !== "assistant") continue;
    if (msg.emotion === emotion) streak++;
    else if (msg.emotion) break;
  }
  return streak;
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

  // ── hurt/pouty 지속·회복 로직 ──────────────────────────────────────────
  // 이전 턴이 hurt 또는 pouty 상태였고 새 메시지가 hurt/pouty를 새로 유발하지
  // 않았다면, 사과·애정 표현(회복 트리거)이나 캐릭터별 자동 회복 임계값에 따라
  // 감정을 결정한다.
  if (current === "hurt" || current === "pouty") {
    // 새 메시지가 hurt/pouty를 직접 재유발 → 그대로 유지
    if (fromMessage === "hurt" || fromMessage === "pouty") {
      return fromMessage;
    }

    // 사과·달래기 → 즉시 회복
    if (APOLOGY_RECOVERY_PATTERN.test(text)) {
      return pickPositiveEmotion(history, input.characterId);
    }

    // 애정·칭찬 메시지 → 회복
    if (fromMessage === "excited" || fromMessage === "happy") {
      return fromMessage;
    }

    // 중립 메시지: 이전 hurt/pouty 지속 턴 수 체크
    const prevStreak = countPreviousHurtStreak(history, current);
    const recoveryThreshold =
      HURT_RECOVERY_TURNS[input.characterId ?? ""] ?? 3;

    if (prevStreak >= recoveryThreshold) {
      // 임계값 도달 → 자동 회복
      return pickPositiveEmotion(history, input.characterId);
    }

    // 임계값 미달 → 현재 감정 유지 (arc 지속)
    return current;
  }
  // ────────────────────────────────────────────────────────────────────────

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
 * 단조로운 happy 반복을 방지한다.
 */
export function pickPositiveEmotion(
  history: Message[],
  characterId?: string
): EmotionState {
  const recentAssistant = history
    .filter((m) => m.role === "assistant")
    .slice(-3);
  const recentExcited = recentAssistant.some((m) => m.emotion === "excited");
  if (!recentExcited && Math.random() < 0.30) return "excited";
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
