"use client";

/**
 * ChatProvider — 채팅 화면 전역 상태 관리
 *
 * 제공하는 상태:
 *   character, characterId, isPremiumUser
 *   emotion, affection, relationshipLevel
 *   messages, isTyping, isLoadingHistory
 *   showPremiumModal / openPremiumModal / closePremiumModal
 *
 * 사용법:
 *   <ChatProvider character={character} isPremiumUser={isPremiumUser}>
 *     <ChatScreen />
 *   </ChatProvider>
 *
 *   // 하위 컴포넌트에서
 *   const { emotion, sendMessage } = useChat();
 */

import { normalizeEmotion } from "@/lib/emotions";
import type { Character, EmotionState, RelationshipLevel } from "@/types";
import type { ChatStreamChunk } from "@/types/api";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatContextValue {
  // ── Character ──────────────────────────────
  character: Character;
  characterId: string;

  // ── User ───────────────────────────────────
  /** 프리미엄 구독 여부 (나린 hidden-text blur 등에 사용) */
  isPremiumUser: boolean;

  // ── Relationship state ─────────────────────
  emotion: EmotionState;
  affection: number;
  relationshipLevel: RelationshipLevel;
  /** 마지막 대화 시각 ISO string (재방문 이벤트 트리거용) */
  lastChatAt: string | null;

  // ── Messages ───────────────────────────────
  messages: ChatMessage[];
  isTyping: boolean;
  isLoadingHistory: boolean;

  // ── Actions ────────────────────────────────
  sendMessage: (text: string) => Promise<void>;
  reload: () => Promise<void>;

  // ── Premium modal ──────────────────────────
  showPremiumModal: boolean;
  openPremiumModal: () => void;
  closePremiumModal: () => void;
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

const ChatContext = createContext<ChatContextValue | null>(null);

/**
 * useChat — ChatProvider 하위의 어느 컴포넌트에서나 채팅 상태에 접근.
 * Provider 바깥에서 호출하면 에러를 던진다.
 */
export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used inside <ChatProvider>");
  }
  return ctx;
}

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

interface ChatProviderProps {
  character: Character;
  isPremiumUser: boolean;
  children: ReactNode;
}

export function ChatProvider({
  character,
  isPremiumUser,
  children,
}: ChatProviderProps) {
  const characterId = character.id;

  // ── Messages ───────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const streamingIdRef = useRef<string | null>(null);

  // ── Relationship state ─────────────────────
  const [affection, setAffection] = useState(0);
  const [relationshipLevel, setRelationshipLevel] =
    useState<RelationshipLevel>(1);
  const [emotion, setEmotion] = useState<EmotionState>(
    character.defaultEmotion ?? "happy"
  );
  const [lastChatAt, setLastChatAt] = useState<string | null>(null);

  // ── Premium modal ──────────────────────────
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  // ─────────────────────────────────────────────
  // History loader
  // ─────────────────────────────────────────────

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const [msgRes, relRes] = await Promise.all([
        fetch(`/api/messages?characterId=${characterId}`),
        fetch(`/api/relationship?characterId=${characterId}`),
      ]);
      const [msgData, relData] = await Promise.all([
        msgRes.json(),
        relRes.json(),
      ]);

      if (msgRes.ok && Array.isArray(msgData.messages)) {
        setMessages(
          (
            msgData.messages as Array<{
              id: string;
              role: string;
              content: string;
            }>
          ).map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
          }))
        );
      }

      if (relRes.ok && relData.state) {
        setAffection(relData.state.affection ?? 0);
        setRelationshipLevel(relData.state.relationshipLevel ?? 1);
        setEmotion(normalizeEmotion(relData.state.emotion));
        setLastChatAt(relData.state.lastChatAt ?? null);
      }
    } finally {
      setIsLoadingHistory(false);
    }
  }, [characterId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ─────────────────────────────────────────────
  // Send message (SSE streaming)
  // ─────────────────────────────────────────────

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      // 사용자 메시지 즉시 추가
      const userMsgId = `user-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: text.trim() },
      ]);
      setIsTyping(true);

      // AI 답변 placeholder
      const aiMsgId = `stream-${Date.now()}`;
      streamingIdRef.current = aiMsgId;
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, role: "assistant", content: "" },
      ]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characterId, message: text.trim() }),
        });

        if (!res.ok) {
          const err = (await res.json()) as { error?: string };
          throw new Error(err.error ?? "전송 실패");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("스트림을 읽을 수 없습니다.");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data:")) continue;
            const json = line.slice(5).trim();
            if (!json) continue;

            const chunk = JSON.parse(json) as ChatStreamChunk & {
              error?: string;
              affection?: number;
              relationshipLevel?: RelationshipLevel;
              emotion?: EmotionState;
            };

            if (chunk.error) throw new Error(chunk.error);

            if (chunk.content) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId
                    ? { ...m, content: m.content + chunk.content }
                    : m
                )
              );
            }

            if (chunk.done) {
              if (chunk.affection != null) setAffection(chunk.affection);
              if (chunk.relationshipLevel != null)
                setRelationshipLevel(chunk.relationshipLevel);
              if (chunk.emotion) setEmotion(normalizeEmotion(chunk.emotion));
            }
          }
        }

        // 스트리밍 완료 후 히스토리 동기화
        await loadHistory();
      } catch (e) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  content:
                    e instanceof Error
                      ? `오류: ${e.message}`
                      : "오류가 발생했어요.",
                }
              : m
          )
        );
      } finally {
        setIsTyping(false);
        streamingIdRef.current = null;
      }
    },
    [characterId, isTyping, loadHistory]
  );

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <ChatContext.Provider
      value={{
        character,
        characterId,
        isPremiumUser,
        emotion,
        affection,
        relationshipLevel,
        lastChatAt,
        messages,
        isTyping,
        isLoadingHistory,
        sendMessage,
        reload: loadHistory,
        showPremiumModal,
        openPremiumModal: () => setShowPremiumModal(true),
        closePremiumModal: () => setShowPremiumModal(false),
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
