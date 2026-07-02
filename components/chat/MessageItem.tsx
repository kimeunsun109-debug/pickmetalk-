"use client";

import { useChat } from "@/contexts/ChatProvider";
import type { ChatMessage } from "@/contexts/ChatProvider";
import { useLongPress } from "@/hooks/useLongPress";
import { formatBubbleTime } from "@/lib/formatMessageTime";
import { TypingIndicator } from "@/components/chat/TypingIndicator";

function bubbleRadiusClass(
  isUser: boolean,
  isGroupedWithPrev: boolean,
  isGroupedWithNext: boolean
): string {
  if (isUser) {
    if (isGroupedWithPrev && isGroupedWithNext) return "rounded-2xl rounded-r-md";
    if (isGroupedWithPrev) return "rounded-2xl rounded-tr-md rounded-br-sm";
    if (isGroupedWithNext) return "rounded-2xl rounded-tr-sm rounded-br-md";
    return "rounded-2xl rounded-tr-sm";
  }

  if (isGroupedWithPrev && isGroupedWithNext) return "rounded-2xl rounded-l-md";
  if (isGroupedWithPrev) return "rounded-2xl rounded-tl-md rounded-bl-sm";
  if (isGroupedWithNext) return "rounded-2xl rounded-tl-sm rounded-bl-md";
  return "rounded-2xl rounded-tl-sm";
}

export interface MessageItemProps {
  message: ChatMessage;
  isStreaming?: boolean;
  showAvatar?: boolean;
  showAvatarSpacer?: boolean;
  isGroupedWithPrev?: boolean;
  isGroupedWithNext?: boolean;
  showTimestamp?: boolean;
  onLongPress?: (messageId: string) => void;
  canDelete?: boolean;
}

export function MessageItem({
  message,
  isStreaming = false,
  showAvatar = true,
  showAvatarSpacer = false,
  isGroupedWithPrev = false,
  isGroupedWithNext = false,
  showTimestamp = false,
  onLongPress,
  canDelete = false,
}: MessageItemProps) {
  const { character } = useChat();
  const { role, content } = message;
  const isUser = role === "user";

  const longPress = useLongPress(
    () => onLongPress?.(message.id),
    { disabled: !canDelete || !onLongPress }
  );

  const rowPadding = isGroupedWithPrev ? "pt-0.5" : "pt-2";

  return (
    <div
      className={`flex w-full px-3 ${rowPadding} ${isUser ? "justify-end" : "justify-start"}`}
      {...(canDelete ? longPress : {})}
    >
      {!isUser && showAvatar && (
        <div className="mr-1.5 mt-auto flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-pink-200 to-pink-400 text-[11px] font-bold text-white shadow-sm">
          {character.name[0]}
        </div>
      )}

      {!isUser && showAvatarSpacer && (
        <div className="mr-1.5 size-8 shrink-0" aria-hidden />
      )}

      <div
        className={`max-w-[78%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-0.5`}
      >
        <div
          className={`flex items-end gap-1.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
        >
          <div
            className={`px-3.5 py-2 text-[15px] leading-[1.45] ${bubbleRadiusClass(
              isUser,
              isGroupedWithPrev,
              isGroupedWithNext
            )} ${
              isUser
                ? "bg-bubble-user text-gray-900"
                : "bg-bubble-ai text-gray-800 shadow-sm"
            } ${canDelete ? "select-none" : ""}`}
          >
            {content ? (
              <p className="whitespace-pre-wrap break-words">{content}</p>
            ) : isStreaming ? (
              <TypingIndicator />
            ) : null}
          </div>
          {showTimestamp && message.createdAt && (
            <span className="shrink-0 pb-0.5 text-[10px] text-gray-400">
              {formatBubbleTime(message.createdAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
