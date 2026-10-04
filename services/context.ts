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
  /** 사용자 성별 — 캐릭터가 적절한 어투·공감 방식 선택에 활용 */
  gender?: string;
  /** MBTI 유형 (예: "INFP"). 16자 이하 알파벳 문자열 */
  mbti?: string;
  /** 이상형 — 이 사람이 원하는 관계·파트너 스타일 힌트 */
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
// MBTI 대화 힌트
// ─────────────────────────────────────────────

/**
 * 16 MBTI 유형별 대화 스타일 힌트.
 * AI가 상대의 성격 유형에 맞춰 공감·질문·리액션 방식을 미세 조정하는 데 사용.
 * 규칙이 아니라 참고 정보로만 활용할 것.
 */
export const MBTI_HINTS: Record<string, string> = {
  INTJ: "논리와 효율을 중시하며 깊은 주제를 선호. 피상적 수다보다 의미 있는 대화를 즐김. 감정 표현이 직접적이지 않아도 관심을 기울이고 있음.",
  INTP: "지적 탐구를 즐기고 가설-검증형 대화를 좋아함. 반론도 자연스럽게 받아들임. 감정적 위로보다 논리적 공감이 더 잘 통함.",
  ENTJ: "목표 지향적이고 결단력 있음. 솔직하고 직접적인 대화를 선호. 성취 이야기를 나눌 때 에너지가 높아짐.",
  ENTP: "아이디어와 논쟁을 즐기는 타입. 관습에 얽매이지 않고 유머 감각이 풍부. 다양한 주제를 빠르게 전환하는 대화를 좋아함.",
  INFJ: "깊은 의미와 가치를 중시하며 타인의 감정에 민감. 표면보다 내면을 보려 함. 진정성 있는 대화에서 마음을 열고, 피상적인 잡담은 불편해할 수 있음.",
  INFP: "감성적이고 이상주의적. 자신만의 가치관이 강함. 공감과 경청을 원하며, 판단받는 느낌을 싫어함. 창의적 주제나 감성적 대화에서 활발해짐.",
  ENFJ: "타인을 돌보는 것을 좋아하며 공감 능력이 뛰어남. 관계의 조화를 중시하고 격려·인정에 잘 반응함. 주변 사람들 이야기에 관심이 많음.",
  ENFP: "열정적이고 가능성을 탐색하는 걸 좋아함. 감정 표현이 풍부하고 다양한 이야기를 펼침. 자유로운 대화 흐름을 선호하며 규칙적인 패턴을 답답해할 수 있음.",
  ISTJ: "신뢰와 책임을 중시하며 구체적·사실적 대화를 선호. 익숙한 것에서 안정감을 찾음. 감정보다 사실 기반 소통이 편함.",
  ISFJ: "따뜻하고 세심하며 타인을 잘 기억함. 안정적이고 예측 가능한 관계를 원함. 작은 배려에 큰 감동을 받고, 갑작스러운 변화를 불편해할 수 있음.",
  ESTJ: "실용적이고 계획적이며 책임감이 강함. 명확한 목표와 결과 중심 대화를 선호. 효율을 중시하고 모호한 대화를 답답해함.",
  ESFJ: "사교적이고 주변을 잘 챙기는 타입. 관계와 화합을 중시하며 타인의 감정에 빠르게 반응. 인정받고 싶은 욕구가 강하고 갈등 상황을 피하려 함.",
  ISTP: "논리적이고 침착하며 실질적인 문제 해결을 좋아함. 불필요한 감정 소모를 피하고 간결한 소통을 선호. 혼자만의 시간이 필요한 편.",
  ISFP: "온화하고 감성적이며 예술·자연·감각적 경험을 즐김. 갈등을 피하려 하고 진심 어린 공감을 원함. 말보다 행동으로 마음을 표현하는 경향.",
  ESTP: "행동 지향적이고 즉흥적이며 현재를 즐김. 유머와 에너지가 넘침. 긴 설명보다 빠른 대화와 직접적인 경험 이야기를 선호.",
  ESFP: "밝고 활동적이며 새로운 경험을 즐김. 분위기를 띄우는 것을 좋아하고 유머와 재미를 중시. 감정 공유에 솔직하고 깊은 대화보다 즐거운 일상 이야기를 선호.",
};

/**
 * MBTI 유형 문자열을 검증한다. 유효하지 않으면 undefined 반환.
 */
export function validateMbti(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const upper = raw.trim().toUpperCase();
  return upper in MBTI_HINTS ? upper : undefined;
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

  const rawGender = profileCtx.gender?.trim();
  const normalizedGender = rawGender
    ? rawGender === "male"
      ? "남성"
      : rawGender === "female"
        ? "여성"
        : rawGender
    : undefined;

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
    gender: normalizedGender,
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
    lines.push(`- MBTI: ${ctx.mbti} — ${hint}`);
    lines.push(
      `  ※ MBTI는 참고 정보일 뿐. 고정관념으로 대하지 말고 이 사람 자체에 집중할 것.`
    );
  }

  if (ctx.idealType)
    lines.push(
      `- 이상형·원하는 관계 스타일: ${ctx.idealType} (억지로 맞추려 하지 말고 자연스럽게 참고만 할 것)`
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
