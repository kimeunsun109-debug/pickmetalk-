"use client";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageActionSheet } from "@/components/chat/MessageActionSheet";
import { MessageItem } from "@/components/chat/MessageItem";
import { PremiumModal } from "@/components/chat/PremiumModal";
import { useChat } from "@/contexts/ChatProvider";
import { usePerfRenderCount } from "@/lib/perf/client";
import { getMessageGroupMeta } from "@/lib/chatMessageLayout";
import {
  formatDateSeparator,
  shouldShowDateSeparator,
} from "@/lib/formatMessageTime";
import { getAbsenceTier } from "@/lib/returnVisit";
import { trackEvent } from "@/services/analytics";
import { useEffect, useRef, useState } from "react";

export function ChatScreen({
  conversationTitle,
}: {
  conversationTitle?: string;
} = {}) {
  usePerfRenderCount("ChatScreen");
  const {
    character,
    characterId,
    messages,
    isTyping,
    isLoadingHistory,
    lastChatAt,
    sendMessage,
    deleteMessage,
  } = useChat();

  const bottomRef = useRef<HTMLDivElement>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [menuMessageId, setMenuMessageId] = useState<string | null>(null);
  const returnVisitTrackedRef = useRef(false);

  useEffect(() => {
    if (isLoadingHistory || returnVisitTrackedRef.current) return;

    trackEvent("session_start", characterId);

    if (lastChatAt) {
      const gapHours =
        (Date.now() - new Date(lastChatAt).getTime()) / (1000 * 60 * 60);
      const tier = getAbsenceTier(gapHours);
      if (tier) {
        trackEvent(
          tier === "tier1"
            ? "return_visit_tier1"
            : tier === "tier2"
              ? "return_visit_tier2"
              : "return_visit_tier3",
          characterId
        );
      }
    }

    returnVisitTrackedRef.current = true;
  }, [isLoadingHistory, lastChatAt, characterId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  async function handleSend(text: string) {
    setSendError(null);
    try {
      await sendMessage(text);
      trackEvent("message_sent", characterId);
    } catch {
      setSendError("메시지 전송에 실패했어요. 잠시 후 다시 시도해 주세요.");
    }
  }

  async function handleDeleteMessage(messageId: string) {
    setSendError(null);
    try {
      await deleteMessage(messageId);
    } catch (e) {
      setSendError(
        e instanceof Error ? e.message : "메시지를 삭제하지 못했습니다."
      );
    }
  }

  function handleMessageLongPress(messageId: string) {
    const meta = messages.findIndex((m) => m.id === messageId);
    if (meta < 0) return;
    const { canDelete } = getMessageGroupMeta(messages, meta);
    const isStreamingLast =
      isTyping &&
      meta === messages.length - 1 &&
      messages[meta]?.role === "assistant";
    if (!canDelete || isStreamingLast) return;
    setMenuMessageId(messageId);
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#b2c7d9]/30">
      <ChatHeader conversationTitle={conversationTitle} />

      <main className="flex-1 overflow-y-auto scroll-ios pb-2">
        {isLoadingHistory && messages.length === 0 ? (
          <div className="flex h-full items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-pink-accent/30 border-t-pink-accent" />
              <p className="text-sm text-gray-500">대화 불러오는 중…</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-8 py-20 text-center">
            <p className="text-sm text-gray-500">
              {character.name}에게 첫 인사를 건네보세요
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
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
                  isStreaming={isStreaming}
                  showAvatar={group.showAvatar}
                  showAvatarSpacer={group.showAvatarSpacer}
                  isGroupedWithPrev={group.isGroupedWithPrev}
                  isGroupedWithNext={group.isGroupedWithNext}
                  showTimestamp={!group.isGroupedWithNext && !isStreaming}
                  canDelete={group.canDelete && !isStreaming}
                  onLongPress={handleMessageLongPress}
                />
              </div>
            );
          })
        )}

        <div ref={bottomRef} />
      </main>

      {sendError && (
        <div className="mx-3 mb-1 rounded-xl bg-red-50 px-4 py-2 text-xs text-red-600">
          {sendError}
        </div>
      )}

      <ChatInput disabled={isTyping} onSend={handleSend} />

      <MessageActionSheet
        open={menuMessageId !== null}
        onClose={() => setMenuMessageId(null)}
        onDelete={() => {
          if (menuMessageId) void handleDeleteMessage(menuMessageId);
        }}
      />

      <PremiumModal />
    </div>
  );
}
