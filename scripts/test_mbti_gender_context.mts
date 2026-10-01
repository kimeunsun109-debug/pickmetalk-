/**
 * 성별·MBTI·이상형 컨텍스트 파이프라인 단위 테스트
 *
 * 실행: npx tsx scripts/test_mbti_gender_context.mts
 */

import {
  extractUserContext,
  buildCommonContextBlock,
  type ProfileUserContext,
} from "../services/context.js";

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${(e as Error).message}`);
    failed++;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertIncludes(str: string, sub: string) {
  if (!str.includes(sub))
    throw new Error(`Expected to include "${sub}" but got:\n${str}`);
}

function assertNotIncludes(str: string, sub: string) {
  if (str.includes(sub))
    throw new Error(`Expected NOT to include "${sub}" but got:\n${str}`);
}

// ─── extractUserContext — gender normalization ───────────────────────────────
console.log("\n[1] Gender normalization");

test("male → 남성", () => {
  const ctx = extractUserContext(null, { gender: "male" });
  assert(ctx.gender === "남성", `got "${ctx.gender}"`);
});

test("남 → 남성", () => {
  const ctx = extractUserContext(null, { gender: "남" });
  assert(ctx.gender === "남성", `got "${ctx.gender}"`);
});

test("남자 → 남성", () => {
  const ctx = extractUserContext(null, { gender: "남자" });
  assert(ctx.gender === "남성", `got "${ctx.gender}"`);
});

test("female → 여성", () => {
  const ctx = extractUserContext(null, { gender: "female" });
  assert(ctx.gender === "여성", `got "${ctx.gender}"`);
});

test("여 → 여성", () => {
  const ctx = extractUserContext(null, { gender: "여" });
  assert(ctx.gender === "여성", `got "${ctx.gender}"`);
});

test("여자 → 여성", () => {
  const ctx = extractUserContext(null, { gender: "여자" });
  assert(ctx.gender === "여성", `got "${ctx.gender}"`);
});

test("unknown gender → undefined", () => {
  const ctx = extractUserContext(null, { gender: "other" });
  assert(ctx.gender === undefined, `got "${ctx.gender}"`);
});

test("empty gender → undefined", () => {
  const ctx = extractUserContext(null, { gender: "" });
  assert(ctx.gender === undefined, `got "${ctx.gender}"`);
});

// ─── extractUserContext — MBTI normalization ─────────────────────────────────
console.log("\n[2] MBTI normalization");

const VALID_TYPES = [
  "INTJ","INTP","ENTJ","ENTP",
  "INFJ","INFP","ENFJ","ENFP",
  "ISTJ","ISFJ","ESTJ","ESFJ",
  "ISTP","ISFP","ESTP","ESFP",
];

for (const t of VALID_TYPES) {
  test(`${t} 유형 → 정상 추출`, () => {
    const ctx = extractUserContext(null, { mbti: t.toLowerCase() });
    assert(ctx.mbti === t, `got "${ctx.mbti}"`);
  });
}

test("invalid MBTI (XXXX) → undefined", () => {
  const ctx = extractUserContext(null, { mbti: "XXXX" });
  assert(ctx.mbti === undefined, `got "${ctx.mbti}"`);
});

test("empty MBTI → undefined", () => {
  const ctx = extractUserContext(null, { mbti: "" });
  assert(ctx.mbti === undefined, `got "${ctx.mbti}"`);
});

// ─── extractUserContext — idealType ──────────────────────────────────────────
console.log("\n[3] idealType extraction");

test("idealType 정상 추출", () => {
  const ctx = extractUserContext(null, { idealType: "따뜻하고 유머있는 사람" });
  assert(ctx.idealType === "따뜻하고 유머있는 사람", `got "${ctx.idealType}"`);
});

test("공백만 있는 idealType → undefined", () => {
  const ctx = extractUserContext(null, { idealType: "   " });
  assert(ctx.idealType === undefined, `got "${ctx.idealType}"`);
});

test("undefined idealType → undefined", () => {
  const ctx = extractUserContext(null, {});
  assert(ctx.idealType === undefined, `got "${ctx.idealType}"`);
});

// ─── buildCommonContextBlock — gender/MBTI/idealType in prompt ───────────────
console.log("\n[4] buildCommonContextBlock output");

test("성별 라인 포함", () => {
  const ctx = extractUserContext(null, { gender: "male", nickname: "민준" });
  const block = buildCommonContextBlock(ctx);
  assertIncludes(block, "- 성별: 남성");
});

test("MBTI 라인 포함 (유형 + 힌트)", () => {
  const ctx = extractUserContext(null, { mbti: "INFJ", nickname: "민준" });
  const block = buildCommonContextBlock(ctx);
  assertIncludes(block, "- MBTI: INFJ");
  assertIncludes(block, "깊은 공감");
});

test("이상형 라인 포함 (직접 언급 금지 주석)", () => {
  const ctx = extractUserContext(null, {
    idealType: "다정하고 배려있는",
    nickname: "민준",
  });
  const block = buildCommonContextBlock(ctx);
  assertIncludes(block, "이상형 키워드: 다정하고 배려있는");
  assertIncludes(block, "직접 언급 금지");
});

test("gender/MBTI/idealType 없으면 해당 라인 미포함", () => {
  const ctx = extractUserContext(null, { nickname: "민준" });
  const block = buildCommonContextBlock(ctx);
  assertNotIncludes(block, "성별");
  assertNotIncludes(block, "MBTI");
  assertNotIncludes(block, "이상형");
});

test("모든 필드 함께 사용", () => {
  const profile: ProfileUserContext = {
    nickname: "지훈",
    gender: "male",
    mbti: "ENTP",
    idealType: "활발하고 솔직한 사람",
    age: "28",
    job: "개발자",
  };
  const ctx = extractUserContext(null, profile);
  const block = buildCommonContextBlock(ctx);
  assertIncludes(block, "지훈");
  assertIncludes(block, "남성");
  assertIncludes(block, "ENTP");
  assertIncludes(block, "도전·토론 즐김");
  assertIncludes(block, "활발하고 솔직한 사람");
  assertIncludes(block, "28세");
  assertIncludes(block, "개발자");
});

test("context 블록이 [유저 컨텍스트] 헤더로 시작", () => {
  const ctx = extractUserContext(null, { nickname: "민준", gender: "male" });
  const block = buildCommonContextBlock(ctx);
  assert(
    block.startsWith("[유저 컨텍스트"),
    `Block does not start with header: ${block.slice(0, 50)}`
  );
});

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`총 ${passed + failed}개 테스트: ✓ ${passed} 통과 / ✗ ${failed} 실패`);
if (failed > 0) {
  process.exit(1);
}
