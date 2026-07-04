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

/** proactive refresh 시 스트리밍 중 덮어쓰지 않고 신규 메시지만 병합 */
function mergeNewServerMessages(
  prev: ChatMessage[],
  server: ChatMessage[]
): ChatMessage[] {
  const prevIds = new Set(prev.map((m) => m.id));
  const novel = server.filter((m) => !prevIds.has(m.id));
  if (novel.length === 0) return prev;
  const merged = [...prev, ...novel];
  merged.sort((a, b) => {
    const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
    const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
    return ta - tb;
  });
  return merged;
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
  const ssrMessagesHydratedRef = useRef(Boolean(initialMessages?.length));
  const ssrRelationshipHydratedRef = useRef(
    Boolean(initialMessages?.length)
  );

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

  const runProactiveInBackground = useCallback(
    (convId: string) => {
      if (proactiveDoneRef.current === convId) return;

      void fetch(`/api/conversations/${convId}/proactive`, {
        method: "POST",
      })
        .then(() => {
          proactiveDoneRef.current = convId;
          return fetchMessages(convId);
        })
        .then((refreshed) => {
          if (streamingIdRef.current) return;
          setMessages((prev) => mergeNewServerMessages(prev, refreshed));
        })
        .catch(() => undefined);
    },
    [fetchMessages]
  );

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
        ssrMessagesHydratedRef.current &&
        messages.length > 0
      ) {
        setIsLoadingHistory(false);
        if (options?.proactive !== false) {
          runProactiveInBackground(safeConversationId);
        }
        clientTrace?.end();
        return;
      }

      setIsLoadingHistory(true);
      try {
        const skipRelationship = ssrRelationshipHydratedRef.current;

        const messagePromise = fetchMessages(safeConversationId);
        const relationshipPromise = skipRelationship
          ? Promise.resolve(null)
          : fetch(
              `/api/relationship?conversationId=${safeConversationId}&_=${Date.now()}`,
              { cache: "no-store" }
            );

        const [loadedMessages, relRes] = await Promise.all([
          messagePromise,
          relationshipPromise,
        ]);

        setMessages(loadedMessages);

        if (relRes) {
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
        }

        setIsLoadingHistory(false);

        if (options?.proactive !== false) {
          runProactiveInBackground(safeConversationId);
        }
      } catch {
        setIsLoadingHistory(false);
      } finally {
        clientTrace?.end();
      }
    },
    [safeConversationId, fetchMessages, messages.length, runProactiveInBackground]
  );

  useEffect(() => {
    markBrowserSessionActive();
  }, []);

  useEffect(() => {
    streamingIdRef.current = null;
    proactiveDoneRef.current = null;

    if (ssrMessagesHydratedRef.current && (initialMessages?.length ?? 0) > 0) {
      loadHistory({ proactive: true, skipIfHydrated: true });
      return;
    }

    ssrMessagesHydratedRef.current = false;
    ssrRelationshipHydratedRef.current = false;
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
              emotion?: EmotionState;
            };

            if (chunk.error) throw new Error(chunk.error);

            if (chunk.userMessageId) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === userMsgId
                    ? { ...m, id: chunk.userMessageId! }
                    : m
                )
              );
            }

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
                setRelationshipLevel(
                  chunk.relationshipLevel as RelationshipLevel
                );
              if (chunk.emotion) setEmotion(normalizeEmotion(chunk.emotion));
              if (chunk.userMessageId) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === userMsgId
                      ? { ...m, id: chunk.userMessageId! }
                      : m
                  )
                );
              }
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
