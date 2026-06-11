import { characters } from "@/data";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const CHARACTER_IDS = new Set(characters.map((c) => c.id));

export function isConversationUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function isCharacterId(value: string): boolean {
  return CHARACTER_IDS.has(value);
}

/** 캐릭터 기준 채팅 URL (선택 대화방 지정 가능) */
export function characterChatPath(
  characterId: string,
  conversationId?: string
): string {
  const base = `/chat/${characterId}`;
  if (!conversationId) return base;
  return `${base}?conversationId=${conversationId}`;
}
