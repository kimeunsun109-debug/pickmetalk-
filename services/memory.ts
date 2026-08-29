import type { Message, EmotionState } from "@/types";

const RECENT_MESSAGE_LIMIT = 20;
const MAX_MEMORY_FACTS = 10;
const MAX_EMOTION_MEMORIES = 2;

const SKIP_MESSAGE =
  /^(ㅇ+|응|네|아니|하이|안녕|ㅎㅇ|ㅋㅋ+|ㅎㅎ+|ㅠ+|ㅜ+|고마워|감사|굿|ok|okay)$/i;

export type MemoryCategory =
  | "schedule"
  | "hobby"
  | "work"
  | "finance"
  | "emotion";

export interface MemoryEntity {
  fact: string;
  category: MemoryCategory;
  timestamp: number;
}

/** 프롬프트 우선순위 (낮을수록 먼저) — emotion은 마지막 */
const CATEGORY_WEIGHT: Record<MemoryCategory, number> = {
  schedule: 0,
  work: 1,
  hobby: 2,
  finance: 3,
  emotion: 4,
};

const WORK_KEYWORDS = [
  "야근",
  "부장",
  "회사",
  "출장",
  "퇴사",
  "상사",
  "팀장",
  "월급",
  "프로젝트",
  "회의",
  "직장",
  "업무",
];

const HOBBY_KEYWORDS = [
  "낚시",
  "두산",
  "야구",
  "골프",
  "캠핑",
  "축구",
  "LG",
  "KBO",
  "잠실",
  "경기",
  "포켓몬",
  "게임",
];

const FINANCE_KEYWORDS = [
  "주식",
  "코인",
  "삼전",
  "물렸",
  "파란불",
  "빨간불",
  "증시",
  "투자",
  "코스피",
  "코스닥",
];

const SCHEDULE_PATTERNS =
  /(?:갈\s?(?:거|예정)|간다|가\s?볼|방문(?:할)?|(?:할|갈)\s?예정|내일|모레|다음\s?주)/u;

const EMOTION_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /피곤|지쳐|힘들|지침|번아웃/u, label: "피곤·지침" },
  { pattern: /외롭|쓸쓸|혼자\s?(?:있|느)/u, label: "외로움" },
  { pattern: /슬프|우울|속상|눈물|울/u, label: "슬픔·속상" },
  { pattern: /화나|짜증|답답|열받/u, label: "화·답답" },
  { pattern: /불안|걱정|초조|무서/u, label: "불안·걱정" },
  { pattern: /기분\s?좋|신나|행복|설레/u, label: "기분 좋음" },
  { pattern: /별로|기분\s?(?:안|별)/u, label: "기분 안 좋음" },
];

/** 비용 최적화: 최근 N개 + DB 요약만 AI에 전달 */
export function pickMessagesForContext(
  messages: Message[],
  summary: string | null
): { recent: Message[]; summary: string | null } {
  const recent = messages.slice(-RECENT_MESSAGE_LIMIT);
  return { recent, summary };
}

function cleanUserText(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function toCondensedFact(text: string, maxLen = 55): string {
  return text
    .replace(/^(?:오빠|언니|야|어|음+,?\s*)/, "")
    .replace(/^나(?:는|도|랑|랑은)?\s*/, "")
    .replace(/^난\s*/, "")
    .replace(/^내가\s*/, "")
    .replace(/^내는\s*/, "")
    .replace(/\s*(?:갈\s?(?:거|예정)?|간다|가\s?볼?|방문(?:할)?)\.?$/u, "")
    .replace(/(?:이야|이지|야|요)\.?$/u, "")
    .slice(0, maxLen)
    .trim();
}

function includesKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((k) => text.includes(k));
}

function matchedKeywords(text: string, keywords: string[]): string[] {
  return keywords.filter((k) => text.includes(k));
}

function buildFactFromKeywords(text: string, keywords: string[]): string | null {
  const hits = matchedKeywords(text, keywords);
  if (hits.length === 0) return null;

  const condensed = toCondensedFact(text);
  if (condensed.length >= 6) return condensed;

  return `${hits[0]} 관련 언급`;
}

function extractScheduleEntity(
  text: string,
  timestamp: number
): MemoryEntity | null {
  if (!SCHEDULE_PATTERNS.test(text)) return null;
  const fact = toCondensedFact(text);
  if (fact.length < 4) return null;
  return { fact, category: "schedule", timestamp };
}

function extractIdentityEntity(
  text: string,
  timestamp: number
): MemoryEntity | null {
  const fanMatch = text.match(
    /(?:난?|나는?)?\s*(.+?)\s*(?:팬|응원(?:해|함)?)/u
  );
  if (fanMatch?.[1]) {
    return {
      fact: `${fanMatch[1].trim()} 팬`,
      category: "hobby",
      timestamp,
    };
  }

  const identityMatch = text.match(/(?:난?|나는?)\s*(.+?)(?:이야|이지|야)$/u);
  if (identityMatch?.[1] && identityMatch[1].length <= 12) {
    const subject = identityMatch[1].trim();
    if (/팬/.test(text)) {
      return { fact: `${subject} 팬`, category: "hobby", timestamp };
    }
    if (includesKeyword(subject, HOBBY_KEYWORDS)) {
      return { fact: `${subject} (관심)`, category: "hobby", timestamp };
    }
  }
  return null;
}

function extractEmotionEntity(
  text: string,
  timestamp: number,
  hasFactEntity: boolean
): MemoryEntity | null {
  if (hasFactEntity) return null;

  for (const { pattern, label } of EMOTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        fact: label,
        category: "emotion",
        timestamp,
      };
    }
  }
  return null;
}

/** 명사·키워드 Fact 우선 추출 (emotion은 보조) */
export function extractKeyMemories(
  userMessage: string,
  timestamp = Date.now()
): MemoryEntity[] {
  const text = cleanUserText(userMessage);
  if (text.length < 4 || SKIP_MESSAGE.test(text)) return [];

  const entities: MemoryEntity[] = [];

  const schedule = extractScheduleEntity(text, timestamp);
  if (schedule) entities.push(schedule);

  const workFact = buildFactFromKeywords(text, WORK_KEYWORDS);
  if (workFact) {
    entities.push({ fact: workFact, category: "work", timestamp });
  }

  const identity = extractIdentityEntity(text, timestamp);
  if (identity) entities.push(identity);

  const hobbyFact = buildFactFromKeywords(text, HOBBY_KEYWORDS);
  if (hobbyFact && !schedule && !identity) {
    entities.push({ fact: hobbyFact, category: "hobby", timestamp });
  }

  const financeFact = buildFactFromKeywords(text, FINANCE_KEYWORDS);
  if (financeFact) {
    entities.push({ fact: financeFact, category: "finance", timestamp });
  }

  const interestMatch = text.match(
    /(.{2,35}?)(?:좋아(?:해|함)?|즐겨|하는\s?편|관심(?:있)?|최애)/u
  );
  if (interestMatch?.[0] && !identity && !hobbyFact) {
    const fact = toCondensedFact(interestMatch[0]);
    if (fact.length >= 2) {
      entities.push({ fact, category: "hobby", timestamp });
    }
  }

  const hasFactEntity = entities.some((e) => e.category !== "emotion");
  const emotion = extractEmotionEntity(text, timestamp, hasFactEntity);
  if (emotion) entities.push(emotion);

  if (entities.length === 0 && text.length >= 10 && !text.endsWith("?")) {
    const fallback = toCondensedFact(text);
    if (fallback.length >= 6) {
      entities.push({ fact: fallback, category: "hobby", timestamp });
    }
  }

  return entities.slice(0, 3);
}

function entityKey(entity: MemoryEntity): string {
  return `${entity.category}:${entity.fact.toLowerCase().replace(/\s+/g, "")}`;
}

function parseStoredEntity(line: string, fallbackTimestamp: number): MemoryEntity {
  const stripped = line.replace(/^[-•*]\s*/, "").trim();
  const tagged = stripped.match(
    /^\[(schedule|hobby|work|finance|emotion)\]\s*(.+)$/i
  );
  if (tagged) {
    return {
      category: tagged[1].toLowerCase() as MemoryCategory,
      fact: tagged[2].trim(),
      timestamp: fallbackTimestamp,
    };
  }
  if (stripped.startsWith("감정:")) {
    return {
      category: "emotion",
      fact: stripped.replace(/^감정:\s*/, "").trim(),
      timestamp: fallbackTimestamp,
    };
  }
  return { category: "hobby", fact: stripped, timestamp: fallbackTimestamp };
}

export function parseStoredSummary(summary: string | null): MemoryEntity[] {
  if (!summary?.trim()) return [];
  return summary
    .split("\n")
    .map((line, i) => parseStoredEntity(line, i))
    .filter((e) => e.fact.length > 0);
}

function mergeEntities(entities: MemoryEntity[]): MemoryEntity[] {
  const byKey = new Map<string, MemoryEntity>();
  for (const entity of entities) {
    const key = entityKey(entity);
    const prev = byKey.get(key);
    if (!prev || entity.timestamp >= prev.timestamp) {
      byKey.set(key, entity);
    }
  }
  return [...byKey.values()];
}

function sortByPriority(entities: MemoryEntity[]): MemoryEntity[] {
  return [...entities].sort((a, b) => {
    const weightDiff = CATEGORY_WEIGHT[a.category] - CATEGORY_WEIGHT[b.category];
    if (weightDiff !== 0) return weightDiff;
    return b.timestamp - a.timestamp;
  });
}

function capWithEmotionLimit(entities: MemoryEntity[]): MemoryEntity[] {
  const facts = entities.filter((e) => e.category !== "emotion");
  const emotions = entities.filter((e) => e.category === "emotion");
  const cappedEmotions = emotions.slice(0, MAX_EMOTION_MEMORIES);
  const remaining = MAX_MEMORY_FACTS - cappedEmotions.length;
  return [...facts.slice(0, remaining), ...cappedEmotions];
}

function serializeEntity(entity: MemoryEntity): string {
  return `- [${entity.category}] ${entity.fact}`;
}

/**
 * 필수 회수 힌트 주입 임계값.
 * 0 = 대화 첫 턴부터 기억 힌트 주입 (유저가 이미 기억을 쌓았다면 즉시 활용).
 */
const STABLE_USER_MESSAGE_THRESHOLD = 0;

export interface ContextMemoryOptions {
  /** 대화 안정기 판단용 (유저 메시지 수) */
  userMessageCount?: number;
  /** hurt/pouty 초반 arc 중이면 필수 힌트 생략 */
  emotion?: EmotionState;
  emotionDurationTurns?: number;
  /** 같은 세션에서 대화가 이어지는 중이면 강제 회상 생략 */
  ongoingSession?: boolean;
}

/**
 * work/hobby Fact가 있으면 대화 안정기에 시스템 프롬프트 최상단용 필수 회수 힌트 생성
 */
export function getContextMemoryPrompt(
  memorySummary: string | null,
  options: ContextMemoryOptions = {}
): string {
  const {
    userMessageCount = 0,
    emotion,
    emotionDurationTurns = 1,
    ongoingSession = false,
  } = options;

  const entities = parseStoredSummary(memorySummary);
  if (entities.length === 0) return "";

  if (ongoingSession) return "";

  const inAcuteEmotionArc =
    (emotion === "hurt" || emotion === "pouty") && emotionDurationTurns < 3;
  const isStablePhase =
    userMessageCount >= STABLE_USER_MESSAGE_THRESHOLD && !inAcuteEmotionArc;

  if (!isStablePhase) return "";

  const topEntities = sortByPriority(entities).slice(0, 2);
  if (topEntities.length === 0) return "";

  const lines = ["[기억 활용 지침 — 선택적 회상]"];

  for (const entity of topEntities) {
    switch (entity.category) {
      case "work":
        lines.push(
          `- 유저가 예전에 "${entity.fact}"를 언급했다. 관련 있을 때만 1번 자연스럽게 언급. 이미 이번 대화에서 다뤘거나 사용자가 답했다면 반복 금지.`
        );
        break;
      case "hobby":
        lines.push(
          `- 유저가 "${entity.fact}"에 관심을 보였다. 맥락이 맞을 때만 가볍게 이어가기. 같은 질문·안부 반복 금지.`
        );
        break;
      case "schedule":
        lines.push(
          `- 유저가 "${entity.fact}" 일정을 말했다. 아직 안 물어봤을 때만 후속 안부 OK. 이미 "갔다/했다"고 답했으면 다시 묻지 마라.`
        );
        break;
      case "finance":
        lines.push(
          `- 유저가 "${entity.fact}" 관련 이야기를 했다. 맥락이 맞을 때만 넌지시 언급. 반복 금지.`
        );
        break;
      case "emotion":
        lines.push(
          `- 유저가 "${entity.fact}" 감정을 표현했다. 공감은 유지하되 같은 안부·감정 질문 반복 금지.`
        );
        break;
    }
  }

  return lines.join("\n");
}

/** @deprecated extractKeyMemories 사용 */
export function extractFactsFromUserMessage(message: string): string[] {
  return extractKeyMemories(message).map((e) =>
    e.category === "emotion" ? `감정: ${e.fact}` : e.fact
  );
}

/** Fact 우선 가중치로 memory_summary 갱신 (최신 유저 메시지만 점진 반영) */
export function updateMemorySummary(
  existing: string | null,
  newUserMessage: string
): string | null {
  const trimmed = newUserMessage.trim();
  if (!trimmed || SKIP_MESSAGE.test(trimmed)) return existing;

  const extracted = extractKeyMemories(trimmed);
  if (extracted.length === 0) return existing;

  const merged = mergeEntities([
    ...parseStoredSummary(existing),
    ...extracted,
  ]);

  const prioritized = capWithEmotionLimit(sortByPriority(merged));
  return prioritized.map(serializeEntity).join("\n");
}

/**
 * 완료 관련 메시지를 감지해 장기 memory_summary에서 연관 schedule 팩트를 제거한다.
 *
 * 예: "병원 다녀왔어" → summary에서 "병원" 이 들어간 schedule 팩트 제거
 *
 * 연관 여부는 완료 메시지와 팩트 사이의 공통 토큰(≥2자)으로 판단한다.
 */
export function removeCompletedScheduleFromSummary(
  existing: string | null,
  completionMessage: string
): string | null {
  if (!existing?.trim()) return existing;

  const msg = completionMessage.toLowerCase().replace(/\s+/g, "");
  if (msg.length < 2) return existing;

  // 완료 동사를 제거하고 의미 있는 명사/키워드 토큰을 추출 (1자 이상)
  // 한국어 단음절 단어("약", "집" 등)도 포함해야 하므로 최소 길이를 1로 설정
  const tokens = completionMessage
    .toLowerCase()
    .replace(
      /(했어|했다|완료|다녀왔어|다녀왔다|갔어|갔다|먹었어|먹었다|마셨어|마셨다|받았어|받았다|도착했어|도착했다|맞았어|맞았다|됐어|됐다|나왔어|나왔다|만났어|만났다|샀어|구매했어|챙겼어|처리했어|끝냈어|끝났다|해결했어|고쳤어|예약했어|찾았어|가져왔어|보냈어|구매했어|사왔어|사왔다)/g,
      " "
    )
    .split(/\s+/)
    .filter((t) => t.length >= 1);

  if (tokens.length === 0) return existing;

  const entities = parseStoredSummary(existing);
  const filtered = entities.filter((entity) => {
    if (entity.category !== "schedule") return true;

    const factLower = entity.fact.toLowerCase();
    const hasMatch = tokens.some((token) => factLower.includes(token));
    return !hasMatch;
  });

  if (filtered.length === entities.length) return existing;

  return filtered.length === 0
    ? null
    : filtered.map(serializeEntity).join("\n");
}
