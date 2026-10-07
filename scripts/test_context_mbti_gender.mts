/**
 * Unit tests for services/context.ts
 * — normalizeGender, validateMbti, extractUserContext (gender/mbti/idealType fields),
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
    console.error(`     got: ${haystack.slice(0, 200)}`);
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
assert("gender extracted and normalized", ctxFull.gender, "여성");
assert("mbti extracted and validated", ctxFull.mbti, "INFP");
assert("idealType extracted", ctxFull.idealType, "따뜻하고 유머 있는 사람");

const ctxMale = extractUserContext(null, { gender: "male", mbti: "INTJ" });
assert("male gender", ctxMale.gender, "남성");
assert("INTJ valid", ctxMale.mbti, "INTJ");

const ctxInvalid = extractUserContext(null, {
  gender: "robot",
  mbti: "XXXX",
  idealType: "  ",
});
assert("invalid gender → undefined", ctxInvalid.gender, undefined);
assert("invalid mbti → undefined", ctxInvalid.mbti, undefined);
assert("whitespace-only idealType → undefined", ctxInvalid.idealType, undefined);

const ctxEmpty = extractUserContext(null, {});
assert("empty profileCtx: gender=undefined", ctxEmpty.gender, undefined);
assert("empty profileCtx: mbti=undefined", ctxEmpty.mbti, undefined);
assert("empty profileCtx: idealType=undefined", ctxEmpty.idealType, undefined);

// ─── buildCommonContextBlock: gender/mbti/idealType output ─────────────────────
console.log("\n[buildCommonContextBlock — gender/mbti/idealType output]");

const block1 = buildCommonContextBlock({
  userInterests: [],
  gender: "여성",
  mbti: "INFP",
  idealType: "따뜻하고 유머 있는 사람",
});
assertContains("block contains 성별", block1, "성별: 여성");
assertContains("block contains MBTI", block1, "MBTI: INFP");
assertContains("block contains MBTI hint", block1, MBTI_HINTS["INFP"].slice(0, 10));
assertContains("block contains 이상형", block1, "이상형: 따뜻하고 유머 있는 사람");
assertContains("block has 직접 언급 금지", block1, "직접 언급 금지");

const block2 = buildCommonContextBlock({ userInterests: [] });
assertNotContains("no gender if undefined", block2, "성별");
assertNotContains("no MBTI if undefined", block2, "MBTI");
assertNotContains("no 이상형 if undefined", block2, "이상형");

const block3 = buildCommonContextBlock({ userInterests: [], gender: "남성" });
assertContains("남성 present", block3, "성별: 남성");
assertNotContains("no MBTI when absent", block3, "MBTI");

console.log(`\n결과: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
