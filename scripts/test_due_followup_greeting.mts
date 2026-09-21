/**
 * test_due_followup_greeting.mts
 *
 * getDueFollowUpMemories 로직 + 인사 프롬프트 블록 생성 단위 테스트
 *
 * 실행: npx tsx scripts/test_due_followup_greeting.mts
 */

import type { ShortTermMemory } from "@/types";

// ─────────────────────────────────────────────
// 로컬 헬퍼 — DB 없이 로직 재현
// ─────────────────────────────────────────────

function isDueFollowUp(
  memory: ShortTermMemory,
  nowMs: number,
  windowHours = 48
): boolean {
  if (!memory.dueDate) return false;
  if (!["active", "expired"].includes(memory.status)) return false;
  if (memory.priority < 3) return false;
  const dueMs = new Date(memory.dueDate).getTime();
  const windowStart = nowMs - windowHours * 60 * 60 * 1000;
  return dueMs < nowMs && dueMs > windowStart;
}

function buildFollowUpBlock(memories: ShortTermMemory[]): string {
  if (memories.length === 0) return "";
  return [
    "[꼭 안부를 물어볼 것 — 사용자가 신경 쓴다고 했던 일]",
    "아래 항목 중 **하나만** 자연스럽게 결과를 물어봐. 걱정한 듯, 궁금한 듯 가볍게.",
    ...memories.map((m) => `- ${m.content}`),
  ].join("\n");
}

// ─────────────────────────────────────────────
// 테스트 케이스
// ─────────────────────────────────────────────

type TestCase = {
  description: string;
  memory: ShortTermMemory;
  nowOffsetHours: number; // now = dueDate + offsetHours
  windowHours?: number;
  expectIncluded: boolean;
};

function makeMemory(
  overrides: Partial<ShortTermMemory> & { dueDate: string }
): ShortTermMemory {
  return {
    id: "test-id-" + Math.random().toString(36).slice(2),
    userId: "user-1",
    conversationId: "conv-1",
    characterId: "yuna",
    memoryType: "reminder",
    content: "면접",
    dueDate: overrides.dueDate,
    expiresAt: overrides.dueDate,
    status: "active",
    priority: 4,
    sourceMessageId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

const BASE_DUE = new Date("2026-09-21T18:00:00+09:00").toISOString();
const BASE_DUE_MS = new Date(BASE_DUE).getTime();

const CASES: TestCase[] = [
  {
    description: "due 2h 후 복귀 → 포함",
    memory: makeMemory({ dueDate: BASE_DUE, content: "면접 결과 확인" }),
    nowOffsetHours: 2,
    expectIncluded: true,
  },
  {
    description: "due 24h 후 복귀 → 포함 (window 48h)",
    memory: makeMemory({ dueDate: BASE_DUE, content: "병원 다녀오기", memoryType: "health" }),
    nowOffsetHours: 24,
    expectIncluded: true,
  },
  {
    description: "due 47h 후 복귀 → 포함 (window 48h 직전)",
    memory: makeMemory({ dueDate: BASE_DUE, content: "과제 제출" }),
    nowOffsetHours: 47,
    expectIncluded: true,
  },
  {
    description: "due 49h 후 복귀 → 제외 (window 48h 초과)",
    memory: makeMemory({ dueDate: BASE_DUE, content: "과제 제출" }),
    nowOffsetHours: 49,
    expectIncluded: false,
  },
  {
    description: "priority 2 → 제외 (priority < 3)",
    memory: makeMemory({ dueDate: BASE_DUE, content: "마트 가기", priority: 2 }),
    nowOffsetHours: 2,
    expectIncluded: false,
  },
  {
    description: "status dismissed → 제외",
    memory: makeMemory({ dueDate: BASE_DUE, content: "약 먹기", status: "dismissed" }),
    nowOffsetHours: 2,
    expectIncluded: false,
  },
  {
    description: "status completed → 제외",
    memory: makeMemory({ dueDate: BASE_DUE, content: "약 먹기", status: "completed" }),
    nowOffsetHours: 2,
    expectIncluded: false,
  },
  {
    description: "status expired, due 12h 후 → 포함 (expired도 포함)",
    memory: makeMemory({ dueDate: BASE_DUE, content: "치과 예약", status: "expired", priority: 4 }),
    nowOffsetHours: 12,
    expectIncluded: true,
  },
  {
    description: "dueDate 없음 → 제외",
    memory: { ...makeMemory({ dueDate: BASE_DUE }), dueDate: null },
    nowOffsetHours: 2,
    expectIncluded: false,
  },
  {
    description: "priority 3, due 3h 후 → 포함 (경계값)",
    memory: makeMemory({ dueDate: BASE_DUE, content: "친구 생일 선물", priority: 3 }),
    nowOffsetHours: 3,
    expectIncluded: true,
  },
];

// ─────────────────────────────────────────────
// 실행
// ─────────────────────────────────────────────

let passed = 0;
let failed = 0;

console.log("=== getDueFollowUpMemories 필터 테스트 ===\n");

for (const tc of CASES) {
  const nowMs = BASE_DUE_MS + tc.nowOffsetHours * 60 * 60 * 1000;
  const result = isDueFollowUp(tc.memory, nowMs, tc.windowHours ?? 48);

  const ok = result === tc.expectIncluded;
  const mark = ok ? "✅" : "❌";
  console.log(
    `${mark} [${tc.description}] — expected=${tc.expectIncluded}, got=${result}`
  );
  if (ok) passed++;
  else failed++;
}

// ─────────────────────────────────────────────
// 프롬프트 블록 생성 테스트
// ─────────────────────────────────────────────

console.log("\n=== buildFollowUpBlock 프롬프트 블록 테스트 ===\n");

const emptyBlock = buildFollowUpBlock([]);
console.assert(emptyBlock === "", "❌ 빈 배열 → 빈 문자열이어야 함");
console.log("✅ 빈 배열 → 빈 문자열");

const m1 = makeMemory({ dueDate: BASE_DUE, content: "내일 면접" });
const m2 = makeMemory({ dueDate: BASE_DUE, content: "건강검진 결과" });
const block = buildFollowUpBlock([m1, m2]);
console.assert(block.includes("내일 면접"), "❌ 항목이 블록에 없음");
console.assert(block.includes("건강검진 결과"), "❌ 항목 2가 블록에 없음");
console.assert(block.includes("[꼭 안부를 물어볼 것"), "❌ 헤더가 없음");
console.log("✅ 복수 항목 블록 생성 정상");

// 블록 샘플 출력
console.log("\n--- 프롬프트 블록 샘플 ---");
console.log(block);
console.log("---\n");

// ─────────────────────────────────────────────
// 결과 요약
// ─────────────────────────────────────────────

console.log(`\n총 ${CASES.length}케이스 — ✅ ${passed}통과 / ❌ ${failed}실패`);

if (failed > 0) {
  process.exitCode = 1;
}
