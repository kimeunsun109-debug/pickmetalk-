"use client";

import { getCharacterById } from "@/data";
import { normalizeEmotion } from "@/lib/emotions";
import { resolveCharacterId } from "@/lib/chatRoute";
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

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatContextValue {
  character: Character;
  characterId: string;
  conversationId: string;
  isPremiumUser: boolean;
  emotion: EmotionState;
  affection: number;
  relationshipLevel: RelationshipLevel;
  lastChatAt: string | null;
  messages: ChatMessage[];
  isTyping: boolean;
  isLoadingHistory: boolean;
  sendMessage: (text: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  reload: () => Promise<void>;
  showPremiumModal: boolean;
  openPremiumModal: () => void;
  closePremiumModal: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used inside <ChatProvider>");
  }
  return ctx;
}

interface ChatProviderProps {
  character: Character;
  /** URL의 characterId와 반드시 일치 */
  characterId: string;
  conversationId: string;
  isPremiumUser: boolean;
  children: ReactNode;
}

export function ChatProvider({
  character,
  characterId,
  conversationId,
  isPremiumUser,
  children,
}: ChatProviderProps) {
  const safeCharacterId = resolveCharacterId(characterId);
  const resolvedCharacter =
    character.id === safeCharacterId
      ? character
      : (getCharacterById(safeCharacterId) ?? character);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const streamingIdRef = useRef<string | null>(null);

  const [affection, setAffection] = useState(0);
  const [relationshipLevel, setRelationshipLevel] =
    useState<RelationshipLevel>(1);
  const [emotion, setEmotion] = useState<EmotionState>(
    resolvedCharacter.defaultEmotion ?? "happy"
  );
  const [lastChatAt, setLastChatAt] = useState<string | null>(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const loadHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const cacheBust = Date.now();
      const [msgRes, relRes] = await Promise.all([
        fetch(
          `/api/messages?conversationId=${conversationId}&_=${cacheBust}`,
          { cache: "no-store" }
        ),
        fetch(
          `/api/relationship?conversationId=${conversationId}&_=${cacheBust}`,
          { cache: "no-store" }
        ),
      ]);

      let msgData: { messages?: unknown } = {};
      let relData: { state?: Record<string, unknown> } = {};

      try {
        msgData = await msgRes.json();
      } catch {
        /* 빈 대화로 시작 */
      }

      try {
        relData = await relRes.json();
      } catch {
        /* 기본 관계 상태 유지 */
      }

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
        setAffection((relData.state.affection as number) ?? 0);
        setRelationshipLevel(
          (relData.state.relationshipLevel as RelationshipLevel) ?? 1
        );
        setEmotion(normalizeEmotion(relData.state.emotion as string));
        setLastChatAt((relData.state.lastChatAt as string) ?? null);
      }
    } catch {
      /* 히스토리 로드 실패 시 빈 채팅으로 시작 */
    } finally {
      setIsLoadingHistory(false);
    }
  }, [conversationId]);

  useEffect(() => {
    setMessages([]);
    setIsTyping(false);
    setIsLoadingHistory(true);
    setAffection(0);
    setRelationshipLevel(1);
    setEmotion(resolvedCharacter.defaultEmotion ?? "happy");
    setLastChatAt(null);
    streamingIdRef.current = null;
    loadHistory();
  }, [
    conversationId,
    resolvedCharacter.id,
    resolvedCharacter.defaultEmotion,
    loadHistory,
  ]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      const userMsgId = `user-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: text.trim() },
      ]);
      setIsTyping(true);

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
          body: JSON.stringify({
            conversationId,
            message: text.trim(),
          }),
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
    [conversationId, isTyping, loadHistory]
  );

  const deleteMessage = useCallback(async (messageId: string) => {
    const res = await fetch(`/api/messages/${messageId}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "메시지를 삭제하지 못했습니다.");
    }

    setMessages((prev) => prev.filter((message) => message.id !== messageId));
  }, []);

  return (
    <ChatContext.Provider
      value={{
        character: resolvedCharacter,
        characterId: safeCharacterId,
        conversationId,
        isPremiumUser,
        emotion,
        affection,
        relationshipLevel,
        lastChatAt,
        messages,
        isTyping,
        isLoadingHistory,
        sendMessage,
        deleteMessage,
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
