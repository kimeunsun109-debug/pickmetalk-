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
  /** 사용자 성별 — 프로필에서 가져옴 */
  gender?: string;
  /** 사용자 MBTI — 프로필에서 가져옴 */
  mbti?: string;
  /** 사용자가 기입한 이상형 */
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
// MBTI Behavioral Hints
// ─────────────────────────────────────────────

/**
 * MBTI 유형별로 캐릭터가 대화 방식을 살짝 조정하도록 돕는 행동 힌트.
 * 진단·라벨링이 아니라 "이 사람이 편하게 느끼는 대화 결"을 설명한다.
 */
const MBTI_HINTS: Partial<Record<string, string>> = {
  INTJ: "계획적·목표지향적. 감언이설보단 솔직하고 명확한 대화를 선호해.",
  INTP: "분석적·논리적. 깊이 있는 주제를 좋아하고 감정 표현이 서투를 수 있어.",
  ENTJ: "자신감 있고 추진력이 강해. 직접적인 소통을 선호하고 결과를 중시해.",
  ENTP: "토론과 새 아이디어를 즐겨. 예측 불가능한 대화에 잘 반응해.",
  INFJ: "이상적이고 감수성이 풍부해. 깊은 의미 있는 대화를 중요하게 여겨.",
  INFP: "감수성이 많고 자기만의 가치관이 있어. 진정성 있는 감정 공유를 소중히 해.",
  ENFJ: "배려심 있고 리더십이 있어. 조화로운 관계를 추구해.",
  ENFP: "에너지 넘치고 창의적. 새 경험과 열정적인 대화를 즐겨.",
  ISTJ: "책임감 있고 신중해. 전통을 중시하고 약속을 잘 지켜.",
  ISFJ: "따뜻하고 헌신적. 사람을 잘 챙기고 세심하게 기억해.",
  ESTJ: "체계적이고 실용적. 효율적인 대화와 명확한 결론을 선호해.",
  ESFJ: "사교적이고 배려심이 많아. 친밀한 관계를 소중히 여겨.",
  ISTP: "독립적·실용적. 말보다 행동으로 보여주는 편이야.",
  ISFP: "자유롭고 예술적. 자기 페이스를 중요시하고 감각적인 것을 즐겨.",
  ESTP: "적응력 있고 에너지 넘쳐. 직접 경험과 현실적인 것을 좋아해.",
  ESFP: "즉흥적이고 활발해. 지금 이 순간을 즐기고 주변을 밝게 해.",
};

function getMbtiHint(mbti: string): string | undefined {
  const upper = mbti.toUpperCase().trim();
  return MBTI_HINTS[upper];
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
    gender: profileCtx.gender?.trim() || undefined,
    mbti: profileCtx.mbti?.trim() || undefined,
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
  if (ctx.gender) {
    const genderLabel =
      ctx.gender === "male" || ctx.gender === "남"
        ? "남성"
        : ctx.gender === "female" || ctx.gender === "여"
          ? "여성"
          : ctx.gender;
    lines.push(`- 성별: ${genderLabel}`);
  }
  if (ctx.mbti) {
    const hint = getMbtiHint(ctx.mbti);
    lines.push(
      hint
        ? `- MBTI: ${ctx.mbti.toUpperCase()} — ${hint}`
        : `- MBTI: ${ctx.mbti.toUpperCase()}`
    );
  }
  if (ctx.idealType)
    lines.push(
      `- 이상형 키워드: ${ctx.idealType} (대화 결·태도에 자연스럽게 반영, 직접 언급 금지)`
    );
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
