"use client";

import { getEmotionMeta, normalizeEmotion } from "@/lib/emotions";
import {
  affectionProgressBlocks,
  getRelationshipStage,
} from "@/lib/relationship";
import type { EmotionState, RelationshipLevel } from "@/types";
import Link from "next/link";

/** 채팅 상단 — 감정 배지 + 관계 단계 진행바 */
export function ChatStatusHeader({
  characterName,
  emotion,
  affection,
  relationshipLevel,
}: {
  characterName: string;
  emotion: EmotionState;
  affection: number;
  relationshipLevel: RelationshipLevel;
}) {
  const normalized = normalizeEmotion(emotion);
  const meta = getEmotionMeta(normalized);
  const stage = getRelationshipStage(affection);
  const { filled, total, percent } = affectionProgressBlocks(affection);

  return (
    <header className="sticky top-0 z-10 border-b bg-white px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <Link
          href="/characters"
          className="shrink-0 text-sm text-gray-400 hover:text-gray-600"
          aria-label="캐릭터 선택으로"
        >
          ←
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <h1 className="flex items-center justify-center gap-1.5 text-base font-semibold">
            <span>{characterName}</span>
            <span className="text-lg" aria-hidden>
              {meta.emoji}
            </span>
            <span className="text-sm font-medium text-pink-accent">
              {meta.label}
            </span>
          </h1>
          <p className="mt-0.5 truncate text-[11px] text-gray-400">
            {meta.hint}
          </p>
        </div>
        <span className="w-6 shrink-0" aria-hidden />
      </div>

      <div className="mt-3 space-y-1.5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-medium text-gray-700">
            Lv{relationshipLevel} {stage.label}
          </span>
          <span className="text-gray-400">호감도 {percent}%</span>
        </div>
        <div
          className="flex gap-0.5"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`호감도 ${percent}퍼센트`}
        >
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`h-2 flex-1 rounded-sm ${
                i < filled ? "bg-pink-accent" : "bg-pink-soft/60"
              }`}
            />
          ))}
        </div>
      </div>
    </header>
  );
}
