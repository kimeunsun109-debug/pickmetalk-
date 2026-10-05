/**
 * Unit test for buildDailyPatternPromptBlock improvements:
 * - evidenceCount >= 2 filter
 * - time-aware "← 지금 이 시간대" marker
 */

import { buildDailyPatternPromptBlock } from "../prompts/patternNudges";
import type { UserDailyPattern } from "../types";

function makePattern(
  type: UserDailyPattern["patternType"],
  start: number,
  end: number,
  confidence: number,
  evidenceCount: number
): UserDailyPattern {
  return {
    id: `${type}-test`,
    userId: "test-user",
    patternType: type,
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

let passed = 0;
let failed = 0;

function assert(desc: string, condition: boolean) {
  if (condition) {
    console.log(`  ✅ ${desc}`);
    passed++;
  } else {
    console.error(`  ❌ ${desc}`);
    failed++;
  }
}

// Test 1: Empty when all patterns have evidenceCount < 2
console.log("\n[Test 1] Evidence count filter");
const lowEvidence = [
  makePattern("lunch", 720, 780, 60, 1),
  makePattern("sleep", 1380, 60, 70, 1),
];
const result1 = buildDailyPatternPromptBlock(lowEvidence);
assert("Returns empty string when all evidenceCount < 2", result1 === "");

// Test 2: Only patterns with evidenceCount >= 2 are shown
console.log("\n[Test 2] Mixed evidence counts");
const mixedEvidence = [
  makePattern("lunch", 720, 780, 60, 3),
  makePattern("work_end", 1080, 1140, 55, 1), // excluded
  makePattern("wake", 420, 480, 70, 2),
];
const result2 = buildDailyPatternPromptBlock(mixedEvidence);
assert("Output contains lunch pattern", result2.includes("점심 추정"));
assert("Output contains wake pattern", result2.includes("기상 추정"));
assert("Excluded work_end pattern (evidenceCount=1)", !result2.includes("퇴근 추정"));
assert("Contains pattern block header", result2.includes("[생활 패턴 힌트"));

// Test 3: Max 4 patterns shown (sorted by caller — we pass already-sorted array)
console.log("\n[Test 3] Max 4 patterns");
const manyPatterns = [
  makePattern("wake", 420, 480, 80, 5),
  makePattern("work_start", 480, 540, 75, 4),
  makePattern("lunch", 720, 780, 70, 3),
  makePattern("work_end", 1080, 1140, 65, 3),
  makePattern("exercise", 1140, 1200, 60, 2),
];
const result3 = buildDailyPatternPromptBlock(manyPatterns);
const patternLines3 = result3.split("\n").filter(l => l.startsWith("- ") && l.includes("추정"));
assert("Shows max 4 patterns", patternLines3.length === 4);
assert("First pattern is wake", patternLines3[0].includes("기상"));

// Test 4: Time-awareness — inject a pattern that overlaps "now" + 30 min window
// We can't control "now" in tests, so we test the "approaching" logic directly by
// verifying the marker text appears somewhere when we give a very wide window
console.log("\n[Test 4] Time awareness");
// Create a pattern window that covers the entire day (00:00–23:59) — should always match
const alwaysActive = [makePattern("lunch", 0, 1439, 80, 3)];
const result4 = buildDailyPatternPromptBlock(alwaysActive);
assert("Wide window pattern gets '← 지금 이 시간대' marker", result4.includes("← 지금 이 시간대"));

// Pattern outside any current hour should NOT have the marker
// (We can't guarantee current time but narrow window makes it very unlikely to match)
// We test a window 1 minute wide in the middle of the night (03:01–03:02 KST) → UTC 18:01–18:02
// which is very unlikely to overlap our +1h window
const narrowNightWindow = [makePattern("sleep", 181, 182, 80, 3)];
const result5 = buildDailyPatternPromptBlock(narrowNightWindow);
// This might or might not have the marker depending on run time, so we just verify structure
assert("Narrow window pattern still renders", result5.includes("취침"));

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
