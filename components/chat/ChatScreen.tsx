"use client";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { AssistantMessageActions } from "@/components/chat/AssistantMessageActions";
import { ChatOnboarding } from "@/components/chat/ChatOnboarding";
import { MessageActionSheet } from "@/components/chat/MessageActionSheet";
import { MessageList } from "@/components/chat/MessageList";
import { PremiumModal } from "@/components/chat/PremiumModal";
import { useChat } from "@/contexts/ChatProvider";
import { usePerfRenderCount } from "@/lib/perf/client";
import { getMessageGroupMeta } from "@/lib/chatMessageLayout";
import { getAbsenceTier } from "@/lib/returnVisit";
import { trackEvent } from "@/services/analytics";
import { useCallback, useEffect, useRef, useState } from "react";

export function ChatScreen({
  conversationTitle,
  userNickname,
}: {
  conversationTitle?: string;
  userNickname?: string | null;
} = {}) {
  usePerfRenderCount("ChatScreen");
  const {
    character,
    characterId,
    messages,
    isTyping,
    lastChatAt,
    sendMessage,
    regenerateLastReply,
    deleteMessage,
  } = useChat();

  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMsg = messages[messages.length - 1];
  const streamScrollBucket = isTyping
    ? Math.floor((lastMsg?.content?.length ?? 0) / 48)
    : 0;

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages.length, isTyping, streamScrollBucket]);
  const [sendError, setSendError] = useState<string | null>(null);
  const [menuMessageId, setMenuMessageId] = useState<string | null>(null);
  const returnVisitTrackedRef = useRef(false);

  useEffect(() => {
    if (returnVisitTrackedRef.current) return;

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
  }, [lastChatAt, characterId]);

  const handleSend = useCallback(
    async (text: string) => {
      setSendError(null);
      try {
        await sendMessage(text);
        trackEvent("message_sent", characterId);
      } catch {
        setSendError("메시지 전송에 실패했어요. 잠시 후 다시 시도해 주세요.");
      }
    },
    [sendMessage, characterId]
  );

  const handleDeleteMessage = useCallback(
    async (messageId: string) => {
      setSendError(null);
      try {
        await deleteMessage(messageId);
      } catch (e) {
        setSendError(
          e instanceof Error ? e.message : "메시지를 삭제하지 못했습니다."
        );
      }
    },
    [deleteMessage]
  );

  const handleMessageLongPress = useCallback(
    (messageId: string) => {
      const meta = messages.findIndex((m) => m.id === messageId);
      if (meta < 0) return;
      const { canDelete } = getMessageGroupMeta(messages, meta);
      const isStreamingLast =
        isTyping &&
        meta === messages.length - 1 &&
        messages[meta]?.role === "assistant";
      if (!canDelete || isStreamingLast) return;
      setMenuMessageId(messageId);
    },
    [messages, isTyping]
  );

  const showOnboarding = messages.length === 0;
  const lastAssistant =
    lastMsg?.role === "assistant" ? lastMsg : null;
  const showActions =
    lastAssistant &&
    !isTyping &&
    lastAssistant.content.trim().length > 0;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#b2c7d9]/30">
      <ChatHeader conversationTitle={conversationTitle} />

      <main className="flex-1 overflow-y-auto scroll-ios pb-2">
        {showOnboarding ? (
          <ChatOnboarding character={character} nickname={userNickname} />
        ) : (
          <MessageList
            messages={messages}
            characterName={character.name}
            isTyping={isTyping}
            onLongPress={handleMessageLongPress}
          />
        )}

        {showActions && lastAssistant && (
          <AssistantMessageActions
            messageId={lastAssistant.id}
            content={lastAssistant.content}
            characterId={characterId}
            onRegenerate={() => void regenerateLastReply()}
          />
        )}

        <div ref={bottomRef} />
      </main>

      {sendError && (
        <div className="mx-3 mb-1 rounded-xl bg-red-50 px-4 py-2 text-xs text-red-600">
          {sendError}
        </div>
      )}

      <ChatInput
        disabled={isTyping}
        isWaitingReply={isTyping}
        onSend={handleSend}
      />

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
