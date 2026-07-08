"use client";

import { PhotoMessageBubble } from "@/components/chat/PhotoMessageBubble";
import type { ChatMessage } from "@/contexts/ChatProvider";
import { useLongPress } from "@/hooks/useLongPress";
import { formatBubbleTime } from "@/lib/formatMessageTime";
import { memo, useMemo } from "react";

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

/** 짧은 답변은 한 말풍선 유지, 긴 답변만 문장 단위로 쪼갠다 */
const MIN_LEN_TO_SPLIT = 28;

/** 문장 부호 기준으로 나눈 뒤, 너무 짧은 조각은 앞 말풍선에 붙인다 */
function splitIntoSentences(text: string): string[] {
  if (text.length < MIN_LEN_TO_SPLIT) return [text];
  const raw = text.match(/[^.!?~…]+[.!?~…]+[)\]\s]*|[^.!?~…]+$/gu);
  if (!raw || raw.length <= 1) return [text];

  const sentences = raw.map((s) => s.trim()).filter(Boolean);
  const bubbles: string[] = [];
  for (const s of sentences) {
    const prev = bubbles[bubbles.length - 1];
    if (prev && (s.length < 8 || prev.length < 12)) {
      bubbles[bubbles.length - 1] = `${prev} ${s}`;
    } else {
      bubbles.push(s);
    }
  }
  return bubbles;
}

/**
 * 어시스턴트 답변을 카톡처럼 여러 말풍선으로 쪼갠다.
 * 1) 모델이 줄바꿈으로 나눴으면 그 단위로, 2) 아니면 긴 답변을 문장 단위로 나눈다.
 */
function splitAssistantBubbles(content: string, max = 4): string[] {
  const byNewline = content
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  let parts = byNewline.length > 1 ? byNewline : splitIntoSentences(content.trim());
  if (parts.length === 0) return [content];

  if (parts.length > max) {
    const head = parts.slice(0, max - 1);
    const tail = parts.slice(max - 1).join(" ");
    parts = [...head, tail];
  }
  return parts;
}

export interface MessageItemProps {
  message: ChatMessage;
  characterName: string;
  characterId?: string;
  isStreaming?: boolean;
  showAvatar?: boolean;
  showAvatarSpacer?: boolean;
  isGroupedWithPrev?: boolean;
  isGroupedWithNext?: boolean;
  showTimestamp?: boolean;
  onLongPress?: (messageId: string) => void;
  canDelete?: boolean;
}

export const MessageItem = memo(function MessageItem({
  message,
  characterName,
  characterId,
  isStreaming = false,
  showAvatar = true,
  showAvatarSpacer = false,
  isGroupedWithPrev = false,
  isGroupedWithNext = false,
  showTimestamp = false,
  onLongPress,
  canDelete = false,
}: MessageItemProps) {
  const { role, content, mediaType, mediaUrl, photoDeliveryId } = message;
  const isUser = role === "user";
  const isPhoto = !isUser && mediaType === "photo" && mediaUrl;

  const longPress = useLongPress(
    () => onLongPress?.(message.id),
    { disabled: !canDelete || !onLongPress }
  );

  const rowPadding = isGroupedWithPrev ? "pt-0.5" : "pt-2";

  const bubbleSegments = useMemo(
    () =>
      isUser || isStreaming
        ? [content || ""]
        : splitAssistantBubbles(content),
    [isUser, isStreaming, content]
  );
  const hasContent = content.trim().length > 0;

  return (
    <div
      className={`flex w-full px-3 ${rowPadding} ${isUser ? "justify-end" : "justify-start"}`}
      {...(canDelete ? longPress : {})}
    >
      {!isUser && showAvatar && (
        <div className="mr-1.5 mt-auto flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-pink-200 to-pink-400 text-[11px] font-bold text-white shadow-sm">
          {characterName[0]}
        </div>
      )}

      {!isUser && showAvatarSpacer && (
        <div className="mr-1.5 size-8 shrink-0" aria-hidden />
      )}

      <div
        className={`max-w-[78%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}
      >
        {isPhoto ? (
          <div
            className={`rounded-2xl rounded-tl-sm bg-bubble-ai px-3 py-2 shadow-sm ${
              canDelete ? "select-none" : ""
            }`}
          >
            <PhotoMessageBubble
              mediaUrl={mediaUrl!}
              caption={content}
              photoDeliveryId={photoDeliveryId}
              characterId={characterId}
            />
            {showTimestamp && message.createdAt && (
              <span className="mt-1 block text-[10px] text-gray-400">
                {formatBubbleTime(message.createdAt)}
              </span>
            )}
          </div>
        ) : hasContent ? (
          bubbleSegments.map((segment, segIdx) => {
            const isLastSegment = segIdx === bubbleSegments.length - 1;
            const groupedPrev = isGroupedWithPrev || segIdx > 0;
            const groupedNext = isGroupedWithNext || !isLastSegment;
            return (
              <div
                key={segIdx}
                className={`flex items-end gap-1.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`px-3.5 py-2 text-[15px] leading-[1.45] ${bubbleRadiusClass(
                    isUser,
                    groupedPrev,
                    groupedNext
                  )} ${
                    isUser
                      ? "bg-bubble-user text-gray-900"
                      : "bg-bubble-ai text-gray-800 shadow-sm"
                  } ${canDelete ? "select-none" : ""}`}
                >
                  <p className="whitespace-pre-wrap break-words">{segment}</p>
                </div>
                {isLastSegment && showTimestamp && message.createdAt && (
                  <span className="shrink-0 pb-0.5 text-[10px] text-gray-400">
                    {formatBubbleTime(message.createdAt)}
                  </span>
                )}
              </div>
            );
          })
        ) : null}
      </div>
    </div>
  );
});
