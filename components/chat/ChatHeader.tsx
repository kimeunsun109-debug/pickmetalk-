"use client";

import { useChat } from "@/contexts/ChatProvider";
import { getEmotionMeta } from "@/lib/emotions";
import {
  affectionProgressBlocks,
  getRelationshipStage,
} from "@/lib/relationship";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

/**
 * ChatHeader — 아바타·감정 뱃지·호감도 진행바를 포함한 채팅 상단 헤더.
 *
 * 아바타 이미지 경로: /assets/characters/{characterId}/{emotion}.png
 * 파일이 없는 경우 캐릭터 이름 첫 글자 + 그라디언트 원으로 대체한다.
 */
export function ChatHeader() {
  const { character, characterId, emotion, affection, relationshipLevel } =
    useChat();

  const meta = getEmotionMeta(emotion);
  const stage = getRelationshipStage(affection);
  const { filled, total, percent } = affectionProgressBlocks(affection);

  const avatarSrc = `/assets/characters/${characterId}/${emotion}.png`;
  const [imgError, setImgError] = useState(false);

  /** 감정에 따른 헤더 배경 그라디언트 (아주 옅게) */
  const emotionBg: Record<string, string> = {
    happy: "from-pink-50 to-white",
    excited: "from-rose-50 to-white",
    hurt: "from-blue-50 to-white",
    pouty: "from-purple-50 to-white",
    miss_you: "from-indigo-50 to-white",
    bored: "from-gray-50 to-white",
    special_day: "from-yellow-50 to-white",
  };
  const bgGradient = emotionBg[emotion] ?? "from-pink-50 to-white";

  return (
    <header
      className={`sticky top-0 z-10 border-b bg-gradient-to-b ${bgGradient} shadow-sm`}
    >
      {/* ── 상단 행: 뒤로가기 / 아바타+이름 / 레벨 ── */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* 뒤로가기 */}
        <Link
          href="/characters"
          className="shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
          aria-label="캐릭터 선택으로"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="size-5"
          >
            <path
              fillRule="evenodd"
              d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
              clipRule="evenodd"
            />
          </svg>
        </Link>

        {/* 아바타 */}
        <div className="relative shrink-0">
          {!imgError ? (
            <Image
              src={avatarSrc}
              alt={`${character.name} ${meta.label}`}
              width={44}
              height={44}
              className="rounded-full object-cover ring-2 ring-pink-soft transition-all duration-500"
              onError={() => setImgError(true)}
              priority
            />
          ) : (
            /* 이미지 없을 때 fallback: 그라디언트 원 + 이름 첫 글자 */
            <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-pink-300 to-pink-500 text-lg font-bold text-white ring-2 ring-pink-soft">
              {character.name[0]}
            </div>
          )}

          {/* 감정 이모지 뱃지 */}
          <span
            className="absolute -bottom-0.5 -right-1 rounded-full bg-white px-0.5 text-[15px] leading-none shadow-sm ring-1 ring-pink-soft/60"
            aria-label={`감정: ${meta.label}`}
          >
            {meta.emoji}
          </span>
        </div>

        {/* 이름 + 감정 상태 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[15px] font-semibold text-gray-900">
              {character.name}
            </span>
            {/* 감정 뱃지 — 감정 변화 시 부드럽게 페이드 */}
            <span
              key={emotion}
              className="animate-fadeIn rounded-full bg-pink-soft px-2 py-0.5 text-[10px] font-semibold text-pink-accent"
            >
              {meta.label}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-gray-400">
            {meta.hint}
          </p>
        </div>

        {/* 관계 레벨 뱃지 */}
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-pink-accent shadow-sm ring-1 ring-pink-soft">
          Lv{relationshipLevel}
        </span>
      </div>

      {/* ── 호감도 진행바 ── */}
      <div className="px-4 pb-3">
        <div className="mb-1.5 flex items-baseline justify-between">
          <span className="text-[10px] font-medium text-gray-600">
            {stage.label}
          </span>
          <span className="text-[10px] text-gray-400">호감도 {percent}%</span>
        </div>
        <div
          className="flex gap-[3px]"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`호감도 ${percent}퍼센트`}
        >
          {Array.from({ length: total }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-700 ${
                i < filled
                  ? "bg-pink-accent shadow-sm shadow-pink-accent/40"
                  : "bg-pink-soft/40"
              }`}
            />
          ))}
        </div>
      </div>
    </header>
  );
}
