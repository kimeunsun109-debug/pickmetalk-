import { ageFromBirthDate } from "@/lib/userAge";
import { OTHER_CHARACTER_DISPLAY_NAMES } from "@/prompts/base";
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
  /** 반려동물 이름, 가족 이름 등 대화에서 언급한 개인 정보 */
  personalFacts?: string[];
  /** 사용자 성별 ("남성" | "여성" | "논바이너리") */
  gender?: string;
  /** MBTI 유형 (e.g. "ISFJ") */
  mbti?: string;
  /** 사용자가 원하는 이상형 설명 */
  idealType?: string;
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
 * MBTI 유형별 대화 스타일 힌트.
 * buildCommonContextBlock에서 AI 프롬프트에 주입.
 * 대화 방식 예측에만 쓰고 MBTI를 직접 언급하지 않는다.
 */
const MBTI_HINTS: Partial<Record<string, string>> = {
  INTJ: "혼자 생각을 정리하는 걸 즐김. 논리적이고 깊이 있는 대화에 잘 호응. 불필요한 공감 멘트보다 실질적인 반응을 좋아함.",
  INTP: "분석적이고 새로운 아이디어에 호기심이 많음. 정해진 답보다 탐구하는 과정을 즐김. 감정 표현은 서툴지만 진심이 있음.",
  ENTJ: "목표 지향적이고 자신감 있음. 직접적인 대화를 선호하며 계획·성취 이야기에 눈빛이 달라짐.",
  ENTP: "논쟁과 토론을 즐기고 유머 감각이 있음. 여러 관점으로 대화가 튀어도 잘 따라옴. 지루한 패턴을 싫어함.",
  INFJ: "깊은 공감과 의미 있는 대화를 원함. 표면적인 잡담보다 진솔한 이야기를 선호. 혼자만의 시간이 중요함.",
  INFP: "감수성이 풍부하고 자신만의 가치관이 뚜렷함. 판단보다 이해받고 싶어함. 창의적이고 낭만적인 면이 있음.",
  ENFJ: "사람을 좋아하고 따뜻한 에너지. 상대방의 감정 변화에 예민하게 반응. 격려와 공감에 큰 힘을 얻음.",
  ENFP: "에너지 넘치고 아이디어가 많음. 다양한 주제로 대화가 튀어도 따라옴. 공감과 열정적 반응에 잘 호응.",
  ISTJ: "신중하고 책임감이 강함. 약속을 중시하며 일관성 있는 태도를 좋아함. 구체적이고 실용적인 이야기를 선호.",
  ISFJ: "섬세하고 배려심이 깊음. 일상의 작은 것들을 기억하고 챙겨주는 걸 좋아함. 안정감 있는 대화를 선호.",
  ESTJ: "현실적이고 체계적임. 명확하고 솔직한 대화를 좋아하며 두루뭉술한 표현을 싫어함.",
  ESFJ: "사람 관계를 중요하게 여기고 분위기를 잘 맞춤. 칭찬과 인정에 크게 기뻐함. 갈등을 불편해함.",
  ISTP: "독립적이고 말이 적음. 실용적이고 행동 중심. 감정 이야기보다 함께하는 활동·경험을 좋아함.",
  ISFP: "조용하지만 감성적임. 자신의 페이스를 중요하게 여김. 예술·자연·감각적인 것에 반응이 좋음.",
  ESTP: "활동적이고 즉흥적임. 지금 이 순간을 즐기는 타입. 길고 무거운 대화보다 경쾌한 리듬을 좋아함.",
  ESFP: "밝고 사교적이며 유머 감각이 있음. 이야기의 흐름이 빠르고 재미를 중시. 주목받는 걸 좋아함.",
};

function normalizeGender(raw: string): string {
  const lower = raw.trim().toLowerCase();
  if (lower === "male" || lower === "남성" || lower === "남자" || lower === "남") return "남성";
  if (lower === "female" || lower === "여성" || lower === "여자" || lower === "여") return "여성";
  return raw.trim();
}

function validateMbti(raw: string): string | undefined {
  const upper = raw.trim().toUpperCase().replace(/\s+/g, "");
  if (/^[EI][NS][TF][JP]$/.test(upper)) return upper;
  return undefined;
}

/**
 * profiles.user_context(JSONB) + memory_summary를 합쳐
 * 유저 메타 컨텍스트를 추출한다.
 */
export function extractUserContext(
  memorySummary: string | null,
  profileCtx: ProfileUserContext = {}
): UserContextData {
  const entities = parseStoredSummary(memorySummary);

  const personalEntities = entities.filter((e) => e.category === "personal");
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

  // 대화에서 유저가 알려준 이름 (프로필 닉네임보다 낮은 우선순위)
  const memoryUserName = personalEntities
    .find((e) => e.fact.startsWith("유저 이름:"))
    ?.fact.replace("유저 이름:", "")
    .trim();

  // 반려동물·가족 이름 등 (대화에 자연스럽게 활용할 개인 정보)
  const personalFacts = personalEntities
    .filter((e) => !e.fact.startsWith("유저 이름:"))
    .map((e) => e.fact);

  const derivedAge = profileCtx.age
    ? profileCtx.age
    : (() => {
        const a = ageFromBirthDate(profileCtx.birthDate);
        return a != null ? String(a) : undefined;
      })();

  return {
    userName: profileCtx.nickname ?? profileCtx.name ?? memoryUserName,
    userAge: derivedAge,
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
    personalFacts: personalFacts.length > 0 ? personalFacts : undefined,
    gender: profileCtx.gender ? normalizeGender(profileCtx.gender) : undefined,
    mbti: profileCtx.mbti ? validateMbti(profileCtx.mbti) : undefined,
    idealType: profileCtx.idealType?.trim() || undefined,
  };
}

/**
 * 모든 캐릭터 공통으로 프롬프트 최상단에 주입되는 유저 컨텍스트 블록.
 * 빈 데이터가 많으면 빈 문자열 반환 (주입하지 않음).
 */
export function buildCommonContextBlock(ctx: UserContextData): string {
  const lines: string[] = [];
  const characterNames = OTHER_CHARACTER_DISPLAY_NAMES.join("·");

  if (ctx.userName) {
    lines.push(`- 대화 상대(사용자) 표시 이름: ${ctx.userName}`);
    lines.push(
      `- 호칭 규칙: 위 표시 이름만 사용. ${characterNames} 등 캐릭터 이름으로 사용자를 부르지 마라. 확실하지 않으면 생략하거나 '너'.`
    );
    if (
      (OTHER_CHARACTER_DISPLAY_NAMES as readonly string[]).includes(ctx.userName)
    ) {
      lines.push(
        `- 주의: 표시 이름 '${ctx.userName}'은 앱 캐릭터명과 같지만, 이 사람은 플레이어(사용자)이다. 캐릭터 ${ctx.userName}와 혼동·오호칭 금지.`
      );
    }
  } else {
    lines.push(
      `- 사용자 표시 이름: (미등록) — 캐릭터명(${characterNames})으로 부르지 말고 '너' 또는 호칭 생략.`
    );
  }
  if (ctx.gender) lines.push(`- 성별: ${ctx.gender}`);
  if (ctx.userAge) lines.push(`- 나이: ${ctx.userAge}세`);
  if (ctx.userJob) lines.push(`- 직업/직장: ${ctx.userJob}`);
  if (ctx.mbti) {
    const hint = MBTI_HINTS[ctx.mbti];
    lines.push(
      hint
        ? `- MBTI: ${ctx.mbti} — 대화 스타일 참고: ${hint}`
        : `- MBTI: ${ctx.mbti}`
    );
  }
  if (ctx.idealType) {
    lines.push(
      `- 이상형: ${ctx.idealType} — 너는 이 사람의 이상형에 부합하는 면이 있음. 억지스럽지 않게 자연스럽게 녹여내도 좋아.`
    );
  }
  if (ctx.recentStressor)
    lines.push(`- 최근 스트레스 요인: ${ctx.recentStressor}`);
  if (ctx.recentSchedule)
    lines.push(`- 최근 예정 일정: ${ctx.recentSchedule}`);
  if (ctx.userInterests.length > 0)
    lines.push(`- 관심사·취미: ${ctx.userInterests.join(", ")}`);
  if (ctx.personalFacts && ctx.personalFacts.length > 0)
    lines.push(
      `- 유저가 알려준 정보: ${ctx.personalFacts.join(", ")} (자연스럽게 활용, 같은 질문 반복 금지)`
    );

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
    `※ 위 수치만 인용 가능. 근거 없는 %·주·bpm·체감온도·확률을 지어내지 마라.`
  );
  lines.push(
    `※ 이 데이터를 대화에 자연스럽게 녹여 쓸 것. 전부 나열하지 말 것.`
  );

  return lines.join("\n");
}
