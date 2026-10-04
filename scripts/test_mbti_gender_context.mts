/**
 * gender/MBTI/idealType 컨텍스트 파이프라인 테스트
 * Usage: npx tsx scripts/test_mbti_gender_context.mts
 */

import {
  extractUserContext,
  buildCommonContextBlock,
  validateMbti,
  MBTI_HINTS,
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
      if (actual !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
      }
    },
    toContain(expected: string) {
      if (typeof actual !== "string" || !actual.includes(expected)) {
        throw new Error(`Expected string to contain "${expected}", but got:\n${actual}`);
      }
    },
    notToContain(expected: string) {
      if (typeof actual === "string" && actual.includes(expected)) {
        throw new Error(`Expected string NOT to contain "${expected}", but it did.`);
      }
    },
    toBeUndefined() {
      if (actual !== undefined) {
        throw new Error(`Expected undefined, got ${JSON.stringify(actual)}`);
      }
    },
    toBeTrue() {
      if (actual !== true) {
        throw new Error(`Expected true, got ${JSON.stringify(actual)}`);
      }
    },
  };
}

// ────────────────────────────
// validateMbti
// ────────────────────────────

console.log(`\n${BOLD}=== validateMbti ===${RESET}`);

test("INFP → INFP", () => expect(validateMbti("INFP")).toBe("INFP"));
test("infp (소문자) → INFP", () => expect(validateMbti("infp")).toBe("INFP"));
test("  ENTJ  (공백 포함) → ENTJ", () => expect(validateMbti("  ENTJ  ")).toBe("ENTJ"));
test("XXXX (잘못된 유형) → undefined", () => expect(validateMbti("XXXX")).toBeUndefined());
test("빈 문자열 → undefined", () => expect(validateMbti("")).toBeUndefined());
test("undefined → undefined", () => expect(validateMbti(undefined)).toBeUndefined());

// 16개 전체 유효
const VALID_TYPES = [
  "INTJ","INTP","ENTJ","ENTP",
  "INFJ","INFP","ENFJ","ENFP",
  "ISTJ","ISFJ","ESTJ","ESFJ",
  "ISTP","ISFP","ESTP","ESFP",
];
test("MBTI_HINTS에 16개 유형 모두 포함", () => {
  const missing = VALID_TYPES.filter((t) => !(t in MBTI_HINTS));
  if (missing.length > 0) throw new Error(`Missing hints: ${missing.join(", ")}`);
});

// ────────────────────────────
// extractUserContext — gender
// ────────────────────────────

console.log(`\n${BOLD}=== extractUserContext — gender ===${RESET}`);

test("gender 'male' → '남성'", () => {
  const ctx = extractUserContext(null, { gender: "male" });
  expect(ctx.gender).toBe("남성");
});

test("gender 'female' → '여성'", () => {
  const ctx = extractUserContext(null, { gender: "female" });
  expect(ctx.gender).toBe("여성");
});

test("gender '남성' (이미 한글) → '남성'", () => {
  const ctx = extractUserContext(null, { gender: "남성" });
  expect(ctx.gender).toBe("남성");
});

test("gender 없으면 undefined", () => {
  const ctx = extractUserContext(null, {});
  expect(ctx.gender).toBeUndefined();
});

test("gender 공백만 있으면 undefined", () => {
  const ctx = extractUserContext(null, { gender: "   " });
  expect(ctx.gender).toBeUndefined();
});

// ────────────────────────────
// extractUserContext — mbti
// ────────────────────────────

console.log(`\n${BOLD}=== extractUserContext — mbti ===${RESET}`);

test("유효한 MBTI 'INFP' → 추출됨", () => {
  const ctx = extractUserContext(null, { mbti: "INFP" });
  expect(ctx.mbti).toBe("INFP");
});

test("소문자 'entj' → 'ENTJ'", () => {
  const ctx = extractUserContext(null, { mbti: "entj" });
  expect(ctx.mbti).toBe("ENTJ");
});

test("잘못된 MBTI → undefined", () => {
  const ctx = extractUserContext(null, { mbti: "XYZQ" });
  expect(ctx.mbti).toBeUndefined();
});

test("MBTI 없으면 undefined", () => {
  const ctx = extractUserContext(null, {});
  expect(ctx.mbti).toBeUndefined();
});

// ────────────────────────────
// extractUserContext — idealType
// ────────────────────────────

console.log(`\n${BOLD}=== extractUserContext — idealType ===${RESET}`);

test("이상형 문자열 → 추출됨", () => {
  const ctx = extractUserContext(null, { idealType: "다정하고 유머 있는 사람" });
  expect(ctx.idealType).toBe("다정하고 유머 있는 사람");
});

test("이상형 앞뒤 공백 → trim됨", () => {
  const ctx = extractUserContext(null, { idealType: "  따뜻한 사람  " });
  expect(ctx.idealType).toBe("따뜻한 사람");
});

test("빈 이상형 → undefined", () => {
  const ctx = extractUserContext(null, { idealType: "" });
  expect(ctx.idealType).toBeUndefined();
});

test("이상형 없으면 undefined", () => {
  const ctx = extractUserContext(null, {});
  expect(ctx.idealType).toBeUndefined();
});

// ────────────────────────────
// buildCommonContextBlock — gender/MBTI/idealType 출력
// ────────────────────────────

console.log(`\n${BOLD}=== buildCommonContextBlock — 출력 검증 ===${RESET}`);

test("MBTI ISFJ → 힌트 텍스트 포함", () => {
  const ctx = extractUserContext(null, { mbti: "ISFJ" });
  const block = buildCommonContextBlock(ctx);
  expect(block).toContain("MBTI: ISFJ");
  expect(block).toContain("세심하며");
});

test("gender '남성' → 블록에 포함", () => {
  const ctx = extractUserContext(null, { gender: "male" });
  const block = buildCommonContextBlock(ctx);
  expect(block).toContain("성별: 남성");
});

test("idealType → 블록에 포함", () => {
  const ctx = extractUserContext(null, { idealType: "유머 있는 사람" });
  const block = buildCommonContextBlock(ctx);
  expect(block).toContain("이상형·원하는 관계 스타일: 유머 있는 사람");
});

test("잘못된 MBTI → 블록에 MBTI 라인 없음", () => {
  const ctx = extractUserContext(null, { mbti: "XXXX" });
  const block = buildCommonContextBlock(ctx);
  expect(block).notToContain("MBTI:");
});

test("gender + mbti + idealType 모두 없으면 해당 라인 없음", () => {
  const ctx = extractUserContext(null, { nickname: "지훈" });
  const block = buildCommonContextBlock(ctx);
  expect(block).notToContain("성별:");
  expect(block).notToContain("MBTI:");
  expect(block).notToContain("이상형");
});

test("닉네임 + MBTI 동시 — 모두 포함", () => {
  const ctx = extractUserContext(null, { nickname: "지훈", mbti: "ENFP", gender: "male", idealType: "다정한 사람" });
  const block = buildCommonContextBlock(ctx);
  expect(block).toContain("지훈");
  expect(block).toContain("MBTI: ENFP");
  expect(block).toContain("성별: 남성");
  expect(block).toContain("이상형·원하는 관계 스타일: 다정한 사람");
});

test("MBTI 참고 주의 문구 포함", () => {
  const ctx = extractUserContext(null, { mbti: "INTJ" });
  const block = buildCommonContextBlock(ctx);
  expect(block).toContain("고정관념으로 대하지 말고");
});

// ────────────────────────────
// 기존 기능 회귀 테스트
// ────────────────────────────

console.log(`\n${BOLD}=== 기존 기능 회귀 ===${RESET}`);

test("관심사·취미 → 여전히 추출됨", () => {
  const ctx = extractUserContext(null, { interests: "게임, 음악", hobbies: "독서" });
  expect(ctx.userInterests.join(",")).toContain("게임");
  expect(ctx.userInterests.join(",")).toContain("독서");
});

test("닉네임 우선 순위 유지 — nickname > name > memory", () => {
  const ctx = extractUserContext(
    "[personal] 유저 이름: 기억이름",
    { nickname: "닉네임", name: "이름" }
  );
  expect(ctx.userName).toBe("닉네임");
});

test("birthDate → 나이 계산됨", () => {
  const birthYear = new Date().getFullYear() - 28;
  const ctx = extractUserContext(null, { birthDate: `${birthYear}-01-01` });
  expect(ctx.userAge).toBe("28");
});

// ────────────────────────────
// 결과
// ────────────────────────────

console.log(`\n${BOLD}결과: ${GREEN}${passed} passed${RESET}${BOLD}, ${failed > 0 ? RED : ""}${failed} failed${RESET}\n`);

if (failed > 0) process.exit(1);
