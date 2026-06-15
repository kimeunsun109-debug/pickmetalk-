"use client";

import type { ChatMessage } from "@/contexts/ChatProvider";

function isTemporaryMessage(id: string): boolean {
  return id.startsWith("user-") || id.startsWith("stream-");
}

export function getMessageGroupMeta(
  messages: ChatMessage[],
  index: number
): {
  showAvatar: boolean;
  showAvatarSpacer: boolean;
  isGroupedWithPrev: boolean;
  isGroupedWithNext: boolean;
  canDelete: boolean;
} {
  const current = messages[index];
  const prev = index > 0 ? messages[index - 1] : null;
  const next = index < messages.length - 1 ? messages[index + 1] : null;

  const isGroupedWithPrev = prev?.role === current.role;
  const isGroupedWithNext = next?.role === current.role;

  const isAssistant = current.role === "assistant";

  return {
    showAvatar: isAssistant && !isGroupedWithPrev,
    showAvatarSpacer: isAssistant && isGroupedWithPrev,
    isGroupedWithPrev,
    isGroupedWithNext,
    canDelete: !isTemporaryMessage(current.id),
  };
}
