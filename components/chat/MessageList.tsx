"use client";

import { MessageItem } from "@/components/chat/MessageItem";
import type { ChatMessage } from "@/contexts/ChatProvider";
import { getMessageGroupMeta } from "@/lib/chatMessageLayout";
import {
  formatDateSeparator,
  shouldShowDateSeparator,
} from "@/lib/formatMessageTime";
import { memo } from "react";

export interface MessageListProps {
  messages: ChatMessage[];
  characterName: string;
  characterId: string;
  isTyping: boolean;
  onLongPress: (messageId: string) => void;
}

export const MessageList = memo(function MessageList({
  messages,
  characterName,
  characterId,
  isTyping,
  onLongPress,
}: MessageListProps) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <>
      {messages.map((msg, idx) => {
        const isStreaming =
          isTyping &&
          idx === messages.length - 1 &&
          msg.role === "assistant";
        const group = getMessageGroupMeta(messages, idx);
        const prevMsg = idx > 0 ? messages[idx - 1] : null;
        const showDate =
          msg.createdAt &&
          shouldShowDateSeparator(prevMsg?.createdAt, msg.createdAt);

        return (
          <div key={msg.id}>
            {showDate && msg.createdAt && (
              <div className="flex justify-center py-3">
                <span className="rounded-full bg-black/10 px-3 py-1 text-[11px] text-gray-600">
                  {formatDateSeparator(msg.createdAt)}
                </span>
              </div>
            )}
            <MessageItem
              message={msg}
              characterName={characterName}
              characterId={characterId}
              isStreaming={isStreaming}
              showAvatar={group.showAvatar}
              showAvatarSpacer={group.showAvatarSpacer}
              isGroupedWithPrev={group.isGroupedWithPrev}
              isGroupedWithNext={group.isGroupedWithNext}
              showTimestamp={!group.isGroupedWithNext && !isStreaming}
              onLongPress={onLongPress}
            />
          </div>
        );
      })}
    </>
  );
});
