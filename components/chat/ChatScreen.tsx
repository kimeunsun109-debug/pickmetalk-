"use client";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { FreeUsageBanner } from "@/components/chat/FreeUsageBanner";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatOnboarding } from "@/components/chat/ChatOnboarding";
import { MessageList } from "@/components/chat/MessageList";
import { PremiumModal } from "@/components/chat/PremiumModal";
import { GiftPickerSheet } from "@/components/gifts/GiftPickerSheet";
import { AbsenceWelcome } from "@/components/events/AbsenceWelcome";
import { useChat } from "@/contexts/ChatProvider";
import { useAbsenceEvent } from "@/hooks/useAbsenceEvent";
import { usePerfRenderCount } from "@/lib/perf/client";
import { getAbsenceTier } from "@/lib/returnVisit";
import { trackEvent } from "@/services/analytics";
import type { Gift } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

export function ChatScreen({
  conversationTitle,
  userNickname,
  photoPushDeliveryId,
}: {
  conversationTitle?: string;
  userNickname?: string | null;
  photoPushDeliveryId?: string | null;
} = {}) {
  usePerfRenderCount("ChatScreen");
  const {
    character,
    characterId,
    messages,
    isTyping,
    lastChatAt,
    sendMessage,
    sendGift,
    usageBannerMessage,
    dismissUsageBanner,
  } = useChat();

  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMsg = messages[messages.length - 1];
  const streamScrollBucket = isTyping
    ? Math.floor((lastMsg?.content?.length ?? 0) / 48)
    : 0;
  const [giftPickerOpen, setGiftPickerOpen] = useState(false);
  const [sendingGiftId, setSendingGiftId] = useState<string | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      bottomRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
    });
    return () => cancelAnimationFrame(frame);
  }, [messages.length, isTyping, streamScrollBucket]);
  const [sendError, setSendError] = useState<string | null>(null);
  const [absenceDismissed, setAbsenceDismissed] = useState(false);
  const returnVisitTrackedRef = useRef(false);
  const photoPushTrackedRef = useRef(false);

  const absenceEvent = useAbsenceEvent(lastChatAt, characterId, userNickname);

  useEffect(() => {
    if (!photoPushDeliveryId || photoPushTrackedRef.current) return;
    photoPushTrackedRef.current = true;
    trackEvent("photo_push_opened", characterId, {
      deliveryId: photoPushDeliveryId,
    });
    void fetch(`/api/photo-push/${photoPushDeliveryId}/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "open" }),
    }).catch(() => undefined);
  }, [photoPushDeliveryId, characterId]);

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

  const handleAbsenceDismiss = useCallback(() => setAbsenceDismissed(true), []);

  const handleSelectGift = useCallback(
    async (gift: Gift) => {
      setSendingGiftId(gift.id);
      try {
        await sendGift(gift.id);
        trackEvent("gift_sent", characterId, { giftId: gift.id });
      } finally {
        setSendingGiftId(null);
      }
    },
    [sendGift, characterId]
  );

  const showOnboarding = messages.length === 0;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-paper">
      <div className="relative">
        {usageBannerMessage && (
          <FreeUsageBanner
            message={usageBannerMessage}
            onDismiss={dismissUsageBanner}
          />
        )}
        <ChatHeader conversationTitle={conversationTitle} />
      </div>

      <main className="flex-1 overflow-y-auto scroll-ios pb-2">
        {showOnboarding ? (
          <ChatOnboarding character={character} nickname={userNickname} />
        ) : (
          <MessageList
            messages={messages}
            characterName={character.name}
            characterId={characterId}
            isTyping={isTyping}
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
        onOpenGifts={() => setGiftPickerOpen(true)}
      />

      <GiftPickerSheet
        open={giftPickerOpen}
        characterName={character.name}
        sendingGiftId={sendingGiftId}
        onClose={() => setGiftPickerOpen(false)}
        onSelectGift={handleSelectGift}
      />

      <PremiumModal />

      {absenceEvent.shouldShow && !absenceDismissed && absenceEvent.data && (
        <AbsenceWelcome
          characterName={character.name}
          data={absenceEvent.data}
          onDismiss={handleAbsenceDismiss}
        />
      )}
    </div>
  );
}
