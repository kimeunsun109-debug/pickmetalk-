"use client";

import { characterChatHref } from "@/lib/navigateChat";
import { resolveCharacterId } from "@/lib/chatRoute";
import type { PublicCharacter } from "@/types";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

/** Character selection card. */
export function CharacterCard({
  character,
  onSelect,
  isLoading,
  isActive,
}: {
  character: PublicCharacter;
  onSelect: () => void;
  isLoading?: boolean;
  isActive?: boolean;
}) {
  const router = useRouter();
  const characterId = resolveCharacterId(character.id);
  const chatHref = characterChatHref(characterId);

  const prefetchChat = useCallback(() => {
    router.prefetch(chatHref);
  }, [router, chatHref]);

  return (
    <button
      type="button"
      onClick={onSelect}
      onMouseEnter={prefetchChat}
      onFocus={prefetchChat}
      disabled={isLoading}
      className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-pink-accent disabled:opacity-60 ${
        isActive ? "border-pink-accent ring-1 ring-pink-accent" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-soft text-lg font-bold text-pink-accent">
          {character.name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">
            <span className="text-pink-accent">❤️</span>
            {character.name}
            <span className="font-normal text-gray-600">
              {" "}
              - {character.tagline.split(" (")[0]}
            </span>
          </h3>
          <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
            {character.tagline.includes("(")
              ? character.tagline.slice(character.tagline.indexOf("("))
              : character.tagline}
          </p>
        </div>
      </div>
      {isLoading && (
        <p className="mt-2 text-xs text-pink-accent">선택 중...</p>
      )}
    </button>
  );
}
