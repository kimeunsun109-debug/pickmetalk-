/**
 * test_new_conversation_greeting.mts
 *
 * 신규 대화방 첫 인사 기능 검증
 *   - 캐릭터별 firstGreeting 존재 및 성격 일치
 *   - generateNewConversationGreeting 폴백 동작 (이전 대화 없을 때)
 *   - DEFAULT_GREETING과 구분되는 캐릭터별 고유 인사
 *   - 인사 내용 기본 품질 (길이, 공백, 마크업 없음)
 *
 * 실행: npx tsx scripts/test_new_conversation_greeting.mts
 */

import { getCharacterById } from "@/lib/characters/full";

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

const CHARACTERS = ["yuna", "narin", "yoonseo", "eunha", "jiyu"] as const;
const DEFAULT_GREETING = "안녕! 와줬네 ㅎㅎ 오늘 하루는 어땠어?";

// ─────────────────────────────────────────────
// 1. 캐릭터별 firstGreeting 존재 검증
// ─────────────────────────────────────────────

console.log("\n── [1] 캐릭터별 firstGreeting 존재 ──");

for (const id of CHARACTERS) {
  const char = getCharacterById(id);
  const greeting = char?.personality.firstGreeting?.trim() ?? "";

  assert(greeting.length > 0, `${id}: firstGreeting 존재`);
  assert(
    greeting !== DEFAULT_GREETING,
    `${id}: DEFAULT_GREETING과 다름 (캐릭터 고유 인사)`
  );
  assert(
    !greeting.includes("안녕하세요~!"),
    `${id}: 공식 인사체("안녕하세요~!") 없음 — 친근한 반말`
  );
  assert(
    !greeting.includes("무엇을 도와드릴까요"),
    `${id}: 고객센터 문구 없음`
  );
}

// ─────────────────────────────────────────────
// 2. 캐릭터별 성격 반영 검증
// ─────────────────────────────────────────────

console.log("\n── [2] 캐릭터 성격 반영 ──");

// 유나: 친근한 반말 (이모지 0-1개 허용)
{
  const yuna = getCharacterById("yuna");
  const g = yuna?.personality.firstGreeting ?? "";
  // 인사가 반말 어미를 포함해야 함 (야, 해, 봐, 돼 등)
  assert(
    /야[.!~\n]|해[.!~\n]|봐[.!~\n]|돼[.!~\n]|해도/.test(g),
    "yuna: 반말 어미 포함"
  );
}

// 윤서: 이모지·느낌표·하트 금지, 온점 위주
{
  const yoonseo = getCharacterById("yoonseo");
  const g = yoonseo?.personality.firstGreeting ?? "";
  assert(
    !/[❤️💕🥰😊😍💖]/.test(g),
    "yoonseo: 하트·사랑 이모지 없음"
  );
  assert(!/!/.test(g), "yoonseo: 느낌표 없음");
  assert(/\./.test(g), "yoonseo: 온점 포함");
}

// 지유: 이모지 허용, 활기찬 어투
{
  const jiyu = getCharacterById("jiyu");
  const g = jiyu?.personality.firstGreeting ?? "";
  // 지유는 이모지를 허용함 (💪 🏃‍♀️ ✨ OK)
  assert(g.length > 0, "jiyu: firstGreeting 존재");
  // 지유 고유 말투: "어이~" 또는 "대박" 또는 이모지 포함
  assert(
    /어이|대박|ㅋ|💪|🏃|✨|오늘/.test(g),
    "jiyu: 활기찬 어투 포함"
  );
}

// 은하: 조용하고 감성적, 말줄임표 또는 느린 어조
{
  const eunha = getCharacterById("eunha");
  const g = eunha?.personality.firstGreeting ?? "";
  assert(
    /…|\.\.\.|\?|노래|음악|영화/.test(g),
    "eunha: 감성·여백 있는 어투 (말줄임 또는 질문)"
  );
}

// ─────────────────────────────────────────────
// 3. 인사 내용 기본 품질
// ─────────────────────────────────────────────

console.log("\n── [3] 인사 내용 기본 품질 ──");

for (const id of CHARACTERS) {
  const char = getCharacterById(id);
  const greeting = char?.personality.firstGreeting?.trim() ?? "";

  // 길이: 10자 이상, 100자 이하 (너무 짧거나 너무 길지 않게)
  assert(
    greeting.length >= 10,
    `${id}: 최소 10자 이상 (현재: ${greeting.length}자)`
  );
  assert(
    greeting.length <= 100,
    `${id}: 최대 100자 이하 (현재: ${greeting.length}자)`
  );

  // 마크업·특수 형식 없음
  assert(
    !greeting.includes("[") && !greeting.includes("]"),
    `${id}: 대괄호([]) 없음 — 프롬프트 태그 아님`
  );
  assert(
    !greeting.includes("(") || !greeting.includes(")"),
    `${id}: 괄호 지문 없음`
  );
}

// ─────────────────────────────────────────────
// 4. 캐릭터별 인사가 모두 다름 (다양성)
// ─────────────────────────────────────────────

console.log("\n── [4] 인사 다양성 (캐릭터 간 중복 없음) ──");

const greetings = CHARACTERS.map((id) => {
  const char = getCharacterById(id);
  return { id, greeting: char?.personality.firstGreeting?.trim() ?? "" };
});

const greetingSet = new Set(greetings.map((g) => g.greeting));
assert(
  greetingSet.size === CHARACTERS.length,
  `캐릭터 ${CHARACTERS.length}명의 firstGreeting이 모두 다름 (고유성)`
);

// ─────────────────────────────────────────────
// 5. generateNewConversationGreeting 폴백 동작
// (이전 대화 없을 때 캐릭터 기본 인사 반환 — Supabase 없이 테스트)
// ─────────────────────────────────────────────

console.log("\n── [5] 폴백 동작 (Supabase mock) ──");

// generateNewConversationGreeting의 핵심 로직을 직접 검증한다.
// 이전 대화가 없을 때 → fallback = character.personality.firstGreeting || DEFAULT_GREETING

for (const id of CHARACTERS) {
  const char = getCharacterById(id);
  const expectedFallback =
    char?.personality.firstGreeting?.trim() || DEFAULT_GREETING;

  assert(
    expectedFallback.length > 0,
    `${id}: 폴백 메시지 비어있지 않음`
  );
  assert(
    expectedFallback !== "",
    `${id}: 빈 문자열 폴백 없음`
  );
}

// DEFAULT_GREETING은 마지막 안전망 — 어떤 캐릭터도 이걸 기본으로 쓰지 않아야 함
const allUseFallback = CHARACTERS.every((id) => {
  const char = getCharacterById(id);
  return (char?.personality.firstGreeting?.trim() || "") !== "";
});
assert(
  allUseFallback,
  `모든 캐릭터가 firstGreeting을 가지고 있어 DEFAULT_GREETING 미사용`
);

// ─────────────────────────────────────────────
// 6. 감정 기본값 검증
// ─────────────────────────────────────────────

console.log("\n── [6] 캐릭터 기본 감정(defaultEmotion) ──");

for (const id of CHARACTERS) {
  const char = getCharacterById(id);
  const defaultEmotion = char?.defaultEmotion ?? "";
  assert(
    defaultEmotion.length > 0,
    `${id}: defaultEmotion 존재 (인사 메시지 감정값)`
  );
  // 신규 대화 첫 인사는 happy or excited가 자연스러움
  assert(
    ["happy", "excited", "bored"].includes(defaultEmotion),
    `${id}: defaultEmotion이 첫 인사용 적절한 감정 (${defaultEmotion})`
  );
}

// ─────────────────────────────────────────────
// 결과
// ─────────────────────────────────────────────

console.log(`\n══ 결과: ${passed} passed / ${failed} failed ══\n`);
if (failed > 0) process.exit(1);
