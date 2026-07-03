"use client";

import { useChat } from "@/contexts/ChatProvider";
import { goToCharacterChat } from "@/lib/navigateChat";
import {
  affectionProgressBlocks,
  getRelationshipStage,
} from "@/lib/relationship";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface ChatHeaderProps {
  conversationTitle?: string;
}

export function ChatHeader({ conversationTitle }: ChatHeaderProps) {
  const router = useRouter();
  const { character, characterId, emotion, affection, relationshipLevel } =
    useChat();

  const stage = getRelationshipStage(affection);
  const { filled, total, percent } = affectionProgressBlocks(affection);

  const avatarSrc = `/assets/characters/${characterId}/${emotion}.png`;
  const [imgError, setImgError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;

    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [menuOpen]);

  async function handleNewConversation() {
    if (creating) return;
    setCreating(true);
    setCreateError(null);
    setMenuOpen(false);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "새 대화를 만들 수 없습니다.");
      }
      goToCharacterChat(router, characterId, data.conversation.id);
    } catch (e) {
      setCreateError(
        e instanceof Error
          ? e.message
          : "새 대화를 만들 수 없습니다. 잠시 후 다시 시도해주세요."
      );
    } finally {
      setCreating(false);
    }
  }

  const subtitle =
    conversationTitle?.trim() ||
    (relationshipLevel >= 2 ? stage.label : "대화 중");

  return (
    <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <Link
          href="/conversations"
          className="shrink-0 rounded-full p-1.5 text-gray-500 transition-colors active:bg-gray-100"
          aria-label="대화 목록"
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

        <div className="relative shrink-0">
          {!imgError ? (
            <Image
              src={avatarSrc}
              alt={character.name}
              width={40}
              height={40}
              className="size-10 rounded-full object-cover"
              onError={() => setImgError(true)}
              priority
            />
          ) : (
            <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-300 to-pink-500 text-base font-bold text-white">
              {character.name[0]}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[16px] font-semibold leading-tight text-gray-900">
            {character.name}
          </p>
          <p className="mt-0.5 truncate text-[12px] text-gray-400">{subtitle}</p>
        </div>

        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-full p-2 text-gray-500 transition-colors active:bg-gray-100"
            aria-label="더보기"
            aria-expanded={menuOpen}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="size-5"
            >
              <path d="M3 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM8.5 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0ZM15.5 10a1.5 1.5 0 1 1 3 0 1.5 1.5 0 0 1-3 0Z" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-30 mt-1 min-w-[148px] overflow-hidden rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
              <button
                type="button"
                disabled={creating}
                onClick={handleNewConversation}
                className="flex w-full px-4 py-2.5 text-left text-sm text-gray-700 active:bg-gray-50 disabled:opacity-50"
              >
                {creating ? "만드는 중…" : "새 대화 시작"}
              </button>
              <Link
                href="/settings"
                className="block px-4 py-2.5 text-sm text-gray-700 active:bg-gray-50"
                onClick={() => setMenuOpen(false)}
              >
                설정
              </Link>
            </div>
          )}
        </div>
      </div>

      {createError && (
        <p className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {createError}
        </p>
      )}

      <div
        className="flex gap-[2px] px-4 pb-2"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`호감도 ${percent}%`}
      >
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-[3px] flex-1 rounded-full transition-colors duration-700 ${
              i < filled ? "bg-pink-accent/80" : "bg-pink-soft/50"
            }`}
          />
        ))}
      </div>
    </header>
  );
}
