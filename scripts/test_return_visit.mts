/**
 * test_return_visit.mts
 *
 * returnVisit 메시지 풀 + ongoing session emotion variety 검증
 *
 * 실행: npx tsx scripts/test_return_visit.mts
 */

import { getReturnVisitData, getAbsenceTier } from "@/lib/returnVisit";
import {
  resolveCharacterEmotion,
  isOngoingChatSession,
} from "@/services/emotion";
import type { Message } from "@/types";

// ─────────────────────────────────────────────
// 유틸
// ─────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${label}`);
    failed++;
  }
}

// ─────────────────────────────────────────────
// 1. returnVisit 메시지 풀 크기 검증
// ─────────────────────────────────────────────

const CHARACTERS = ["yuna", "narin", "yoonseo", "eunha", "jiyu"];
const TIERS = ["tier1", "tier2", "tier3"] as const;
const MIN_POOL_SIZE = 5;

console.log("\n── [1] returnVisit 메시지 풀 크기 ──");

for (const char of CHARACTERS) {
  for (const tier of TIERS) {
    // 여러 번 호출해 다양한 메시지가 나오는지 확인
    const seen = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const data = getReturnVisitData(char, tier);
      seen.add(data.message);
    }
    assert(
      seen.size >= MIN_POOL_SIZE,
      `${char}/${tier}: 메시지 다양성 ${seen.size}종 ≥ ${MIN_POOL_SIZE}`
    );
  }
}

// ─────────────────────────────────────────────
// 2. getReturnVisitData 필드 완전성
// ─────────────────────────────────────────────

console.log("\n── [2] ReturnVisitData 필드 완전성 ──");

for (const char of CHARACTERS) {
  for (const tier of TIERS) {
    const data = getReturnVisitData(char, tier);
    assert(
      typeof data.message === "string" && data.message.length > 0,
      `${char}/${tier}: message 존재`
    );
    assert(
      typeof data.subMessage === "string" && data.subMessage.length > 0,
      `${char}/${tier}: subMessage 존재`
    );
    assert(
      typeof data.emoji === "string" && data.emoji.length > 0,
      `${char}/${tier}: emoji 존재`
    );
    assert(data.tier === tier, `${char}/${tier}: tier 일치`);
    assert(
      typeof data.ctaLabel === "string" && data.ctaLabel.length > 0,
      `${char}/${tier}: ctaLabel 존재`
    );
  }
}

// ─────────────────────────────────────────────
// 3. getAbsenceTier 경계값
// ─────────────────────────────────────────────

console.log("\n── [3] getAbsenceTier 경계값 ──");

assert(getAbsenceTier(23) === null,   "23h → null (이벤트 없음)");
assert(getAbsenceTier(24) === "tier1","24h → tier1");
assert(getAbsenceTier(71) === "tier1","71h → tier1");
assert(getAbsenceTier(72) === "tier2","72h → tier2");
assert(getAbsenceTier(167) === "tier2","167h → tier2");
assert(getAbsenceTier(168) === "tier3","168h → tier3");
assert(getAbsenceTier(500) === "tier3","500h → tier3");

// ─────────────────────────────────────────────
// 4. Ongoing session emotion variety (excited)
// ─────────────────────────────────────────────

console.log("\n── [4] Ongoing session emotion variety ──");

const now = new Date();
const recentMsg = (offsetMin: number): Message => ({
  id: String(offsetMin),
  role: "user",
  content: "안녕",
  createdAt: new Date(now.getTime() - offsetMin * 60 * 1000).toISOString(),
  conversationId: "c1",
});

const assistantMsg = (emotion: string, offsetMin: number): Message => ({
  id: `a${offsetMin}`,
  role: "assistant",
  content: "응",
  emotion: emotion as Message["emotion"],
  createdAt: new Date(now.getTime() - offsetMin * 60 * 1000).toISOString(),
  conversationId: "c1",
});

// 진행 중 세션 확인
const ongoingHistory: Message[] = [
  recentMsg(10),
  recentMsg(5),
];
assert(
  isOngoingChatSession(ongoingHistory),
  "진행 중 세션 감지: 5분 전 메시지"
);

// 비진행 세션 확인 (60분 전 마지막 유저 메시지)
const staleHistory: Message[] = [
  recentMsg(65),
  recentMsg(2),
];
assert(
  !isOngoingChatSession(staleHistory),
  "비진행 세션: 65분 전 이전 메시지"
);

// excited 비율 테스트: 100번 중 excited가 최소 1번 나와야 함
// 중립 메시지 사용 — "좋아해" 등은 AFFECTION_PATTERN에 직접 매칭되므로 제외
const NEUTRAL_MSG = "오늘 날씨 어때?";
const recentChatAt = new Date(now.getTime() - 5 * 60 * 1000).toISOString();

const excitedEmotions: string[] = [];
for (let i = 0; i < 100; i++) {
  const h: Message[] = [recentMsg(10), recentMsg(5)];
  const e = resolveCharacterEmotion(
    {
      userMessage: NEUTRAL_MSG,
      lastChatAt: recentChatAt,
      lastSeenAt: recentChatAt,
      affectionWillIncrease: true,
    },
    undefined,
    h
  );
  excitedEmotions.push(e);
}
const excitedCount = excitedEmotions.filter((e) => e === "excited").length;
const happyCount = excitedEmotions.filter((e) => e === "happy").length;
console.log(
  `  ℹ️  100번 샘플 (중립 메시지): excited=${excitedCount}, happy=${happyCount}`
);
assert(excitedCount > 0, "100번 중 excited 최소 1번 발생");
assert(happyCount > 0, "100번 중 happy 최소 1번 발생");
assert(excitedCount < 60, "excited가 happy보다 지배적이지 않음 (<60%)");

// 최근 excited 연속 시 happy로 수렴
const historyWithExcited: Message[] = [
  recentMsg(10),
  assistantMsg("excited", 9),
  recentMsg(7),
  assistantMsg("excited", 6),
  recentMsg(4),
  assistantMsg("excited", 3),
  recentMsg(1),
];

let happyAfterExcited = 0;
for (let i = 0; i < 50; i++) {
  const e = resolveCharacterEmotion(
    {
      userMessage: NEUTRAL_MSG,
      lastChatAt: new Date(now.getTime() - 1 * 60 * 1000).toISOString(),
      lastSeenAt: new Date(now.getTime() - 1 * 60 * 1000).toISOString(),
      affectionWillIncrease: true,
    },
    undefined,
    historyWithExcited
  );
  if (e === "happy") happyAfterExcited++;
}
assert(
  happyAfterExcited === 50,
  "최근 excited 3회 연속 → 50/50 모두 happy"
);

// ─────────────────────────────────────────────
// 5. {nick} 닉네임 치환 (#24)
// ─────────────────────────────────────────────

console.log("\n── [5] {nick} 닉네임 치환 ──");

const NICK = "민수";
for (const char of CHARACTERS) {
  for (const tier of TIERS) {
    const data = getReturnVisitData(char, tier, NICK);
    assert(
      !data.message.includes("{nick}") && !data.subMessage.includes("{nick}"),
      `${char}/${tier}: nickname=${NICK} → 미치환 {nick} 없음`
    );
  }
}

// nickname 없을 때 {nick} 풀 항목 제외
for (let i = 0; i < 50; i++) {
  const data = getReturnVisitData("yuna", "tier1");
  assert(
    !data.message.includes("{nick}") && !data.subMessage.includes("{nick}"),
    `yuna/tier1 (no nick): 미치환 {nick} 노출 없음 (sample ${i + 1})`
  );
}

const nickData = getReturnVisitData("yuna", "tier1", NICK);
// 닉네임 제공 시 {nick} 풀에서 선택 가능 — 50회 중 최소 1회 닉네임 포함 기대
let nickSeen = 0;
for (let i = 0; i < 50; i++) {
  const d = getReturnVisitData("yuna", "tier1", NICK);
  if (d.message.includes(NICK) || d.subMessage.includes(NICK)) nickSeen++;
}
assert(nickSeen > 0, `yuna/tier1 + nick: 50회 중 닉네임 삽입 ${nickSeen}회 > 0`);

// ─────────────────────────────────────────────
// 결과
// ─────────────────────────────────────────────

console.log(`\n══ 결과: ${passed} passed / ${failed} failed ══\n`);
if (failed > 0) process.exit(1);
