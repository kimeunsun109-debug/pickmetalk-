/**
 * Personal memory category 추출 테스트
 * Usage: npx tsx scripts/test_personal_memory.mts
 */

import {
  extractKeyMemories,
  updateMemorySummary,
  parseStoredSummary,
  getContextMemoryPrompt,
} from "../services/memory.js";
import { extractUserContext, buildCommonContextBlock } from "../services/context.js";

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
        throw new Error(`Expected "${actual}" to contain "${expected}"`);
      }
    },
    toBeNull() {
      if (actual !== null) {
        throw new Error(`Expected null, got ${JSON.stringify(actual)}`);
      }
    },
    notToBeNull() {
      if (actual === null || actual === undefined) {
        throw new Error(`Expected non-null value, got ${actual}`);
      }
    },
    toHaveLength(n: number) {
      const arr = actual as unknown[];
      if (!Array.isArray(arr) || arr.length !== n) {
        throw new Error(
          `Expected length ${n}, got ${Array.isArray(arr) ? arr.length : "not an array"}: ${JSON.stringify(arr)}`
        );
      }
    },
  };
}

console.log(`\n${BOLD}=== Personal Memory Category Tests ===${RESET}\n`);

// ─── Pet extraction ──────────────────────────────────────────

test("강아지 이름 추출 (X라는 강아지)", () => {
  const entities = extractKeyMemories("망고라는 강아지가 있어");
  expect(entities.length).toBe(1);
  expect(entities[0].category).toBe("personal");
  expect(entities[0].fact).toContain("망고");
  expect(entities[0].fact).toContain("강아지");
});

test("강아지 이름 추출 (강아지 이름이 X야)", () => {
  const entities = extractKeyMemories("강아지 이름이 보리야");
  expect(entities.length).toBe(1);
  expect(entities[0].category).toBe("personal");
  expect(entities[0].fact).toContain("보리");
  expect(entities[0].fact).toContain("강아지");
});

test("고양이 이름 추출 (X이라는 고양이)", () => {
  const entities = extractKeyMemories("나비이라는 고양이 키워");
  expect(entities.length).toBe(1);
  expect(entities[0].category).toBe("personal");
  expect(entities[0].fact).toContain("고양이");
});

test("고양이 이름 추출 (고양이 이름이 X야)", () => {
  const entities = extractKeyMemories("고양이 이름이 루나야");
  expect(entities.length).toBe(1);
  expect(entities[0].category).toBe("personal");
  expect(entities[0].fact).toContain("루나");
  expect(entities[0].fact).toContain("고양이");
});

// ─── User name extraction ────────────────────────────────────

test("유저 이름 추출 (내 이름은 X야)", () => {
  const entities = extractKeyMemories("내 이름은 민준이야");
  expect(entities.length).toBe(1);
  expect(entities[0].category).toBe("personal");
  expect(entities[0].fact).toContain("민준");
});

test("유저 이름 추출 (내 이름이 X야)", () => {
  const entities = extractKeyMemories("내 이름이 지호야");
  expect(entities.length).toBe(1);
  expect(entities[0].category).toBe("personal");
  expect(entities[0].fact).toContain("지호");
});

test("유저 이름 추출 (X라고 불러)", () => {
  const entities = extractKeyMemories("나 준혁이라고 불러");
  expect(entities.length).toBe(1);
  expect(entities[0].category).toBe("personal");
  expect(entities[0].fact).toContain("준혁");
});

test("유저 이름 추출 (X라고 해)", () => {
  const entities = extractKeyMemories("그냥 민수라고 해");
  expect(entities.length).toBe(1);
  expect(entities[0].category).toBe("personal");
  expect(entities[0].fact).toContain("민수");
});

// ─── Family name extraction ──────────────────────────────────

test("형 이름 추출", () => {
  const entities = extractKeyMemories("형 이름이 민수야");
  expect(entities.length).toBe(1);
  expect(entities[0].category).toBe("personal");
  expect(entities[0].fact).toContain("형");
  expect(entities[0].fact).toContain("민수");
});

test("엄마 이름 추출", () => {
  const entities = extractKeyMemories("엄마 이름이 박순자야");
  expect(entities.length).toBe(1);
  expect(entities[0].category).toBe("personal");
  expect(entities[0].fact).toContain("엄마");
  expect(entities[0].fact).toContain("박순자");
});

test("동생 이름 추출", () => {
  const entities = extractKeyMemories("동생 이름이 지은이야");
  expect(entities.length).toBe(1);
  expect(entities[0].category).toBe("personal");
  expect(entities[0].fact).toContain("동생");
});

// ─── Negative tests (should NOT extract personal) ────────────

test("직업 추출 안 함 (나는 학생이야)", () => {
  const entities = extractKeyMemories("나는 학생이야");
  const personal = entities.filter((e) => e.category === "personal");
  expect(personal.length).toBe(0);
});

test("직업 추출 안 함 (나는 의사야)", () => {
  const entities = extractKeyMemories("나는 의사야");
  const personal = entities.filter((e) => e.category === "personal");
  expect(personal.length).toBe(0);
});

test("짧은 메시지 추출 안 함", () => {
  const entities = extractKeyMemories("응");
  expect(entities.length).toBe(0);
});

// ─── Memory summary persistence ──────────────────────────────

test("memory_summary에 personal 저장됨", () => {
  const summary = updateMemorySummary(null, "망고라는 강아지가 있어");
  expect(summary).notToBeNull();
  expect(summary!).toContain("[personal]");
  expect(summary!).toContain("망고");
});

test("기존 summary에 personal 추가됨", () => {
  const existing = "- [hobby] 야구 좋아함";
  const summary = updateMemorySummary(existing, "강아지 이름이 콩이야");
  expect(summary).notToBeNull();
  expect(summary!).toContain("[personal]");
  expect(summary!).toContain("콩");
  expect(summary!).toContain("[hobby]");
});

test("personal이 summary 최상단에 위치", () => {
  const existing = "- [hobby] 야구 좋아함\n- [work] 야근 힘들다";
  const summary = updateMemorySummary(existing, "내 이름은 재훈이야");
  expect(summary).notToBeNull();
  const lines = summary!.split("\n");
  expect(lines[0]).toContain("[personal]");
});

test("parseStoredSummary가 personal 태그 파싱", () => {
  const summary = "- [personal] 반려동물: 망고 (강아지)\n- [hobby] 야구 좋아함";
  const entities = parseStoredSummary(summary);
  const personal = entities.filter((e) => e.category === "personal");
  expect(personal.length).toBe(1);
  expect(personal[0].fact).toContain("망고");
});

// ─── Context block integration ───────────────────────────────

test("buildCommonContextBlock에 personalFacts 표시", () => {
  const summary = "- [personal] 반려동물: 망고 (강아지)\n- [personal] 반려동물: 나비 (고양이)";
  const ctx = extractUserContext(summary, {});
  const block = buildCommonContextBlock(ctx);
  expect(block).toContain("망고");
  expect(block).toContain("나비");
});

test("유저 이름이 context의 userName에 반영됨", () => {
  const summary = "- [personal] 유저 이름: 민준";
  const ctx = extractUserContext(summary, {});
  expect(ctx.userName).toBe("민준");
});

test("프로필 닉네임이 메모리 이름보다 우선", () => {
  const summary = "- [personal] 유저 이름: 민준";
  const ctx = extractUserContext(summary, { nickname: "철수" });
  expect(ctx.userName).toBe("철수");
});

test("반려동물 이름이 personalFacts에 있고 userName에는 없음", () => {
  const summary = "- [personal] 반려동물: 망고 (강아지)";
  const ctx = extractUserContext(summary, {});
  expect(ctx.userName).toBe(undefined);
  expect(ctx.personalFacts).notToBeNull();
  const facts = ctx.personalFacts!;
  expect(facts.length).toBe(1);
  expect(facts[0]).toContain("망고");
});

// ─── Friend name extraction ──────────────────────────────────

test("친구 이름 추출 — Pattern 1: 친구 이름이 {name}야", () => {
  const entities = extractKeyMemories("친구 이름이 민지야");
  const personal = entities.filter((e) => e.category === "personal");
  expect(personal.length).toBe(1);
  expect(personal[0].fact).toContain("친구");
  expect(personal[0].fact).toContain("민지");
});

test("친구 이름 추출 — Pattern 2: {name}라는 친구야", () => {
  const entities = extractKeyMemories("준호라는 친구가 있어");
  const personal = entities.filter((e) => e.category === "personal");
  expect(personal.length).toBe(1);
  expect(personal[0].fact).toContain("친구");
  expect(personal[0].fact).toContain("준호");
});

test("친구 이름 추출 — Pattern 3: 내 친구가 {name}야", () => {
  const entities = extractKeyMemories("내 친구가 수현이야");
  const personal = entities.filter((e) => e.category === "personal");
  expect(personal.length).toBe(1);
  expect(personal[0].fact).toContain("친구");
  expect(personal[0].fact).toContain("수현");
});

test("베프 이름 추출", () => {
  const entities = extractKeyMemories("내 베프 이름이 지은이야");
  const personal = entities.filter((e) => e.category === "personal");
  expect(personal.length).toBe(1);
  expect(personal[0].fact).toContain("베프");
  expect(personal[0].fact).toContain("지은");
});

// ─── Partner name extraction ──────────────────────────────────

test("남자친구 이름 추출 — Pattern 1: 남자친구 이름이 {name}야", () => {
  const entities = extractKeyMemories("남자친구 이름이 준호야");
  const personal = entities.filter((e) => e.category === "personal");
  expect(personal.length).toBe(1);
  expect(personal[0].fact).toContain("남자친구");
  expect(personal[0].fact).toContain("준호");
});

test("여자친구 이름 추출 — Pattern 2: {name}이라는 여자친구", () => {
  const entities = extractKeyMemories("서연이라는 여자친구가 있어");
  const personal = entities.filter((e) => e.category === "personal");
  expect(personal.length).toBe(1);
  expect(personal[0].fact).toContain("여자친구");
  expect(personal[0].fact).toContain("서연");
});

test("남친 이름 추출 — Pattern 3: 내 남친이 {name}야", () => {
  const entities = extractKeyMemories("내 남친이 태민이야");
  const personal = entities.filter((e) => e.category === "personal");
  expect(personal.length).toBe(1);
  expect(personal[0].fact).toContain("남친");
  expect(personal[0].fact).toContain("태민");
});

test("애인 이름 추출 — Pattern 2: {name}라는 애인", () => {
  const entities = extractKeyMemories("재원이라는 애인이 생겼어");
  const personal = entities.filter((e) => e.category === "personal");
  expect(personal.length).toBe(1);
  expect(personal[0].fact).toContain("애인");
  expect(personal[0].fact).toContain("재원");
});

// ─── Extended family patterns ─────────────────────────────────

test("형 이름 추출 — Pattern 4: 형이 {name}야", () => {
  const entities = extractKeyMemories("형이 준혁이야");
  const personal = entities.filter((e) => e.category === "personal");
  expect(personal.length).toBe(1);
  expect(personal[0].fact).toContain("형");
  expect(personal[0].fact).toContain("준혁");
});

test("사촌 이름 추출 — Pattern 2: {name}라는 사촌", () => {
  const entities = extractKeyMemories("영호라는 사촌이 있어");
  const personal = entities.filter((e) => e.category === "personal");
  expect(personal.length).toBe(1);
  expect(personal[0].fact).toContain("사촌");
  expect(personal[0].fact).toContain("영호");
});

// ─── Negative tests ───────────────────────────────────────────

test("직업/역할 추출 안 함 — '친구 같은 선생님이야'", () => {
  const entities = extractKeyMemories("우리 선생님은 친구 같아");
  const personal = entities.filter((e) => e.category === "personal");
  expect(personal.length).toBe(0);
});

test("관계 언급만 있고 이름 없으면 추출 안 함 — '내 친구가 너무 예뻐'", () => {
  const entities = extractKeyMemories("내 친구가 너무 예뻐");
  const personal = entities.filter((e) => e.category === "personal");
  expect(personal.length).toBe(0);
});

// ─── getContextMemoryPrompt — relation recall hints ───────────

test("친구 이름이 getContextMemoryPrompt에 회상 힌트로 포함됨", () => {
  const summary = "- [personal] 친구 이름: 민지";
  const prompt = getContextMemoryPrompt(summary, { userMessageCount: 3 });
  expect(prompt).toContain("민지");
  expect(prompt).toContain("친구");
});

test("남자친구 이름이 getContextMemoryPrompt에 회상 힌트로 포함됨", () => {
  const summary = "- [personal] 남자친구 이름: 준호";
  const prompt = getContextMemoryPrompt(summary, { userMessageCount: 3 });
  expect(prompt).toContain("준호");
  expect(prompt).toContain("남자친구");
});

test("가족 이름이 getContextMemoryPrompt에 회상 힌트로 포함됨", () => {
  const summary = "- [personal] 형 이름: 민수";
  const prompt = getContextMemoryPrompt(summary, { userMessageCount: 3 });
  expect(prompt).toContain("민수");
  expect(prompt).toContain("형");
});

test("유저 이름·반려동물은 getContextMemoryPrompt에서 제외됨 (buildCommonContextBlock에서 처리)", () => {
  const summary = "- [personal] 유저 이름: 철수\n- [personal] 반려동물: 망고 (강아지)";
  const prompt = getContextMemoryPrompt(summary, { userMessageCount: 3 });
  expect(prompt).toBe("");
});

test("friend + non-personal 조합 회상 힌트 모두 포함됨", () => {
  const summary = "- [personal] 친구 이름: 지은\n- [work] 야근 힘들다";
  const prompt = getContextMemoryPrompt(summary, { userMessageCount: 3 });
  expect(prompt).toContain("지은");
  expect(prompt).toContain("야근");
});

// ─── Summary ────────────────────────────────────────────────

console.log(`\n${BOLD}Results: ${passed} passed, ${failed} failed${RESET}\n`);
if (failed > 0) {
  process.exit(1);
}
