"use client";

/**
 * 채팅 스트리밍 훅 — /api/chat SSE 소비
 * TODO: 메시지 목록 state, sendMessage, isTyping
 */
export function useChat(_characterId: string) {
  return {
    messages: [] as { role: string; content: string }[],
    isTyping: false,
    sendMessage: async (_text: string) => {},
  };
}
