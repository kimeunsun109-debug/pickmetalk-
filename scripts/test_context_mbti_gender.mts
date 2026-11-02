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

// ─── normalizeGender ───────────────────────────────────────────────────────────
console.log("\n[normalizeGender]");
assert("undefined → undefined", normalizeGender(undefined), undefined);
assert("empty → undefined", normalizeGender(""), undefined);
assert("male → 남성", normalizeGender("male"), "남성");
assert("Male → 남성 (case insensitive)", normalizeGender("Male"), "남성");
assert("MALE → 남성", normalizeGender("MALE"), "남성");
assert("female → 여성", normalizeGender("female"), "여성");
assert("Female → 여성", normalizeGender("Female"), "여성");
assert("남자 → 남성", normalizeGender("남자"), "남성");
assert("여자 → 여성", normalizeGender("여자"), "여성");
assert("남성 → 남성", normalizeGender("남성"), "남성");
assert("여성 → 여성", normalizeGender("여성"), "여성");
assert("unknown → undefined", normalizeGender("other"), undefined);

// ─── validateMbti ──────────────────────────────────────────────────────────────
console.log("\n[validateMbti]");
assert("undefined → undefined", validateMbti(undefined), undefined);
assert("empty → undefined", validateMbti(""), undefined);
assert("INTJ → INTJ", validateMbti("INTJ"), "INTJ");
assert("intj (lowercase) → INTJ", validateMbti("intj"), "INTJ");
assert("Infp → INFP", validateMbti("Infp"), "INFP");
assert("ESFP → ESFP", validateMbti("ESFP"), "ESFP");
assert("ENTP → ENTP", validateMbti("ENTP"), "ENTP");
assert("invalid 3 chars → undefined", validateMbti("INT"), undefined);
assert("invalid 5 chars → undefined", validateMbti("INTJX"), undefined);
assert("invalid letters → undefined", validateMbti("XXXX"), undefined);
assert("ABCD → undefined", validateMbti("ABCD"), undefined);

// ─── MBTI_HINTS coverage ────────────────────────────────────────────────────────
console.log("\n[MBTI_HINTS]");
const expectedTypes = [
  "INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP",
  "ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP",
];
assert("MBTI_HINTS has 16 types", Object.keys(MBTI_HINTS).length, 16);
for (const t of expectedTypes) {
  assert(`MBTI_HINTS has ${t}`, typeof MBTI_HINTS[t], "string");
}

// ─── extractUserContext: gender/mbti/idealType ──────────────────────────────────
console.log("\n[extractUserContext — gender/mbti/idealType]");

const ctxFull = extractUserContext(null, {
  gender: "female",
  mbti: "infp",
  idealType: "따뜻하고 유머 있는 사람",
});
assert("gender female → 여성", ctxFull.gender, "여성");
assert("mbti infp → INFP", ctxFull.mbti, "INFP");
assert("idealType preserved", ctxFull.idealType, "따뜻하고 유머 있는 사람");

const ctxMale = extractUserContext(null, { gender: "male", mbti: "INTJ" });
assert("gender male → 남성", ctxMale.gender, "남성");
assert("mbti INTJ → INTJ", ctxMale.mbti, "INTJ");
assert("idealType absent → undefined", ctxMale.idealType, undefined);

const ctxEmpty = extractUserContext(null, {});
assert("no gender → undefined", ctxEmpty.gender, undefined);
assert("no mbti → undefined", ctxEmpty.mbti, undefined);
assert("no idealType → undefined", ctxEmpty.idealType, undefined);

const ctxInvalid = extractUserContext(null, { gender: "other", mbti: "XXXX" });
assert("invalid gender → undefined", ctxInvalid.gender, undefined);
assert("invalid mbti → undefined", ctxInvalid.mbti, undefined);

const ctxWhitespace = extractUserContext(null, { idealType: "   " });
assert("whitespace idealType → undefined", ctxWhitespace.idealType, undefined);

// ─── buildCommonContextBlock: gender/mbti/idealType output ─────────────────────
console.log("\n[buildCommonContextBlock — gender/mbti/idealType]");

const blockFull = buildCommonContextBlock({
  userInterests: [],
  gender: "여성",
  mbti: "INFP",
  idealType: "따뜻한 타입",
});
assertContains("block contains gender", blockFull, "- 성별: 여성");
assertContains("block contains MBTI type", blockFull, "- MBTI: INFP");
assertContains("block contains MBTI hint", blockFull, "감수성 풍부");
assertContains("block contains idealType", blockFull, "- 이상형: 따뜻한 타입");
assertContains("block contains idealType note", blockFull, "직접 언급 금지");

const blockMale = buildCommonContextBlock({
  userInterests: [],
  gender: "남성",
  mbti: "INTJ",
});
assertContains("block male gender", blockMale, "- 성별: 남성");
assertContains("block INTJ hint", blockMale, "논리적이고 독립적");
assertNotContains("block no idealType line", blockMale, "이상형");

const blockNoGender = buildCommonContextBlock({ userInterests: [] });
assertNotContains("no gender field", blockNoGender, "- 성별:");
assertNotContains("no mbti field", blockNoGender, "- MBTI:");
assertNotContains("no idealType field", blockNoGender, "- 이상형:");

const blockAllMbtiTypes = Object.keys(MBTI_HINTS);
for (const mbtiType of blockAllMbtiTypes) {
  const b = buildCommonContextBlock({ userInterests: [], mbti: mbtiType });
  assertContains(`MBTI block for ${mbtiType} has hint`, b, `- MBTI: ${mbtiType}`);
}

// ─── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
if (failed > 0) {
  console.error(`\n❌ ${failed} test(s) failed.`);
  process.exit(1);
} else {
  console.log(`\n✅ All ${passed} tests passed.`);
}
