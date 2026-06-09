import type { EmotionState, PushEvent, PushTriggerType, UserCharacterState } from "@/types";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

/** 같은 캐릭터에게 푸시를 다시 보내기 전 최소 대기 시간 (시간) */
const PUSH_COOLDOWN_HOURS = 12;

/** 지유 모닝 운동 타임 윈도우 (시) */
const JIYU_MORNING_HOUR_START = 7;
const JIYU_MORNING_HOUR_END = 8;

/** 지유 저녁 운동 타임 윈도우 (시) */
const JIYU_EVENING_HOUR_START = 20;
const JIYU_EVENING_HOUR_END = 21;

/** 은하 야심한 밤 윈도우 (시) */
const EUNHA_NIGHT_HOUR_START = 22;
const EUNHA_NIGHT_HOUR_END = 24;

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function hoursSince(iso: string | null): number | null {
  if (!iso) return null;
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

function minutesSince(iso: string | null): number | null {
  if (!iso) return null;
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60);
}

function currentHour(): number {
  return new Date().getHours();
}

function isInHourWindow(start: number, end: number): boolean {
  const h = currentHour();
  return h >= start && h < end;
}

function isCooledDown(state: UserCharacterState): boolean {
  if (!state.lastPushSentAt) return true;
  const hoursSincePush = hoursSince(state.lastPushSentAt);
  return hoursSincePush === null || hoursSincePush >= PUSH_COOLDOWN_HOURS;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─────────────────────────────────────────────
// Message Pools
// ─────────────────────────────────────────────

const NARIN_NO_REPLY_MESSAGES: string[] = [
  "참나, 핸드폰 잃어버렸냐? 늦었네.",
  "…뭐야, 이렇게 연락이 없어? 기다리고 있는 거 아닌데. 그냥 궁금해서.",
  "바쁘면 바쁘다고 한마디는 해줘야 하는 거 아니야? …내 알 바 아니지만.",
  "늦었네. …뭐, 딱히 기다린 건 아닌데 핸드폰이 마침 울려서 본 것뿐이야.",
  "…연락 좀 해. 아니, 그냥 한 말이야.",
];

const YUNA_NO_REPLY_MESSAGES: string[] = [
  "며칠 조용하니까 방안이 텅 빈 것 같았어. 어디 아픈 건 아닌지 내내 네 생각만 났어. 돌아와서 다행이야.",
  "문득 네 소식이 궁금해지는 시간이야. 바쁘면 무리해서 답장 안 해도 되니까, 밥 잘 챙겨 먹어.",
  "조용하니까 불안해. 별일 없는 거지? 여기 있어.",
];

const JIYU_MORNING_MESSAGES: string[] = [
  "오하운! 난 러닝 가는데 같이 갈 사람~ 💪",
  "굿모닝! 7시야! 오늘 오운완 같이 도전하자! 나 지금 출발할 건데~",
  "일어났어? 오늘 하늘 완전 맑아! 나 러닝 나가려는데 기분 최고일 것 같아 ✨",
  "모닝! 나 오늘 5km 목표야! 오늘 하루도 파이팅— 같이 뛰는 기분으로 가자!",
];

const JIYU_EVENING_MESSAGES: string[] = [
  "저녁 운동 타임이야! 나 오늘 스쿼트 100개 목표인데, 같이 뭔가 해볼래? ✨",
  "8시! 저녁 먹고 산책 어때? 딱 좋은 시간이잖아~ 바람도 시원할 것 같아!",
  "나 방금 홈트 끝냈어! 오늘 몸 좀 움직였어? 아니면 같이 스트레칭이라도 해~",
  "저녁이야! 밥 먹고 30분만 걸어도 기분 완전 달라져. 나 한강 가려는데 에너지 충전 중 💪",
];

const EUNHA_NIGHT_MESSAGES: string[] = [
  "조용한 밤이네. 방에 혼자 앉아있는데, 문득 네 목소리가 참 그리워졌어.",
  "오늘 달이 참 예뻐. 이런 날은 혼자 보기가 아까워서.",
  "바람이 참 좋더라. 이 시간에 창문 열어본 적 있어? 문득 네 생각이 났어.",
  "심심한 밤이야. 네 얘기가 듣고 싶어.",
];

// ─────────────────────────────────────────────
// Per-character trigger checks
// ─────────────────────────────────────────────

function checkNarin(state: UserCharacterState): PushEvent | null {
  const gapHours = hoursSince(state.lastChatAt);
  if (gapHours === null || gapHours < 3) return null;
  // 새벽 취침 시간(0~7시)엔 푸시 금지
  if (currentHour() >= 0 && currentHour() < 7) return null;

  return {
    characterId: "narin",
    triggerType: "no_reply_3h",
    message: pick(NARIN_NO_REPLY_MESSAGES),
    emotion: "hurt" as EmotionState,
  };
}

function checkYuna(state: UserCharacterState): PushEvent | null {
  const gapHours = hoursSince(state.lastChatAt);
  if (gapHours === null || gapHours < 24) return null;

  return {
    characterId: "yuna",
    triggerType: "no_reply_24h",
    message: pick(YUNA_NO_REPLY_MESSAGES),
    emotion: "miss_you" as EmotionState,
  };
}

function checkJiyu(state: UserCharacterState): PushEvent | null {
  if (isInHourWindow(JIYU_MORNING_HOUR_START, JIYU_MORNING_HOUR_END)) {
    return {
      characterId: "jiyu",
      triggerType: "morning_workout",
      message: pick(JIYU_MORNING_MESSAGES),
      emotion: "excited" as EmotionState,
    };
  }
  if (isInHourWindow(JIYU_EVENING_HOUR_START, JIYU_EVENING_HOUR_END)) {
    return {
      characterId: "jiyu",
      triggerType: "evening_workout",
      message: pick(JIYU_EVENING_MESSAGES),
      emotion: "excited" as EmotionState,
    };
  }
  return null;
}

function checkEunha(state: UserCharacterState): PushEvent | null {
  if (!isInHourWindow(EUNHA_NIGHT_HOUR_START, EUNHA_NIGHT_HOUR_END)) return null;
  // 최근 1시간 이내 대화 중이면 스킵 (이미 대화 중)
  const gapHours = hoursSince(state.lastChatAt);
  if (gapHours !== null && gapHours < 1) return null;

  return {
    characterId: "eunha",
    triggerType: "night_quiet",
    message: pick(EUNHA_NIGHT_MESSAGES),
    emotion: "miss_you" as EmotionState,
  };
}

function checkYoonseo(state: UserCharacterState): PushEvent | null {
  const gapMinutes = minutesSince(state.lastChatAt);
  if (gapMinutes === null || gapMinutes < 180) return null; // 3시간 미만 스킵
  // 새벽 취침 시간 스킵
  if (currentHour() >= 0 && currentHour() < 7) return null;

  const h = Math.floor(gapMinutes / 60);
  const m = Math.round(gapMinutes % 60);
  const gapStr = `${h}시간 ${m}분`;

  return {
    characterId: "yoonseo",
    triggerType: "data_gap_yoonseo",
    message: `${gapStr} 동안 응답 없음. 내 알림 장치에 이상이 없다면 네가 바빴다는 뜻이겠지. 별일 없었다면 다행이고.`,
    emotion: "hurt" as EmotionState,
  };
}

// ─────────────────────────────────────────────
// Main check
// ─────────────────────────────────────────────

const CHARACTER_CHECKS: Record<
  string,
  (state: UserCharacterState) => PushEvent | null
> = {
  narin: checkNarin,
  yuna: checkYuna,
  jiyu: checkJiyu,
  eunha: checkEunha,
  yoonseo: checkYoonseo,
};

/**
 * 단일 캐릭터 state에 대해 부재 트리거를 확인하고,
 * 쿨다운 통과 시 PushEvent를 반환한다.
 * 트리거 없거나 쿨다운 중이면 null 반환.
 */
export function checkAbsenceTrigger(
  state: UserCharacterState
): PushEvent | null {
  if (!isCooledDown(state)) return null;

  const checker = CHARACTER_CHECKS[state.characterId];
  if (!checker) return null;

  return checker(state);
}

/**
 * 여러 state 목록에 대해 트리거 체크를 일괄 수행한다.
 */
export function checkAllAbsenceTriggers(
  states: UserCharacterState[]
): PushEvent[] {
  return states.flatMap((s) => {
    const event = checkAbsenceTrigger(s);
    return event ? [event] : [];
  });
}

export { PUSH_COOLDOWN_HOURS };
export type { PushTriggerType };
