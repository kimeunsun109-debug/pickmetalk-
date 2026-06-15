"use client";

import { useChat } from "@/contexts/ChatProvider";
import type { ChatMessage } from "@/contexts/ChatProvider";

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

interface MessageItemProps {
  message: ChatMessage;
  isStreaming?: boolean;
  onDelete?: (messageId: string) => void;
}

export function MessageItem({
  message,
  isStreaming = false,
  onDelete,
}: MessageItemProps) {
  const { characterId, isPremiumUser, openPremiumModal } = useChat();
  const { role, content } = message;
  const isUser = role === "user";
  const isTemporary =
    message.id.startsWith("user-") || message.id.startsWith("stream-");
  const canDelete = Boolean(onDelete) && !isStreaming && !isTemporary;

  const { visible, hidden } =
    characterId === "narin" && !isUser
      ? parseNarinContent(content, isStreaming)
      : { visible: content, hidden: null };

  return (
    <div
      className={`flex w-full px-3 py-1 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="mr-2 mt-auto flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-pink-200 to-pink-400 text-[11px] font-bold text-white shadow-sm">
          <AvatarInitial />
        </div>
      )}

      <div
        className={`max-w-[75%] space-y-1 ${isUser ? "items-end" : "items-start"} flex flex-col`}
      >
        {canDelete && (
          <button
            type="button"
            onClick={() => onDelete?.(message.id)}
            className="rounded-full px-2 py-0.5 text-[10px] text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
            aria-label="메시지 삭제"
          >
            삭제
          </button>
        )}

        <div
          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "rounded-tr-sm bg-bubble-user text-gray-900"
              : "rounded-tl-sm bg-bubble-ai text-gray-800 shadow-sm ring-1 ring-gray-100"
          }`}
        >
          <p className="whitespace-pre-wrap break-words">{visible}</p>
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

function AvatarInitial() {
  const { character } = useChat();
  return <>{character.name[0]}</>;
}
