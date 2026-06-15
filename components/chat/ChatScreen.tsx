"use client";

import { ChatHeader } from "@/components/chat/ChatHeader";
import { ChatInput } from "@/components/chat/ChatInput";
import { MessageActionSheet } from "@/components/chat/MessageActionSheet";
import { MessageItem } from "@/components/chat/MessageItem";
import { PremiumModal } from "@/components/chat/PremiumModal";
import { AbsenceWelcome } from "@/components/events/AbsenceWelcome";
import { useChat } from "@/contexts/ChatProvider";
import { useAbsenceEvent } from "@/hooks/useAbsenceEvent";
import { getMessageGroupMeta } from "@/lib/chatMessageLayout";
import { trackEvent } from "@/services/analytics";
import { useEffect, useRef, useState } from "react";

/**
 * ChatScreen — 채팅 화면 루트 컴포넌트.
 * ChatProvider 하위에 배치해야 하며, props 없이 context에서 전부 읽는다.
 *
 * 통합 기능:
 *   - 재방문 이벤트 (24h / 3d / 7d AbsenceWelcome 오버레이)
 *   - session_start 애널리틱스 로깅
 *   - 사용자 친화적 오류 메시지
 */
export function ChatScreen({
  conversationTitle,
}: {
  conversationTitle?: string;
} = {}) {
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

  // ── 재방문 이벤트 ─────────────────────────────
  const absence = useAbsenceEvent(lastChatAt, characterId);
  const [showAbsence, setShowAbsence] = useState(false);

  // 히스토리 로딩 완료 후 한 번만 평가
  useEffect(() => {
    if (!isLoadingHistory && absence.shouldShow) {
      setShowAbsence(true);
    }
  }, [isLoadingHistory, absence.shouldShow]);

  // ── 세션 시작 + 재방문 애널리틱스 ─────────────
  useEffect(() => {
    if (isLoadingHistory) return;

    trackEvent("session_start", characterId);

    if (absence.shouldShow && absence.data) {
      const tier = absence.data.tier;
      trackEvent(
        tier === "tier1"
          ? "return_visit_tier1"
          : tier === "tier2"
            ? "return_visit_tier2"
            : "return_visit_tier3",
        characterId
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingHistory]);

  // ── 새 메시지 / 타이핑 때마다 스크롤 하단 고정 ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── 메시지 전송 (에러 핸들링 래핑) ─────────────
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

  // ── 부재 배너 닫기 ────────────────────────────
  function handleAbsenceDismiss() {
    setShowAbsence(false);
    trackEvent("absence_banner_dismissed", characterId, {
      tier: absence.data?.tier,
    });
  }

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#b2c7d9]/30">
      {/* 헤더 (아바타 + 감정 뱃지 + 호감도) */}
      <ChatHeader conversationTitle={conversationTitle} />

      {/* 메시지 목록 */}
      <main className="flex-1 overflow-y-auto scroll-ios pb-2">
        {isLoadingHistory ? (
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

            return (
              <MessageItem
                key={msg.id}
                message={msg}
                isStreaming={isStreaming}
                showAvatar={group.showAvatar}
                showAvatarSpacer={group.showAvatarSpacer}
                isGroupedWithPrev={group.isGroupedWithPrev}
                isGroupedWithNext={group.isGroupedWithNext}
                canDelete={group.canDelete && !isStreaming}
                onLongPress={handleMessageLongPress}
              />
            );
          })
        )}

        <div ref={bottomRef} />
      </main>

      {/* 전송 오류 토스트 */}
      {sendError && (
        <div className="mx-3 mb-1 rounded-xl bg-red-50 px-4 py-2 text-xs text-red-600">
          {sendError}
        </div>
      )}

      <ChatInput disabled={isTyping || isLoadingHistory} onSend={handleSend} />

      <MessageActionSheet
        open={menuMessageId !== null}
        onClose={() => setMenuMessageId(null)}
        onDelete={() => {
          if (menuMessageId) void handleDeleteMessage(menuMessageId);
        }}
      />

      {/* 프리미엄 모달 (fixed overlay) */}
      <PremiumModal />

      {/* 재방문 이벤트 오버레이 */}
      {showAbsence && absence.data && (
        <AbsenceWelcome
          characterName={character.name}
          data={absence.data}
          onDismiss={handleAbsenceDismiss}
        />
      )}
    </div>
  );
}
