/**
 * test_emotion.mts — 감정 결정 로직 테스트
 *
 * 실행: npx tsx scripts/test_emotion.mts
 */

import {
  resolveCharacterEmotion,
  isNegativeOrColdMessage,
  inferEmotionFromUserMessage,
  isOngoingChatSession,
  countEmotionDurationTurns,
} from "../services/emotion";
import type { EmotionState, Message } from "../types";

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(desc: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log(`  ✓ ${desc}`);
    passed++;
  } else {
    console.error(`  ✗ ${desc}`);
    console.error(`    expected: ${JSON.stringify(expected)}`);
    console.error(`    actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

function minutesAgo(min: number): string {
  return new Date(Date.now() - min * 60 * 1000).toISOString();
}

function makeMessage(
  role: "user" | "assistant",
  minutesBefore: number,
  emotion?: EmotionState
): Message {
  return {
    id: `msg-${Math.random()}`,
    role,
    content: "test",
    createdAt: minutesAgo(minutesBefore),
    emotion: emotion ?? null,
    isProactive: false,
  };
}

// ─────────────────────────────────────────────
// 1. isNegativeOrColdMessage
// ─────────────────────────────────────────────

console.log("\n[1] isNegativeOrColdMessage");

test("빈 문자열 → cold", isNegativeOrColdMessage(""), true);
test("한 글자 'ㅇ' → cold", isNegativeOrColdMessage("ㅇ"), true);
test("'응' → cold", isNegativeOrColdMessage("응"), true);
test("'어' → cold", isNegativeOrColdMessage("어"), true);
test("'ㅇㅇ' → cold", isNegativeOrColdMessage("ㅇㅇ"), true);
test("'몰라' → cold", isNegativeOrColdMessage("몰라"), true);
test("'별로' → cold", isNegativeOrColdMessage("별로"), true);
test("'뭐해' → cold", isNegativeOrColdMessage("뭐해"), true);
test("'심심' → cold", isNegativeOrColdMessage("심심"), true);

test("'오늘 힘들었어' → warm", isNegativeOrColdMessage("오늘 힘들었어"), false);
test("'밥 먹었어?' → warm", isNegativeOrColdMessage("밥 먹었어?"), false);
test("'야 나 왔어' → warm", isNegativeOrColdMessage("야 나 왔어"), false);
test("'좋아해' → warm", isNegativeOrColdMessage("좋아해"), false);
test("'회사 끝났다~' → warm", isNegativeOrColdMessage("회사 끝났다~"), false);

// ─────────────────────────────────────────────
// 2. inferEmotionFromUserMessage
// ─────────────────────────────────────────────

console.log("\n[2] inferEmotionFromUserMessage — 패턴 매칭");

test("'좋아해' → excited", inferEmotionFromUserMessage("좋아해"), "excited");
test("'보고 싶어' → excited", inferEmotionFromUserMessage("보고 싶어"), "excited");
test("'챗GPT' → pouty", inferEmotionFromUserMessage("챗GPT"), "pouty");
test("'약속 취소' → pouty", inferEmotionFromUserMessage("약속 취소"), "pouty");
test("'최고야' → happy", inferEmotionFromUserMessage("최고야"), "happy");
test("'ㅇ' → hurt", inferEmotionFromUserMessage("ㅇ"), "hurt");
test("'응' → hurt", inferEmotionFromUserMessage("응"), "hurt");
test("'뭐해' → bored", inferEmotionFromUserMessage("뭐해"), "bored");
test("'미안 늦었어' → hurt", inferEmotionFromUserMessage("미안 늦게 답장해서"), "hurt");
test("'오늘 힘들었어' → null (패턴 없음)", inferEmotionFromUserMessage("오늘 힘들었어"), null);

// ─────────────────────────────────────────────
// 3. resolveCharacterEmotion — 온고잉 세션
// ─────────────────────────────────────────────

console.log("\n[3] resolveCharacterEmotion — 온고잉 세션");

const recentHistory: Message[] = [
  makeMessage("user", 40),   // 40분 전 (두 번째 최근 유저 메시지)
  makeMessage("assistant", 38),
  makeMessage("user", 5),    // 5분 전 (최근 유저 메시지 — prev로 쓰임)
];

// ongoingSession = true일 때 warm msg → happy
test(
  "온고잉 + warm → happy",
  resolveCharacterEmotion(
    { userMessage: "오늘 점심 뭐 먹었어?", lastChatAt: minutesAgo(5), lastSeenAt: minutesAgo(60), affectionWillIncrease: true },
    undefined,
    recentHistory
  ),
  "happy"
);

// ongoingSession = true, 호감도 증가 — #23 pickPositiveEmotion: happy or excited
{
  const ongoingAffection = resolveCharacterEmotion(
    { userMessage: "회사 끝나고 생각났어", lastChatAt: minutesAgo(3), lastSeenAt: minutesAgo(40), affectionWillIncrease: true },
    undefined,
    recentHistory
  );
  test(
    "온고잉 + affection → happy or excited",
    ongoingAffection === "happy" || ongoingAffection === "excited",
    true
  );
}

// ─────────────────────────────────────────────
// 4. resolveCharacterEmotion — 재접속 (비온고잉) + warm
// ─────────────────────────────────────────────

console.log("\n[4] resolveCharacterEmotion — 재접속 + warm 메시지");

const noHistory: Message[] = [];

// 1~3h gap + warm → happy (이전: hurt)
test(
  "1h 갭 + warm → happy (not hurt)",
  resolveCharacterEmotion(
    { userMessage: "야 오늘 힘들었어ㅠ", lastChatAt: hoursAgo(1.5), lastSeenAt: hoursAgo(2), affectionWillIncrease: true },
    undefined,
    noHistory
  ),
  "happy"
);

test(
  "2h 갭 + warm → happy (not hurt)",
  resolveCharacterEmotion(
    { userMessage: "회사 끝났다!!", lastChatAt: hoursAgo(2), lastSeenAt: hoursAgo(2.5), affectionWillIncrease: true },
    undefined,
    noHistory
  ),
  "happy"
);

// 3h+ gap + warm → miss_you (이전: pouty)
test(
  "3h 갭 + warm → miss_you (not pouty)",
  resolveCharacterEmotion(
    { userMessage: "왔어~ 바빴어", lastChatAt: hoursAgo(3.5), lastSeenAt: hoursAgo(4), affectionWillIncrease: true },
    undefined,
    noHistory
  ),
  "miss_you"
);

test(
  "5h 갭 + warm → miss_you (not pouty)",
  resolveCharacterEmotion(
    { userMessage: "오늘 퇴근하고 너 생각났어", lastChatAt: hoursAgo(5), lastSeenAt: hoursAgo(5.5), affectionWillIncrease: true },
    undefined,
    noHistory
  ),
  "miss_you"
);

// 24h+ gap → miss_you (unchanged, warm/cold 관계없이)
test(
  "24h 갭 → miss_you",
  resolveCharacterEmotion(
    { userMessage: "오랜만이야", lastChatAt: hoursAgo(25), lastSeenAt: hoursAgo(26), affectionWillIncrease: true },
    undefined,
    noHistory
  ),
  "miss_you"
);

// ─────────────────────────────────────────────
// 5. resolveCharacterEmotion — 재접속 + cold
// ─────────────────────────────────────────────

console.log("\n[5] resolveCharacterEmotion — 재접속 + cold 메시지");

// '응', 'ㅇㅇ', '몰라' 등은 inferEmotionFromUserMessage가 먼저 "hurt"를 반환 (시간 로직 우선권 없음)
test(
  "1h 갭 + cold '응' → hurt (패턴 직접 캐치)",
  resolveCharacterEmotion(
    { userMessage: "응", lastChatAt: hoursAgo(1.5), lastSeenAt: hoursAgo(2), affectionWillIncrease: true },
    undefined,
    noHistory
  ),
  "hurt"
);

test(
  "3h 갭 + cold 'ㅇㅇ' → hurt (패턴 직접 캐치, 시간 로직 전에 반환)",
  resolveCharacterEmotion(
    { userMessage: "ㅇㅇ", lastChatAt: hoursAgo(3.5), lastSeenAt: hoursAgo(4), affectionWillIncrease: true },
    undefined,
    noHistory
  ),
  "hurt"
);

test(
  "5h 갭 + cold '몰라' → hurt (패턴 직접 캐치)",
  resolveCharacterEmotion(
    { userMessage: "몰라", lastChatAt: hoursAgo(5), lastSeenAt: hoursAgo(5.5), affectionWillIncrease: true },
    undefined,
    noHistory
  ),
  "hurt"
);

// 단일 글자(패턴 미해당, 1글자 이하 → isNegativeOrColdMessage=true) + 시간 갭 → pouty
test(
  "3h 갭 + 한 글자 'ㄴ' → pouty (패턴 미해당, isNegativeOrColdMessage=true)",
  resolveCharacterEmotion(
    { userMessage: "ㄴ", lastChatAt: hoursAgo(3.5), lastSeenAt: hoursAgo(4), affectionWillIncrease: true },
    undefined,
    noHistory
  ),
  "pouty"
);

// 단일 글자 + 1h 갭 → hurt
test(
  "1h 갭 + 한 글자 '.' → hurt (isNegativeOrColdMessage=true)",
  resolveCharacterEmotion(
    { userMessage: ".", lastChatAt: hoursAgo(1.5), lastSeenAt: hoursAgo(2), affectionWillIncrease: true },
    undefined,
    noHistory
  ),
  "hurt"
);

// ─────────────────────────────────────────────
// 6. resolveCharacterEmotion — 패턴 우선 (메시지 패턴 > 시간 갭)
// ─────────────────────────────────────────────

console.log("\n[6] inferEmotionFromUserMessage 패턴 > 시간 갭 우선순위");

// 3h gap이지만 '좋아해' → excited (패턴이 우선)
test(
  "3h 갭 + '좋아해' → excited (패턴 우선)",
  resolveCharacterEmotion(
    { userMessage: "좋아해", lastChatAt: hoursAgo(3.5), lastSeenAt: hoursAgo(4), affectionWillIncrease: true },
    undefined,
    noHistory
  ),
  "excited"
);

// 3h gap + 챗GPT 언급 → pouty (패턴)
test(
  "3h 갭 + '챗GPT 써봤어' → pouty (패턴)",
  resolveCharacterEmotion(
    { userMessage: "챗GPT 써봤어", lastChatAt: hoursAgo(3.5), lastSeenAt: hoursAgo(4), affectionWillIncrease: true },
    undefined,
    noHistory
  ),
  "pouty"
);

// special_day 유지
test(
  "currentEmotion=special_day → special_day",
  resolveCharacterEmotion(
    { userMessage: "안녕", lastChatAt: hoursAgo(3.5), lastSeenAt: hoursAgo(4), currentEmotion: "special_day" },
    undefined,
    noHistory
  ),
  "special_day"
);

// ─────────────────────────────────────────────
// 7. countEmotionDurationTurns
// ─────────────────────────────────────────────

console.log("\n[7] countEmotionDurationTurns");

const hurtHistory: Message[] = [
  makeMessage("assistant", 30, "happy"),
  makeMessage("assistant", 20, "hurt"),
  makeMessage("assistant", 10, "hurt"),
];

test("hurt 2턴 연속 → 3 (이번 포함)", countEmotionDurationTurns(hurtHistory, "hurt"), 3);
test("happy 카운트 → 1 (hurt/pouty 아님)", countEmotionDurationTurns(hurtHistory, "happy"), 1);

const mixedHistory: Message[] = [
  makeMessage("assistant", 50, "pouty"),
  makeMessage("assistant", 30, "hurt"),
  makeMessage("assistant", 10, "hurt"),
];

test("hurt 2연속 (앞에 pouty) → 3", countEmotionDurationTurns(mixedHistory, "hurt"), 3);

// ─────────────────────────────────────────────
// 8. isOngoingChatSession
// ─────────────────────────────────────────────

console.log("\n[8] isOngoingChatSession");

// isOngoingChatSession: prev = userMsgs[length - 2] (두 번째로 최근)
// gapMin = now - prev.createdAt / 60 < 45이면 true
const ongoingHist: Message[] = [
  makeMessage("user", 90),  // 90분 전 (3번째)
  makeMessage("user", 30),  // 30분 전 — prev (두 번째 최근 유저 메시지)
  makeMessage("user", 5),   // 5분 전 — 최근
];
const gapHist: Message[] = [
  makeMessage("user", 120), // 2h 전 — prev
  makeMessage("user", 10),  // 10분 전 — 최근
];

test("prev 유저메시지가 30분 전 → ongoing=true", isOngoingChatSession(ongoingHist), true);
test("prev 유저메시지가 2h 전 → ongoing=false", isOngoingChatSession(gapHist), false);
test("메시지 1개 → ongoing=false", isOngoingChatSession([makeMessage("user", 5)]), false);

// ─────────────────────────────────────────────
// 9. hurt/pouty 지속 + 캐릭터별 자동 회복
// ─────────────────────────────────────────────

console.log("\n[9] hurt/pouty 지속 및 캐릭터별 회복");

// 현재 감정 hurt, 중립 메시지 → 이전 턴 0개 (streak=0) → 유지
test(
  "hurt 0턴 지속 중 중립 메시지 → hurt 유지 (기본 임계 3)",
  resolveCharacterEmotion(
    {
      userMessage: "뭐해",
      lastChatAt: minutesAgo(5),
      lastSeenAt: minutesAgo(60),
      currentEmotion: "hurt",
      affectionWillIncrease: true,
    },
    undefined,
    [] // 이전 history 없음
  ),
  "hurt"
);

// 현재 감정 pouty, 중립, 이전 1턴 → streak=1 < 기본임계 3 → 유지
const poutyHistory1: Message[] = [
  makeMessage("assistant", 10, "pouty"),
];
test(
  "pouty 1턴 지속 중 중립 메시지 → pouty 유지",
  resolveCharacterEmotion(
    {
      userMessage: "오늘 뭐했어",
      lastChatAt: minutesAgo(5),
      lastSeenAt: minutesAgo(60),
      currentEmotion: "pouty",
      affectionWillIncrease: true,
    },
    undefined,
    poutyHistory1
  ),
  "pouty"
);

// jiyu: 임계값 2 — 이전 2턴이면 자동 회복 (happy or excited)
const poutyHistory2: Message[] = [
  makeMessage("assistant", 20, "pouty"),
  makeMessage("assistant", 10, "pouty"),
];
{
  const result = resolveCharacterEmotion(
    {
      userMessage: "오늘 뭐했어",
      lastChatAt: minutesAgo(5),
      lastSeenAt: minutesAgo(60),
      currentEmotion: "pouty",
      affectionWillIncrease: true,
      characterId: "jiyu",
    },
    undefined,
    poutyHistory2
  );
  test(
    "jiyu: pouty 2턴 + 중립 → 자동 회복 (happy or excited)",
    result === "happy" || result === "excited",
    true
  );
}

// yoonseo: 임계값 5 — 이전 2턴이면 아직 유지
{
  const result = resolveCharacterEmotion(
    {
      userMessage: "오늘 뭐했어",
      lastChatAt: minutesAgo(5),
      lastSeenAt: minutesAgo(60),
      currentEmotion: "pouty",
      affectionWillIncrease: true,
      characterId: "yoonseo",
    },
    undefined,
    poutyHistory2
  );
  test(
    "yoonseo: pouty 2턴 + 중립 → 아직 유지 (2 < 5)",
    result,
    "pouty"
  );
}

// eunha: 임계값 5 — 이전 5턴이면 자동 회복
const hurtHistory5: Message[] = [
  makeMessage("assistant", 50, "hurt"),
  makeMessage("assistant", 40, "hurt"),
  makeMessage("assistant", 30, "hurt"),
  makeMessage("assistant", 20, "hurt"),
  makeMessage("assistant", 10, "hurt"),
];
{
  const result = resolveCharacterEmotion(
    {
      userMessage: "어제 일은 어때",
      lastChatAt: minutesAgo(5),
      lastSeenAt: minutesAgo(60),
      currentEmotion: "hurt",
      affectionWillIncrease: true,
      characterId: "eunha",
    },
    undefined,
    hurtHistory5
  );
  test(
    "eunha: hurt 5턴 + 중립 → 자동 회복 (happy or excited)",
    result === "happy" || result === "excited",
    true
  );
}

// 사과 메시지 → 즉시 회복 (캐릭터 무관, streak 무관)
test(
  "hurt 상태에서 '미안해' → 즉시 회복 (happy or excited)",
  (() => {
    const r = resolveCharacterEmotion(
      {
        userMessage: "미안해",
        lastChatAt: minutesAgo(5),
        lastSeenAt: minutesAgo(60),
        currentEmotion: "hurt",
        affectionWillIncrease: true,
        characterId: "eunha", // 임계 높은 캐릭터도 사과엔 회복
      },
      undefined,
      poutyHistory1
    );
    return r === "happy" || r === "excited";
  })(),
  true
);

test(
  "pouty 상태에서 '잘못했어' → 즉시 회복",
  (() => {
    const r = resolveCharacterEmotion(
      {
        userMessage: "잘못했어 진짜",
        lastChatAt: minutesAgo(5),
        lastSeenAt: minutesAgo(60),
        currentEmotion: "pouty",
        affectionWillIncrease: true,
      },
      undefined,
      poutyHistory2
    );
    return r === "happy" || r === "excited";
  })(),
  true
);

// 사랑 메시지 (AFFECTION_PATTERN) → hurt 상태에서 회복
test(
  "hurt 상태에서 '좋아해' → 즉시 회복 (excited)",
  resolveCharacterEmotion(
    {
      userMessage: "좋아해",
      lastChatAt: minutesAgo(5),
      lastSeenAt: minutesAgo(60),
      currentEmotion: "hurt",
      affectionWillIncrease: true,
    },
    undefined,
    []
  ),
  "excited"
);

// 새 hurt 트리거 → hurt 중 'ㅇ' 입력 → hurt 유지
test(
  "hurt 상태에서 냉담 'ㅇ' → hurt 재유발",
  resolveCharacterEmotion(
    {
      userMessage: "ㅇ",
      lastChatAt: minutesAgo(5),
      lastSeenAt: minutesAgo(60),
      currentEmotion: "hurt",
      affectionWillIncrease: true,
    },
    undefined,
    []
  ),
  "hurt"
);

// hurt 상태가 아닌 경우 기존 로직 그대로
test(
  "현재 happy 상태 + 중립 메시지 → happy or excited",
  (() => {
    const r = resolveCharacterEmotion(
      {
        userMessage: "오늘 점심 뭐 먹었어",
        lastChatAt: minutesAgo(5),
        lastSeenAt: minutesAgo(60),
        currentEmotion: "happy",
        affectionWillIncrease: true,
      },
      undefined,
      recentHistory
    );
    return r === "happy" || r === "excited";
  })(),
  true
);

// ─────────────────────────────────────────────
// 결과
// ─────────────────────────────────────────────

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`결과: ${passed} passed, ${failed} failed (총 ${passed + failed}개)`);

if (failed > 0) {
  process.exit(1);
}
