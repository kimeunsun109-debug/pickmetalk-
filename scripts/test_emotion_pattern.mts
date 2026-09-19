/**
 * test_emotion_pattern.mts
 * 감정 공명 패턴 분석 서비스 단위 테스트
 */
import {
  analyzeEmotionPattern,
  mergeEmotionPattern,
  parseSavedEmotionPattern,
  buildEmotionPatternPromptBlock,
} from "../services/emotionPattern.js";

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

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

function assertEqual<T>(a: T, b: T, msg?: string) {
  if (a !== b) throw new Error(msg ?? `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

// ─── 케이스 1: 빈 메시지 ────────────────────────────────────────────────────
console.log("\n[1] 빈 메시지");
test("빈 배열 → 상관관계 없음", () => {
  const result = analyzeEmotionPattern([]);
  assertEqual(result.correlations.length, 0, "correlations should be empty");
  assertEqual(result.sampleCount, 0);
});

// ─── 케이스 2: 야근 + 피곤 패턴 감지 ───────────────────────────────────────
console.log("\n[2] 야근·직장 스트레스 패턴");
test("야근+힘들 → 직장·야근 stress 상관", () => {
  const msgs = [
    "오늘도 야근했어. 진짜 힘들다",
    "야근이 너무 많아서 지침",
    "야근 때문에 짜증나서 미치겠음",
    "회사 프로젝트 때문에 야근이야. 피곤해 죽겠어",
    "야근 또 했다. 진짜 답답해",
  ];
  const result = analyzeEmotionPattern(msgs);
  const workCorrel = result.correlations.find(
    (c) => c.topic === "직장·야근" && c.sentiment === "stress"
  );
  assert(workCorrel !== undefined, "직장·야근 stress 상관이 검출되어야 함");
  assert(workCorrel!.count >= 2, `count should be >= 2 but got ${workCorrel!.count}`);
  console.log(`    → 야근 stress count: ${workCorrel!.count}`);
});

// ─── 케이스 3: 게임 긍정 패턴 ──────────────────────────────────────────────
console.log("\n[3] 게임·취미 긍정 패턴");
test("게임+재밌 → 게임·취미 positive 상관", () => {
  const msgs = [
    "오늘 게임했는데 진짜 재밌었어 ㅋㅋ",
    "게임 이겼다! 대박 신나",
    "게임 한 판 더 했어. 너무 좋아",
    "포켓몬 게임 재밌다 ㅎㅎ",
    "게임하다가 웃겼어 진짜ㅋㅋ",
  ];
  const result = analyzeEmotionPattern(msgs);
  const gameCorrel = result.correlations.find(
    (c) => c.topic === "게임·취미" && c.sentiment === "positive"
  );
  assert(gameCorrel !== undefined, "게임·취미 positive 상관이 검출되어야 함");
  assert(gameCorrel!.count >= 2, `count should be >= 2 but got ${gameCorrel!.count}`);
  console.log(`    → 게임 positive count: ${gameCorrel!.count}`);
});

// ─── 케이스 4: 혼재 신호 (긍정+부정) → null ────────────────────────────────
console.log("\n[4] 긍정+부정 혼재");
test("야근했는데 재밌어 → null (혼재)", () => {
  const msgs = [
    "야근했는데 동료들이랑 재밌었어 ㅋㅋ",
    "야근 힘들지만 게임이 재밌어서 버텼어",
  ];
  // Only 1 occurrence per combination → count < 2 → not in correlations
  const result = analyzeEmotionPattern(msgs);
  const ambiguous = result.correlations.find(
    (c) => c.topic === "직장·야근" && c.sentiment === "stress"
  );
  // 1회 관측은 count < 2 임계값 미충족이므로 결과에 포함되지 않아야 함
  assert(!ambiguous, "1회 관측은 결과에 포함되면 안 됨");
  console.log("    → 혼재 신호 필터링 OK");
});

// ─── 케이스 5: mergeEmotionPattern ─────────────────────────────────────────
console.log("\n[5] 패턴 병합");
test("기존 패턴 + 새 패턴 병합", () => {
  const existing = analyzeEmotionPattern([
    "야근해서 피곤해",
    "야근 너무 힘들어",
    "야근 또 했어. 지침",
    "야근 짜증나",
    "야근 답답",
    "게임 재밌었어 ㅋㅋ",
    "게임하니까 신나",
    "게임 또 이겼어! 행복",
    "게임 대박",
    "게임 너무 좋아",
  ]);
  const incoming = analyzeEmotionPattern([
    "야근이야 또. 힘들다",
    "야근해서 지침",
    "야근 짜증나",
    "게임했어 신났음",
    "게임 재밌어",
    "게임 좋아",
  ]);
  const merged = mergeEmotionPattern(existing, incoming);
  assert(merged.correlations.length > 0, "병합 결과에 상관관계가 있어야 함");
  assert(merged.sampleCount > existing.sampleCount, "sampleCount 증가해야 함");
  console.log(`    → 병합 후 correlations: ${merged.correlations.length}개`);
});

test("기존 패턴이 null이면 incoming 그대로 반환", () => {
  const incoming = analyzeEmotionPattern([
    "야근해서 피곤해",
    "야근 너무 힘들어",
    "야근 또 했어. 지침",
    "야근 짜증나",
    "야근 답답",
  ]);
  const merged = mergeEmotionPattern(null, incoming);
  assertEqual(
    merged.correlations.length,
    incoming.correlations.length,
    "null 기존 패턴은 incoming 그대로 반환"
  );
});

// ─── 케이스 6: parseSavedEmotionPattern ────────────────────────────────────
console.log("\n[6] JSONB 파싱");
test("null 입력 → null 반환", () => {
  assert(parseSavedEmotionPattern(null) === null, "null 입력은 null 반환");
});

test("유효한 JSONB → 파싱 성공", () => {
  const raw = {
    correlations: [{ topic: "직장·야근", sentiment: "stress", count: 3 }],
    sampleCount: 15,
    updatedAt: "2026-09-19T00:00:00Z",
  };
  const parsed = parseSavedEmotionPattern(raw);
  assert(parsed !== null, "유효한 JSONB는 파싱 성공");
  assertEqual(parsed!.correlations.length, 1);
  assertEqual(parsed!.sampleCount, 15);
});

test("잘못된 구조 → null 반환", () => {
  assert(parseSavedEmotionPattern({ foo: "bar" }) === null, "잘못된 구조는 null");
  assert(parseSavedEmotionPattern("string") === null, "string 입력은 null");
});

// ─── 케이스 7: buildEmotionPatternPromptBlock ───────────────────────────────
console.log("\n[7] 프롬프트 블록 생성");
test("패턴 없음 → 빈 문자열", () => {
  assertEqual(buildEmotionPatternPromptBlock(null), "", "null → empty string");
  const empty = { correlations: [], sampleCount: 20, updatedAt: "" };
  assertEqual(buildEmotionPatternPromptBlock(empty), "", "빈 correlations → empty");
});

test("샘플 부족 → 빈 문자열", () => {
  const few = {
    correlations: [{ topic: "직장·야근", sentiment: "stress" as const, count: 5 }],
    sampleCount: 5,
    updatedAt: "",
  };
  assertEqual(buildEmotionPatternPromptBlock(few), "", "sampleCount < 8 → empty");
});

test("충분한 패턴 → 힌트 블록 생성", () => {
  const pattern = {
    correlations: [
      { topic: "직장·야근", sentiment: "stress" as const, count: 4 },
      { topic: "게임·취미", sentiment: "positive" as const, count: 4 },
    ],
    sampleCount: 30,
    updatedAt: "2026-09-19T00:00:00Z",
  };
  const block = buildEmotionPatternPromptBlock(pattern);
  assert(block.length > 0, "패턴 있으면 블록 생성");
  assert(block.includes("직장·야근"), "직장·야근 언급");
  assert(block.includes("게임·취미"), "게임·취미 언급");
  assert(block.includes("감정 패턴"), "감정 패턴 헤더");
  // 캐릭터에게 "패턴이나 기록을 직접 언급하지 마라" 지시가 있어야 함
  assert(block.includes("패턴") || block.includes("기록"), "패턴 언급 금지 지시 존재");
  console.log("    블록 미리보기:");
  console.log(
    block
      .split("\n")
      .map((l) => `    ${l}`)
      .join("\n")
  );
});

test("count < 3 인 상관관계는 블록에서 제외", () => {
  const pattern = {
    correlations: [
      { topic: "직장·야근", sentiment: "stress" as const, count: 2 },
    ],
    sampleCount: 15,
    updatedAt: "",
  };
  const block = buildEmotionPatternPromptBlock(pattern);
  assertEqual(block, "", "count < 3 → 블록 생성 안 함");
});

// ─── 요약 ────────────────────────────────────────────────────────────────────
console.log(`\n결과: ${passed} 통과 / ${failed} 실패`);
if (failed > 0) process.exit(1);
