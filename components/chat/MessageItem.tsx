"use client";

import { useChat } from "@/contexts/ChatProvider";
import type { ChatMessage } from "@/contexts/ChatProvider";
import { useLongPress } from "@/hooks/useLongPress";
import { TypingIndicator } from "@/components/chat/TypingIndicator";

function parseNarinContent(
  content: string,
  isStreaming: boolean
): { visible: string; hidden: string | null } {
  if (isStreaming) return { visible: content, hidden: null };

  const match = content.match(/^([\s\S]+?)\s*(\([^()]+\))\s*$/);
  if (!match) return { visible: content, hidden: null };

  return {
    visible: match[1].trim(),
    hidden: match[2],
  };
}

function HiddenTextBlock({
  text,
  isPremiumUser,
  onClickLock,
}: {
  text: string;
  isPremiumUser: boolean;
  onClickLock: () => void;
}) {
  if (isPremiumUser) {
    return (
      <span className="mt-1 block text-[12px] font-medium italic text-pink-accent">
        {text}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={onClickLock}
      className="group relative mt-1 block w-full cursor-pointer rounded-lg text-left"
      aria-label="프리미엄 콘텐츠 확인"
      title="프리미엄 구독 후 확인 가능"
    >
      <span
        className="block select-none text-[12px] text-gray-700 blur-[4px] transition-all duration-200 group-hover:blur-[5px]"
        aria-hidden
      >
        {text}
      </span>
      <span className="absolute inset-0 flex items-center justify-center gap-1 rounded-lg bg-pink-soft/60 text-[11px] font-semibold text-pink-accent backdrop-blur-[1px] transition-colors group-hover:bg-pink-soft/80">
        <span aria-hidden>🔒</span>
        <span>속마음 보기</span>
      </span>
    </button>
  );
}

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
  onLongPress,
  canDelete = false,
}: MessageItemProps) {
  const { character, characterId, isPremiumUser, openPremiumModal } = useChat();
  const { role, content } = message;
  const isUser = role === "user";

  const longPress = useLongPress(
    () => onLongPress?.(message.id),
    { disabled: !canDelete || !onLongPress }
  );

  const { visible, hidden } =
    characterId === "narin" && !isUser
      ? parseNarinContent(content, isStreaming)
      : { visible: content, hidden: null };

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
        className={`max-w-[78%] ${isUser ? "items-end" : "items-start"} flex flex-col`}
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
          {visible ? (
            <p className="whitespace-pre-wrap break-words">{visible}</p>
          ) : isStreaming ? (
            <TypingIndicator />
          ) : null}
          {hidden && (
            <HiddenTextBlock
              text={hidden}
              isPremiumUser={isPremiumUser}
              onClickLock={openPremiumModal}
            />
          )}
        </div>
      </div>
    </div>
  );
}
