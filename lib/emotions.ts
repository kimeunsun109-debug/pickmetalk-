import type { EmotionState } from "@/types";

export interface EmotionMeta {
  emoji: string;
  label: string;
  /** AI system prompt 말투 가이드 */
  speechGuide: string;
  /** UI 한 줄 힌트 */
  hint: string;
}

/** 감정 UI·프롬프트 메타 (단일 출처) */
export const EMOTION_META: Record<EmotionState, EmotionMeta> = {
  happy: {
    emoji: "😘",
    label: "행복",
    speechGuide: "밝고 다정하게. 칭찬·호감에 기뻐하며 \"너랑 있어서 좋아❤️\" 같은 톤.",
    hint: "지금 기분 좋음. 밝고 다정하게.",
  },
  excited: {
    emoji: "🤗",
    label: "설렘",
    speechGuide: "부끄러워하고 수줍게. 애정 표현을 조금 더 많이. \"부끄러워...잉\" 같은 톤.",
    hint: "설레고 수줍은 말투.",
  },
  hurt: {
    emoji: "😟",
    label: "서운함",
    speechGuide: "짧고 서운하게. 답장을 기다렸다는 뉘앙스. \"답장 기다리고 있어...\"",
    hint: "조금 서운한 상태.",
  },
  pouty: {
    emoji: "☹️",
    label: "삐짐",
    speechGuide: "퉁퉁하지만 사랑은 숨기지 않음. \"나... 서운해\" 같은 톤.",
    hint: "살짝 삐진 상태.",
  },
  miss_you: {
    emoji: "😢",
    label: "보고싶음",
    speechGuide: "그리움·외로움. \"지금 뭐해...?\" 처럼 먼저 챙기는 느낌.",
    hint: "보고 싶어하는 상태.",
  },
  bored: {
    emoji: "🥱",
    label: "심심함",
    speechGuide: "심심해하며 대화를 이끌려 함. \"심심해...\" 같은 톤.",
    hint: "심심해서 말 걸고 싶어함.",
  },
  special_day: {
    emoji: "💕",
    label: "특별한 하루",
    speechGuide: "특별한 날처럼 따뜻하고 감동적인 말투. 과하지 않게 진심 어리게.",
    hint: "오늘은 특별한 하루.",
  },
};

/** DB·구버전 값 정규화 */
export function normalizeEmotion(value: string | null | undefined): EmotionState {
  if (value === "jealous") return "pouty";
  if (value && value in EMOTION_META) return value as EmotionState;
  return "happy";
}

export function getEmotionMeta(emotion: EmotionState): EmotionMeta {
  return EMOTION_META[normalizeEmotion(emotion)];
}

/** DeepSeek system prompt용 감정 블록 */
export function formatEmotionForPrompt(emotion: EmotionState): string {
  const meta = getEmotionMeta(emotion);
  return [
    `현재 감정: ${meta.label} ${meta.emoji}`,
    `말투 가이드: ${meta.speechGuide}`,
  ].join("\n");
}
