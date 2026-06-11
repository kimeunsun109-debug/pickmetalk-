import { characterChatPath } from "@/lib/chatRoute";

/** 캐릭터 채팅으로 이동 — hard navigation으로 캐시·이전 상태 제거 */
export function goToCharacterChat(
  characterId: string,
  conversationId?: string
) {
  const path = characterChatPath(characterId, conversationId);
  window.location.href = `${path}${path.includes("?") ? "&" : "?"}_=${Date.now()}`;
}

/** @deprecated conversationId만으로 이동 — characterId URL 사용 권장 */
export function goToConversation(conversationId: string) {
  window.location.href = `/chat/${conversationId}?_=${Date.now()}`;
}
