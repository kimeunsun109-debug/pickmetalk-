"use client";

import { getCharacterById } from "@/data";
import { markBrowserSessionActive } from "@/lib/auth/browserSession";
import { normalizeEmotion } from "@/lib/emotions";
import { resolveCharacterId } from "@/lib/chatRoute";
import { perfClientTrace, usePerfRenderCount } from "@/lib/perf/client";
import { isPerfEnabled } from "@/lib/perf/trace";
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
  createdAt?: string;
}

interface ChatContextValue {
  character: Character;
  characterId: string;
  conversationId: string | null;
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
  conversationId: string | null;
  isPremiumUser: boolean;
  /** SSR에서 미리 불러온 메시지 — 클라이언트 재요청 생략 */
  initialMessages?: ChatMessage[];
  initialAffection?: number;
  initialRelationshipLevel?: RelationshipLevel;
  initialEmotion?: EmotionState;
  initialLastChatAt?: string | null;
  children: ReactNode;
}

export function ChatProvider({
  character,
  characterId,
  conversationId,
  isPremiumUser,
  initialMessages,
  initialAffection = 0,
  initialRelationshipLevel = 1,
  initialEmotion,
  initialLastChatAt = null,
  children,
}: ChatProviderProps) {
  usePerfRenderCount("ChatProvider");
  const safeCharacterId = resolveCharacterId(characterId);
  const resolvedCharacter =
    character.id === safeCharacterId
      ? character
      : (getCharacterById(safeCharacterId) ?? character);

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? []);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(
    !initialMessages?.length && Boolean(conversationId?.trim())
  );
  const streamingIdRef = useRef<string | null>(null);
  const proactiveDoneRef = useRef<string | null>(null);
  const hydratedFromServerRef = useRef(Boolean(initialMessages?.length));

  const [affection, setAffection] = useState(initialAffection);
  const [relationshipLevel, setRelationshipLevel] =
    useState<RelationshipLevel>(initialRelationshipLevel);
  const [emotion, setEmotion] = useState<EmotionState>(
    initialEmotion ?? resolvedCharacter.defaultEmotion ?? "happy"
  );
  const [lastChatAt, setLastChatAt] = useState<string | null>(initialLastChatAt);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const safeConversationId = conversationId?.trim() || null;

  const fetchMessages = useCallback(async (convId: string) => {
    const cacheBust = Date.now();
    const msgRes = await fetch(
      `/api/messages?conversationId=${convId}&_=${cacheBust}`,
      { cache: "no-store" }
    );

    let msgData: { messages?: unknown } = {};
    try {
      msgData = await msgRes.json();
    } catch {
      return [];
    }

    if (!msgRes.ok || !Array.isArray(msgData.messages)) return [];

    return (
      msgData.messages as Array<{
        id: string;
        role: string;
        content: string;
        createdAt?: string;
      }>
    ).map((m) => ({
      id: m.id,
      role: m.role as "user" | "assistant",
      content: m.content,
      createdAt: m.createdAt,
    }));
  }, []);

  const loadHistory = useCallback(
    async (options?: { proactive?: boolean; skipIfHydrated?: boolean }) => {
    const clientTrace = isPerfEnabled()
      ? perfClientTrace("Enter Chat — Client")
      : null;
    if (!safeConversationId) {
      setMessages([]);
      setIsLoadingHistory(false);
      return;
    }

    if (
      options?.skipIfHydrated &&
      hydratedFromServerRef.current &&
      messages.length > 0
    ) {
      hydratedFromServerRef.current = false;
      setIsLoadingHistory(false);
      const runProactive =
        options?.proactive !== false &&
        proactiveDoneRef.current !== safeConversationId;
      if (runProactive) {
        fetch(`/api/conversations/${safeConversationId}/proactive`, {
          method: "POST",
        })
          .then(() => {
            proactiveDoneRef.current = safeConversationId;
            return fetchMessages(safeConversationId);
          })
          .then((refreshed) => {
            setMessages((prev) =>
              refreshed.length > prev.length ? refreshed : prev
            );
          })
          .catch(() => undefined);
      }
      return;
    }

    setIsLoadingHistory(true);
    try {
      const cacheBust = Date.now();
      const runProactive =
        options?.proactive !== false &&
        proactiveDoneRef.current !== safeConversationId;

      const proactivePromise = runProactive
        ? fetch(
            `/api/conversations/${safeConversationId}/proactive?_=${cacheBust}`,
            { method: "POST" }
          )
            .then(() => {
              proactiveDoneRef.current = safeConversationId;
            })
            .catch(() => {
              /* 선제 메시지 실패해도 채팅은 열림 */
            })
        : null;

      const [loadedMessages, relRes] = await Promise.all([
        fetchMessages(safeConversationId),
        fetch(
          `/api/relationship?conversationId=${safeConversationId}&_=${cacheBust}`,
          { cache: "no-store" }
        ),
      ]);

      setMessages(loadedMessages);

      let relData: { state?: Record<string, unknown> } = {};
      try {
        relData = await relRes.json();
      } catch {
        /* 기본 관계 상태 유지 */
      }

      if (relRes.ok && relData.state) {
        setAffection((relData.state.affection as number) ?? 0);
        setRelationshipLevel(
          (relData.state.relationshipLevel as RelationshipLevel) ?? 1
        );
        setEmotion(normalizeEmotion(relData.state.emotion as string));
        setLastChatAt((relData.state.lastChatAt as string) ?? null);
      }

      setIsLoadingHistory(false);

      if (proactivePromise) {
        proactivePromise.then(async () => {
          const refreshed = await fetchMessages(safeConversationId);
          setMessages((prev) =>
            refreshed.length > prev.length ? refreshed : prev
          );
        });
      }
    } catch {
      /* 히스토리 로드 실패 시 빈 채팅으로 시작 */
      setIsLoadingHistory(false);
    } finally {
      clientTrace?.end();
    }
  },
    [safeConversationId, fetchMessages]
  );

  useEffect(() => {
    markBrowserSessionActive();
  }, []);

  useEffect(() => {
    streamingIdRef.current = null;
    proactiveDoneRef.current = null;

    if (hydratedFromServerRef.current && (initialMessages?.length ?? 0) > 0) {
      loadHistory({ proactive: true, skipIfHydrated: true });
      return;
    }

    setMessages([]);
    setIsTyping(false);
    setIsLoadingHistory(true);
    setAffection(initialAffection);
    setRelationshipLevel(initialRelationshipLevel);
    setEmotion(initialEmotion ?? resolvedCharacter.defaultEmotion ?? "happy");
    setLastChatAt(initialLastChatAt);
    loadHistory({ proactive: true });
  }, [safeConversationId, loadHistory]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping) return;

      const userMsgId = `user-${Date.now()}`;
      const nowIso = new Date().toISOString();
      setMessages((prev) => [
        ...prev,
        { id: userMsgId, role: "user", content: text.trim(), createdAt: nowIso },
      ]);
      setIsTyping(true);

      const aiMsgId = `stream-${Date.now()}`;
      streamingIdRef.current = aiMsgId;
      setMessages((prev) => [
        ...prev,
        { id: aiMsgId, role: "assistant", content: "" },
      ]);

      try {
        if (!safeConversationId) {
          throw new Error("대화방을 준비 중입니다. 잠시 후 다시 시도해주세요.");
        }

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: safeConversationId,
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
              assistantMessageId?: string;
              assistantCreatedAt?: string;
            };

            if (chunk.error) throw new Error(chunk.error);

            if (chunk.content) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId
                    ? {
                        ...m,
                        content: chunk.replace
                          ? chunk.content!
                          : m.content + chunk.content,
                      }
                    : m
                )
              );
            }

            if (chunk.done) {
              if (chunk.affection != null) setAffection(chunk.affection);
              if (chunk.relationshipLevel != null)
                setRelationshipLevel(chunk.relationshipLevel);
              if (chunk.emotion) setEmotion(normalizeEmotion(chunk.emotion));
              if (chunk.assistantMessageId) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMsgId
                      ? {
                          ...m,
                          id: chunk.assistantMessageId!,
                          createdAt:
                            chunk.assistantCreatedAt ?? m.createdAt,
                        }
                      : m
                  )
                );
              }
            }
          }
        }
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
    [safeConversationId, isTyping]
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
        conversationId: safeConversationId,
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
