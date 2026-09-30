import {
  inferDailyPatternObservations,
  mergePatternObservation,
} from "../services/dailyPatternInference";
import {
  buildDailyPatternPromptBlock,
  minuteFromDateInKst,
} from "../prompts/patternNudges";
import type { UserDailyPattern } from "../types";

// ── helpers ────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label: string, cond: boolean) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}`);
    failed++;
  }
}

function makePattern(
  patternType: UserDailyPattern["patternType"],
  start: number,
  end: number,
  confidence: number,
  evidenceCount = 3
): UserDailyPattern {
  return {
    id: `${patternType}-test`,
    userId: "u1",
    patternType,
    timeStartMinute: start,
    timeEndMinute: end,
    confidence,
    evidenceCount,
    timezone: "Asia/Seoul",
    lastObservedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    updatedFromMessageId: null,
  };
}

// ── Part 1: inferDailyPatternObservations ──────────────────────────────────

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

console.log("\n=== Prompt Block Preview (no nowKST) ===");
console.log(buildDailyPatternPromptBlock(rows));

// ── Part 2: minuteFromDateInKst ────────────────────────────────────────────

console.log("\n=== minuteFromDateInKst tests ===");

assert(
  "UTC 00:00 → KST 09:00 = 540",
  minuteFromDateInKst(new Date("2026-06-25T00:00:00.000Z")) === 540
);
assert(
  "UTC 15:00 → KST 00:00 = 0",
  minuteFromDateInKst(new Date("2026-06-25T15:00:00.000Z")) === 0
);
assert(
  "UTC 03:00 → KST 12:00 = 720",
  minuteFromDateInKst(new Date("2026-06-25T03:00:00.000Z")) === 720
);
assert(
  "UTC 14:00 → KST 23:00 = 1380",
  minuteFromDateInKst(new Date("2026-06-25T14:00:00.000Z")) === 1380
);

// ── Part 3: buildDailyPatternPromptBlock — confidence filter ───────────────

console.log("\n=== buildDailyPatternPromptBlock — confidence filter ===");

const highConf = makePattern("lunch", 720, 780, 75);
const lowConf = makePattern("exercise", 1140, 1230, 40); // below 60 threshold

const blockHighOnly = buildDailyPatternPromptBlock([highConf, lowConf]);
assert("block includes high-confidence pattern", blockHighOnly.includes("점심"));
assert("block excludes low-confidence pattern", !blockHighOnly.includes("운동"));
assert("block has header", blockHighOnly.includes("[생활 패턴 힌트"));

const blockAllLow = buildDailyPatternPromptBlock([lowConf]);
assert("empty for all-low-confidence", blockAllLow === "");

const blockEmpty = buildDailyPatternPromptBlock([]);
assert("empty for no patterns", blockEmpty === "");

// ── Part 4: buildDailyPatternPromptBlock — active window detection ─────────

console.log("\n=== buildDailyPatternPromptBlock — active window ===");

// lunch: 12:00 (720) ~ 13:00 (780)
const lunchPattern = makePattern("lunch", 720, 780, 70);
// exercise: 19:00 (1140) ~ 20:30 (1230)
const exercisePattern = makePattern("exercise", 1140, 1230, 65);
// sleep: 23:00 (1380) ~ 01:00 (60) — wraps around midnight
const sleepPattern = makePattern("sleep", 1380, 60, 70);

const lunchTime = 750; // 12:30 KST — inside lunch window
const lunchBlock = buildDailyPatternPromptBlock([lunchPattern, exercisePattern], lunchTime);
assert(
  "active lunch window shows indicator",
  lunchBlock.includes("(지금 이 시간대)") && lunchBlock.includes("점심")
);
assert(
  "inactive exercise window has no indicator",
  !lunchBlock.split("\n").find((l) => l.includes("운동") && l.includes("지금"))
);
assert("active hint appears in block", lunchBlock.includes("※ 현재 [점심]"));

const exerciseTime = 1200; // 20:00 KST — inside exercise window
const exerciseBlock = buildDailyPatternPromptBlock(
  [lunchPattern, exercisePattern],
  exerciseTime
);
assert("active exercise window shows indicator", exerciseBlock.includes("※ 현재 [운동]"));
assert("inactive lunch at 20:00 has no indicator", !exerciseBlock.includes("※ 현재 [점심"));

const beforeLunch = 700; // 11:40 KST — before lunch
const beforeBlock = buildDailyPatternPromptBlock([lunchPattern], beforeLunch);
assert("no active marker before lunch window", !beforeBlock.includes("(지금 이 시간대)"));
assert("no ※ hint when nothing active", !beforeBlock.includes("※ 현재"));

// sleep wrap-around
const midnightTime = 30; // 00:30 KST — inside sleep window (wraps past midnight)
const sleepBlock = buildDailyPatternPromptBlock([sleepPattern], midnightTime);
assert(
  "sleep wrap-around window active at 00:30",
  sleepBlock.includes("(지금 이 시간대)")
);
const earlyAfternoon = 900; // 15:00 KST — outside sleep window
const sleepInactive = buildDailyPatternPromptBlock([sleepPattern], earlyAfternoon);
assert("sleep pattern inactive at 15:00", !sleepInactive.includes("(지금 이 시간대)"));

// ── Part 5: max 4 patterns cap ─────────────────────────────────────────────

console.log("\n=== buildDailyPatternPromptBlock — max 4 patterns cap ===");

const manyPatterns = [
  makePattern("wake", 420, 510, 80),
  makePattern("work_start", 480, 570, 75),
  makePattern("lunch", 720, 780, 70),
  makePattern("work_end", 1080, 1170, 65),
  makePattern("exercise", 1140, 1230, 62), // 5th — should be excluded
];
const capBlock = buildDailyPatternPromptBlock(manyPatterns);
const capLines = capBlock.split("\n").filter((l) => l.startsWith("- "));
assert("at most 4 pattern rows", capLines.length <= 4);

// ── Part 6: no report/stats tone ─────────────────────────────────────────

console.log("\n=== buildDailyPatternPromptBlock — no report tone ===");

const reportCheck = buildDailyPatternPromptBlock([highConf]);
assert("no confidence % in output", !reportCheck.includes("%"));
assert("no evidence count in output", !reportCheck.includes("관측"));
assert("no 신뢰도 label in output", !reportCheck.includes("신뢰도"));

// ── Part 7: nowKST omitted → no active marker ────────────────────────────

console.log("\n=== buildDailyPatternPromptBlock — nowKST omitted ===");

const noTimeBlock = buildDailyPatternPromptBlock([lunchPattern]);
assert("no active marker when nowKST omitted", !noTimeBlock.includes("(지금 이 시간대)"));
assert("no ※ hint when nowKST omitted", !noTimeBlock.includes("※ 현재"));

// ── Summary ────────────────────────────────────────────────────────────────

console.log(`\n=== 결과: ${passed} passed / ${failed} failed ===`);
if (failed > 0) process.exit(1);
