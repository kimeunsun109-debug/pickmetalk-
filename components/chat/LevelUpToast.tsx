"use client";

import { characterEmotionSrc } from "@/lib/characters/images";
import type { RelationshipLevel } from "@/types";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface LevelUpToastProps {
  newLevel: RelationshipLevel;
  stageName: string;
  characterId: string;
  characterName: string;
  onDismiss: () => void;
}

const LEVEL_HEARTS: Record<RelationshipLevel, string[]> = {
  1: ["🌱"],
  2: ["💛", "🌸"],
  3: ["💖", "✨", "🌸"],
  4: ["💕", "💗", "✨", "🌷"],
  5: ["💖", "💕", "✨", "🌸", "💫", "🌹"],
};

const AUTO_CLOSE_MS = 3600;

/**
 * LevelUpToast — 관계 레벨업 시 하단에서 올라오는 축하 오버레이.
 * auto-close: 3.6초. 탭 또는 버튼으로 즉시 닫기 가능.
 */
export function LevelUpToast({
  newLevel,
  stageName,
  characterId,
  characterName,
  onDismiss,
}: LevelUpToastProps) {
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = () => {
    if (leaving) return;
    setLeaving(true);
    timerRef.current = setTimeout(onDismiss, 300);
  };

  useEffect(() => {
    const t = setTimeout(dismiss, AUTO_CLOSE_MS);
    return () => {
      clearTimeout(t);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const avatarSrc = characterEmotionSrc(characterId, "happy");
  const hearts = LEVEL_HEARTS[newLevel] ?? ["💖"];

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`관계 레벨 ${newLevel}로 상승 — ${stageName}`}
      className="pointer-events-auto fixed inset-x-0 bottom-[env(safe-area-inset-bottom,0px)] z-50 flex justify-center px-4 pb-24"
      onClick={dismiss}
    >
      <div
        className={[
          "relative w-full max-w-sm overflow-hidden rounded-3xl",
          "bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100",
          "shadow-[0_8px_32px_rgba(184,106,122,0.22)]",
          "border border-rose-200/60",
          leaving ? "animate-level-up-out" : "animate-level-up-in",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
      >
        {/* floating sparkles */}
        <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {hearts.map((h, i) => (
            <span
              key={i}
              className="absolute text-lg animate-heart-float"
              style={{
                left: `${12 + i * (72 / hearts.length)}%`,
                top: "10%",
                animationDelay: `${i * 0.18}s`,
                animationDuration: `${1.3 + i * 0.15}s`,
              }}
            >
              {h}
            </span>
          ))}
        </div>

        <div className="relative flex items-center gap-3 px-4 py-3">
          {/* character avatar */}
          <div className="relative size-14 shrink-0 overflow-hidden rounded-full border-2 border-rose-200 shadow-sm">
            <Image
              src={avatarSrc}
              alt={characterName}
              fill
              sizes="56px"
              className="object-cover object-top"
              onError={() => undefined}
            />
          </div>

          {/* text */}
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-pink-accent/70">
              관계가 발전했어요
            </p>
            <p className="mt-0.5 truncate text-base font-bold text-gray-900">
              {stageName}
            </p>
            <div className="mt-1 flex gap-0.5">
              {Array.from({ length: 5 }, (_, i) => (
                <span
                  key={i}
                  className={[
                    "inline-block size-2.5 rounded-full transition-colors",
                    i < newLevel ? "bg-rose-deep" : "bg-rose-200/60",
                  ].join(" ")}
                />
              ))}
            </div>
          </div>

          {/* close */}
          <button
            onClick={dismiss}
            aria-label="닫기"
            className="ml-1 shrink-0 rounded-full p-1 text-gray-400 hover:text-gray-600"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
