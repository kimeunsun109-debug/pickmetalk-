/**
 * test_urgent_followup.mts
 *
 * buildUrgentFollowUpBlock + buildTypeFollowUpHint 단위 테스트.
 * DB 없이 순수 함수만 검증한다.
 */

import {
  buildTypeFollowUpHint,
  buildUrgentFollowUpBlock,
} from "../lib/db/shortTermMemories";
import type { ShortTermMemory } from "../types";

let passed = 0;
let failed = 0;

function assert(desc: string, condition: boolean): void {
  if (condition) {
    console.log(`  ✓ ${desc}`);
    passed++;
  } else {
    console.error(`  ✗ ${desc}`);
    failed++;
  }
}

function makeMemory(
  overrides: Partial<ShortTermMemory> & { memoryType: ShortTermMemory["memoryType"]; content: string }
): ShortTermMemory {
  return {
    id: "test-id",
    userId: "user-1",
    conversationId: "conv-1",
    characterId: "yuna",
    dueDate: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    priority: 3,
    sourceMessageId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ──────────────────────────────────────────────
// buildTypeFollowUpHint — 타입별 hint 문구
// ──────────────────────────────────────────────
console.log("\n[buildTypeFollowUpHint]");

const healthHospital = makeMemory({
  memoryType: "health",
  content: "내일 병원 검사 있어",
});
assert(
  "health + 병원 → 병원 다녀왔어? 포함",
  buildTypeFollowUpHint(healthHospital).includes("병원 다녀왔어?")
);

const healthMeds = makeMemory({
  memoryType: "health",
  content: "약 꼭 챙겨 먹기",
});
assert(
  "health + 약 → 잘 챙겨 먹고 있어? 포함",
  buildTypeFollowUpHint(healthMeds).includes("잘 챙겨 먹고 있어?")
);

const healthExercise = makeMemory({
  memoryType: "health",
  content: "오늘 헬스장 가기",
});
assert(
  "health + 운동 → 오늘 운동했어? 포함",
  buildTypeFollowUpHint(healthExercise).includes("오늘 운동했어?")
);

const healthGeneral = makeMemory({
  memoryType: "health",
  content: "감기 걸렸어",
});
assert(
  "health + 일반 → 몸 상태는 좀 어때? 포함",
  buildTypeFollowUpHint(healthGeneral).includes("몸 상태는 좀 어때?")
);

const followUpInterview = makeMemory({
  memoryType: "follow_up",
  content: "오늘 면접이 있어",
});
assert(
  "follow_up + 면접 → 면접 결과는 어떻게 됐어? 포함",
  buildTypeFollowUpHint(followUpInterview).includes("면접 결과는 어떻게 됐어?")
);

const followUpExam = makeMemory({
  memoryType: "follow_up",
  content: "오늘 토익 시험",
});
assert(
  "follow_up + 시험 → 시험 어떻게 봤어? 포함",
  buildTypeFollowUpHint(followUpExam).includes("시험 어떻게 봤어?")
);

const followUpHospital = makeMemory({
  memoryType: "follow_up",
  content: "병원 예약해야 해",
});
assert(
  "follow_up + 병원 → 병원 다녀왔어? 포함",
  buildTypeFollowUpHint(followUpHospital).includes("병원 다녀왔어?")
);

const followUpDefault = makeMemory({
  memoryType: "follow_up",
  content: "친구 만나기로 했어",
});
assert(
  "follow_up + default → 어떻게 됐어? 포함",
  buildTypeFollowUpHint(followUpDefault).includes("어떻게 됐어?")
);

const missionMemory = makeMemory({
  memoryType: "mission",
  content: "오늘 미션: 물 2리터 마시기",
});
assert(
  "mission → 미션 완수했어? 포함",
  buildTypeFollowUpHint(missionMemory).includes("미션 완수했어?")
);

const reminderDeadline = makeMemory({
  memoryType: "reminder",
  content: "이메일 제출 마감 오늘까지",
});
assert(
  "reminder + 마감 → 제때 처리했어? 포함",
  buildTypeFollowUpHint(reminderDeadline).includes("제때 처리했어?")
);

const reminderGeneral = makeMemory({
  memoryType: "reminder",
  content: "열쇠 챙기기",
});
assert(
  "reminder + general → 잊지 않고 했어? 포함",
  buildTypeFollowUpHint(reminderGeneral).includes("잊지 않고 했어?")
);

const purchaseMemory = makeMemory({
  memoryType: "purchase",
  content: "충전기 사야 해",
});
assert(
  "purchase → 샀어? 포함",
  buildTypeFollowUpHint(purchaseMemory).includes("샀어?")
);

const weatherMemory = makeMemory({
  memoryType: "weather",
  content: "내일 비 온다고 했어",
});
assert(
  "weather → 우산 챙겼어? 포함",
  buildTypeFollowUpHint(weatherMemory).includes("우산 챙겼어?")
);

const gratitudeMemory = makeMemory({
  memoryType: "gratitude",
  content: "감사한 일 3가지 쓰기",
});
assert(
  "gratitude → 어떻게 됐어? 포함",
  buildTypeFollowUpHint(gratitudeMemory).includes("어떻게 됐어?")
);

// content가 40자 초과일 때 잘리는지 확인 (50자 내용)
const longContent = makeMemory({
  memoryType: "reminder",
  content: "이건 정말정말 긴 내용인데 40자가 넘어서 잘려야 하는 내용입니다 꼭 잘려야 해요 맞죠?",
});
const hintResult = buildTypeFollowUpHint(longContent);
const longFull = "이건 정말정말 긴 내용인데 40자가 넘어서 잘려야 하는 내용입니다 꼭 잘려야 해요 맞죠?";
assert(
  "content 40자 초과 시 잘림",
  longFull.length > 40 && !hintResult.includes(longFull)
);

// ──────────────────────────────────────────────
// buildUrgentFollowUpBlock
// ──────────────────────────────────────────────
console.log("\n[buildUrgentFollowUpBlock]");

assert("빈 배열 → 빈 문자열", buildUrgentFollowUpBlock([]) === "");

const twoMemories = [
  makeMemory({ memoryType: "follow_up", content: "면접 결과 확인", id: "a" }),
  makeMemory({ memoryType: "health", content: "병원 다녀오기", id: "b" }),
];
const block = buildUrgentFollowUpBlock(twoMemories);
assert(
  "여러 메모리 → 헤더 포함",
  block.includes("[오늘 대화 중 자연스럽게 한 번 챙겨봐야 할 것 — 우선순위 높음]")
);
assert(
  "여러 메모리 → 두 힌트 모두 포함",
  block.includes("면접 결과는 어떻게 됐어?") && block.includes("병원 다녀왔어?")
);
assert(
  "블록 설명 포함",
  block.includes("기한이 오늘까지이거나 이미 지난")
);
assert(
  "각 힌트는 - 로 시작",
  block.split("\n").filter((l) => l.startsWith("- ")).length === 2
);

// 단일 메모리
const singleBlock = buildUrgentFollowUpBlock([
  makeMemory({ memoryType: "mission", content: "운동 30분 미션", id: "c" }),
]);
assert("단일 메모리 → 미션 힌트 포함", singleBlock.includes("미션 완수했어?"));

// ──────────────────────────────────────────────
// 결과
// ──────────────────────────────────────────────
console.log(`\n결과: ${passed} passed / ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
