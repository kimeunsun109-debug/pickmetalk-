/**
 * 테스트: gender / MBTI / idealType 컨텍스트 파이프라인
 *
 * extractUserContext + buildCommonContextBlock이 gender/mbti/idealType을
 * 올바르게 처리하고 프롬프트 블록에 포함하는지 검증.
 */

import {
  extractUserContext,
  buildCommonContextBlock,
} from "../services/context.js";

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${name}`);
    failed++;
  }
}

// ─────────────────────────────────────────────
// 1. extractUserContext — 필드 추출
// ─────────────────────────────────────────────
console.log("\n[1] extractUserContext — gender/mbti/idealType 추출");

{
  const ctx = extractUserContext(null, {
    nickname: "민준",
    gender: "male",
    mbti: "intj",
    idealType: "자상하고 유머 있는 사람",
  });
  assert("gender 추출 (male)", ctx.gender === "male");
  assert("mbti 추출 + 소문자 허용", ctx.mbti === "intj");
  assert("idealType 추출", ctx.idealType === "자상하고 유머 있는 사람");
  assert("userName 추출", ctx.userName === "민준");
}

{
  const ctx = extractUserContext(null, {
    gender: "  ",    // 공백만 → undefined
    mbti: "",        // 빈 문자열 → undefined
    idealType: "  ", // 공백만 → undefined
  });
  assert("공백 gender → undefined", ctx.gender === undefined);
  assert("빈 mbti → undefined", ctx.mbti === undefined);
  assert("공백 idealType → undefined", ctx.idealType === undefined);
}

{
  const ctx = extractUserContext(null, {});
  assert("미제공 → undefined (gender)", ctx.gender === undefined);
  assert("미제공 → undefined (mbti)", ctx.mbti === undefined);
  assert("미제공 → undefined (idealType)", ctx.idealType === undefined);
}

// ─────────────────────────────────────────────
// 2. buildCommonContextBlock — 출력 확인
// ─────────────────────────────────────────────
console.log("\n[2] buildCommonContextBlock — 프롬프트 블록 출력");

{
  const ctx = extractUserContext(null, {
    nickname: "지훈",
    gender: "male",
    mbti: "INFP",
    idealType: "따뜻하고 진솔한 사람",
  });
  const block = buildCommonContextBlock(ctx);
  assert("블록이 비어 있지 않음", block.length > 0);
  assert("성별: 남성 포함", block.includes("성별: 남성"));
  assert("MBTI: INFP 포함", block.includes("MBTI: INFP"));
  assert("INFP 행동 힌트 포함", block.includes("감수성"));
  assert("이상형 키워드 포함", block.includes("따뜻하고 진솔한 사람"));
  assert("직접 언급 금지 주석 포함", block.includes("직접 언급 금지"));
  console.log("\n  샘플 출력:\n" + block.split("\n").map(l => "    " + l).join("\n"));
}

{
  const ctx = extractUserContext(null, {
    gender: "female",
    mbti: "ENFP",
  });
  const block = buildCommonContextBlock(ctx);
  assert("female → 여성", block.includes("성별: 여성"));
  assert("ENFP 힌트 포함", block.includes("에너지 넘치고 창의적"));
}

{
  const ctx = extractUserContext(null, {
    gender: "남",   // 한국어 약식
    mbti: "ESTP",
  });
  const block = buildCommonContextBlock(ctx);
  assert("'남' → 남성 변환", block.includes("성별: 남성"));
}

{
  const ctx = extractUserContext(null, {
    gender: "여",   // 한국어 약식
    mbti: "ISFJ",
  });
  const block = buildCommonContextBlock(ctx);
  assert("'여' → 여성 변환", block.includes("성별: 여성"));
}

{
  const ctx = extractUserContext(null, {
    mbti: "ZZZZ",  // 정의되지 않은 MBTI — 힌트 없이 그대로 출력
  });
  const block = buildCommonContextBlock(ctx);
  assert("미정의 MBTI — 힌트 없이 포함", block.includes("MBTI: ZZZZ"));
}

// ─────────────────────────────────────────────
// 3. gender/mbti 없을 때 블록 내 해당 라인 없음
// ─────────────────────────────────────────────
console.log("\n[3] gender/mbti 미제공 시 관련 라인 미포함");

{
  const ctx = extractUserContext(null, { nickname: "수진" });
  const block = buildCommonContextBlock(ctx);
  assert("성별 라인 없음", !block.includes("성별:"));
  assert("MBTI 라인 없음", !block.includes("MBTI:"));
  assert("이상형 라인 없음", !block.includes("이상형"));
}

// ─────────────────────────────────────────────
// 4. 16가지 MBTI 유형 모두 힌트 확인
// ─────────────────────────────────────────────
console.log("\n[4] 16개 MBTI 유형 — 힌트 존재 확인");

const ALL_MBTI = [
  "INTJ","INTP","ENTJ","ENTP",
  "INFJ","INFP","ENFJ","ENFP",
  "ISTJ","ISFJ","ESTJ","ESFJ",
  "ISTP","ISFP","ESTP","ESFP",
];

for (const mbti of ALL_MBTI) {
  const ctx = extractUserContext(null, { mbti });
  const block = buildCommonContextBlock(ctx);
  assert(`${mbti} 힌트 포함`, block.includes(`MBTI: ${mbti} —`));
}

// ─────────────────────────────────────────────
// 결과 요약
// ─────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`결과: ${passed} passed / ${failed} failed`);
if (failed > 0) process.exit(1);
