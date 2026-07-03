/**
 * 사용자 말투 분석 — 메시지에서 패턴 추출 후 프로필 병합
 */
export type ReplyLength = "short" | "medium" | "long";
export type UsageLevel = "high" | "low";
export type LaughLevel = "often" | "sometimes" | "rare";
export type SpeechTone = "serious" | "light" | "mixed";
export type HonorificStyle = "banmal" | "jondaemal" | "mixed";

export interface UserSpeechProfile {
  avgLength: ReplyLength;
  emojiUsage: UsageLevel;
  laughUsage: LaughLevel;
  tone: SpeechTone;
  honorific: HonorificStyle;
  commonPatterns: string[];
  interests: string[];
  messageSampleCount: number;
  updatedAt: string;
}

const PATTERN_CANDIDATES = [
  "진짜",
  "아니",
  "그냥",
  "왜",
  "근데",
  "솔직히",
  "헐",
  "대박",
  "ㅋㅋ",
  "ㅎㅎ",
] as const;

const INTEREST_KEYWORDS: Record<string, string> = {
  주식: "주식/재테크",
  코인: "주식/재테크",
  야근: "일/직장",
  회사: "일/직장",
  부장: "일/직장",
  건강: "건강",
  운동: "건강/운동",
  러닝: "건강/운동",
  낚시: "취미",
  야구: "취미",
  게임: "취미",
};

const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function classifyLength(messages: string[]): ReplyLength {
  if (messages.length === 0) return "medium";
  const avg =
    messages.reduce((s, m) => s + wordCount(m), 0) / messages.length;
  if (avg <= 5) return "short";
  if (avg <= 12) return "medium";
  return "long";
}

function classifyEmoji(messages: string[]): UsageLevel {
  const withEmoji = messages.filter((m) => EMOJI_RE.test(m)).length;
  const ratio = messages.length ? withEmoji / messages.length : 0;
  return ratio >= 0.25 ? "high" : "low";
}

function classifyLaugh(messages: string[]): LaughLevel {
  const withLaugh = messages.filter((m) => /ㅋ{2,}|ㅎ{2,}/.test(m)).length;
  const ratio = messages.length ? withLaugh / messages.length : 0;
  if (ratio >= 0.4) return "often";
  if (ratio >= 0.15) return "sometimes";
  return "rare";
}

function classifyTone(messages: string[]): SpeechTone {
  let serious = 0;
  let light = 0;
  for (const m of messages) {
    if (/[?？]/.test(m) && /왜|어떻게|무슨/.test(m)) serious++;
    if (/ㅋ|ㅎ|ㅠ|!{2,}|대박|헐/.test(m)) light++;
  }
  if (serious > light * 1.5) return "serious";
  if (light > serious * 1.5) return "light";
  return "mixed";
}

function classifyHonorific(messages: string[]): HonorificStyle {
  let banmal = 0;
  let jondaemal = 0;
  for (const m of messages) {
    if (/(?:요|습니다|세요|십시오|니다)[.!?~]?\s*$/u.test(m)) jondaemal++;
    if (/(?:야|해|했어|거야|잖아|봐)[.!?~]?\s*$/u.test(m)) banmal++;
  }
  if (banmal > jondaemal * 1.5) return "banmal";
  if (jondaemal > banmal * 1.5) return "jondaemal";
  return "mixed";
}

function extractPatterns(messages: string[]): string[] {
  const counts = new Map<string, number>();
  for (const m of messages) {
    for (const p of PATTERN_CANDIDATES) {
      if (m.includes(p)) {
        counts.set(p, (counts.get(p) ?? 0) + 1);
      }
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([p]) => p);
}

function extractInterests(messages: string[]): string[] {
  const found = new Set<string>();
  const joined = messages.join(" ");
  for (const [kw, label] of Object.entries(INTEREST_KEYWORDS)) {
    if (joined.includes(kw)) found.add(label);
  }
  return [...found].slice(0, 5);
}

/** 단일 메시지 배열에서 말투 프로필 스냅샷 */
export function analyzeSpeechFromMessages(
  messages: string[]
): UserSpeechProfile {
  const samples = messages.filter((m) => m.trim().length >= 2);
  const now = new Date().toISOString();

  return {
    avgLength: classifyLength(samples),
    emojiUsage: classifyEmoji(samples),
    laughUsage: classifyLaugh(samples),
    tone: classifyTone(samples),
    honorific: classifyHonorific(samples),
    commonPatterns: extractPatterns(samples),
    interests: extractInterests(samples),
    messageSampleCount: samples.length,
    updatedAt: now,
  };
}

/** 기존 프로필과 새 스냅샷 병합 (이동 평균적) */
export function mergeSpeechProfile(
  existing: UserSpeechProfile | null,
  incoming: UserSpeechProfile
): UserSpeechProfile {
  if (!existing || existing.messageSampleCount < 3) {
    return incoming;
  }

  const prevN = existing.messageSampleCount;
  const newN = incoming.messageSampleCount;
  const total = prevN + newN;

  const pickDominant = <T extends string>(
    a: T,
    b: T,
    weightA: number
  ): T => (weightA >= total / 2 ? a : b);

  const patterns = [
    ...new Set([...existing.commonPatterns, ...incoming.commonPatterns]),
  ].slice(0, 5);

  const interests = [
    ...new Set([...existing.interests, ...incoming.interests]),
  ].slice(0, 5);

  return {
    avgLength: pickDominant(
      existing.avgLength,
      incoming.avgLength,
      prevN
    ),
    emojiUsage: pickDominant(
      existing.emojiUsage,
      incoming.emojiUsage,
      prevN
    ),
    laughUsage: pickDominant(
      existing.laughUsage,
      incoming.laughUsage,
      prevN
    ),
    tone: pickDominant(existing.tone, incoming.tone, prevN),
    honorific: pickDominant(
      existing.honorific,
      incoming.honorific,
      prevN
    ),
    commonPatterns: patterns,
    interests,
    messageSampleCount: total,
    updatedAt: incoming.updatedAt,
  };
}

const LENGTH_HINT: Record<ReplyLength, string> = {
  short: "3~5단어 수준으로 짧게",
  medium: "한두 문장, 10단어 전후",
  long: "조금 길게, 2문장까지",
};

const LAUGH_HINT: Record<LaughLevel, string> = {
  often: "ㅋㅋ·ㅎㅎ를 자주 섞는다",
  sometimes: "가끔 ㅋㅋ 정도",
  rare: "ㅋㅋ 거의 안 씀",
};

/** 프롬프트용 말투 학습 블록 */
export function buildSpeechStylePromptBlock(
  profile: UserSpeechProfile | null
): string {
  const header = [
    "[상대와의 대화 리듬]",
    "캐릭터 정체성·자기소개서가 최우선이다. 성격을 유지한 채 상대에 맞춘다.",
    "사용자 말투를 흉내 내거나 이모지·ㅋㅋ를 억지로 복사하지 않는다.",
  ];

  if (!profile || profile.messageSampleCount < 2) {
    return [
      ...header,
      "아직 패턴이 적다. 반말/존댓말·길이만 자연스럽게 맞춘다.",
    ].join("\n");
  }

  const honorificRule =
    profile.honorific === "banmal"
      ? "상대가 반말 → 반말 (Lv·캐릭터 범위 내)."
      : profile.honorific === "jondaemal"
        ? "상대가 존댓말 → 존댓말 또는 부드러운 존댓."
        : "반말·존댓말 혼용 OK.";

  const lines = [
    ...header,
    `- 답 길이 감각: ${LENGTH_HINT[profile.avgLength]}`,
    `- 상대 톤: ${profile.tone === "serious" ? "진지한 편 — 가볍게 깨지 말 것" : profile.tone === "light" ? "가벼운 편 — 유머 OK" : "진지·가벼움 오감"}`,
    `- ${honorificRule}`,
  ];

  if (profile.interests.length > 0) {
    lines.push(`- 관심사 참고: ${profile.interests.join(", ")}`);
  }

  lines.push(
    "※ 캐릭터가 이모지·ㅋㅋ를 쓰지 않는 성격이면 상대 빈도와 관계없이 자제한다."
  );

  return lines.join("\n");
}

export function parseSpeechProfile(raw: unknown): UserSpeechProfile | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.messageSampleCount !== "number") return null;
  return o as unknown as UserSpeechProfile;
}
