import type { ChatFollowUp } from "@/types/api";

const ELLIPSIS_PATTERN = /(?:\.{3,}|…+)/g;
/** 괄호 속마음·행동·표정 지문 — 반각/전각 */
const PAREN_NARRATION_PATTERN = /[\s　]*[\(（][^()（）\n]{1,160}[\)）]/g;

/** "(사실 …)", "(웃으며)" 등 괄호 속마음·지문 제거 */
export function stripParentheticalNarration(text: string): string {
  const stripped = text.replace(PAREN_NARRATION_PATTERN, "");
  return stripped.replace(/[ \t]{2,}/g, " ").trim();
}

/** 응답당 말줄임표 제거 — 정말 필요할 때만 프롬프트에서 유도 */
export function limitEllipsis(text: string): string {
  return text
    .replace(ELLIPSIS_PATTERN, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** 후속 유형 추론 — done 이벤트 메타용 */
export function detectFollowUp(text: string): ChatFollowUp {
  const trimmed = text.trim();
  if (!trimmed) return "none";
  if (/[?？]/.test(trimmed)) return "question";
  if (/ㅋ|ㅎ|장난|농담|웃|ㅋㅋ|ㅎㅎ/.test(trimmed)) return "joke";
  return "comment";
}

export function postProcessAssistantReply(text: string): {
  text: string;
  follow_up: ChatFollowUp;
} {
  const trimmedInput = text.trim();
  const normalized = limitEllipsis(stripParentheticalNarration(trimmedInput));
  return {
    text: normalized || trimmedInput || "잠깐만, 다시 말해줄게.",
    follow_up: detectFollowUp(normalized || trimmedInput),
  };
}
