/**
 * test_chat_context.mts
 *
 * 세 가지 신규 기능을 검증한다:
 *  1. UserContextData에 userGender / userMbti / userIdealType 추가
 *  2. buildCommonContextBlock에 성별·MBTI·이상형 키워드 출력
 *  3. getContextMemoryPrompt — memory recall 힌트 생성
 *  4. buildDailyPatternPromptBlock — 생활 패턴 힌트 생성
 */

import {
  extractUserContext,
  buildCommonContextBlock,
  type ProfileUserContext,
} from "../services/context";
import { getContextMemoryPrompt } from "../services/memory";
import { buildDailyPatternPromptBlock } from "../prompts/patternNudges";
import type { UserDailyPattern } from "../types";

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}${detail ? `\n     → ${detail}` : ""}`);
    failed++;
  }
}

// ─────────────────────────────────────────────────
// 1. UserContextData — 신규 필드 추출
// ─────────────────────────────────────────────────
console.log("\n[1] UserContextData 신규 필드 추출");

const profileCtx1: ProfileUserContext = {
  nickname: "민준",
  gender: "male",
  mbti: "ENFP",
  idealType: "따뜻하고 유머 있는 사람",
  age: "28",
  job: "개발자",
};
const ctx1 = extractUserContext(null, profileCtx1);

assert("userName 추출", ctx1.userName === "민준");
assert("userAge 추출", ctx1.userAge === "28");
assert("userJob 추출", ctx1.userJob === "개발자");
assert("userGender 추출", ctx1.userGender === "male");
assert("userMbti 추출", ctx1.userMbti === "ENFP");
assert("userIdealType 추출", ctx1.userIdealType === "따뜻하고 유머 있는 사람");

const profileCtx2: ProfileUserContext = { gender: "female", mbti: "INTJ" };
const ctx2 = extractUserContext(null, profileCtx2);
assert("여성 성별 추출", ctx2.userGender === "female");
assert("INTJ MBTI 추출", ctx2.userMbti === "INTJ");
assert("이상형 미설정시 undefined", ctx2.userIdealType === undefined);

// ─────────────────────────────────────────────────
// 2. buildCommonContextBlock — 새 필드 포함 여부
// ─────────────────────────────────────────────────
console.log("\n[2] buildCommonContextBlock 새 필드 확인");

const block1 = buildCommonContextBlock(ctx1);
assert("성별(남성) 포함", block1.includes("남성"), block1);
assert("MBTI ENFP 포함", block1.includes("ENFP"), block1);
assert("분석·낙인 금지 힌트 포함", block1.includes("분석·낙인 금지"), block1);
assert("이상형 키워드 포함", block1.includes("따뜻하고 유머 있는 사람"), block1);
assert("직접 언급 금지 힌트 포함", block1.includes("직접 언급 금지"), block1);
assert("나이 포함", block1.includes("28세"), block1);
assert("직업 포함", block1.includes("개발자"), block1);

const ctxFemale = extractUserContext(null, { gender: "female" });
const blockFemale = buildCommonContextBlock(ctxFemale);
assert("성별(여성) 포함", blockFemale.includes("여성"), blockFemale);

// 필드 없을 때도 이름 미등록 힌트는 출력됨
const ctxEmpty = extractUserContext(null, {});
const blockEmpty = buildCommonContextBlock(ctxEmpty);
assert("모든 필드 없을 때도 이름 미등록 힌트 포함", blockEmpty.includes("미등록"), blockEmpty);

// ─────────────────────────────────────────────────
// 3. getContextMemoryPrompt — recall 힌트 생성
// ─────────────────────────────────────────────────
console.log("\n[3] getContextMemoryPrompt 메모리 회상 힌트");

const memorySummary = `- [work] 야근이 많아서 힘들다고 했음
- [hobby] 야구를 좋아한다고 했음
- [schedule] 다음 주 부산 여행 예정
- [personal] 유저 이름: 민준`;

// 신규 세션 (ongoing=false) → 힌트 있어야 함
const recall1 = getContextMemoryPrompt(memorySummary, {
  userMessageCount: 5,
  emotion: "normal",
  ongoingSession: false,
});
assert("신규 세션에서 recall 힌트 생성", recall1.length > 0, recall1);
assert("work 팩트 포함", recall1.includes("야근"), recall1);

// 진행 중 세션 → 힌트 없어야 함
const recall2 = getContextMemoryPrompt(memorySummary, {
  userMessageCount: 5,
  emotion: "normal",
  ongoingSession: true,
});
assert("진행 중 세션에서 recall 힌트 없음", recall2 === "", `got: "${recall2}"`);

// hurt 초기 arc → 힌트 없어야 함
const recall3 = getContextMemoryPrompt(memorySummary, {
  userMessageCount: 5,
  emotion: "hurt",
  emotionDurationTurns: 1,
  ongoingSession: false,
});
assert("hurt 1턴 arc에서 recall 힌트 없음", recall3 === "", `got: "${recall3}"`);

// hurt arc 회복 후 (turns >= 3) → 힌트 있어야 함
const recall4 = getContextMemoryPrompt(memorySummary, {
  userMessageCount: 5,
  emotion: "hurt",
  emotionDurationTurns: 3,
  ongoingSession: false,
});
assert("hurt 3턴 이후 recall 힌트 재개", recall4.length > 0, recall4);

// summary 없음 → 빈 문자열
const recall5 = getContextMemoryPrompt(null, { ongoingSession: false });
assert("summary 없을 때 빈 문자열", recall5 === "");

// ─────────────────────────────────────────────────
// 4. buildDailyPatternPromptBlock — 생활 패턴 블록
// ─────────────────────────────────────────────────
console.log("\n[4] buildDailyPatternPromptBlock 생활 패턴 블록");

const patterns: UserDailyPattern[] = [
  {
    id: "p1",
    userId: "u1",
    patternType: "work_end",
    timeStartMinute: 1080,
    timeEndMinute: 1140,
    confidence: 75,
    evidenceCount: 5,
    timezone: "Asia/Seoul",
    lastObservedAt: "2026-09-19T12:00:00Z",
    lastUpdatedAt: "2026-09-19T12:00:00Z",
    updatedFromMessageId: null,
  },
  {
    id: "p2",
    userId: "u1",
    patternType: "lunch",
    timeStartMinute: 720,
    timeEndMinute: 780,
    confidence: 60,
    evidenceCount: 3,
    timezone: "Asia/Seoul",
    lastObservedAt: "2026-09-19T03:30:00Z",
    lastUpdatedAt: "2026-09-19T03:30:00Z",
    updatedFromMessageId: null,
  },
];

const patternBlock = buildDailyPatternPromptBlock(patterns);
assert("패턴 블록 생성", patternBlock.length > 0, patternBlock);
assert("퇴근 패턴 포함", patternBlock.includes("퇴근"), patternBlock);
assert("점심 패턴 포함", patternBlock.includes("점심"), patternBlock);
assert("신뢰도 포함", patternBlock.includes("75%"), patternBlock);
assert("감시 톤 금지 경고 포함", patternBlock.includes("감시/리포트 톤"), patternBlock);

const emptyPatternBlock = buildDailyPatternPromptBlock([]);
assert("패턴 없을 때 빈 문자열", emptyPatternBlock === "");

// ─────────────────────────────────────────────────
// 결과 요약
// ─────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`결과: ${passed} passed / ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
