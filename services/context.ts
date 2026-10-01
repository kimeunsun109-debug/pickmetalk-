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
  /** 성별: '남성' | '여성' */
  gender?: string;
  /** MBTI 유형 (예: INFJ, ENTP) */
  mbti?: string;
  /** 이상형 키워드 */
  idealType?: string;
}

/**
 * MBTI 16유형별 대화 행동 힌트 — 라벨이 아닌 대화 결을 설명한다.
 * 프롬프트에서 "INFJ입니다"가 아니라 실제 행동 패턴으로 삽입된다.
 */
const MBTI_HINTS: Record<string, string> = {
  INTJ: "계획·논리 중심. 감정 표현보단 직접적인 분석을 선호한다. 칭찬보다 실질적인 도움에 더 반응한다.",
  INTP: "아이디어 탐구를 즐긴다. 감정적 위로보다 흥미로운 주제 전환이나 논리적 공감에 더 반응한다.",
  ENTJ: "주도적·목표 지향. 결론부터 말하는 편을 선호한다. 답답한 상황에 직접적인 해결책을 원한다.",
  ENTP: "도전·토론 즐김. 새로운 시각이나 가볍게 반박하는 말에도 재미를 느낀다.",
  INFJ: "의미와 연결을 중시한다. 깊은 공감과 '왜'를 이해받는 느낌에 반응한다. 표면적 위로보다 진심이 통한다.",
  INFP: "가치·감정 중심. 자신만의 세계를 인정받는 것에 민감하다. 가볍게 다독이는 말보다 감정을 이름 붙여 주는 것이 효과적이다.",
  ENFJ: "타인 중심·관계 지향. 대화에서 상대의 감정 변화를 잘 감지한다. 칭찬·인정에 에너지를 얻는다.",
  ENFP: "열정·가능성 중심. 아이디어와 감정 공유를 좋아한다. 가끔 즉흥적인 뜬금없는 이야기에 함께 들어가 주면 좋아한다.",
  ISTJ: "규칙·책임 중심. 감정 표현이 적은 편이다. 안정적이고 신뢰감 있는 말투에 편안함을 느낀다.",
  ISFJ: "배려·보호 중심. 작은 것도 신경 써 주는 말에 감동받는다. 갑작스러운 변화보다 일관된 관심을 좋아한다.",
  ESTJ: "효율·질서 중심. 두리뭉실한 위로보다 명확한 방향 제시를 선호한다.",
  ESFJ: "화합·돌봄 중심. 사람 사이의 분위기와 관계에 예민하다. 따뜻한 말 한마디에 크게 반응한다.",
  ISTP: "실용·조용 중심. 필요 이상의 감정 표현은 부담스럽다. 담담하지만 진심 있는 반응이 잘 맞는다.",
  ISFP: "감각·조화 중심. 압박 없이 자연스럽게 흘러가는 대화를 좋아한다. 예쁜 것·맛있는 것·일상 소소한 것에 반응한다.",
  ESTP: "행동·현실 중심. 빠른 리듬, 가벼운 장난, 직설적인 대화에 활기를 느낀다.",
  ESFP: "재미·순간 중심. 신나는 분위기와 공감에 적극적으로 반응한다. 함께 즐기는 느낌을 원한다.",
};

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

  // 성별 정규화: male/'남'/'남자' → 남성, female/'여'/'여자' → 여성
  const rawGender = profileCtx.gender?.trim().toLowerCase();
  let gender: string | undefined;
  if (rawGender) {
    if (rawGender === "male" || rawGender.startsWith("남")) {
      gender = "남성";
    } else if (rawGender === "female" || rawGender.startsWith("여")) {
      gender = "여성";
    }
  }

  // MBTI 정규화: 대문자 변환 후 유효한 16유형인지 확인
  const rawMbti = profileCtx.mbti?.trim().toUpperCase();
  const mbti = rawMbti && rawMbti in MBTI_HINTS ? rawMbti : undefined;

  // 이상형: 공백·없음은 undefined
  const idealType = profileCtx.idealType?.trim() || undefined;

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
    gender,
    mbti,
    idealType,
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
  if (ctx.gender) lines.push(`- 성별: ${ctx.gender}`);
  if (ctx.mbti) {
    const hint = MBTI_HINTS[ctx.mbti];
    lines.push(`- MBTI: ${ctx.mbti} — ${hint}`);
  }
  if (ctx.idealType)
    lines.push(
      `- 이상형 키워드: ${ctx.idealType} (직접 언급 금지 — 대화 결에 자연스럽게 반영)`
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
