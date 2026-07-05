import type { Message, UserCharacterState } from "@/types";
import { parseStoredSummary } from "./memory";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface UserContextData {
  userName?: string;
  userAge?: string;
  userJob?: string;
  userInterests: string[];
  recentStressor?: string;
  recentSchedule?: string;
}

export interface YoonseoStats {
  avgSessionGapMinutes: number | null;
  totalTurns: number;
  promiseKeptCount: number;
  promiseBrokenCount: number;
  promiseKeepRatePct: number | null;
}

/** profiles.user_context JSONB 구조 */
export interface ProfileUserContext {
  name?: string;
  nickname?: string;
  age?: string;
  job?: string;
  gender?: string;
  birthDate?: string;
  interests?: string;
  hobbies?: string;
  mbti?: string;
  idealType?: string;
}

// ─────────────────────────────────────────────
// Common Context
// ─────────────────────────────────────────────

/**
 * profiles.user_context(JSONB) + memory_summary를 합쳐
 * 유저 메타 컨텍스트를 추출한다.
 */
export function extractUserContext(
  memorySummary: string | null,
  profileCtx: ProfileUserContext = {}
): UserContextData {
  const entities = parseStoredSummary(memorySummary);

  const workFacts = entities
    .filter((e) => e.category === "work")
    .map((e) => e.fact);
  const hobbyFacts = entities
    .filter((e) => e.category === "hobby")
    .map((e) => e.fact);
  const financeFacts = entities
    .filter((e) => e.category === "finance")
    .map((e) => e.fact);
  const scheduleFacts = entities
    .filter((e) => e.category === "schedule")
    .map((e) => e.fact);

  const userInterests = [...new Set([...hobbyFacts, ...financeFacts])];
  const recentStressor = workFacts[0];
  const recentSchedule = scheduleFacts[0];

  return {
    userName: profileCtx.nickname ?? profileCtx.name,
    userAge: profileCtx.age,
    userJob: profileCtx.job,
    userInterests: [
      ...new Set([
        ...userInterests,
        ...(profileCtx.interests ? [profileCtx.interests] : []),
        ...(profileCtx.hobbies ? [profileCtx.hobbies] : []),
      ]),
    ],
    recentStressor,
    recentSchedule,
  };
}

/**
 * 모든 캐릭터 공통으로 프롬프트 최상단에 주입되는 유저 컨텍스트 블록.
 * 빈 데이터가 많으면 빈 문자열 반환 (주입하지 않음).
 */
export function buildCommonContextBlock(ctx: UserContextData): string {
  const lines: string[] = [];

  if (ctx.userName) lines.push(`- 유저 닉네임: ${ctx.userName} (첫 인사·호칭에 활용)`);
  if (ctx.userAge) lines.push(`- 나이: ${ctx.userAge}세`);
  if (ctx.userJob) lines.push(`- 직업/직장: ${ctx.userJob}`);
  if (ctx.recentStressor)
    lines.push(`- 최근 스트레스 요인: ${ctx.recentStressor}`);
  if (ctx.recentSchedule)
    lines.push(`- 최근 예정 일정: ${ctx.recentSchedule}`);
  if (ctx.userInterests.length > 0)
    lines.push(`- 관심사·취미: ${ctx.userInterests.join(", ")}`);

  if (lines.length === 0) return "";

  return ["[유저 컨텍스트 — 매 턴 참고, 대화에 자연스럽게 활용]", ...lines].join(
    "\n"
  );
}

// ─────────────────────────────────────────────
// Yoonseo-specific Stats
// ─────────────────────────────────────────────

/**
 * 최근 7일 메시지 히스토리에서 평균 세션 간격(분)을 계산.
 * 30분 이상의 갭만 '새 세션'으로 간주.
 */
function computeAvgSessionGap(history: Message[]): number | null {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentUserMsgs = history
    .filter(
      (m) =>
        m.role === "user" &&
        new Date(m.createdAt).getTime() > sevenDaysAgo
    )
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

  if (recentUserMsgs.length < 2) return null;

  const sessionGaps: number[] = [];
  for (let i = 1; i < recentUserMsgs.length; i++) {
    const gapMin =
      (new Date(recentUserMsgs[i].createdAt).getTime() -
        new Date(recentUserMsgs[i - 1].createdAt).getTime()) /
      60000;
    if (gapMin > 30) sessionGaps.push(gapMin);
  }

  if (sessionGaps.length === 0) return null;
  return Math.round(
    sessionGaps.reduce((a, b) => a + b, 0) / sessionGaps.length
  );
}

/**
 * 윤서 전용 스탯을 메시지 히스토리 + state에서 계산.
 */
export function computeYoonseoStats(
  history: Message[],
  state: UserCharacterState
): YoonseoStats {
  const totalTurns = history.filter((m) => m.role === "user").length;
  const avgSessionGapMinutes = computeAvgSessionGap(history);

  const promiseKeptCount = state.promiseKeptCount ?? 0;
  const promiseBrokenCount = state.promiseBrokenCount ?? 0;
  const totalPromises = promiseKeptCount + promiseBrokenCount;
  const promiseKeepRatePct =
    totalPromises > 0
      ? Math.round((promiseKeptCount / totalPromises) * 100)
      : null;

  return {
    avgSessionGapMinutes,
    totalTurns,
    promiseKeptCount,
    promiseBrokenCount,
    promiseKeepRatePct,
  };
}

/**
 * 윤서 전용 데이터 스탯 블록.
 * buildSystemPrompt에서 characterId === 'yoonseo'일 때만 주입.
 */
export function buildYoonseoStatsBlock(stats: YoonseoStats): string {
  const lines = ["[윤서 전용 — 유저 데이터 스탯]"];

  lines.push(`- 누적 대화 턴 수: ${stats.totalTurns}턴`);

  if (stats.avgSessionGapMinutes !== null) {
    const h = Math.floor(stats.avgSessionGapMinutes / 60);
    const m = stats.avgSessionGapMinutes % 60;
    lines.push(
      `- 최근 7일 평균 접속 간격: ${h > 0 ? `${h}시간 ` : ""}${m}분`
    );
  } else {
    lines.push(`- 최근 7일 평균 접속 간격: 데이터 측정 중`);
  }

  if (stats.promiseKeepRatePct !== null) {
    lines.push(
      `- 약속 이행률: ${stats.promiseKeepRatePct}% (이행 ${stats.promiseKeptCount}회 / 불이행 ${stats.promiseBrokenCount}회)`
    );
  } else {
    lines.push(`- 약속 이행률: 기록 없음`);
  }

  lines.push(
    `※ 이 데이터를 대화에 자연스럽게 녹여 쓸 것. 전부 나열하지 말 것.`
  );

  return lines.join("\n");
}
