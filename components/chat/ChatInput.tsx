"use client";

import { useState } from "react";

/** 채팅 입력창 — 전송 시 onSend 호출 */
export function ChatInput({
  disabled,
  onSend,
}: {
  disabled?: boolean;
  onSend: (text: string) => void;
}) {
  const [text, setText] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
  }

  return (
    <footer className="border-t bg-white p-3">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지를 입력하세요"
          disabled={disabled}
          className="min-w-0 flex-1 rounded-full border px-4 py-2 text-sm outline-none focus:border-pink-accent"
        />
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="shrink-0 rounded-full bg-pink-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
        >
          전송
        </button>
      </form>
    </footer>
  );
}
