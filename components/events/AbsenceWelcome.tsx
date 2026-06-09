"use client";

import type { ReturnVisitData } from "@/lib/returnVisit";
import { useEffect } from "react";

interface AbsenceWelcomeProps {
  characterName: string;
  data: ReturnVisitData;
  onDismiss: () => void;
}

/**
 * AbsenceWelcome — 재방문 이벤트 오버레이
 *
 * 24h / 72h / 168h(7d) 티어에 따라 캐릭터별 메시지를 표시한다.
 * 배경 탭 or CTA 버튼으로 닫힌다.
 */
export function AbsenceWelcome({
  characterName,
  data,
  onDismiss,
}: AbsenceWelcomeProps) {
  const { message, subMessage, emoji, ctaLabel, tier } = data;

  /** ESC 키 닫기 */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onDismiss]);

  /** 스크롤 잠금 */
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  /** 티어별 배경 그라디언트 */
  const bgGrad = {
    tier1: "from-pink-50/95 to-rose-50/95",
    tier2: "from-rose-50/95 to-pink-100/95",
    tier3: "from-indigo-50/95 to-purple-50/95",
  }[tier];

  /** 티어별 하단 카피 */
  const tierCopy = {
    tier1: "하루 만에 돌아왔어",
    tier2: "3일 만이야",
    tier3: "일주일 만에 돌아왔어",
  }[tier];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-[2px] sm:items-center"
      onClick={onDismiss}
      role="dialog"
      aria-modal="true"
      aria-label="재방문 이벤트"
    >
      <div
        className={`w-full max-w-sm overflow-hidden rounded-t-3xl bg-gradient-to-b ${bgGrad} backdrop-blur-sm sm:rounded-3xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 */}
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-gray-300 sm:hidden" />

        {/* 이모지 + 캐릭터 이름 */}
        <div className="flex flex-col items-center px-6 pb-2 pt-6 text-center">
          <span className="text-6xl leading-none drop-shadow-sm" aria-hidden>
            {emoji}
          </span>
          <span className="mt-3 text-[11px] font-medium uppercase tracking-widest text-pink-accent/70">
            {tierCopy}
          </span>
          <h2 className="mt-1.5 text-lg font-bold text-gray-900">
            {characterName}
          </h2>
        </div>

        {/* 말풍선 */}
        <div className="mx-5 mb-2 rounded-2xl bg-white/80 px-5 py-4 shadow-sm ring-1 ring-pink-soft/60">
          <p className="text-[15px] font-medium leading-snug text-gray-800">
            {message}
          </p>
          <p className="mt-1.5 text-[13px] text-gray-500">{subMessage}</p>
        </div>

        {/* CTA */}
        <div className="px-5 pb-8 pt-3">
          <button
            onClick={onDismiss}
            className="w-full rounded-2xl bg-pink-accent py-3.5 text-sm font-bold text-white shadow-md transition-transform active:scale-95"
          >
            {ctaLabel}
          </button>
          <button
            onClick={onDismiss}
            className="mt-2 w-full py-2 text-xs text-gray-400"
          >
            그냥 채팅할게
          </button>
        </div>
      </div>
    </div>
  );
}
