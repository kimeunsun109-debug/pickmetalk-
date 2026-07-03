import { markBrowserSessionActive } from "@/lib/auth/browserSession";
import { characterChatPath, resolveCharacterId } from "@/lib/chatRoute";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

/** 캐릭터 채팅 URL (Link·router.push용) */
export function characterChatHref(
  characterId: string,
  conversationId?: string
): string {
  return characterChatPath(resolveCharacterId(characterId), conversationId);
}

/** 클라이언트 소프트 네비게이션 — hard reload 제거 */
export function goToCharacterChat(
  router: AppRouterInstance,
  characterId: string,
  conversationId?: string
) {
  markBrowserSessionActive();
  router.push(characterChatHref(characterId, conversationId));
}

/** @deprecated conversationId만으로 이동 — characterId URL 사용 권장 */
export function goToConversation(router: AppRouterInstance, conversationId: string) {
  markBrowserSessionActive();
  router.push(`/chat/${conversationId}`);
}
