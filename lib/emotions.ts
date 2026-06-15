import type { EmotionState } from "@/types";

export interface EmotionMeta {
  emoji: string;
  label: string;
  /** Tone guide used in AI system prompts. */
  speechGuide: string;
  /** Short hint shown in the chat header. */
  hint: string;
}

/** Shared emotion metadata for UI and prompt composition. */
export const EMOTION_META: Record<EmotionState, EmotionMeta> = {
  happy: {
    emoji: "😊",
    label: "행복",
    speechGuide: "밝고 다정하게, 부담스럽지 않은 호감으로 반응한다.",
    hint: "지금 기분이 좋아 보여요.",
  },
  excited: {
    emoji: "✨",
    label: "설렘",
    speechGuide: "조금 들뜨고 수줍은 말투로 설렘을 표현한다.",
    hint: "살짝 설레는 분위기예요.",
  },
  hurt: {
    emoji: "🥺",
    label: "서운함",
    speechGuide: "차분하고 서운하지만 공격적이지 않게 반응한다.",
    hint: "조금 서운해하고 있어요.",
  },
  pouty: {
    emoji: "😗",
    label: "삐짐",
    speechGuide: "귀엽게 삐진 듯 말하되 무례하거나 차갑지 않게 반응한다.",
    hint: "살짝 삐진 상태예요.",
  },
  miss_you: {
    emoji: "💭",
    label: "보고 싶음",
    speechGuide:
      "오래 만난 뒤 첫 턴에만 그리움을 살짝 담는다. '왔네/반가워' 반복 금지. 이후 턴은 일반 대화.",
    hint: "보고 싶어하는 마음이 느껴져요.",
  },
  bored: {
    emoji: "☁️",
    label: "심심함",
    speechGuide: "심심해서 말을 걸고 싶은 느낌으로 자연스럽게 반응한다.",
    hint: "대화를 기다리고 있어요.",
  },
  special_day: {
    emoji: "🎀",
    label: "특별한 날",
    speechGuide: "평소보다 조금 더 진심이 드러나게 반응한다.",
    hint: "오늘은 조금 특별한 분위기예요.",
  },
};

/** Normalize DB or legacy emotion values. */
export function normalizeEmotion(value: string | null | undefined): EmotionState {
  if (value === "jealous") return "pouty";
  if (value && value in EMOTION_META) return value as EmotionState;
  return "happy";
}

export function getEmotionMeta(emotion: EmotionState): EmotionMeta {
  return EMOTION_META[normalizeEmotion(emotion)];
}

/** Emotion block included in DeepSeek system prompts. */
export function formatEmotionForPrompt(emotion: EmotionState): string {
  const meta = getEmotionMeta(emotion);
  return [
    `현재 감정: ${meta.label} ${meta.emoji}`,
    `말투 가이드: ${meta.speechGuide}`,
  ].join("\n");
}
