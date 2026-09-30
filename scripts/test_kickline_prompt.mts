/**
 * test_kickline_prompt.mts — 킥 문장 프롬프트 통합 테스트
 *
 * 실행: npx tsx scripts/test_kickline_prompt.mts
 */

import { buildKickLineHint } from "../prompts/kickLines";
import { buildNaturalSystemPrompt } from "../prompts/natural";

let passed = 0;
let failed = 0;

function test(desc: string, condition: boolean) {
  if (condition) {
    console.log(`  ✓ ${desc}`);
    passed++;
  } else {
    console.error(`  ✗ ${desc}`);
    failed++;
  }
}

// ── buildKickLineHint 단위 테스트 ──────────────────────────────

console.log("\n[1] buildKickLineHint — closing 감지");

{
  const result = buildKickLineHint({
    characterId: "yuna",
    userMessage: "잘 자",
    turnCount: 5,
  });
  test("'잘 자' 메시지에 closing 힌트 반환", result.includes("[킥 문장 힌트"));
  test("closing 힌트에 카테고리 label 포함", result.includes("마무리"));
}

console.log("\n[2] buildKickLineHint — 모멘텀 턴 (6번째 배수)");

{
  // turnCount 6 은 6 % 6 === 0 이고 > 0 이므로 isMomentumTurn = true
  // yuna 의 microKickChance = 0.3 — 확률적이므로 여러 번 시도해서 최소 1회 반환 확인
  let hitCount = 0;
  for (let i = 0; i < 100; i++) {
    const r = buildKickLineHint({ characterId: "yuna", userMessage: "그렇구나", turnCount: 6 });
    if (r.length > 0) hitCount++;
  }
  test("모멘텀 턴(6)에서 100회 중 최소 1회 킥 문장 반환", hitCount >= 1);
}

console.log("\n[3] buildKickLineHint — 일반 턴 (빈 문자열)");

{
  // turnCount 1 (모멘텀 아님), 메시지도 일반 — 대부분 empty. 완전히 0이어야 하진 않음(big kick 확률)
  const result = buildKickLineHint({
    characterId: "yoonseo",
    userMessage: "어 그렇구나",
    turnCount: 1,
  });
  // 반드시 빈 문자열이라고 단정할 수 없으나 closing·big kick이 아니면 보통 ""
  // 형식 검증: 반환값이 string임을 확인
  test("반환값이 string 타입", typeof result === "string");
}

console.log("\n[4] buildNaturalSystemPrompt — kickLine 통합 확인");

{
  // closing 상황 → 반드시 킥 문장 블록이 들어가야 함
  const prompt = buildNaturalSystemPrompt({
    characterId: "yuna",
    emotion: "happy",
    level: 3,
    affection: 60,
    memorySummary: null,
    userMessage: "잘 자",
    turnCount: 10,
  });
  test("프롬프트에 킥 문장 힌트 섹션 포함", prompt.includes("[킥 문장 힌트"));
  test("프롬프트에 Identity 섹션 포함", prompt.includes("유나"));
  test("프롬프트에 Being 섹션 포함", prompt.includes("Her"));
  test("프롬프트가 500자 이상 (기본 블록 있음)", prompt.length >= 500);
}

console.log("\n[5] buildNaturalSystemPrompt — 일반 턴 (kickLine 없음)");

{
  // turnCount 1, 일반 메시지 → 킥 문장 없을 가능성이 높음 (확률 기반이라 보장 불가)
  // 대신 프롬프트 구조가 정상인지 확인
  const prompt = buildNaturalSystemPrompt({
    characterId: "narin",
    emotion: "happy",
    level: 2,
    affection: 30,
    userMessage: "오늘 피곤하다",
    turnCount: 1,
  });
  test("프롬프트에 나린 Identity 포함", prompt.includes("나린"));
  test("프롬프트에 Being 섹션 포함", prompt.includes("Her"));
  test("프롬프트가 string 타입", typeof prompt === "string");
}

console.log("\n[6] 캐릭터별 closing 힌트 — 5 캐릭터 모두 반환 확인");

{
  const characters = ["yuna", "narin", "yoonseo", "eunha", "jiyu"];
  for (const ch of characters) {
    const r = buildKickLineHint({ characterId: ch, userMessage: "굿나잇", turnCount: 5 });
    test(`${ch} — closing 메시지에 킥 문장 힌트 반환`, r.includes("[킥 문장 힌트"));
  }
}

console.log("\n[7] turnCount=0 edge case");

{
  const result = buildKickLineHint({ characterId: "jiyu", userMessage: "", turnCount: 0 });
  test("turnCount=0, 빈 메시지 → string 반환 (패닉 없음)", typeof result === "string");
}

// ── 결과 ──────────────────────────────────────────────────────

console.log(`\n${"─".repeat(50)}`);
console.log(`결과: ${passed + failed}개 테스트 — ✓ ${passed} 통과, ✗ ${failed} 실패`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log("모든 테스트 통과 ✅");
}
