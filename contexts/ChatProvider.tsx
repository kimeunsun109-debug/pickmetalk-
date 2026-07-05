"use client";

import { markBrowserSessionActive } from "@/lib/auth/browserSession";
import { deviceSessionHeaders } from "@/lib/auth/deviceSession";
import { normalizeEmotion } from "@/lib/emotions";
import { resolveCharacterId } from "@/lib/chatRoute";
import { perfClientTrace, usePerfRenderCount } from "@/lib/perf/client";
import { isPerfEnabled } from "@/lib/perf/trace";
import type { EmotionState, PublicCharacter, RelationshipLevel } from "@/types";
import type { ChatStreamChunk } from "@/types/api";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  character: PublicCharacter;
  characterId: string;
  conversationId: string | null;
  isPremiumUser: boolean;
  emotion: EmotionState;
  affection: number;
  relationshipLevel: RelationshipLevel;
  lastChatAt: string | null;
  messages: ChatMessage[];
  isTyping: boolean;
  /** 백그라운드 동기화 중 — UI 차단·전체 로딩 화면에 사용하지 않음 */
  isSyncingHistory: boolean;
  sendMessage: (text: string, options?: { resend?: boolean }) => Promise<void>;
  regenerateLastReply: () => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  reload: () => Promise<void>;
  showPremiumModal: boolean;
  premiumModalReason: "daily_limit" | "content" | null;
  openPremiumModal: (reason?: "daily_limit" | "content") => void;
  closePremiumModal: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

/** 헤더 등 — messages 변경 시 re-render 방지 */
interface ChatMetaContextValue {
  character: PublicCharacter;
  characterId: string;
  conversationId: string | null;
  isPremiumUser: boolean;
  emotion: EmotionState;
  affection: number;
  relationshipLevel: RelationshipLevel;
  lastChatAt: string | null;
}

const ChatMetaContext = createContext<ChatMetaContextValue | null>(null);

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) {
    throw new Error("useChat must be used inside <ChatProvider>");
  }
  return ctx;
}

export function useChatMeta(): ChatMetaContextValue {
  const ctx = useContext(ChatMetaContext);
  if (!ctx) {
    throw new Error("useChatMeta must be used inside <ChatProvider>");
  }
  return ctx;
}

interface ChatProviderProps {
  character: PublicCharacter;
  characterId: string;
  conversationId: string | null;
  isPremiumUser: boolean;
  initialMessages?: ChatMessage[];
  initialAffection?: number;
  initialRelationshipLevel?: RelationshipLevel;
  initialEmotion?: EmotionState;
  initialLastChatAt?: string | null;
  children: ReactNode;
}

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
  const resolvedCharacter = character;

  const hasSsrMessages = Boolean(initialMessages?.length);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages ?? []);
  const [isTyping, setIsTyping] = useState(false);
  /** UI에 사용하지 않음 — 백그라운드 동기화만 (로딩 화면·skeleton 없음) */
  const [isSyncingHistory] = useState(false);
  const streamingIdRef = useRef<string | null>(null);
  const proactiveDoneRef = useRef<string | null>(null);
  const ssrHydratedRef = useRef(hasSsrMessages);
  const ssrRelationshipHydratedRef = useRef(hasSsrMessages);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const initialSnapshotRef = useRef({
    initialMessages,
    initialAffection,
    initialRelationshipLevel,
    initialEmotion,
    initialLastChatAt,
  });
  initialSnapshotRef.current = {
    initialMessages,
    initialAffection,
    initialRelationshipLevel,
    initialEmotion,
    initialLastChatAt,
  };

  const [affection, setAffection] = useState(initialAffection);
  const [relationshipLevel, setRelationshipLevel] =
    useState<RelationshipLevel>(initialRelationshipLevel);
  const [emotion, setEmotion] = useState<EmotionState>(
    initialEmotion ?? resolvedCharacter.defaultEmotion ?? "happy"
  );
  const [lastChatAt, setLastChatAt] = useState<string | null>(initialLastChatAt);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumModalReason, setPremiumModalReason] = useState<
    "daily_limit" | "content" | null
  >(null);

  const safeConversationId = conversationId?.trim() || null;

  const fetchMessages = useCallback(async (convId: string) => {
    const msgRes = await fetch(
      `/api/messages?conversationId=${convId}&_=${Date.now()}`,
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

      void fetch(`/api/conversations/${convId}/proactive`, { method: "POST" })
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

  const syncHistoryInBackground = useCallback(
    async (options?: { proactive?: boolean; skipIfHydrated?: boolean }) => {
      const clientTrace = isPerfEnabled()
        ? perfClientTrace("Enter Chat — Client")
        : null;

      if (!safeConversationId) {
        return;
      }

      if (
        options?.skipIfHydrated &&
        ssrHydratedRef.current &&
        messagesRef.current.length > 0
      ) {
        if (options?.proactive !== false) {
          runProactiveInBackground(safeConversationId);
        }
        clientTrace?.end();
        return;
      }

      try {
        const skipRelationship = ssrRelationshipHydratedRef.current;

        const [loadedMessages, relRes] = await Promise.all([
          fetchMessages(safeConversationId),
          skipRelationship
            ? Promise.resolve(null)
            : fetch(
                `/api/relationship?conversationId=${safeConversationId}&_=${Date.now()}`,
                { cache: "no-store" }
              ),
        ]);

        setMessages((prev) => mergeNewServerMessages(prev, loadedMessages));

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

        if (options?.proactive !== false) {
          runProactiveInBackground(safeConversationId);
        }
      } catch {
        /* 기존 화면 유지 */
      } finally {
        clientTrace?.end();
      }
    },
    [safeConversationId, fetchMessages, runProactiveInBackground]
  );

  useEffect(() => {
    markBrowserSessionActive();
  }, []);

  useEffect(() => {
    const snap = initialSnapshotRef.current;
    const msgs = snap.initialMessages ?? [];
    const hasMessages = msgs.length > 0;

    streamingIdRef.current = null;
    proactiveDoneRef.current = null;
    ssrHydratedRef.current = hasMessages;
    ssrRelationshipHydratedRef.current = hasMessages;
    messagesRef.current = msgs;

    setMessages(msgs);
    setIsTyping(false);
    setAffection(snap.initialAffection);
    setRelationshipLevel(snap.initialRelationshipLevel);
    setEmotion(
      snap.initialEmotion ?? resolvedCharacter.defaultEmotion ?? "happy"
    );
    setLastChatAt(snap.initialLastChatAt);

    void syncHistoryInBackground({
      proactive: true,
      skipIfHydrated: hasMessages,
    });
  }, [safeConversationId, syncHistoryInBackground, resolvedCharacter.defaultEmotion]);

  const sendMessage = useCallback(
    async (text: string, options?: { resend?: boolean }) => {
      if (!text.trim() || isTyping) return;

      const trimmed = text.trim();
      const resend = options?.resend === true;
      const userMsgId = resend
        ? (messagesRef.current.filter((m) => m.role === "user").at(-1)?.id ??
          `user-${Date.now()}`)
        : `user-${Date.now()}`;
      const nowIso = new Date().toISOString();

      if (!resend) {
        setMessages((prev) => [
          ...prev,
          { id: userMsgId, role: "user", content: trimmed, createdAt: nowIso },
        ]);
      }
      setIsTyping(true);

      const aiMsgId = `stream-${Date.now()}`;
      streamingIdRef.current = aiMsgId;

      try {
        if (!safeConversationId) {
          throw new Error("대화방을 준비 중입니다. 잠시 후 다시 시도해주세요.");
        }

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...deviceSessionHeaders(),
          },
          body: JSON.stringify({
            conversationId: safeConversationId,
            message: trimmed,
            resend: resend || undefined,
          }),
        });

        if (!res.ok) {
          const err = (await res.json()) as {
            error?: string;
            code?: string;
          };
          if (res.status === 429 || err.code === "DAILY_LIMIT_REACHED") {
            if (!resend) {
              setMessages((prev) => prev.filter((m) => m.id !== userMsgId));
            }
            setPremiumModalReason("daily_limit");
            setShowPremiumModal(true);
            return;
          }
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
              setMessages((prev) => {
                const existing = prev.find((m) => m.id === aiMsgId);
                const shouldReplace =
                  Boolean(chunk.replace) || Boolean(chunk.clearFallback);
                if (!existing) {
                  return [
                    ...prev,
                    {
                      id: aiMsgId,
                      role: "assistant",
                      content: chunk.content!,
                    },
                  ];
                }
                return prev.map((m) =>
                  m.id === aiMsgId
                    ? {
                        ...m,
                        content: shouldReplace
                          ? chunk.content!
                          : m.content + chunk.content,
                      }
                    : m
                );
              });
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
        const errText =
          e instanceof Error
            ? `오류: ${e.message}`
            : "오류가 발생했어요.";
        setMessages((prev) => {
          const existing = prev.find((m) => m.id === aiMsgId);
          if (!existing) {
            return [
              ...prev,
              { id: aiMsgId, role: "assistant", content: errText },
            ];
          }
          return prev.map((m) =>
            m.id === aiMsgId ? { ...m, content: errText } : m
          );
        });
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
      headers: deviceSessionHeaders(),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(data.error ?? "메시지를 삭제하지 못했습니다.");
    }

    setMessages((prev) => prev.filter((message) => message.id !== messageId));
  }, []);

  const regenerateLastReply = useCallback(async () => {
    const msgs = messagesRef.current;
    const last = msgs[msgs.length - 1];
    if (!last || last.role !== "assistant" || isTyping) return;

    let lastUser: ChatMessage | undefined;
    for (let i = msgs.length - 2; i >= 0; i -= 1) {
      if (msgs[i].role === "user") {
        lastUser = msgs[i];
        break;
      }
    }
    if (!lastUser?.content.trim()) return;

    try {
      await deleteMessage(last.id);
      await sendMessage(lastUser.content, { resend: true });
    } catch {
      /* sendMessage surfaces errors in UI */
    }
  }, [deleteMessage, sendMessage, isTyping]);

  const openPremiumModal = useCallback(
    (reason: "daily_limit" | "content" = "content") => {
      setPremiumModalReason(reason);
      setShowPremiumModal(true);
    },
    []
  );
  const closePremiumModal = useCallback(() => {
    setShowPremiumModal(false);
    setPremiumModalReason(null);
  }, []);

  const contextValue = useMemo<ChatContextValue>(
    () => ({
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
      isSyncingHistory,
      sendMessage,
      regenerateLastReply,
      deleteMessage,
      reload: syncHistoryInBackground,
      showPremiumModal,
      premiumModalReason,
      openPremiumModal,
      closePremiumModal,
    }),
    [
      resolvedCharacter,
      safeCharacterId,
      safeConversationId,
      isPremiumUser,
      emotion,
      affection,
      relationshipLevel,
      lastChatAt,
      messages,
      isTyping,
      isSyncingHistory,
      sendMessage,
      regenerateLastReply,
      deleteMessage,
      syncHistoryInBackground,
      showPremiumModal,
      premiumModalReason,
      openPremiumModal,
      closePremiumModal,
    ]
  );

  const metaValue = useMemo<ChatMetaContextValue>(
    () => ({
      character: resolvedCharacter,
      characterId: safeCharacterId,
      conversationId: safeConversationId,
      isPremiumUser,
      emotion,
      affection,
      relationshipLevel,
      lastChatAt,
    }),
    [
      resolvedCharacter,
      safeCharacterId,
      safeConversationId,
      isPremiumUser,
      emotion,
      affection,
      relationshipLevel,
      lastChatAt,
    ]
  );

  return (
    <ChatMetaContext.Provider value={metaValue}>
      <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
    </ChatMetaContext.Provider>
  );
}
