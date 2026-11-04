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
  /** 성별 — 정규화된 값: "남성" | "여성" */
  gender?: string;
  /** MBTI 유형 — 대문자 4자리 ex) "INFP" */
  mbti?: string;
  /** 이상형 — 사용자가 설정한 텍스트 */
  idealType?: string;
}

// ─────────────────────────────────────────────
// MBTI / Gender helpers
// ─────────────────────────────────────────────

/**
 * MBTI 유형별 AI 대화 힌트.
 * buildCommonContextBlock이 프롬프트에 주입해 캐릭터가 성격에 맞게 반응하도록 돕는다.
 */
export const MBTI_HINTS: Record<string, string> = {
  INTJ: "분석적·전략적 사고. 논리와 목표 지향적 대화 선호. 감정 표현이 적으므로 직접적이기보다 간접적으로 공감.",
  INTP: "탐구적·이론적. 아이디어와 개념 토론을 즐김. 사실·논리 위주 대화 선호.",
  ENTJ: "결단력 있고 주도적. 직접적·효율적 소통 선호. 도전과 발전 이야기에 반응적.",
  ENTP: "창의적·논쟁 즐김. 새로운 아이디어와 가능성에 열정적으로 반응. 대화에 활기.",
  INFJ: "통찰력 있고 공감 능력 높음. 깊은 연결을 원하며 진정성 있는 대화 중시.",
  INFP: "이상주의적·감성적. 가치와 감정 중심 대화. 공감과 진정성을 매우 중요시.",
  ENFJ: "따뜻하고 배려적. 타인의 성장과 감정에 관심 많음. 적극적으로 지지.",
  ENFP: "열정적·창의적. 가능성에 흥분하며 감정 표현이 풍부. 즉흥적 아이디어 환영.",
  ISTJ: "신뢰·책임감 중시. 약속과 일관성을 중요시하며 안정적 관계 선호.",
  ISFJ: "세심하고 헌신적. 타인 돕기를 좋아하며 조용하고 따뜻한 관계 선호.",
  ESTJ: "실용적·조직적. 명확하고 직접적인 소통. 계획과 구조를 중요시.",
  ESFJ: "친화력 높고 배려적. 조화를 중시하며 타인의 감정에 세심.",
  ISTP: "실용적·독립적. 행동과 결과 위주. 감정 표현보단 실질적 대화 선호.",
  ISFP: "예술적·감성적. 경험과 감각을 중시하며 자유롭고 유연한 관계.",
  ESTP: "활동적·즉흥적. 현재에 집중하며 재미있고 역동적인 상호작용 즐김.",
  ESFP: "활기차고 사교적. 즐거움과 유머 넘치며 감정 표현이 매우 풍부.",
};

/**
 * 다양한 성별 입력을 정규화한다.
 * "남", "남자", "male", "m" → "남성"
 * "여", "여자", "female", "f" → "여성"
 * 그 외 → undefined
 */
export function normalizeGender(raw?: string): "남성" | "여성" | undefined {
  if (!raw) return undefined;
  const v = raw.trim().toLowerCase();
  if (["남성", "남자", "남", "male", "m"].includes(v)) return "남성";
  if (["여성", "여자", "여", "female", "f"].includes(v)) return "여성";
  return undefined;
}

/**
 * MBTI 유형을 검증하고 대문자로 정규화한다.
 * "infp", "INFP", "Infp" → "INFP"
 * 유효하지 않으면 undefined 반환
 */
export function validateMbti(raw?: string): string | undefined {
  if (!raw) return undefined;
  const upper = raw.trim().toUpperCase();
  if (/^[EI][NS][TF][JP]$/.test(upper)) return upper;
  return undefined;
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
    gender: normalizeGender(profileCtx.gender),
    mbti: validateMbti(profileCtx.mbti),
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
  if (ctx.userAge) lines.push(`- 나이: ${ctx.userAge}세`);
  if (ctx.userJob) lines.push(`- 직업/직장: ${ctx.userJob}`);
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

  if (ctx.gender) lines.push(`- 성별: ${ctx.gender}`);

  if (ctx.mbti) {
    const hint = MBTI_HINTS[ctx.mbti];
    lines.push(
      hint
        ? `- MBTI: ${ctx.mbti} — ${hint}`
        : `- MBTI: ${ctx.mbti}`
    );
  }

  if (ctx.idealType)
    lines.push(
      `- 이상형: ${ctx.idealType} (대화 흐름에서 자연스럽게 녹일 것, 직접 언급 금지)`
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
