/**
 * 사용자 감정 공명 패턴 분석
 *
 * 대화 이력에서 "어떤 주제를 말할 때 어떤 감정을 보이는지" 패턴을 추출하여
 * 캐릭터가 유저의 감정 트리거를 자연스럽게 인식하도록 한다.
 */

// ─── 타입 정의 ──────────────────────────────────────────────────────────────

export interface EmotionTopicCorrelation {
  /** 주제 레이블 (예: "직장·야근", "게임·취미") */
  topic: string;
  /** 연관 감정 방향 */
  sentiment: "stress" | "positive";
  /** 관측 횟수 */
  count: number;
}

export interface UserEmotionPattern {
  /** 관측된 상위 감정-주제 상관관계 (최대 4개) */
  correlations: EmotionTopicCorrelation[];
  /** 분석에 사용된 메시지 샘플 수 */
  sampleCount: number;
  updatedAt: string;
}

// ─── 키워드 테이블 ──────────────────────────────────────────────────────────

interface TopicDef {
  label: string;
  keywords: string[];
}

const TOPIC_DEFS: TopicDef[] = [
  {
    label: "직장·야근",
    keywords: [
      "야근",
      "회사",
      "부장",
      "상사",
      "회의",
      "프로젝트",
      "업무",
      "퇴근",
      "출근",
      "직장",
      "팀장",
    ],
  },
  {
    label: "게임·취미",
    keywords: [
      "게임",
      "포켓몬",
      "롤",
      "발로란트",
      "오버워치",
      "스팀",
      "PC방",
    ],
  },
  {
    label: "야구·스포츠",
    keywords: [
      "야구",
      "두산",
      "LG",
      "KBO",
      "잠실",
      "경기",
      "골프",
      "축구",
      "농구",
    ],
  },
  {
    label: "건강·몸",
    keywords: ["병원", "약", "몸살", "감기", "두통", "건강", "운동", "헬스"],
  },
  {
    label: "재테크·투자",
    keywords: [
      "주식",
      "코인",
      "투자",
      "삼전",
      "물렸",
      "코스피",
      "코스닥",
      "증시",
    ],
  },
  {
    label: "음악·영화",
    keywords: ["노래", "음악", "영화", "드라마", "넷플릭스", "콘서트", "공연"],
  },
];

const STRESS_SIGNALS = [
  "힘들",
  "피곤",
  "지침",
  "지쳐",
  "짜증",
  "화나",
  "답답",
  "속상",
  "걱정",
  "불안",
  "우울",
  "스트레스",
  "최악",
  "망했",
  "미치겠",
  "죽겠",
  "빡쳐",
  "열받",
  "야근했",
  "야근해",
];

const POSITIVE_SIGNALS = [
  "재밌",
  "신나",
  "행복",
  "기분 좋",
  "좋아",
  "설레",
  "웃겼",
  "대박",
  "잼",
  "즐거",
  "좋았",
  "최고",
  "승",
  "이겼",
  "ㅋㅋ",
  "ㅎㅎ",
];

// ─── 분석 로직 ──────────────────────────────────────────────────────────────

function detectTopics(text: string): string[] {
  const found: string[] = [];
  for (const def of TOPIC_DEFS) {
    if (def.keywords.some((kw) => text.includes(kw))) {
      found.push(def.label);
    }
  }
  return found;
}

function detectSentiment(text: string): "stress" | "positive" | null {
  const hasStress = STRESS_SIGNALS.some((s) => text.includes(s));
  const hasPositive = POSITIVE_SIGNALS.some((s) => text.includes(s));
  if (hasStress && !hasPositive) return "stress";
  if (hasPositive && !hasStress) return "positive";
  return null;
}

/**
 * 단일 세션 분석 — 사용자 메시지 목록에서 감정-주제 상관 추출.
 * @param userMessages 사용자 메시지 string[] (role === "user" 필터 이후)
 */
export function analyzeEmotionPattern(
  userMessages: string[]
): UserEmotionPattern {
  const userMsgs = userMessages;

  const correlationMap = new Map<string, EmotionTopicCorrelation>();

  for (const text of userMsgs) {
    const topics = detectTopics(text);
    if (topics.length === 0) continue;

    const sentiment = detectSentiment(text);
    if (!sentiment) continue;

    for (const topic of topics) {
      const key = `${topic}:${sentiment}`;
      const existing = correlationMap.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        correlationMap.set(key, { topic, sentiment, count: 1 });
      }
    }
  }

  const correlations = [...correlationMap.values()]
    .filter((c) => c.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return {
    correlations,
    sampleCount: userMsgs.length,
    updatedAt: new Date().toISOString(),
  };
}

/** 기존 패턴 + 새 패턴 병합 (이동 평균 방식) */
export function mergeEmotionPattern(
  existing: UserEmotionPattern | null,
  incoming: UserEmotionPattern
): UserEmotionPattern {
  if (!existing || existing.sampleCount < 5) {
    return incoming;
  }

  const merged = new Map<string, EmotionTopicCorrelation>();

  for (const c of existing.correlations) {
    merged.set(`${c.topic}:${c.sentiment}`, { ...c });
  }

  for (const c of incoming.correlations) {
    const key = `${c.topic}:${c.sentiment}`;
    const ex = merged.get(key);
    if (ex) {
      ex.count = Math.round((ex.count * 0.7 + c.count * 0.3));
    } else {
      merged.set(key, { ...c });
    }
  }

  const correlations = [...merged.values()]
    .filter((c) => c.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  return {
    correlations,
    sampleCount: existing.sampleCount + incoming.sampleCount,
    updatedAt: new Date().toISOString(),
  };
}

/** JSONB에서 파싱 */
export function parseSavedEmotionPattern(
  raw: unknown
): UserEmotionPattern | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (!Array.isArray(o.correlations)) return null;
  if (typeof o.sampleCount !== "number") return null;
  return o as unknown as UserEmotionPattern;
}

// ─── 프롬프트 블록 생성 ──────────────────────────────────────────────────────

/** 감정 패턴을 캐릭터 인식 힌트로 변환 */
export function buildEmotionPatternPromptBlock(
  pattern: UserEmotionPattern | null
): string {
  if (!pattern || pattern.correlations.length === 0) return "";
  if (pattern.sampleCount < 8) return "";

  const stressItems = pattern.correlations
    .filter((c) => c.sentiment === "stress" && c.count >= 3)
    .slice(0, 2);
  const positiveItems = pattern.correlations
    .filter((c) => c.sentiment === "positive" && c.count >= 3)
    .slice(0, 2);

  if (stressItems.length === 0 && positiveItems.length === 0) return "";

  const lines: string[] = ["[감정 패턴 인식 — 장기 관찰]"];
  lines.push(
    "아래는 유저가 반복적으로 보인 감정 패턴이다. 대화에 자연스럽게 녹여라. '패턴'이나 '기록'을 직접 언급하지 마라."
  );

  for (const item of stressItems) {
    lines.push(
      `- ${item.topic} 이야기가 나오면 유저가 자주 피곤·답답함을 표현한다 → 선제 공감·위로 준비.`
    );
  }
  for (const item of positiveItems) {
    lines.push(
      `- ${item.topic} 이야기가 나오면 유저가 자주 긍정·활기를 보인다 → 함께 리액션하고 관심을 보여라.`
    );
  }

  lines.push(
    "※ 패턴 멘트 반복 금지. 상황이 맞을 때만 1회. 분석·통계 말투 절대 금지."
  );

  return lines.join("\n");
}
