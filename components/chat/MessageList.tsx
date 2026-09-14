"use client";

import { MessageItem } from "@/components/chat/MessageItem";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import type { ChatMessage } from "@/contexts/ChatProvider";
import { getMessageGroupMeta } from "@/lib/chatMessageLayout";
import {
  formatDateSeparator,
  shouldShowDateSeparator,
} from "@/lib/formatMessageTime";
import { characterAvatarSrc } from "@/lib/characters/images";
import Image from "next/image";
import { memo, useState } from "react";

export interface MessageListProps {
  messages: ChatMessage[];
  characterName: string;
  characterId: string;
  isTyping: boolean;
  /** 캐릭터 선제 인사 생성 중 — 타이핑 버블을 표시한다 */
  isProactiveLoading?: boolean;
}

function TypingBubble({
  characterName,
  characterId,
}: {
  characterName: string;
  characterId: string;
}) {
  const [avatarError, setAvatarError] = useState(false);

  return (
    <div className="flex w-full px-3 pt-2 justify-start">
      <div className="mr-1.5 mt-auto flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-pink-200 to-pink-400 text-[11px] font-bold text-white shadow-sm">
        {characterId && !avatarError ? (
          <Image
            src={characterAvatarSrc(characterId)}
            alt={characterName}
            width={32}
            height={32}
            className="size-8 object-cover"
            onError={() => setAvatarError(true)}
          />
        ) : (
          characterName[0]
        )}
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-bubble-ai px-3.5 py-2.5 shadow-sm">
        <TypingIndicator />
      </div>
    </div>
  );
}

export const MessageList = memo(function MessageList({
  messages,
  characterName,
  characterId,
  isTyping,
  isProactiveLoading = false,
}: MessageListProps) {
  const lastMsg = messages[messages.length - 1];

  // 타이핑 버블: 사용자 메시지 직후 AI 응답을 기다리는 동안 또는 선제 인사 생성 중
  const showTypingBubble =
    (isTyping && (!lastMsg || lastMsg.role === "user")) || isProactiveLoading;

  if (messages.length === 0 && !showTypingBubble) {
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
            />
          </div>
        );
      })}
      {showTypingBubble && (
        <TypingBubble characterName={characterName} characterId={characterId} />
      )}
    </>
  );
});
