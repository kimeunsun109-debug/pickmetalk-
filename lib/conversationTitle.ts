const DEFAULT_TITLE = "새 대화";

/** 첫 사용자 메시지로 대화방 제목 생성 (최대 15자) */
export function titleFromFirstMessage(text: string, maxLen = 15): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return DEFAULT_TITLE;
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen)}…`;
}

export function isDefaultConversationTitle(title: string): boolean {
  return title === DEFAULT_TITLE || title === "기본 대화";
}
