/**
 * 사용자 감정 감지 서비스 단위 테스트
 * 실행: npx tsx scripts/test_user_emotion_detector.mts
 */
import {
  detectUserEmotion,
  buildUserEmotionHintBlock,
  type UserEmotionCategory,
  type UserEmotionIntensity,
} from "../services/userEmotionDetector.js";

interface TestCase {
  message: string;
  expectedCategory: UserEmotionCategory | null;
  expectedIntensity?: UserEmotionIntensity;
  description: string;
}

const tests: TestCase[] = [
  // ── sad ──
  {
    message: "너무 힘들어 죽겠어 ㅠㅠ",
    expectedCategory: "sad",
    expectedIntensity: "high",
    description: "sad high: 너무 힘들어",
  },
  {
    message: "오늘 너무 슬퍼서 울었어",
    expectedCategory: "sad",
    expectedIntensity: "high",
    description: "sad high: 너무 슬퍼서 울었어",
  },
  {
    message: "좀 기분이 안 좋아",
    expectedCategory: "sad",
    expectedIntensity: "low",
    description: "sad low: 기분이 안 좋아",
  },

  // ── stressed ──
  {
    message: "진짜 한계야 더 못하겠어",
    expectedCategory: "stressed",
    expectedIntensity: "high",
    description: "stressed high: 한계야",
  },
  {
    message: "요즘 너무 스트레스 받아",
    expectedCategory: "stressed",
    expectedIntensity: "medium",
    description: "stressed medium: 스트레스",
  },
  {
    message: "좀 힘들긴 한데",
    expectedCategory: "stressed",
    expectedIntensity: "low",
    description: "stressed low: 좀 힘들긴",
  },

  // ── angry ──
  {
    message: "진짜 화나 열받아 ㅠ",
    expectedCategory: "angry",
    expectedIntensity: "high",
    description: "angry high: 열받아",
  },
  {
    message: "짜증나 진짜로",
    expectedCategory: "angry",
    expectedIntensity: "medium",
    description: "angry medium: 짜증나",
  },
  {
    message: "살짝 짜증스럽긴 해",
    expectedCategory: "angry",
    expectedIntensity: "low",
    description: "angry low: 살짝 짜증",
  },

  // ── worried ──
  {
    message: "너무 걱정돼서 잠을 못 자",
    expectedCategory: "worried",
    expectedIntensity: "high",
    description: "worried high: 너무 걱정돼서",
  },
  {
    message: "불안해 죽겠어",
    expectedCategory: "worried",
    expectedIntensity: "high",
    description: "worried high: 불안해 죽겠어",
  },
  {
    message: "좀 걱정되긴 해",
    expectedCategory: "worried",
    expectedIntensity: "low",
    description: "worried low: 좀 걱정",
  },

  // ── happy ──
  {
    message: "오늘 너무 좋은 일이 있었어!!",
    expectedCategory: "happy",
    expectedIntensity: "high",
    description: "happy high: 너무 좋은 일",
  },
  {
    message: "기분이 좋아 오늘",
    expectedCategory: "happy",
    expectedIntensity: "medium",
    description: "happy medium: 기분이 좋아",
  },

  // ── excited ──
  {
    message: "너무 설레 두근두근",
    expectedCategory: "excited",
    expectedIntensity: "high",
    description: "excited high: 너무 설레 두근두근",
  },
  {
    message: "설레네~ 내일 기대돼",
    expectedCategory: "excited",
    expectedIntensity: "medium",
    description: "excited medium: 설레네 기대돼",
  },

  // ── lonely ──
  {
    message: "너무 외로워 아무도 없어",
    expectedCategory: "lonely",
    expectedIntensity: "high",
    description: "lonely high: 너무 외로워 아무도 없어",
  },
  {
    message: "외로워 보고 싶어",
    expectedCategory: "lonely",
    expectedIntensity: "medium",
    description: "lonely medium: 외로워 보고 싶어",
  },

  // ── tired ──
  {
    message: "너무 피곤해 눈이 감겨",
    expectedCategory: "tired",
    expectedIntensity: "high",
    description: "tired high: 너무 피곤해 눈이 감겨",
  },
  {
    message: "졸려 피곤하다",
    expectedCategory: "tired",
    expectedIntensity: "medium",
    description: "tired medium: 졸려 피곤하다",
  },

  // ── 감정 없음 ──
  {
    message: "오늘 뭐 먹었어?",
    expectedCategory: null,
    description: "no emotion: 일반 질문",
  },
  {
    message: "ㅎㅎ",
    expectedCategory: null,
    description: "no emotion: 짧은 이모티콘",
  },
  {
    message: "",
    expectedCategory: null,
    description: "no emotion: 빈 메시지",
  },
];

let passed = 0;
let failed = 0;
const failures: string[] = [];

for (const tc of tests) {
  const result = detectUserEmotion(tc.message);

  if (tc.expectedCategory === null) {
    if (result === null) {
      passed++;
    } else {
      failed++;
      failures.push(
        `FAIL [${tc.description}]: expected null, got ${result.category}/${result.intensity}`
      );
    }
  } else {
    if (!result) {
      failed++;
      failures.push(
        `FAIL [${tc.description}]: expected ${tc.expectedCategory}/${tc.expectedIntensity ?? "*"}, got null`
      );
    } else if (result.category !== tc.expectedCategory) {
      failed++;
      failures.push(
        `FAIL [${tc.description}]: expected category=${tc.expectedCategory}, got ${result.category}`
      );
    } else if (tc.expectedIntensity && result.intensity !== tc.expectedIntensity) {
      failed++;
      failures.push(
        `FAIL [${tc.description}]: expected intensity=${tc.expectedIntensity}, got ${result.intensity}`
      );
    } else {
      passed++;
    }
  }
}

// ── 힌트 블록 생성 테스트 ──
const sampleDetection = detectUserEmotion("너무 힘들어서 눈물이 나왔어");
if (sampleDetection) {
  const block = buildUserEmotionHintBlock(sampleDetection);
  if (block.includes("[지금 이 사람의 감정") && block.length > 20) {
    passed++;
    console.log("PASS [hint block]: 힌트 블록 생성 성공");
    console.log("  →", block.slice(0, 80) + "...");
  } else {
    failed++;
    failures.push("FAIL [hint block]: 힌트 블록 형식 오류");
  }
} else {
  failed++;
  failures.push("FAIL [hint block sample]: '너무 힘들어서 눈물이 나왔어' 미감지");
}

// ── 결과 출력 ──
console.log(`\n결과: ${passed}/${passed + failed} 통과`);
if (failures.length > 0) {
  console.log("\n실패 목록:");
  for (const f of failures) {
    console.log(" ", f);
  }
  process.exit(1);
} else {
  console.log("모든 테스트 통과 ✓");
}
