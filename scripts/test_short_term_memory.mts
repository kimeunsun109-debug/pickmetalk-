/**
 * 단기기억 완료 감지 로직 테스트
 * npx tsx scripts/test_short_term_memory.mts
 */

import {
  isShortTermCompletionMessage,
  extractShortTermMemory,
  getCompletionVerbBonus,
} from "@/services/shortTermMemory";
import { removeCompletedScheduleFromSummary } from "@/services/memory";

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(label: string, got: unknown, expected: unknown) {
  const ok = JSON.stringify(got) === JSON.stringify(expected);
  if (ok) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}`);
    console.error(`     expected: ${JSON.stringify(expected)}`);
    console.error(`     got:      ${JSON.stringify(got)}`);
    failed++;
  }
}

function assertTruthy(label: string, got: unknown) {
  if (got) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label} (falsy: ${JSON.stringify(got)})`);
    failed++;
  }
}

function assertFalsy(label: string, got: unknown) {
  if (!got) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label} (truthy: ${JSON.stringify(got)})`);
    failed++;
  }
}

// ─────────────────────────────────────────────
// 1. isShortTermCompletionMessage
// ─────────────────────────────────────────────
console.log("\n[1] isShortTermCompletionMessage");

// 기존 패턴 — 계속 동작해야 함
assertTruthy("했어 (기존)", isShortTermCompletionMessage("약속 했어"));
assertTruthy("챙겼어 (기존)", isShortTermCompletionMessage("우산 챙겼어"));
assertTruthy("샀어 (기존)", isShortTermCompletionMessage("마트에서 우유 샀어"));

// 새로 추가된 패턴
assertTruthy("먹었어 — 약", isShortTermCompletionMessage("약 먹었어"));
assertTruthy("먹었다 — 밥", isShortTermCompletionMessage("아까 밥 먹었다"));
assertTruthy("마셨어 — 약", isShortTermCompletionMessage("약 마셨어"));
assertTruthy("갔어 — 병원", isShortTermCompletionMessage("병원 갔어"));
assertTruthy("갔다 — 마트", isShortTermCompletionMessage("마트 갔다"));
assertTruthy("다녀왔어 — 병원", isShortTermCompletionMessage("병원 다녀왔어"));
assertTruthy("다녀왔다", isShortTermCompletionMessage("병원 다녀왔다"));
assertTruthy("받았어 — 택배", isShortTermCompletionMessage("택배 받았어"));
assertTruthy("도착했어", isShortTermCompletionMessage("회사 도착했어"));
assertTruthy("맞았어 — 주사", isShortTermCompletionMessage("주사 맞았어"));
assertTruthy("됐어", isShortTermCompletionMessage("됐어 이제 다 됐어"));
assertTruthy("나왔어", isShortTermCompletionMessage("병원 나왔어"));
assertTruthy("만났어", isShortTermCompletionMessage("친구 만났어"));
assertTruthy("사왔어", isShortTermCompletionMessage("우유 사왔어"));
assertTruthy("예약했어", isShortTermCompletionMessage("미용실 예약했어"));
assertTruthy("해결했어", isShortTermCompletionMessage("문제 해결했어"));

// 완료가 아닌 일반 메시지 — false여야 함
assertFalsy("안녕", isShortTermCompletionMessage("안녕"));
assertFalsy("뭐해?", isShortTermCompletionMessage("뭐해?"));
assertFalsy("오늘 뭐 먹을지 모르겠어", isShortTermCompletionMessage("오늘 뭐 먹을지 모르겠어"));
assertFalsy("내일 병원 가야 해", isShortTermCompletionMessage("내일 병원 가야 해"));
assertFalsy("ㅋㅋ 그래", isShortTermCompletionMessage("ㅋㅋ 그래"));

// ─────────────────────────────────────────────
// 2. extractShortTermMemory — 단순 완료 문장 억제
// ─────────────────────────────────────────────
console.log("\n[2] extractShortTermMemory — 짧은 완료 문장 억제");

assertFalsy(
  "약 먹었어 (짧은 완료 메시지 → 신규 기억 억제)",
  extractShortTermMemory("약 먹었어")
);
assertFalsy(
  "병원 갔어 (짧은 완료 → 억제)",
  extractShortTermMemory("병원 갔어")
);
assertFalsy(
  "우산 챙겼어 (짧은 완료 → 억제)",
  extractShortTermMemory("우산 챙겼어")
);

// 완료 문장 + 미래 일정 → 새 기억 생성 허용
assertTruthy(
  "병원 다녀왔어 내일 약 먹어야 해 (완료+미래 → 새 기억 추출)",
  extractShortTermMemory("병원 다녀왔어 내일 약 먹어야 해")
);

// 순수 미래 일정 → 기억 생성
assertTruthy(
  "내일 병원 가야 해 → 기억 생성",
  extractShortTermMemory("내일 병원 가야 해")
);

// ─────────────────────────────────────────────
// 3. getCompletionVerbBonus
// ─────────────────────────────────────────────
console.log("\n[3] getCompletionVerbBonus");

assert(
  "먹었어 + health → 5점",
  getCompletionVerbBonus("약 먹었어", "health"),
  5
);
assert(
  "다녀왔어 + health → 4점",
  getCompletionVerbBonus("병원 다녀왔어", "health"),
  4
);
assert(
  "샀어 + purchase → 5점",
  getCompletionVerbBonus("마트에서 우유 샀어", "purchase"),
  5
);
assert(
  "먹었어 + purchase → 2점",
  getCompletionVerbBonus("뭐 먹었어", "purchase"),
  2
);
assert(
  "갔어 + reminder → 2점 (갔어/갔다 패턴 보너스)",
  getCompletionVerbBonus("갔어", "reminder"),
  2
);

// ─────────────────────────────────────────────
// 4. removeCompletedScheduleFromSummary
// ─────────────────────────────────────────────
console.log("\n[4] removeCompletedScheduleFromSummary");

const summaryWithHospital = [
  "- [schedule] 병원 가야 함",
  "- [hobby] 야구 좋아함",
  "- [work] 야근 있음",
].join("\n");

const afterHospital = removeCompletedScheduleFromSummary(
  summaryWithHospital,
  "병원 다녀왔어"
);
assertFalsy("병원 다녀왔어 → schedule '병원' 팩트 제거됨", afterHospital?.includes("[schedule] 병원"));
assertTruthy("병원 다녀왔어 → hobby/work 팩트 보존", afterHospital?.includes("[hobby]") && afterHospital?.includes("[work]"));

const summaryWithDrug = [
  "- [schedule] 약 챙겨야 함",
  "- [hobby] 게임 좋아함",
].join("\n");

const afterDrug = removeCompletedScheduleFromSummary(summaryWithDrug, "약 먹었어");
assertFalsy("약 먹었어 → schedule '약' 팩트 제거됨", afterDrug?.includes("[schedule] 약"));
assertTruthy("약 먹었어 → hobby 팩트 보존", afterDrug?.includes("[hobby]"));

// schedule이 없는 summary는 그대로
const noScheduleSummary = "- [hobby] 게임\n- [work] 야근";
assert(
  "schedule 없는 summary는 변경 없음",
  removeCompletedScheduleFromSummary(noScheduleSummary, "병원 다녀왔어"),
  noScheduleSummary
);

// null input
assert("null 입력 → null 반환", removeCompletedScheduleFromSummary(null, "됐어"), null);

// 무관한 완료 메시지 — schedule 제거 없음
const afterUnrelated = removeCompletedScheduleFromSummary(
  summaryWithHospital,
  "밥 먹었어"
);
assertTruthy(
  "무관한 완료 메시지 → schedule 보존",
  afterUnrelated?.includes("[schedule] 병원")
);

// ─────────────────────────────────────────────
// 결과
// ─────────────────────────────────────────────
console.log(`\n총 ${passed + failed}개 중 ${passed}개 통과, ${failed}개 실패`);
if (failed > 0) process.exit(1);
