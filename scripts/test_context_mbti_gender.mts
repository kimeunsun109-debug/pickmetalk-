/**
 * gender/MBTI/idealType → extractUserContext/buildCommonContextBlock 단위 테스트
 * npx tsx scripts/test_context_mbti_gender.mts
 */

import {
  extractUserContext,
  buildCommonContextBlock,
} from "@/services/context";

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

function assertIncludes(label: string, text: string, substr: string) {
  if (text.includes(substr)) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}`);
    console.error(`     expected to include: "${substr}"`);
    console.error(`     in: "${text}"`);
    failed++;
  }
}

function assertNotIncludes(label: string, text: string, substr: string) {
  if (!text.includes(substr)) {
    console.log(`  ✅ ${label}`);
    passed++;
  } else {
    console.error(`  ❌ ${label}`);
    console.error(`     expected NOT to include: "${substr}"`);
    console.error(`     in: "${text}"`);
    failed++;
  }
}

// ─────────────────────────────────────────────
// extractUserContext — gender 정규화
// ─────────────────────────────────────────────
console.log("\n[extractUserContext — gender 정규화]");

{
  const ctx = extractUserContext(null, { gender: "male" });
  assert("male → 남성", ctx.gender, "남성");
}
{
  const ctx = extractUserContext(null, { gender: "female" });
  assert("female → 여성", ctx.gender, "여성");
}
{
  const ctx = extractUserContext(null, { gender: "남성" });
  assert("남성 → 남성 (그대로)", ctx.gender, "남성");
}
{
  const ctx = extractUserContext(null, { gender: "여자" });
  assert("여자 → 여성", ctx.gender, "여성");
}
{
  const ctx = extractUserContext(null, { gender: "논바이너리" });
  assert("논바이너리 → 논바이너리 (그대로)", ctx.gender, "논바이너리");
}
{
  const ctx = extractUserContext(null, {});
  assert("gender 없으면 undefined", ctx.gender, undefined);
}

// ─────────────────────────────────────────────
// extractUserContext — MBTI 검증·정규화
// ─────────────────────────────────────────────
console.log("\n[extractUserContext — MBTI 검증]");

{
  const ctx = extractUserContext(null, { mbti: "isfj" });
  assert("소문자 isfj → ISFJ", ctx.mbti, "ISFJ");
}
{
  const ctx = extractUserContext(null, { mbti: "ENFP" });
  assert("대문자 ENFP 통과", ctx.mbti, "ENFP");
}
{
  const ctx = extractUserContext(null, { mbti: "entp" });
  assert("소문자 entp → ENTP", ctx.mbti, "ENTP");
}
{
  const ctx = extractUserContext(null, { mbti: "invalid" });
  assert("잘못된 MBTI → undefined", ctx.mbti, undefined);
}
{
  const ctx = extractUserContext(null, { mbti: "ABCD" });
  assert("ABCD → undefined (유효하지 않은 패턴)", ctx.mbti, undefined);
}
{
  const ctx = extractUserContext(null, { mbti: "  ISTJ  " });
  assert("공백 포함 ISTJ 정규화", ctx.mbti, "ISTJ");
}
{
  const ctx = extractUserContext(null, {});
  assert("mbti 없으면 undefined", ctx.mbti, undefined);
}

// ─────────────────────────────────────────────
// extractUserContext — idealType
// ─────────────────────────────────────────────
console.log("\n[extractUserContext — idealType]");

{
  const ctx = extractUserContext(null, { idealType: "키 크고 다정한 사람" });
  assert("idealType 그대로 전달", ctx.idealType, "키 크고 다정한 사람");
}
{
  const ctx = extractUserContext(null, { idealType: "  다정한 사람  " });
  assert("idealType 공백 trim", ctx.idealType, "다정한 사람");
}
{
  const ctx = extractUserContext(null, { idealType: "" });
  assert("빈 idealType → undefined", ctx.idealType, undefined);
}
{
  const ctx = extractUserContext(null, {});
  assert("idealType 없으면 undefined", ctx.idealType, undefined);
}

// ─────────────────────────────────────────────
// buildCommonContextBlock — gender 출력
// ─────────────────────────────────────────────
console.log("\n[buildCommonContextBlock — gender 출력]");

{
  const block = buildCommonContextBlock({
    userInterests: [],
    gender: "남성",
  });
  assertIncludes("남성 성별 라인 포함", block, "- 성별: 남성");
}
{
  const block = buildCommonContextBlock({
    userInterests: [],
  });
  assertNotIncludes("gender 없으면 성별 라인 없음", block, "- 성별:");
}

// ─────────────────────────────────────────────
// buildCommonContextBlock — MBTI + 힌트 출력
// ─────────────────────────────────────────────
console.log("\n[buildCommonContextBlock — MBTI 힌트 출력]");

{
  const block = buildCommonContextBlock({
    userInterests: [],
    mbti: "ISFJ",
  });
  assertIncludes("ISFJ 라인 포함", block, "ISFJ");
  assertIncludes("ISFJ 힌트 포함 (섬세)", block, "섬세하고");
}
{
  const block = buildCommonContextBlock({
    userInterests: [],
    mbti: "ENFP",
  });
  assertIncludes("ENFP 라인 포함", block, "ENFP");
  assertIncludes("ENFP 힌트 포함 (에너지)", block, "에너지");
}
{
  const block = buildCommonContextBlock({
    userInterests: [],
    mbti: "INTJ",
  });
  assertIncludes("INTJ 힌트 포함 (논리적)", block, "논리적이고");
}
{
  const block = buildCommonContextBlock({
    userInterests: [],
  });
  assertNotIncludes("MBTI 없으면 MBTI 라인 없음", block, "- MBTI:");
}

// ─────────────────────────────────────────────
// buildCommonContextBlock — idealType 출력
// ─────────────────────────────────────────────
console.log("\n[buildCommonContextBlock — idealType 출력]");

{
  const block = buildCommonContextBlock({
    userInterests: [],
    idealType: "키 크고 다정한 사람",
  });
  assertIncludes("이상형 라인 포함", block, "이상형:");
  assertIncludes("이상형 내용 포함", block, "키 크고 다정한 사람");
  assertIncludes("이상형 활용 힌트 포함", block, "자연스럽게 녹여내도");
}
{
  const block = buildCommonContextBlock({
    userInterests: [],
  });
  assertNotIncludes("idealType 없으면 이상형 라인 없음", block, "이상형:");
}

// ─────────────────────────────────────────────
// buildCommonContextBlock — 통합 출력 순서
// ─────────────────────────────────────────────
console.log("\n[buildCommonContextBlock — 통합 출력]");

{
  const block = buildCommonContextBlock({
    userName: "민준",
    gender: "남성",
    userAge: "28",
    userJob: "개발자",
    mbti: "INTP",
    idealType: "지적이고 유머있는 사람",
    userInterests: ["게임", "영화"],
  });
  assertIncludes("헤더 포함", block, "[유저 컨텍스트");
  assertIncludes("닉네임 포함", block, "민준");
  assertIncludes("성별 포함", block, "남성");
  assertIncludes("나이 포함", block, "28세");
  assertIncludes("직업 포함", block, "개발자");
  assertIncludes("MBTI INTP 포함", block, "INTP");
  assertIncludes("이상형 포함", block, "지적이고");
  assertIncludes("관심사 포함", block, "게임");
}

// ─────────────────────────────────────────────
// 결과
// ─────────────────────────────────────────────
console.log(`\n결과: ${passed}개 통과 / ${failed}개 실패`);
if (failed > 0) process.exit(1);
