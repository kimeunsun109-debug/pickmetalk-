"use client";

import { memo } from "react";

/** 메시지 로딩 중 말풍선 영역만 표시 (전체 화면 교체 없음) */
export const MessageAreaSkeleton = memo(function MessageAreaSkeleton() {
  return (
    <div className="space-y-3 px-3 py-4" aria-hidden>
      <div className="flex justify-start gap-2">
        <div className="size-8 shrink-0 animate-pulse rounded-full bg-gray-200/80" />
        <div className="h-10 w-[58%] animate-pulse rounded-2xl rounded-tl-sm bg-white/70" />
      </div>
      <div className="flex justify-end">
        <div className="h-9 w-[42%] animate-pulse rounded-2xl rounded-tr-sm bg-[#ffe812]/40" />
      </div>
      <div className="flex justify-start gap-2">
        <div className="size-8 shrink-0 animate-pulse rounded-full bg-gray-200/80" />
        <div className="h-14 w-[72%] animate-pulse rounded-2xl rounded-tl-sm bg-white/70" />
      </div>
    </div>
  );
});
