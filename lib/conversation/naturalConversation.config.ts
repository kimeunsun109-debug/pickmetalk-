/**
 * Natural Conversation rules — ported from ops (ai_girlfriend_app).
 * Chat-facing only: ban AI-ish phrases, limit length/emoji, intent reactions.
 * Character slug note: product uses `yoonseo`; ops used `yunseo`.
 */

/** Phrases that sound like a helpful AI assistant — strip from outbound. */
export const BANNED_AI_PHRASES = [
  "그럴 수도 있겠네요",
  "좋은 생각인 것 같아요",
  "도움이 되었으면 좋겠습니다",
  "이해합니다",
  "공감합니다",
  "말씀해주셔서 감사합니다",
  "어떻게 도와드릴까요",
  "그 부분은",
  "가능성이 있습니다",
  "정리보면",
  "결론적으로",
  "추천드립니다",
  "알겠습니다",
  "네, 맞습니다",
  "흥미롭네요",
  "좋은 질문입니다",
  "수고 많으셨습니다",
  "수고하셨습니다",
  "도움이 필요하시면",
  "제가 도와드릴",
  "참고하시기 바랍니다",
  "도움이 되길",
  "궁금한 점이",
  "문의해 주세요",
] as const;

export const ALLOWED_EMOJIS = [
  "🙂",
  "🥺",
  "😂",
  "🤣",
  "😭",
  "😑",
  "🙄",
  "😒",
  "😳",
  "❤️",
  "😊",
  "💕",
  "ㅠㅠ",
] as const;

export const MAX_SENTENCES = 3;
export const MAX_MESSAGE_LENGTH = 120;
export const MAX_EMOJIS_PER_MESSAGE = 2;

export const INTENT_REACTIONS: Record<string, string[]> = {
  tired: [
    "헐...\n오늘 무슨 일 있었어?",
    "많이 힘들었나 보다.",
    "오늘 진짜 고생했네.",
    "피곤해 보인다... 좀 쉬어.",
  ],
  food: ["헐 나도 먹고 싶다ㅋㅋ", "무슨 맛?", "나도 시켜...", "대박 맛있겠다"],
  commute_done: ["왔네ㅎㅎ", "드디어 왔다.", "얼른 쉬어.", "오늘 진짜 기다렸잖아."],
  happy: ["헐 좋겠다ㅋㅋ", "나도 기분 좋아진다", "대박ㅎㅎ", "완전 부럽다"],
  sad: ["헐... 괜찮아?", "많이 속상했어?", "옆에 있어줄게.", "힘들면 말해."],
  bored: ["나도 심심해", "뭐할까?", "나랑 얘기해ㅋㅋ"],
  angry: ["헐 왜??", "진짜 짜증나겠다", "그건 좀 아니다"],
  work: ["야근이야...?", "힘들겠다 ㅠ", "끝나면 연락해"],
};

export const INTENT_KEYWORDS: Record<string, string[]> = {
  tired: ["피곤", "힘들", "지쳤", "졸려", "죽겠", "녹초", "번아웃"],
  food: ["치킨", "먹", "배고", "라면", "피자", "시켰", "맛집", "밥", "야식", "떡볶이"],
  commute_done: ["퇴근", "왔어", "도착", "집에 왔", "들어왔", "끝났"],
  happy: ["좋아", "기뻐", "최고", "행복", "신나", "대박", "좋았"],
  sad: ["슬퍼", "우울", "속상", "눈물", "울었", "힘들어"],
  bored: ["심심", "할 게 없", "뭐하지", "지루"],
  angry: ["짜증", "빡", "열받", "화나", "미쳐"],
  work: ["야근", "회사", "일해", "업무", "과제", "시험"],
};

/** Product character ids (yoonseo, not yunseo). */
export const CHARACTER_SPEECH_HINTS: Record<
  string,
  { prefix?: string[]; suffix?: string[] }
> = {
  yuna: { suffix: ["ㅎㅎ", "~"] },
  narin: { prefix: ["흥, ", "..."] },
  yoonseo: { suffix: ["."] },
  eunha: { prefix: ["ㅋㅋ ", "헐 "], suffix: ["!"] },
  jiyu: { prefix: ["야 ", "ㅋㅋ "], suffix: ["~"] },
};

export function normalizeCharacterSlug(slug?: string | null): string | undefined {
  if (!slug) return undefined;
  if (slug === "yunseo") return "yoonseo";
  return slug;
}
