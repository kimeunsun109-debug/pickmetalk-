import {
  inferDailyPatternObservations,
  mergePatternObservation,
} from "../services/dailyPatternInference";
import { buildDailyPatternPromptBlock } from "../prompts/patternNudges";
import type { UserDailyPattern } from "../types";

const baseDate = new Date("2026-06-25T02:50:00.000Z"); // 11:50 KST

const samples = [
  { text: "나 이제 점심 먹으러 가~", plusMinutes: 0 },
  { text: "점심시간이라 밥 먹으러 간다", plusMinutes: 24 * 60 },
  { text: "점심 먹고 올게", plusMinutes: 2 * 24 * 60 },
  { text: "퇴근했다!", plusMinutes: 5 * 60 },
  { text: "오늘도 이제 퇴근~", plusMinutes: 24 * 60 + 5 * 60 },
  { text: "퇴근하고 운동 갈까 고민 중", plusMinutes: 24 * 60 + 6 * 60 },
];

const store = new Map<string, UserDailyPattern>();

function applyObservation(
  existing: UserDailyPattern | null,
  text: string,
  observedAt: Date,
  idx: number
): UserDailyPattern | null {
  const observations = inferDailyPatternObservations(text, observedAt);
  if (!observations.length) return existing;
  const target = observations[0];
  const merged = mergePatternObservation({
    existing,
    observation: target,
    observedAt: observedAt.toISOString(),
    messageId: `msg-${idx}`,
  });
  return {
    id: existing?.id ?? `${target.patternType}-1`,
    userId: "sample-user",
    patternType: merged.patternType,
    timeStartMinute: merged.timeStartMinute,
    timeEndMinute: merged.timeEndMinute,
    confidence: merged.confidence,
    evidenceCount: merged.evidenceCount,
    timezone: merged.timezone,
    lastObservedAt: merged.observedAt,
    lastUpdatedAt: merged.observedAt,
    updatedFromMessageId: merged.messageId,
  };
}

samples.forEach((sample, idx) => {
  const observedAt = new Date(baseDate.getTime() + sample.plusMinutes * 60_000);
  const observations = inferDailyPatternObservations(sample.text, observedAt);
  observations.forEach((ob) => {
    const existing = store.get(ob.patternType) ?? null;
    const updated = applyObservation(existing, sample.text, observedAt, idx);
    if (updated) store.set(ob.patternType, updated);
  });
});

const rows = [...store.values()].sort((a, b) => b.confidence - a.confidence);

console.log("=== Learned Daily Patterns ===");
rows.forEach((row) => {
  console.log(
    `${row.patternType}: ${row.timeStartMinute}-${row.timeEndMinute}, conf=${row.confidence}, evidence=${row.evidenceCount}`
  );
});

console.log("\n=== Prompt Block Preview ===");
console.log(buildDailyPatternPromptBlock(rows));
