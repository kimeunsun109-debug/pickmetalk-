"use client";

import { RELATIONSHIP_STAGES } from "@/lib/relationship";
import type { RelationshipLevel } from "@/types";
import { useEffect, useRef } from "react";

interface RelationshipLevelUpProps {
  from: RelationshipLevel;
  to: RelationshipLevel;
  characterName: string;
  onDismiss: () => void;
}

const LEVEL_EMOJI: Record<RelationshipLevel, string> = {
  1: "👋",
  2: "😊",
  3: "🥰",
  4: "💕",
  5: "💖",
};

const LEVEL_GRADIENT: Record<RelationshipLevel, string> = {
  1: "from-gray-50 to-slate-50",
  2: "from-pink-50 to-rose-50",
  3: "from-rose-50 to-pink-100",
  4: "from-pink-100 to-fuchsia-50",
  5: "from-fuchsia-50 to-purple-50",
};

const LEVEL_MESSAGE: Record<RelationshipLevel, string> = {
  1: "아직 서먹서먹하지만 첫 걸음이 시작됐어.",
  2: "이젠 좀 편해진 것 같아. 계속 이야기해 줄래?",
  3: "호감이 쌓이고 있어. 설레지 않아?",
  4: "이제 진짜 연인 같은 사이가 됐어. 💕",
  5: "더 특별해질 수가 없을 것 같아. 진심으로.",
};

/**
 * RelationshipLevelUp — 관계 레벨 상승 알림 토스트
 *
 * 레벨 업 직후 하단에서 슬라이드 인, 4초 후 자동 dismiss.
 * 탭/클릭으로도 즉시 닫힌다.
 */
export function RelationshipLevelUp({
  to,
  characterName,
  onDismiss,
}: RelationshipLevelUpProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toStage = RELATIONSHIP_STAGES.find((s) => s.level === to);

  useEffect(() => {
    timerRef.current = setTimeout(onDismiss, 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [onDismiss]);

  if (!toStage) return null;

  const emoji = LEVEL_EMOJI[to];
  const gradient = LEVEL_GRADIENT[to];
  const message = LEVEL_MESSAGE[to];

  return (
    <div
      className="pointer-events-auto fixed bottom-[88px] left-1/2 z-50 w-[calc(100%-32px)] max-w-sm -translate-x-1/2 animate-slide-up"
      onClick={onDismiss}
      role="status"
      aria-live="polite"
      aria-label={`관계 레벨 ${to} 달성`}
    >
      <div
        className={`flex items-center gap-3 rounded-2xl bg-gradient-to-r ${gradient} px-4 py-3.5 shadow-lg ring-1 ring-pink-soft/40`}
      >
        <span className="text-2xl leading-none" aria-hidden>
          {emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-pink-accent/80">
            Lv{to} 달성 · {characterName}
          </p>
          <p className="mt-0.5 text-[13px] font-semibold text-gray-800">
            {toStage.label}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-gray-500">{message}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="shrink-0 p-1 text-gray-400 transition-opacity hover:text-gray-600"
          aria-label="닫기"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
