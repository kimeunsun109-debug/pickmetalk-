/**
 * 사용자 메시지 감정 감지 서비스
 *
 * 사용자의 현재 메시지에서 감정 키워드를 감지해 캐릭터 응답 힌트를 생성한다.
 * - 캐릭터의 감정 상태(emotion.ts)와 별개로, 사용자의 현재 감정을 추적
 * - 감지된 감정에 맞는 공감 힌트를 시스템 프롬프트에 주입해 응답 품질 개선
 * - 명확한 감정 신호가 없으면 null 반환 (힌트 없음)
 */

export type UserEmotionCategory =
  | "sad"       // 슬픔, 눈물
  | "stressed"  // 스트레스, 지침, 피로
  | "angry"     // 화남, 짜증
  | "worried"   // 걱정, 불안
  | "happy"     // 기쁨, 좋은 일
  | "excited"   // 설렘, 두근거림
  | "lonely"    // 외로움, 보고싶음
  | "tired";    // 피곤, 졸림, 힘없음

export type UserEmotionIntensity = "low" | "medium" | "high";

export interface UserEmotionDetection {
  category: UserEmotionCategory;
  intensity: UserEmotionIntensity;
  /** 시스템 프롬프트에 삽입할 공감 힌트 */
  hint: string;
}

// ─────────────────────────────────────────────
// 감정별 키워드 패턴 (강도 순: high → medium → low)
// ─────────────────────────────────────────────

const EMOTION_PATTERNS: Array<{
  category: UserEmotionCategory;
  intensity: UserEmotionIntensity;
  pattern: RegExp;
}> = [
  // ── sad (high) ──
  {
    category: "sad",
    intensity: "high",
    pattern:
      /너무\s*(슬|힘들|괴롭|우울|아파|못 살겠|죽고\s*싶|버리고\s*싶|포기하고\s*싶|사라지고\s*싶)/,
  },
  {
    category: "sad",
    intensity: "medium",
    pattern:
      /(슬퍼|슬프다|울었|눈물|울고\s*싶|마음이\s*아파|속상해|속상하다|서글|마음이\s*무거|우울해|우울하다|가슴이\s*아파)/,
  },
  {
    category: "sad",
    intensity: "low",
    pattern: /(좀\s*슬|조금\s*슬|약간\s*우울|기분이\s*안\s*좋)/,
  },

  // ── stressed (high) ──
  {
    category: "stressed",
    intensity: "high",
    pattern:
      /(미치겠|터질\s*것\s*같|한계야|한계다|더\s*못\s*하겠|지쳐\s*죽겠|너무\s*(힘들어|힘들다)|탈진|번아웃)/,
  },
  {
    category: "stressed",
    intensity: "medium",
    pattern:
      /(스트레스|힘들어|힘들다|힘드네|지쳤어|지쳤다|지치네|벅차|벅차다|압박|몰려|몸이\s*안\s*좋)/,
  },
  {
    category: "stressed",
    intensity: "low",
    pattern: /(좀\s*힘|조금\s*힘|약간\s*힘|좀\s*지|조금\s*지)/,
  },

  // ── angry (high) ──
  {
    category: "angry",
    intensity: "high",
    pattern:
      /(열\s*받아|열받아|열받다|분해|진짜\s*화나|너무\s*화가|ㅂㄷㅂㄷ|폭발할\s*것\s*같|미치겠어)/,
  },
  {
    category: "angry",
    intensity: "medium",
    pattern:
      /(화\s*났|화나|화나다|짜증나|짜증난|짜증이|짜증\s*터지|짜증해|화가\s*나|기분\s*나빠|기분\s*나쁘다)/,
  },
  {
    category: "angry",
    intensity: "low",
    pattern: /(좀\s*짜증|조금\s*짜증|약간\s*짜증|살짝\s*짜증)/,
  },

  // ── worried (high) ──
  {
    category: "worried",
    intensity: "high",
    pattern:
      /(너무\s*걱정|엄청\s*걱정|많이\s*걱정|심하게\s*걱정|불안해\s*죽겠|무서워\s*죽겠|공황|떨려서\s*못)/,
  },
  {
    category: "worried",
    intensity: "medium",
    pattern:
      /(걱정돼|걱정이야|걱정이다|불안해|불안하다|불안한|무서워|무섭다|두렵|두려|긴장돼|긴장이|겁나|겁이|잠을\s*못|자기\s*힘들)/,
  },
  {
    category: "worried",
    intensity: "low",
    pattern: /(좀\s*걱정|조금\s*걱정|약간\s*걱정|살짝\s*걱정|조금\s*불안)/,
  },

  // ── happy (high) ──
  {
    category: "happy",
    intensity: "high",
    pattern:
      /(너무\s*좋(아|은|다)|너무\s*기뻐|엄청\s*좋아|대박이야|완전\s*좋아|행복해\s*죽겠|세상\s*다\s*가진|꿈인가봐)/,
  },
  {
    category: "happy",
    intensity: "medium",
    pattern:
      /(기뻐|기쁘다|기쁘네|좋은\s*일|행복해|행복하다|행복하네|기분.{0,3}좋(아|다)|신나|신나다|신남|웃음이\s*나|웃겨서)/,
  },
  {
    category: "happy",
    intensity: "low",
    pattern: /(좋은\s*하루|좀\s*기분\s*좋|나쁘진\s*않아|그럭저럭\s*좋)/,
  },

  // ── excited (high) ──
  {
    category: "excited",
    intensity: "high",
    pattern:
      /(너무\s*설레|엄청\s*설레|미칠\s*것\s*같이\s*설레|두근두근|심쿵|떨려|너무\s*기대돼)/,
  },
  {
    category: "excited",
    intensity: "medium",
    pattern:
      /(설레|설렌다|설레다|설레네|기대돼|기대가\s*돼|두근|콩닥|가슴\s*뛰|설레는|흥분돼|흥분되다)/,
  },
  {
    category: "excited",
    intensity: "low",
    pattern: /(조금\s*설|좀\s*설|약간\s*설레|살짝\s*기대)/,
  },

  // ── lonely (high) ──
  {
    category: "lonely",
    intensity: "high",
    pattern:
      /(너무\s*외로|많이\s*외로|혼자라서\s*힘|아무도\s*없어|아무도\s*없다|다\s*가고\s*나혼자|나만\s*혼자)/,
  },
  {
    category: "lonely",
    intensity: "medium",
    pattern:
      /(외로워|외롭다|외롭네|보고\s*싶어|보고\s*싶다|혼자야|혼자다|혼자라|허전해|허전하다|공허해|공허하다)/,
  },
  {
    category: "lonely",
    intensity: "low",
    pattern: /(좀\s*외|조금\s*외로|약간\s*외로|살짝\s*외로)/,
  },

  // ── tired (high) ──
  {
    category: "tired",
    intensity: "high",
    pattern:
      /(너무\s*피곤|완전\s*피곤|정말\s*피곤|너무\s*졸려|너무\s*피로|쓰러질\s*것\s*같|눈이\s*감겨|몸이\s*안\s*좋아)/,
  },
  {
    category: "tired",
    intensity: "medium",
    pattern:
      /(피곤해|피곤하다|피곤하네|졸려|졸리다|졸리네|피로해|피로하다|기운\s*없어|기운\s*없다|늘어져|늘어지다|나른해|나른하다)/,
  },
  {
    category: "tired",
    intensity: "low",
    pattern: /(좀\s*피곤|조금\s*피곤|약간\s*피곤|살짝\s*피곤|살짝\s*졸)/,
  },
];

// ─────────────────────────────────────────────
// 감정별 응답 힌트
// ─────────────────────────────────────────────

const EMOTION_HINTS: Record<
  UserEmotionCategory,
  Record<UserEmotionIntensity, string>
> = {
  sad: {
    high: "사용자가 지금 많이 슬퍼하고 있어. 판단·조언·해결책은 잠깐 내려놓고, 그냥 같이 있어줘. '왜 그런데?'도 나중에. 지금은 충분히 공감해줘.",
    medium:
      "사용자가 슬픈 것 같아. 바로 해결하려 하지 말고, 먼저 공감하고 마음을 열어줘. 이야기를 더 들어봐.",
    low: "사용자가 조금 울적한 것 같아. 가볍게 마음을 챙겨주면서 자연스럽게 이야기 이어가봐.",
  },
  stressed: {
    high: "사용자가 지금 한계에 와 있어. 무리하게 위로하려 하지 말고, 함께 있다는 느낌을 줘. '힘들었겠다'를 먼저.",
    medium:
      "사용자가 스트레스를 많이 받고 있어. 먼저 공감해줘. 조언은 요청할 때만 해.",
    low: "사용자가 좀 지쳐 보여. 가볍게 '괜찮아?'처럼 챙겨주는 톤으로.",
  },
  angry: {
    high: "사용자가 많이 화가 났어. 맞장구를 치거나 상황을 가볍게 보지 마. 일단 '그럴 만해'로 충분히 공감해줘.",
    medium:
      "사용자가 짜증나거나 화난 상태야. 공감 먼저, 조언은 나중에. '내 편'이라는 느낌을 줘.",
    low: "사용자가 살짝 짜증스러운 것 같아. 너무 진지하게 파고들지 말고 자연스럽게 풀어줘.",
  },
  worried: {
    high: "사용자가 심하게 걱정하거나 불안해하고 있어. 먼저 '괜찮을 거야'보다 무엇 때문인지 들어봐줘. 성급한 안심시키기는 역효과야.",
    medium:
      "사용자가 걱정이나 불안을 느끼고 있어. 차분하게 들어주고, 혼자가 아니라는 느낌을 줘.",
    low: "사용자가 약간 걱정스러운 상황인 것 같아. 부드럽게 챙겨줘.",
  },
  happy: {
    high: "사용자가 정말 기쁜 일이 있어. 같이 기뻐해줘! 진심으로 신나게 반응하고, 어떤 좋은 일인지 더 들어봐.",
    medium:
      "사용자가 기분이 좋아. 같이 좋아해주고, 그 기분을 이어갈 수 있게 해줘.",
    low: "사용자가 조금 기분이 좋은 것 같아. 같이 좋은 분위기로 이야기 이어가.",
  },
  excited: {
    high: "사용자가 엄청 설레거나 기대에 차 있어. 같이 두근거려줘! 왜 설레는지 더 물어봐.",
    medium: "사용자가 설레거나 기대 중이야. 같이 흥분해주고, 이야기 더 들어봐.",
    low: "사용자가 조금 설레는 것 같아. 가볍게 같이 기대해주는 톤으로.",
  },
  lonely: {
    high: "사용자가 지금 많이 외로워. '나 여기 있어' 라는 느낌을 줘. 함께 있다는 걸 충분히 느끼게 해줘.",
    medium:
      "사용자가 외롭거나 보고 싶어 하는 것 같아. 따뜻하게 곁에 있어줘. 이야기 더 나눠봐.",
    low: "사용자가 약간 외로운 것 같아. 자연스럽게 곁에 있는 느낌을 줘.",
  },
  tired: {
    high: "사용자가 아주 피곤한 상태야. 무겁거나 자극적인 이야기는 잠깐 내려놓고, 편안하게 쉬게 해줘. 짧고 따뜻하게.",
    medium:
      "사용자가 피곤해. 가볍고 따뜻하게 대화하고, 무리하게 이어가지 마.",
    low: "사용자가 조금 피곤한 것 같아. 편한 분위기로 이야기해.",
  },
};

// ─────────────────────────────────────────────
// 공개 API
// ─────────────────────────────────────────────

/**
 * 사용자 메시지에서 감정을 감지한다.
 * 명확한 감정 신호가 없으면 null을 반환한다 (힌트 없음).
 *
 * 우선순위: 강도 높은 순서(high → medium → low)로 첫 번째 매칭 반환.
 */
export function detectUserEmotion(
  message: string
): UserEmotionDetection | null {
  if (!message?.trim()) return null;

  const text = message.trim();

  for (const { category, intensity, pattern } of EMOTION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        category,
        intensity,
        hint: EMOTION_HINTS[category][intensity],
      };
    }
  }

  return null;
}

/**
 * 감지된 감정 힌트를 시스템 프롬프트 블록으로 변환한다.
 */
export function buildUserEmotionHintBlock(
  detection: UserEmotionDetection
): string {
  const CATEGORY_LABEL: Record<UserEmotionCategory, string> = {
    sad: "슬픔",
    stressed: "스트레스/지침",
    angry: "화남/짜증",
    worried: "걱정/불안",
    happy: "기쁨",
    excited: "설렘/기대",
    lonely: "외로움",
    tired: "피로/졸림",
  };
  const INTENSITY_LABEL: Record<UserEmotionIntensity, string> = {
    low: "낮음",
    medium: "중간",
    high: "높음",
  };

  return [
    `[지금 이 사람의 감정 — ${CATEGORY_LABEL[detection.category]} (강도: ${INTENSITY_LABEL[detection.intensity]})]`,
    detection.hint,
  ].join("\n");
}
