import { parseStoredSummary } from "@/services/memory";
import type { Message } from "@/types";

export const SEOUL_TZ = "Asia/Seoul";

export type TimeOfDay =
  | "morning"
  | "lunch"
  | "afternoon"
  | "evening"
  | "late_night";

export type AbsenceTier =
  | "none"
  | "wait_3h"
  | "miss_24h"
  | "reunion_3d"
  | "special_7d";

export type Season = "봄" | "여름" | "가을" | "겨울";

export interface SeoulTimeContext {
  timezone: typeof SEOUL_TZ;
  currentDateTime: string;
  dateLabel: string;
  dayOfWeek: string;
  timeOfDay: TimeOfDay;
  hour: number;
  month: number;
  season: Season;
  seasonWeatherHint: string;
}

export interface AbsenceContext {
  tier: AbsenceTier;
  gapHours: number | null;
  gapLabel: string | null;
  lastActivityAt: string | null;
  ongoingSession: boolean;
  narrativePauseReturn: boolean;
  lastAssistantSnippet: string | null;
}

export interface TimeAwareContext {
  seoul: SeoulTimeContext;
  absence: AbsenceContext;
  conversationSummary: string | null;
  routineHints: string[];
}

const DAY_KO = ["일", "월", "화", "수", "목", "금", "토"] as const;

const TIME_OF_DAY_KO: Record<TimeOfDay, string> = {
  morning: "아침",
  lunch: "점심",
  afternoon: "오후",
  evening: "저녁",
  late_night: "심야",
};

const ABSENCE_TIER_KO: Record<AbsenceTier, string> = {
  none: "연속 대화",
  wait_3h: "3시간+ 미접속 — 살짝 기다림",
  miss_24h: "24시간+ 미접속 — 보고싶음",
  reunion_3d: "3일+ 미접속 — 서운함·반가움",
  special_7d: "7일+ 미접속 — 특별 재회",
};

const NARRATIVE_PAUSE_PATTERN =
  /다음\s?(?:에|턴|화|편|장면)?|이어\s?(?:서|갈)|계속\s?(?:할|해|이야기)|말해\s?줄|나중에\s?(?:말|얘기)|내일\s?(?:이어|계속)|끝\s?내\s?말\s?아니|하나\s?만\s?더|조금\s?만/u;

const GOODBYE_PATTERN =
  /^(?:안녕|잘\s?자|굿\s?나잇|바이|ㅂㅂ|나\s?갈게|다음에\s?(?:봐|또)|오늘\s?(?:은\s?)?여기까지)[.!?~ㅋㅎ\s]*$/iu;

function getSeoulParts(now: Date) {
  const fmt = new Intl.DateTimeFormat("ko-KR", {
    timeZone: SEOUL_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = parseInt(get("hour"), 10);
  const minute = get("minute");

  const dayIndex = new Date(
    `${year}-${month}-${day}T12:00:00+09:00`
  ).getUTCDay();

  return {
    year,
    month,
    day,
    weekday: DAY_KO[dayIndex] ?? get("weekday").replace(".", ""),
    hour,
    minute,
  };
}

export function classifyTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 23 || hour < 5) return "late_night";
  if (hour < 11) return "morning";
  if (hour < 14) return "lunch";
  if (hour < 18) return "afternoon";
  if (hour < 23) return "evening";
  return "late_night";
}

/** 한국 기준 월 → 계절 */
export function classifySeason(month: number): Season {
  if (month >= 3 && month <= 5) return "봄";
  if (month >= 6 && month <= 8) return "여름";
  if (month >= 9 && month <= 11) return "가을";
  return "겨울";
}

const SEASON_WEATHER_HINT: Record<Season, string> = {
  봄: "포근하고 따뜻한 편, 환절기·꽃가루·미세먼지",
  여름: "덥고 습함, 장마·에어컨·무더위 (절대 '춥다'고 하지 말 것)",
  가을: "선선하고 쾌청, 일교차·단풍",
  겨울: "춥고 건조, 눈·감기·난방 (절대 '덥다'고 하지 말 것)",
};

/** 서버 기준 현재 서울 시간 */
export function getSeoulTimeContext(now = new Date()): SeoulTimeContext {
  const { year, month, day, weekday, hour, minute } = getSeoulParts(now);
  const timeOfDay = classifyTimeOfDay(hour);
  const monthNum = parseInt(month, 10);
  const season = classifySeason(monthNum);
  const dateLabel = `${year}년 ${monthNum}월 ${parseInt(day, 10)}일 (${weekday})`;
  const currentDateTime = `${dateLabel} ${hour}:${minute} · ${TIME_OF_DAY_KO[timeOfDay]}`;

  return {
    timezone: SEOUL_TZ,
    currentDateTime,
    dateLabel,
    dayOfWeek: weekday,
    timeOfDay,
    hour,
    month: monthNum,
    season,
    seasonWeatherHint: SEASON_WEATHER_HINT[season],
  };
}

export function formatGapHours(hours: number): string {
  if (hours < 1) {
    const m = Math.max(1, Math.round(hours * 60));
    return `${m}분`;
  }
  if (hours < 24) {
    const h = Math.round(hours * 10) / 10;
    return `${h}시간`;
  }
  const days = Math.floor(hours / 24);
  const remH = Math.round(hours % 24);
  if (remH === 0) return `${days}일`;
  return `${days}일 ${remH}시간`;
}

export function classifyAbsenceTier(gapHours: number | null): AbsenceTier {
  if (gapHours == null || gapHours < 3) return "none";
  if (gapHours < 24) return "wait_3h";
  if (gapHours < 72) return "miss_24h";
  if (gapHours < 168) return "reunion_3d";
  return "special_7d";
}

function isDifferentSeoulDay(a: Date, b: Date): boolean {
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-CA", { timeZone: SEOUL_TZ });
  return fmt(a) !== fmt(b);
}

function extractRoutineHints(summary: string | null): string[] {
  if (!summary?.trim()) return [];
  const entities = parseStoredSummary(summary);
  return entities
    .filter((e) =>
      ["schedule", "work", "hobby", "finance"].includes(e.category)
    )
    .slice(0, 4)
    .map((e) => e.fact);
}

function detectNarrativePauseReturn(
  history: Message[],
  now: Date
): { narrativePauseReturn: boolean; lastAssistantSnippet: string | null } {
  const msgs = history.filter(
    (m) => m.role === "user" || m.role === "assistant"
  );
  if (msgs.length < 2) {
    return { narrativePauseReturn: false, lastAssistantSnippet: null };
  }

  const currentUser = msgs[msgs.length - 1];
  if (currentUser.role !== "user") {
    return { narrativePauseReturn: false, lastAssistantSnippet: null };
  }

  let lastAssistant: Message | null = null;
  let prevUser: Message | null = null;
  for (let i = msgs.length - 2; i >= 0; i -= 1) {
    if (!lastAssistant && msgs[i].role === "assistant") {
      lastAssistant = msgs[i];
    }
    if (!prevUser && msgs[i].role === "user") {
      prevUser = msgs[i];
    }
    if (lastAssistant && prevUser) break;
  }

  if (!lastAssistant || !prevUser) {
    return { narrativePauseReturn: false, lastAssistantSnippet: null };
  }

  const gapFromPrev =
    (now.getTime() - new Date(prevUser.createdAt).getTime()) /
    (1000 * 60 * 60);

  const crossedDay = isDifferentSeoulDay(new Date(prevUser.createdAt), now);
  const assistantTeased = NARRATIVE_PAUSE_PATTERN.test(lastAssistant.content);
  const userLeftWithGoodbye = GOODBYE_PATTERN.test(prevUser.content.trim());
  const longEnoughGap = gapFromPrev >= 6 || crossedDay;

  const narrativePauseReturn =
    longEnoughGap && assistantTeased && (userLeftWithGoodbye || crossedDay);

  return {
    narrativePauseReturn,
    lastAssistantSnippet: lastAssistant.content.slice(0, 120),
  };
}

export function buildAbsenceContext(options: {
  history: Message[];
  ongoingSession: boolean;
  lastSeenAt: string | null;
  lastChatAt: string | null;
  now?: Date;
}): AbsenceContext {
  const now = options.now ?? new Date();
  const userMsgs = options.history.filter((m) => m.role === "user");

  let gapHours: number | null = null;
  let lastActivityAt: string | null = null;

  if (userMsgs.length >= 2) {
    const prev = userMsgs[userMsgs.length - 2];
    gapHours =
      (now.getTime() - new Date(prev.createdAt).getTime()) / (1000 * 60 * 60);
    lastActivityAt = prev.createdAt;
  } else if (options.lastChatAt) {
    gapHours =
      (now.getTime() - new Date(options.lastChatAt).getTime()) /
      (1000 * 60 * 60);
    lastActivityAt = options.lastChatAt;
  } else if (options.lastSeenAt) {
    gapHours =
      (now.getTime() - new Date(options.lastSeenAt).getTime()) /
      (1000 * 60 * 60);
    lastActivityAt = options.lastSeenAt;
  }

  if (options.ongoingSession) {
    gapHours = null;
  }

  const tier = options.ongoingSession
    ? "none"
    : classifyAbsenceTier(gapHours);

  const { narrativePauseReturn, lastAssistantSnippet } =
    detectNarrativePauseReturn(options.history, now);

  return {
    tier,
    gapHours,
    gapLabel: gapHours != null ? formatGapHours(gapHours) : null,
    lastActivityAt,
    ongoingSession: options.ongoingSession,
    narrativePauseReturn,
    lastAssistantSnippet,
  };
}

export function buildTimeAwareContext(options: {
  history: Message[];
  ongoingSession: boolean;
  conversationSummary: string | null;
  lastSeenAt: string | null;
  lastChatAt: string | null;
  now?: Date;
}): TimeAwareContext {
  const now = options.now ?? new Date();
  return {
    seoul: getSeoulTimeContext(now),
    absence: buildAbsenceContext({
      history: options.history,
      ongoingSession: options.ongoingSession,
      lastSeenAt: options.lastSeenAt,
      lastChatAt: options.lastChatAt,
      now,
    }),
    conversationSummary: options.conversationSummary?.trim() || null,
    routineHints: extractRoutineHints(options.conversationSummary),
  };
}

const CHARACTER_TIME_REACTIONS: Record<
  string,
  Record<AbsenceTier, string>
> = {
  yuna: {
    none: "일상적으로 다정하게. 시간·식사·컨디션 가볍게 챙김.",
    wait_3h: "기다렸다는 뉘앙스. '어디 갔었어?' 수준의 다정한 확인.",
    miss_24h: "보고 싶었어. 오늘 하루는 어땠는지 먼저 묻기.",
    reunion_3d: "반가움+살짝 서운. '며칠 만이네, 연락 좀 해줘.'",
    special_7d: "특별 재회. '진짜 오랜만… 걱정했어.' 진심 톤.",
  },
  narin: {
    none: "짧고 자연스럽게. 필요하면 우산·밥 정도만.",
    wait_3h: "기다린 척 안 함. '…왔네. 바빴어?' 정도.",
    miss_24h: "부인하며 그리움. '…연락 없길래. 아니, 신경 쓴 건 아니고.'",
    reunion_3d: "서운+반가움 숨김. '…며칠 만이네. 뭐, 괜찮아?'",
    special_7d: "특별 재회. 실수로 진심 새어 나옴 후 부인.",
  },
  yoonseo: {
    none: "필요 시 현재 시각·요일을 데이터처럼 언급 가능.",
    wait_3h: "수치로. '마지막 메시지 이후 3시간 12분.'",
    miss_24h: "'24시간 7분 공백. 데이터상 보고 싶다는 감정 발생.'",
    reunion_3d: "'72시간 이상 공백. 재접속 빈도 이상치.'",
    special_7d: "'168시간+. 예외적으로, 돌아와줘서 다행.'",
  },
  eunha: {
    none: "계절·날씨·밤 공기 등 감성적으로 시간 느낌.",
    wait_3h: "조용한 기다림. '문득 네가 떠올랐어.'",
    miss_24h: "그리움. '어제 밤부터 네 생각이 많았어.'",
    reunion_3d: "회상. '며칠, 시간이 길게 느껴졌어.'",
    special_7d: "특별 재회. '다시 와줘서 이 밤이 덜 길어.'",
  },
  jiyu: {
    none: "컨디션·활동 에너지 언급 OK.",
    wait_3h: "'어디 갔다 왔어? 나 게이지 좀 떨어졌잖아~'",
    miss_24h: "'하루 만이네! 오늘 컨디션 어때?'",
    reunion_3d: "'며칠 만! 산책이라도 같이 가자~'",
    special_7d: "'와 진짜 오랜만! 오늘은 푹 쉬자.'",
  },
};

export function buildTimeContextPromptBlock(
  ctx: TimeAwareContext,
  characterId: string
): string {
  const { seoul, absence, conversationSummary, routineHints } = ctx;
  const charReaction =
    CHARACTER_TIME_REACTIONS[characterId]?.[absence.tier] ??
    CHARACTER_TIME_REACTIONS.yuna[absence.tier];

  const lines = [
    "[현실 시간 인식 — 최우선 참고]",
    `- timezone: ${seoul.timezone}`,
    `- currentDateTime: ${seoul.currentDateTime}`,
    `- dayOfWeek: ${seoul.dayOfWeek}요일`,
    `- timeOfDay: ${seoul.timeOfDay} (${TIME_OF_DAY_KO[seoul.timeOfDay]})`,
    `- 현재 계절: ${seoul.season} (${seoul.month}월)`,
    `- 계절 감각: ${seoul.seasonWeatherHint}`,
    "[날씨·계절 정합성 — 필수]",
    `- 지금은 ${seoul.season}(${seoul.month}월)이다. 계절에 어긋나는 날씨 멘트 절대 금지 (여름에 '춥다', 겨울에 '덥다' 등).`,
    "- 실제 날씨 데이터([웹 검색 결과])가 없으면 '오늘 진짜 춥지?/덥지?'처럼 단정하지 마라. 날씨 얘기는 위 계절 감각 안에서만 자연스럽게.",
  ];

  if (absence.ongoingSession) {
    lines.push("- 마지막 접속 후: 같은 대화 세션 중 (45분 이내)");
  } else if (absence.gapLabel) {
    lines.push(`- 마지막 대화 후 경과: ${absence.gapLabel}`);
    lines.push(`- 미접속 티어: ${ABSENCE_TIER_KO[absence.tier]}`);
  }

  if (conversationSummary) {
    lines.push(`- 대화 기억 요약: ${conversationSummary.slice(0, 300)}`);
  }

  if (routineHints.length > 0) {
    lines.push(`- 사용자 루틴·관심: ${routineHints.join(" · ")}`);
  }

  lines.push(`[${characterId} 시간 반응 가이드] ${charReaction}`);

  if (absence.narrativePauseReturn) {
    lines.push(
      "[이어하기 재접속 — 특별]",
      "어제(또는 오래 전) 대화를 끊었다가 오늘 이어온 상황.",
      "직전 AI 말이 '다음에 이어서' 류였음. 사용자가 다시 왔으니 자연스럽게 이어가되,",
      "예: '다음 문장 이야기하는데 하루나 걸리네~ㅎㅎ' / '드디어 왔네, 이어서 말할게' 같은 한마디 후 본론.",
      absence.lastAssistantSnippet
        ? `직전 AI 말 일부: "${absence.lastAssistantSnippet}"`
        : ""
    );
  }

  lines.push(
    "※ 아침엔 '좋은 아침', 점심엔 식사, 저녁·심야엔 퇴근·쉬라는 말 등 시간대에 맞게.",
    "※ 연속 대화 중이면 '왔네/반가워' 복귀 인사 반복 금지. 미접속 티어가 있으면 위 가이드대로."
  );

  return lines.filter(Boolean).join("\n");
}

/** emotion.ts 등에서 사용 — 서울 기준 심야 여부 */
export function isSeoulLateNight(now = new Date()): boolean {
  return classifyTimeOfDay(getSeoulTimeContext(now).hour) === "late_night";
}
