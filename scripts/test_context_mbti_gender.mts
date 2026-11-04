/**
 * gender / MBTI / idealType → AI 컨텍스트 블록 단위 테스트
 * Usage: npx tsx scripts/test_context_mbti_gender.mts
 */

import {
  normalizeGender,
  validateMbti,
  MBTI_HINTS,
  extractUserContext,
  buildCommonContextBlock,
} from "../services/context.js";

const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";

let passed = 0;
let failed = 0;

function test(description: string, fn: () => void) {
  try {
    fn();
    console.log(`${GREEN}✓${RESET} ${description}`);
    passed++;
  } catch (e) {
    console.log(`${RED}✗${RESET} ${description}`);
    console.log(`  ${RED}${(e as Error).message}${RESET}`);
    failed++;
  }
}

function expect(actual: unknown) {
  return {
    toBe(expected: unknown) {
      if (actual !== expected)
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    },
    toContain(expected: string) {
      if (typeof actual !== "string" || !actual.includes(expected))
        throw new Error(`Expected string to contain "${expected}", got: ${JSON.stringify(actual)}`);
    },
    notToContain(expected: string) {
      if (typeof actual === "string" && actual.includes(expected))
        throw new Error(`Expected string NOT to contain "${expected}"`);
    },
    toBeUndefined() {
      if (actual !== undefined)
        throw new Error(`Expected undefined, got ${JSON.stringify(actual)}`);
    },
    notToBeUndefined() {
      if (actual === undefined)
        throw new Error(`Expected non-undefined value`);
    },
  };
}

console.log(`\n${BOLD}=== normalizeGender() Tests ===${RESET}\n`);

test("'남' → '남성'", () => expect(normalizeGender("남")).toBe("남성"));
test("'남자' → '남성'", () => expect(normalizeGender("남자")).toBe("남성"));
test("'남성' → '남성'", () => expect(normalizeGender("남성")).toBe("남성"));
test("'male' → '남성'", () => expect(normalizeGender("male")).toBe("남성"));
test("'Male' → '남성' (대소문자 무관)", () => expect(normalizeGender("Male")).toBe("남성"));
test("'m' → '남성'", () => expect(normalizeGender("m")).toBe("남성"));
test("'여' → '여성'", () => expect(normalizeGender("여")).toBe("여성"));
test("'여자' → '여성'", () => expect(normalizeGender("여자")).toBe("여성"));
test("'여성' → '여성'", () => expect(normalizeGender("여성")).toBe("여성"));
test("'female' → '여성'", () => expect(normalizeGender("female")).toBe("여성"));
test("'f' → '여성'", () => expect(normalizeGender("f")).toBe("여성"));
test("'기타' → undefined", () => expect(normalizeGender("기타")).toBeUndefined());
test("undefined → undefined", () => expect(normalizeGender(undefined)).toBeUndefined());
test("'' → undefined", () => expect(normalizeGender("")).toBeUndefined());

console.log(`\n${BOLD}=== validateMbti() Tests ===${RESET}\n`);

test("'INFP' → 'INFP'", () => expect(validateMbti("INFP")).toBe("INFP"));
test("'infp' → 'INFP' (소문자 허용)", () => expect(validateMbti("infp")).toBe("INFP"));
test("'Infp' → 'INFP' (혼합 허용)", () => expect(validateMbti("Infp")).toBe("INFP"));
test("'ENTJ' → 'ENTJ'", () => expect(validateMbti("ENTJ")).toBe("ENTJ"));
test("'ISTP' → 'ISTP'", () => expect(validateMbti("ISTP")).toBe("ISTP"));
test("'ESFJ' → 'ESFJ'", () => expect(validateMbti("ESFJ")).toBe("ESFJ"));
test("'XXXX' → undefined (유효하지 않음)", () => expect(validateMbti("XXXX")).toBeUndefined());
test("'INF' → undefined (3자리)", () => expect(validateMbti("INF")).toBeUndefined());
test("'INFPP' → undefined (5자리)", () => expect(validateMbti("INFPP")).toBeUndefined());
test("'' → undefined", () => expect(validateMbti("")).toBeUndefined());
test("undefined → undefined", () => expect(validateMbti(undefined)).toBeUndefined());

console.log(`\n${BOLD}=== MBTI_HINTS 커버리지 Tests ===${RESET}\n`);

const ALL_MBTI = ["INTJ","INTP","ENTJ","ENTP","INFJ","INFP","ENFJ","ENFP",
                  "ISTJ","ISFJ","ESTJ","ESFJ","ISTP","ISFP","ESTP","ESFP"];

test("16개 유형 모두 힌트 존재", () => {
  const missing = ALL_MBTI.filter((t) => !MBTI_HINTS[t]);
  if (missing.length > 0)
    throw new Error(`힌트 없는 유형: ${missing.join(", ")}`);
});

test("각 힌트가 10자 이상", () => {
  const short = ALL_MBTI.filter((t) => MBTI_HINTS[t].length < 10);
  if (short.length > 0)
    throw new Error(`너무 짧은 힌트: ${short.join(", ")}`);
});

console.log(`\n${BOLD}=== extractUserContext() — gender/MBTI/idealType 추출 Tests ===${RESET}\n`);

test("profileCtx.gender '남자' → ctx.gender '남성'", () => {
  const ctx = extractUserContext(null, { gender: "남자" });
  expect(ctx.gender).toBe("남성");
});

test("profileCtx.gender '여성' → ctx.gender '여성'", () => {
  const ctx = extractUserContext(null, { gender: "여성" });
  expect(ctx.gender).toBe("여성");
});

test("profileCtx.gender 없음 → ctx.gender undefined", () => {
  const ctx = extractUserContext(null, {});
  expect(ctx.gender).toBeUndefined();
});

test("profileCtx.mbti 'INFP' → ctx.mbti 'INFP'", () => {
  const ctx = extractUserContext(null, { mbti: "INFP" });
  expect(ctx.mbti).toBe("INFP");
});

test("profileCtx.mbti 'infp' → ctx.mbti 'INFP' (대문자 정규화)", () => {
  const ctx = extractUserContext(null, { mbti: "infp" });
  expect(ctx.mbti).toBe("INFP");
});

test("profileCtx.mbti 유효하지 않음 → ctx.mbti undefined", () => {
  const ctx = extractUserContext(null, { mbti: "XXXX" });
  expect(ctx.mbti).toBeUndefined();
});

test("profileCtx.idealType → ctx.idealType 그대로 전달", () => {
  const ctx = extractUserContext(null, { idealType: "유머러스하고 따뜻한 사람" });
  expect(ctx.idealType).toBe("유머러스하고 따뜻한 사람");
});

test("profileCtx.idealType 공백만 → ctx.idealType undefined", () => {
  const ctx = extractUserContext(null, { idealType: "   " });
  expect(ctx.idealType).toBeUndefined();
});

test("모든 필드 함께 추출", () => {
  const ctx = extractUserContext(null, {
    nickname: "민준",
    gender: "male",
    mbti: "ENFP",
    idealType: "재미있는 사람",
  });
  expect(ctx.userName).toBe("민준");
  expect(ctx.gender).toBe("남성");
  expect(ctx.mbti).toBe("ENFP");
  expect(ctx.idealType).toBe("재미있는 사람");
});

console.log(`\n${BOLD}=== buildCommonContextBlock() — 프롬프트 출력 Tests ===${RESET}\n`);

test("gender '남성' → 블록에 '성별: 남성' 포함", () => {
  const ctx = extractUserContext(null, { gender: "남성" });
  const block = buildCommonContextBlock(ctx);
  expect(block).toContain("성별: 남성");
});

test("gender '여성' → 블록에 '성별: 여성' 포함", () => {
  const ctx = extractUserContext(null, { gender: "여성" });
  const block = buildCommonContextBlock(ctx);
  expect(block).toContain("성별: 여성");
});

test("gender 없음 → 블록에 '성별' 없음", () => {
  const ctx = extractUserContext(null, {});
  const block = buildCommonContextBlock(ctx);
  expect(block).notToContain("성별");
});

test("MBTI 'INFP' → 블록에 'MBTI: INFP' + 힌트 포함", () => {
  const ctx = extractUserContext(null, { mbti: "INFP" });
  const block = buildCommonContextBlock(ctx);
  expect(block).toContain("MBTI: INFP");
  expect(block).toContain("이상주의적");
});

test("MBTI 'ENTJ' → 블록에 'MBTI: ENTJ' + 힌트 포함", () => {
  const ctx = extractUserContext(null, { mbti: "ENTJ" });
  const block = buildCommonContextBlock(ctx);
  expect(block).toContain("MBTI: ENTJ");
  expect(block).toContain("결단력");
});

test("idealType → 블록에 이상형 텍스트 포함", () => {
  const ctx = extractUserContext(null, { idealType: "유머러스하고 따뜻한 사람" });
  const block = buildCommonContextBlock(ctx);
  expect(block).toContain("이상형: 유머러스하고 따뜻한 사람");
  expect(block).toContain("직접 언급 금지");
});

test("idealType 없음 → '이상형' 블록 없음", () => {
  const ctx = extractUserContext(null, {});
  const block = buildCommonContextBlock(ctx);
  expect(block).notToContain("이상형");
});

test("전체 필드 조합 블록 출력", () => {
  const ctx = extractUserContext(null, {
    nickname: "준혁",
    gender: "남자",
    mbti: "ISTP",
    idealType: "조용하고 지적인 사람",
  });
  const block = buildCommonContextBlock(ctx);
  expect(block).toContain("준혁");
  expect(block).toContain("성별: 남성");
  expect(block).toContain("MBTI: ISTP");
  expect(block).toContain("실용적");
  expect(block).toContain("이상형: 조용하고 지적인 사람");
});

test("유저 컨텍스트 블록 헤더 포함", () => {
  const ctx = extractUserContext(null, { gender: "여성" });
  const block = buildCommonContextBlock(ctx);
  expect(block).toContain("[유저 컨텍스트");
});

// ─── 기존 personal memory 테스트와의 호환성 ──────────────────

test("기존 personalFacts 필드가 여전히 작동함", () => {
  const summary = "- [personal] 반려동물: 망고 (강아지)";
  const ctx = extractUserContext(summary, { gender: "남성", mbti: "INFJ" });
  expect(ctx.personalFacts).notToBeUndefined();
  const block = buildCommonContextBlock(ctx);
  expect(block).toContain("망고");
  expect(block).toContain("성별: 남성");
  expect(block).toContain("MBTI: INFJ");
});

// ─── Summary ──────────────────────────────────────────────────

console.log(`\n${BOLD}Results: ${passed} passed, ${failed} failed${RESET}\n`);
if (failed > 0) process.exit(1);
