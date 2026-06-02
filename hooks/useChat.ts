"use client";

import type { ChatStreamChunk } from "@/types/api";
import { normalizeEmotion } from "@/lib/emotions";
import type { EmotionState, RelationshipLevel } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

export interface ChatMessageItem {
  id: string;
  role: "user" | "assistant";
  content: string;
}

/** 채팅 스트리밍 + 메시지 목록 */
export function useChat(characterId: string | null) {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [affection, setAffection] = useState(0);
  const [relationshipLevel, setRelationshipLevel] = useState<RelationshipLevel>(1);
  const [emotion, setEmotion] = useState<EmotionState>("happy");
  const streamingIdRef = useRef<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!characterId) return;
    setIsLoadingHistory(true);
    try {
      const [msgRes, relRes] = await Promise.all([
        fetch(`/api/messages?characterId=${characterId}`),
        fetch(`/api/relationship?characterId=${characterId}`),
      ]);
      const msgData = await msgRes.json();
      const relData = await relRes.json();

      if (msgRes.ok && msgData.messages) {
        setMessages(
          msgData.messages.map(
            (m: { id: string; role: string; content: string }) => ({
              id: m.id,
              role: m.role as "user" | "assistant",
              content: m.content,
            })
          )
        );
      }

      if (relRes.ok && relData.state) {
        setAffection(relData.state.affection);
        setRelationshipLevel(relData.state.relationshipLevel);
        setEmotion(normalizeEmotion(relData.state.emotion));
      }
    } finally {
      setIsLoadingHistory(false);
    }
  }, [characterId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!characterId || !text.trim() || isTyping) return;

      const userId = `local-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: userId, role: "user", content: text.trim() },
      ]);
      setIsTyping(true);

      const assistantId = `stream-${Date.now()}`;
      streamingIdRef.current = assistantId;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ characterId, message: text.trim() }),
        });

        if (!res.ok) {
          const err = await res.json();
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
                  m.id === assistantId
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
            m.id === assistantId
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

  return {
    messages,
    isTyping,
    isLoadingHistory,
    affection,
    relationshipLevel,
    emotion,
    sendMessage,
    reload: loadHistory,
  };
}
