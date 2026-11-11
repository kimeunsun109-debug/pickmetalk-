"use client";

import { characterEmotionSrc, characterAvatarSrc } from "@/lib/characters/images";
import { RELATIONSHIP_STAGES } from "@/lib/relationship";
import type { RelationshipLevel } from "@/types";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface LevelUpToastProps {
  characterId: string;
  newLevel: RelationshipLevel;
  onDismiss: () => void;
}

const STAGE_EMOJIS: Record<number, string> = {
  1: "👋",
  2: "😊",
  3: "🥰",
  4: "💕",
  5: "💖",
};

const DISMISS_DELAY_MS = 3800;
const FADE_OUT_MS = 400;

const FLOATING_HEARTS = ["💕", "💗", "💓", "✨", "🌸"];

export function LevelUpToast({ characterId, newLevel, onDismiss }: LevelUpToastProps) {
  const stage = RELATIONSHIP_STAGES.find((s) => s.level === newLevel);
  const emoji = STAGE_EMOJIS[newLevel] ?? "💖";
  const [exiting, setExiting] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [floaters, setFloaters] = useState<{ id: number; symbol: string; x: number; delay: number }[]>([]);
  const dismissedRef = useRef(false);

  const avatarSrc = characterEmotionSrc(characterId, "excited") ||
    characterEmotionSrc(characterId, "happy") ||
    characterAvatarSrc(characterId);

  useEffect(() => {
    const items = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      symbol: FLOATING_HEARTS[i % FLOATING_HEARTS.length],
      x: 10 + i * 14,
      delay: i * 0.18,
    }));
    setFloaters(items);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!dismissedRef.current) {
        setExiting(true);
        setTimeout(() => {
          if (!dismissedRef.current) {
            dismissedRef.current = true;
            onDismiss();
          }
        }, FADE_OUT_MS);
      }
    }, DISMISS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  function handleDismiss() {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setExiting(true);
    setTimeout(onDismiss, FADE_OUT_MS);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center pb-24 px-4 pointer-events-none"
      aria-live="polite"
      aria-label={`관계 레벨업: ${stage?.label ?? ""}`}
    >
      {/* floating hearts backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floaters.map((f) => (
          <span
            key={f.id}
            className="absolute bottom-24 text-xl animate-float-up"
            style={{
              left: `${f.x}%`,
              animationDelay: `${f.delay}s`,
              animationFillMode: "both",
            }}
          >
            {f.symbol}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="pointer-events-auto w-full max-w-xs focus:outline-none"
        aria-label="닫기"
      >
        <div
          className={`relative flex flex-col items-center gap-3 rounded-3xl px-6 py-6 shadow-2xl
            bg-white/95 backdrop-blur-md border border-pink-soft/40
            ${exiting ? "animate-level-up-out" : "animate-level-up-in"}
          `}
        >
          {/* sparkle emoji top-right */}
          <span
            className="absolute -top-3 -right-2 text-2xl animate-sparkle-pop"
            style={{ animationDelay: "0.3s", animationFillMode: "both" }}
            aria-hidden
          >
            ✨
          </span>
          <span
            className="absolute -top-2 left-3 text-xl animate-sparkle-pop"
            style={{ animationDelay: "0.5s", animationFillMode: "both" }}
            aria-hidden
          >
            🌸
          </span>

          {/* character avatar */}
          <div className="relative">
            <div className="size-20 overflow-hidden rounded-full ring-4 ring-pink-accent/30 shadow-lg">
              {!imgError ? (
                <Image
                  src={avatarSrc}
                  alt="캐릭터"
                  width={80}
                  height={80}
                  className="size-20 object-cover object-[center_15%]"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-pink-300 to-pink-accent text-3xl">
                  {emoji}
                </div>
              )}
            </div>
            <span
              className="absolute -bottom-1 -right-1 text-2xl animate-sparkle-pop"
              style={{ animationDelay: "0.2s", animationFillMode: "both" }}
              aria-hidden
            >
              {emoji}
            </span>
          </div>

          {/* text */}
          <div className="text-center space-y-1">
            <p className="text-xs font-medium tracking-widest text-pink-accent uppercase">
              관계가 깊어졌어요
            </p>
            <p className="text-xl font-bold text-gray-900 leading-tight">
              {stage?.label ?? `Lv.${newLevel}`}
            </p>
            <p className="text-[11px] text-gray-400 mt-1">
              화면을 탭하면 닫힙니다
            </p>
          </div>

          {/* level bar */}
          <div className="flex w-full gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-700 ${
                  i < newLevel ? "bg-pink-accent/80" : "bg-pink-soft/40"
                }`}
              />
            ))}
          </div>
        </div>
      </button>
    </div>
  );
}
