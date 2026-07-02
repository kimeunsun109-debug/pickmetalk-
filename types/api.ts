/** API 요청/응답 타입 */
export interface ChatRequestBody {
  conversationId: string;
  message: string;
}

export interface CreateConversationBody {
  characterId: string;
  title?: string;
}

export type ChatFollowUp = "question" | "comment" | "joke" | "none";

export interface ChatStreamChunk {
  content?: string;
  emotion?: string;
  done?: boolean;
  follow_up?: ChatFollowUp;
  /** true면 content로 메시지 전체 교체 (폴백 후 본문 확정 등) */
  replace?: boolean;
  should_stream?: boolean;
}

export interface GiftSendBody {
  characterId: string;
  giftId: string;
}

export interface AbsenceEventResponse {
  shouldShow: boolean;
  daysAway: number;
  dialogue: string;
  characterId: string;
}
