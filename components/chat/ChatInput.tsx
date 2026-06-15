"use client";

import { useState } from "react";

/** KakaoTalk-style message input bar. */
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

  const canSend = Boolean(text.trim()) && !disabled;

  return (
    <footer className="border-t border-gray-200/80 bg-white px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <form onSubmit={handleSubmit} className="flex items-end gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="메시지 입력"
          disabled={disabled}
          enterKeyHint="send"
          className="min-w-0 flex-1 rounded-[20px] border border-gray-200 bg-gray-50 px-4 py-2.5 text-[15px] outline-none transition-colors focus:border-pink-accent/50 focus:bg-white"
        />
        <button
          type="submit"
          disabled={!canSend}
          aria-label="전송"
          className={`flex size-10 shrink-0 items-center justify-center rounded-full transition-colors ${
            canSend
              ? "bg-pink-accent text-white"
              : "bg-gray-200 text-gray-400"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-5"
          >
            <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.288Z" />
          </svg>
        </button>
      </form>
    </footer>
  );
}
