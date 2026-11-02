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
  /** 성별: "남성" | "여성" | undefined */
  gender?: string;
  /** MBTI (예: "INTJ") */
  mbti?: string;
  /** 이상형 설명 */
  idealType?: string;
}

/** MBTI 유형별 대화 스타일 힌트 */
export const MBTI_HINTS: Record<string, string> = {
  INTJ: "논리적이고 독립적. 결론 중심 대화 선호. 과도한 감성적 공감보다 실질적 조언을 좋아함.",
  INTP: "분석적이고 호기심 많음. 개념 탐구를 즐기며 즉흥적 공감보다 깊은 이야기를 선호.",
  ENTJ: "목표 지향적이고 직접적. 효율 중시, 칭찬보다 솔직한 피드백 선호.",
  ENTP: "창의적이고 토론 좋아함. 유머·반전 있는 대화에 반응 잘함.",
  INFJ: "공감 능력 높고 의미 있는 대화 중시. 깊은 연결과 진심 어린 소통을 원함.",
  INFP: "감수성 풍부하고 가치 중심. 강요 없는 편안한 분위기와 진정성 있는 말에 반응.",
  ENFJ: "사람 중심적이고 따뜻함. 관계와 감정 공유를 중시, 적극적 공감에 잘 반응.",
  ENFP: "열정적이고 아이디어 풍부. 즉흥적이고 유쾌한 대화, 가능성 탐구를 즐김.",
  ISTJ: "신뢰와 책임감 중시. 일관성 있는 태도와 약속 이행에 신뢰를 느낌.",
  ISFJ: "배려심 깊고 안정 추구. 세심한 챙김과 일상 공유에 편안함을 느낌.",
  ESTJ: "현실적이고 체계적. 명확한 소통과 일 이야기를 편하게 함.",
  ESFJ: "사교적이고 따뜻함. 관계 중심이며 칭찬과 인정에 긍정적으로 반응.",
  ISTP: "실용적이고 독립적. 간결한 대화 선호, 불필요한 감정 과잉 싫어함.",
  ISFP: "온화하고 예술적 감수성. 강요 없는 분위기에서 감정 표현이 자연스럽게 나옴.",
  ESTP: "활동적이고 현실적. 유머·현재 경험 중심 대화에 활기차게 반응.",
  ESFP: "밝고 사교적. 즐거운 분위기와 즉흥적 대화를 좋아하며 감정 표현이 풍부.",
};

/**
 * 성별 문자열 정규화 ("male"/"female"/한글 혼용 → "남성"/"여성").
 */
export function normalizeGender(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const v = raw.toLowerCase().trim();
  if (v === "male" || v === "남자" || v === "남성") return "남성";
  if (v === "female" || v === "여자" || v === "여성") return "여성";
  return undefined;
}

/**
 * MBTI 문자열 검증 및 정규화. 유효하지 않으면 undefined 반환.
 */
export function validateMbti(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const upper = raw.toUpperCase().trim();
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
      `- 이상형: ${ctx.idealType} (대화 스타일·분위기 참고용, 직접 언급 금지)`
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
