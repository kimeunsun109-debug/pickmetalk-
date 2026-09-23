/**
 * 성별·MBTI·이상형 컨텍스트 파이프라인 검증 테스트
 * npm run test:gender-mbti 또는 npx tsx scripts/test_gender_mbti_context.mts
 */
import {
  extractUserContext,
  buildCommonContextBlock,
  getMbtiInteractionHint,
} from "../services/context.js";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, extra?: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${extra ? ` | ${extra}` : ""}`);
    failed++;
  }
}

// ── 1. extractUserContext: gender/mbti/idealType 전달 확인
console.log("\n[1] extractUserContext — gender/mbti/idealType 전달");
{
  const ctx = extractUserContext(null, {
    nickname: "준서",
    gender: "남성",
    mbti: "INFP",
    idealType: "다정하고 따뜻한 사람",
  });
  assert(ctx.gender === "남성", "gender 전달됨");
  assert(ctx.mbti === "INFP", "mbti 전달됨");
  assert(ctx.idealType === "다정하고 따뜻한 사람", "idealType 전달됨");
  assert(ctx.userName === "준서", "nickname -> userName");
}

// ── 2. extractUserContext: 빈 값 → undefined
console.log("\n[2] extractUserContext — 빈 값 처리");
{
  const ctx = extractUserContext(null, { gender: "", mbti: "" });
  assert(ctx.gender === undefined, "빈 gender → undefined");
  assert(ctx.mbti === undefined, "빈 mbti → undefined");
  assert(ctx.idealType === undefined, "없는 idealType → undefined");
}

// ── 3. buildCommonContextBlock: 성별 포함
console.log("\n[3] buildCommonContextBlock — 성별 포함");
{
  const ctx = extractUserContext(null, { gender: "여성", mbti: "ENFJ" });
  const block = buildCommonContextBlock(ctx);
  assert(block.includes("여성"), "성별 출력됨");
  assert(block.includes("ENFJ"), "MBTI 출력됨");
  assert(block.includes("따뜻한 공감"), "ENFJ 힌트 포함됨");
}

// ── 4. buildCommonContextBlock: 이상형 포함
console.log("\n[4] buildCommonContextBlock — 이상형 포함");
{
  const ctx = extractUserContext(null, {
    idealType: "유머 있고 배려심 깊은 사람",
  });
  const block = buildCommonContextBlock(ctx);
  assert(block.includes("이상형/선호 스타일"), "이상형 라벨 포함");
  assert(block.includes("유머 있고 배려심 깊은 사람"), "이상형 내용 포함");
}

// ── 5. buildCommonContextBlock: 성별·MBTI·이상형 없을 때 미포함
console.log("\n[5] buildCommonContextBlock — 미등록 시 미포함");
{
  const ctx = extractUserContext(null, { nickname: "지수" });
  const block = buildCommonContextBlock(ctx);
  assert(!block.includes("성별"), "성별 없으면 미출력");
  assert(!block.includes("MBTI"), "MBTI 없으면 미출력");
  assert(!block.includes("이상형"), "이상형 없으면 미출력");
  assert(block.includes("지수"), "닉네임은 출력됨");
}

// ── 6. getMbtiInteractionHint: 알려진 타입
console.log("\n[6] getMbtiInteractionHint — 타입별 힌트");
{
  assert(getMbtiInteractionHint("INFP") !== null, "INFP 힌트 있음");
  assert(getMbtiInteractionHint("ENTJ") !== null, "ENTJ 힌트 있음");
  assert(getMbtiInteractionHint("ESFP") !== null, "ESFP 힌트 있음");
  assert(getMbtiInteractionHint("ISTJ") !== null, "ISTJ 힌트 있음");
  assert(getMbtiInteractionHint("infp") !== null, "소문자 infp → 힌트 있음");
  assert(getMbtiInteractionHint("XXXX") === null, "미지 타입 → null");
}

// ── 7. 성별 정규화 — 영문 입력
console.log("\n[7] 성별 정규화 — 영문 입력");
{
  const ctxM = extractUserContext(null, { gender: "male" });
  const blockM = buildCommonContextBlock(ctxM);
  assert(blockM.includes("남성"), "male → 남성");

  const ctxF = extractUserContext(null, { gender: "female" });
  const blockF = buildCommonContextBlock(ctxF);
  assert(blockF.includes("여성"), "female → 여성");
}

// ── 8. 전체 필드 조합
console.log("\n[8] 전체 필드 조합 출력 확인");
{
  const ctx = extractUserContext(null, {
    nickname: "민준",
    gender: "남성",
    mbti: "ISTP",
    idealType: "독립적이고 쿨한 사람",
    job: "개발자",
    interests: "게임",
  });
  const block = buildCommonContextBlock(ctx);
  console.log("\n--- 생성된 블록 ---");
  console.log(block);
  console.log("---\n");

  assert(block.includes("민준"), "닉네임 포함");
  assert(block.includes("남성"), "성별 포함");
  assert(block.includes("ISTP"), "MBTI 포함");
  assert(block.includes("독립적이고 쿨한 사람"), "이상형 포함");
  assert(block.includes("개발자"), "직업 포함");
  assert(block.includes("게임"), "관심사 포함");
}

// ── Summary
console.log(`\n=== 결과: ${passed} 통과 / ${failed} 실패 ===\n`);
if (failed > 0) process.exit(1);
