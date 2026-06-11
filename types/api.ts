/** API 요청/응답 타입 */
export interface ChatRequestBody {
  conversationId: string;
  message: string;
}

export interface CreateConversationBody {
  characterId: string;
  title?: string;
}

export interface ChatStreamChunk {
  content?: string;
  emotion?: string;
  done?: boolean;
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
