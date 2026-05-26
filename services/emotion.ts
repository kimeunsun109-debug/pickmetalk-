import type { EmotionState } from "@/types";

/** 키워드·이벤트 기반 감정 추론 (MVP: 규칙 기반, 추후 AI 태깅) */
export function inferEmotionFromUserMessage(text: string): EmotionState | null {
  const t = text.toLowerCase();
  if (/미안|약속/.test(t)) return "hurt";
  if (/다른\s?(여자|ai|챗)/.test(t)) return "jealous";
  if (/보고\s?싶|그리워/.test(t)) return "miss_you";
  if (/좋아|사랑|설레/.test(t)) return "excited";
  return null;
}
