"use client";

import { ChatBubble } from "@/components/chat/ChatBubble";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatStatusHeader } from "@/components/chat/ChatStatusHeader";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { useChat } from "@/hooks/useChat";
import type { Character } from "@/types";
import { useEffect, useRef } from "react";

/** 카카오톡 스타일 채팅 화면 */
export function ChatScreen({ character }: { character: Character }) {
  const {
    messages,
    isTyping,
    isLoadingHistory,
    affection,
    relationshipLevel,
    emotion,
    sendMessage,
  } = useChat(character.id);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex min-h-screen flex-col bg-ivory">
      <ChatStatusHeader
        characterName={character.name}
        emotion={emotion}
        affection={affection}
        relationshipLevel={relationshipLevel}
      />

      <div className="flex-1 overflow-y-auto py-2">
        {isLoadingHistory ? (
          <p className="p-4 text-center text-sm text-gray-400">
            대화 불러오는 중...
          </p>
        ) : messages.length === 0 ? (
          <p className="p-4 text-center text-sm text-gray-400">
            {character.name}에게 첫 인사를 건네보세요 💬
          </p>
        ) : (
          messages.map((m) => (
            <ChatBubble key={m.id} role={m.role}>
              {m.content || (isTyping && m.role === "assistant" ? "" : m.content)}
            </ChatBubble>
          ))
        )}
        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <ChatInput disabled={isTyping || isLoadingHistory} onSend={sendMessage} />
    </div>
  );
}
