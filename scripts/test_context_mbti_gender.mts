/**
 * Unit tests for services/context.ts
 * — normalizeGender, validateMbti, MBTI_HINTS,
 *   extractUserContext (gender/mbti/idealType fields),
 *   buildCommonContextBlock (gender/mbti/idealType output)
 */

import {
  normalizeGender,
  validateMbti,
  extractUserContext,
  buildCommonContextBlock,
  MBTI_HINTS,
} from "../services/context.js";

let passed = 0;
let failed = 0;

function assert(label: string, actual: unknown, expected: unknown) {
  if (actual === expected) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}`);
    console.error(`     expected: ${JSON.stringify(expected)}`);
    console.error(`     actual  : ${JSON.stringify(actual)}`);
    failed++;
  }
}

function assertContains(label: string, haystack: string, needle: string) {
  if (haystack.includes(needle)) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}`);
    console.error(`     expected to contain: ${JSON.stringify(needle)}`);
    console.error(`     got: ${haystack.slice(0, 300)}`);
    failed++;
  }
}

function assertNotContains(label: string, haystack: string, needle: string) {
  if (!haystack.includes(needle)) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}`);
    console.error(`     expected NOT to contain: ${JSON.stringify(needle)}`);
    console.error(`     got: ${haystack.slice(0, 300)}`);
    failed++;
  }
}

console.log("\n[normalizeGender]");
assert("undefined → undefined", normalizeGender(undefined), undefined);
assert("male → 남성", normalizeGender("male"), "남성");
assert("female → 여성", normalizeGender("female"), "여성");
assert("남자 → 남성", normalizeGender("남자"), "남성");
assert("invalid → undefined", normalizeGender("other"), undefined);

console.log("\n[validateMbti]");
assert("intj → INTJ", validateMbti("intj"), "INTJ");
assert("invalid → undefined", validateMbti("XXXX"), undefined);

console.log("\n[MBTI_HINTS]");
assert("16 types", Object.keys(MBTI_HINTS).length, 16);

console.log("\n[extractUserContext]");
const ctxFull = extractUserContext(null, {
  gender: "female",
  mbti: "infp",
  idealType: "따뜻하고 유머 있는 사람",
});
assert("gender", ctxFull.gender, "여성");
assert("mbti", ctxFull.mbti, "INFP");
assert("idealType", ctxFull.idealType, "따뜻하고 유머 있는 사람");

console.log("\n[buildCommonContextBlock]");
const block = buildCommonContextBlock({
  userInterests: [],
  gender: "여성",
  mbti: "INFP",
  idealType: "따뜻한 타입",
});
assertContains("gender line", block, "- 성별: 여성");
assertContains("mbti hint", block, "감수성 풍부");
assertContains("idealType", block, "직접 언급 금지");

console.log(`\n${"─".repeat(50)}`);
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
if (failed > 0) process.exit(1);
