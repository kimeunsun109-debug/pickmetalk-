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
  {
    message: "너무 힘들어 죽겠어 ㅠㅠ",
    expectedCategory: "sad",
    expectedIntensity: "high",
    description: "sad high",
  },
  {
    message: "오늘 너무 슬퍼서 울었어",
    expectedCategory: "sad",
    expectedIntensity: "high",
    description: "sad high 울었어",
  },
  {
    message: "좀 기분이 안 좋아",
    expectedCategory: "sad",
    expectedIntensity: "low",
    description: "sad low",
  },
  {
    message: "진짜 한계야 더 못하겠어",
    expectedCategory: "stressed",
    expectedIntensity: "high",
    description: "stressed high",
  },
  {
    message: "요즘 너무 스트레스 받아",
    expectedCategory: "stressed",
    expectedIntensity: "medium",
    description: "stressed medium",
  },
  {
    message: "진짜 화나 열받아 ㅠ",
    expectedCategory: "angry",
    expectedIntensity: "high",
    description: "angry high",
  },
  {
    message: "짜증나 진짜로",
    expectedCategory: "angry",
    expectedIntensity: "medium",
    description: "angry medium",
  },
  {
    message: "너무 걱정돼서 잠을 못 자",
    expectedCategory: "worried",
    expectedIntensity: "high",
    description: "worried high",
  },
  {
    message: "오늘 너무 좋은 일이 있었어!!",
    expectedCategory: "happy",
    expectedIntensity: "high",
    description: "happy high",
  },
  {
    message: "너무 설레 두근두근",
    expectedCategory: "excited",
    expectedIntensity: "high",
    description: "excited high",
  },
  {
    message: "너무 외로워 아무도 없어",
    expectedCategory: "lonely",
    expectedIntensity: "high",
    description: "lonely high",
  },
  {
    message: "너무 피곤해 눈이 감겨",
    expectedCategory: "tired",
    expectedIntensity: "high",
    description: "tired high",
  },
  { message: "오늘 뭐 먹었어?", expectedCategory: null, description: "neutral" },
  { message: "ㅎㅎ", expectedCategory: null, description: "emoji only" },
  { message: "", expectedCategory: null, description: "empty" },
];

let passed = 0;
let failed = 0;
const failures: string[] = [];

for (const tc of tests) {
  const result = detectUserEmotion(tc.message);
  if (tc.expectedCategory === null) {
    if (result === null) passed++;
    else {
      failed++;
      failures.push(`${tc.description}: expected null, got ${result.category}`);
    }
  } else if (!result || result.category !== tc.expectedCategory) {
    failed++;
    failures.push(`${tc.description}: category mismatch`);
  } else if (tc.expectedIntensity && result.intensity !== tc.expectedIntensity) {
    failed++;
    failures.push(`${tc.description}: intensity mismatch`);
  } else {
    passed++;
  }
}

const sample = detectUserEmotion("너무 힘들어서 눈물이 나왔어");
if (sample && buildUserEmotionHintBlock(sample).includes("[지금 이 사람의 감정")) {
  passed++;
} else {
  failed++;
  failures.push("hint block");
}

console.log(`결과: ${passed}/${passed + failed}`);
if (failed > 0) {
  for (const f of failures) console.error(f);
  process.exit(1);
}
