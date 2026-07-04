"use client";

import { ChatInput } from "@/components/chat/ChatInput";
import { MessageAreaSkeleton } from "@/components/chat/MessageAreaSkeleton";
import { memo } from "react";

/**
 * 라우트 전환 시 ChatScreen과 동일한 크롬 유지 (스피너·전체 교체 없음).
 * loading.tsx에서 사용 — 언마운트 없이 레이아웃만 선표시.
 */
export const ChatRouteShell = memo(function ChatRouteShell() {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#b2c7d9]/30">
      <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 backdrop-blur-md">
        <div className="flex items-center gap-2.5 px-3 py-2.5">
          <div className="size-9 shrink-0 animate-pulse rounded-full bg-gray-100" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
            <div className="h-3 w-16 animate-pulse rounded bg-gray-50" />
          </div>
        </div>
        <div className="flex gap-[2px] px-4 pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <span
              key={i}
              className="h-[3px] flex-1 rounded-full bg-pink-soft/40"
            />
          ))}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto scroll-ios pb-2">
        <MessageAreaSkeleton />
      </main>

      <ChatInput disabled onSend={() => undefined} />
    </div>
  );
});
