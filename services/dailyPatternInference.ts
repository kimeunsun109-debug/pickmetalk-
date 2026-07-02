import type { DailyPatternType, UserDailyPattern } from "@/types";

export interface PatternObservation {
  patternType: DailyPatternType;
  timeStartMinute: number;
  timeEndMinute: number;
  weight: number;
  reason: string;
}

const KST_OFFSET_MINUTES = 9 * 60;
const DEFAULT_TIMEZONE = "Asia/Seoul";

const KEYWORDS: Record<DailyPatternType, RegExp[]> = {
  wake: [/기상|일어났|일어남|눈\s*떴|출근\s*준비/u],
  work_start: [/출근|회사\s*도착|업무\s*시작|일\s*시작/u],
  lunch: [/점심|점심시간|점심\s*먹|밥\s*먹으러/u],
  work_end: [/퇴근|업무\s*끝|일\s*끝났|퇴근했다/u],
  exercise: [/운동|헬스|러닝|런닝|조깅|산책|오운완/u],
  sleep: [/잘게|자러|취침|잠\s*자|자는\s*중/u],
};

const DEFAULT_WINDOWS: Record<DailyPatternType, [number, number]> = {
  wake: [420, 510], // 07:00~08:30
  work_start: [480, 570], // 08:00~09:30
  lunch: [720, 780], // 12:00~13:00
  work_end: [1080, 1170], // 18:00~19:30
  exercise: [1140, 1230], // 19:00~20:30
  sleep: [1380, 60], // 23:00~01:00 (wrap)
};

function clampMinute(value: number): number {
  return Math.max(0, Math.min(1439, Math.round(value)));
}

function parseClockMinute(text: string): number | null {
  const m = text.match(
    /(오전|오후|새벽|밤)?\s*(\d{1,2})\s*시(?:\s*(\d{1,2})\s*분)?/u
  );
  if (!m) return null;
  const marker = m[1] ?? "";
  let hour = Number(m[2]);
  const minute = Number(m[3] ?? "0");
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  if (marker === "오후" && hour < 12) hour += 12;
  if ((marker === "오전" || marker === "새벽") && hour === 12) hour = 0;
  if (marker === "밤" && hour < 12) hour = hour + 12;
  return clampMinute(hour * 60 + minute);
}

function minuteFromDateInKst(date: Date): number {
  const kst = new Date(date.getTime() + KST_OFFSET_MINUTES * 60_000);
  return kst.getUTCHours() * 60 + kst.getUTCMinutes();
}

function windowFromCenter(center: number, span = 50): [number, number] {
  return [clampMinute(center - span), clampMinute(center + span)];
}

function hasPatternKeyword(text: string, patternType: DailyPatternType): boolean {
  return KEYWORDS[patternType].some((re) => re.test(text));
}

export function inferDailyPatternObservations(
  userText: string,
  observedAt: Date
): PatternObservation[] {
  const text = userText.trim();
  if (!text) return [];

  const explicitMinute = parseClockMinute(text);
  const nowMinute = minuteFromDateInKst(observedAt);
  const observations: PatternObservation[] = [];

  (Object.keys(KEYWORDS) as DailyPatternType[]).forEach((type) => {
    if (!hasPatternKeyword(text, type)) return;

    let start: number;
    let end: number;
    let weight = 12;

    if (explicitMinute != null) {
      [start, end] = windowFromCenter(explicitMinute, 30);
      weight = 20;
    } else if (/(지금|이제|막|방금)/u.test(text)) {
      [start, end] = windowFromCenter(nowMinute, 40);
      weight = 15;
    } else {
      [start, end] = DEFAULT_WINDOWS[type];
    }

    observations.push({
      patternType: type,
      timeStartMinute: start,
      timeEndMinute: end,
      weight,
      reason: explicitMinute != null ? "explicit_time" : "utterance_pattern",
    });
  });

  return observations;
}

function blendMinute(oldValue: number, nextValue: number, alpha: number): number {
  return clampMinute(oldValue * (1 - alpha) + nextValue * alpha);
}

function recencyBoost(existing: UserDailyPattern | null, nowIso: string): number {
  if (!existing?.lastObservedAt) return 1;
  const days =
    (new Date(nowIso).getTime() - new Date(existing.lastObservedAt).getTime()) /
    86_400_000;
  if (days <= 1) return 1.1;
  if (days <= 3) return 1.0;
  if (days <= 7) return 0.9;
  return 0.8;
}

export function mergePatternObservation(params: {
  existing: UserDailyPattern | null;
  observation: PatternObservation;
  observedAt: string;
  messageId: string | null;
  timezone?: string;
}): {
  patternType: DailyPatternType;
  timeStartMinute: number;
  timeEndMinute: number;
  confidence: number;
  evidenceCount: number;
  timezone: string;
  observedAt: string;
  messageId: string | null;
} {
  const { existing, observation, observedAt, messageId } = params;

  if (!existing) {
    return {
      patternType: observation.patternType,
      timeStartMinute: observation.timeStartMinute,
      timeEndMinute: observation.timeEndMinute,
      confidence: Math.min(45, observation.weight + 10),
      evidenceCount: 1,
      timezone: params.timezone ?? DEFAULT_TIMEZONE,
      observedAt,
      messageId,
    };
  }

  const evidenceCount = Math.min(999, existing.evidenceCount + 1);
  const alpha = Math.min(0.45, 0.18 + evidenceCount * 0.02);
  const recency = recencyBoost(existing, observedAt);
  const confidenceGain = observation.weight * recency * 0.45;
  const baseDecay = existing.confidence * 0.985;
  const confidence = Math.max(
    20,
    Math.min(100, baseDecay + confidenceGain + Math.min(evidenceCount * 1.7, 22))
  );

  return {
    patternType: observation.patternType,
    timeStartMinute: blendMinute(
      existing.timeStartMinute,
      observation.timeStartMinute,
      alpha
    ),
    timeEndMinute: blendMinute(existing.timeEndMinute, observation.timeEndMinute, alpha),
    confidence,
    evidenceCount,
    timezone: existing.timezone || params.timezone || DEFAULT_TIMEZONE,
    observedAt,
    messageId,
  };
}
