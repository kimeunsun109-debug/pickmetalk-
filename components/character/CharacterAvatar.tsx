"use client";

import Image from "next/image";
import { resolveCharacterId } from "@/lib/chatRoute";
import { useState } from "react";

const CHARACTER_IDS = ["yuna", "narin", "yoonseo", "eunha", "jiyu"] as const;

/** 실사 프로필 우선 — /characters/{id}/profile.webp → .jpg → .svg → fallback */
export function characterProfilePhotoSrc(characterId: string): string {
  const id = resolveCharacterId(characterId);
  return `/characters/${id}/profile.webp`;
}

export function characterProfileFallbacks(characterId: string): string[] {
  const id = resolveCharacterId(characterId);
  return [
    `/characters/${id}/profile.webp`,
    `/characters/${id}/profile.jpg`,
    `/characters/${id}/profile.svg`,
    `/avatars/${id}.svg`,
  ];
}

export function CharacterAvatar({
  characterId,
  name,
  size = 48,
  className = "",
}: {
  characterId: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const id = resolveCharacterId(characterId);
  const sources = characterProfileFallbacks(id);
  const [srcIndex, setSrcIndex] = useState(0);
  const src = sources[srcIndex];
  const showInitial = srcIndex >= sources.length;

  if (showInitial) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full bg-pink-soft font-bold text-pink-accent ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.38 }}
        aria-hidden
      >
        {name[0]}
      </div>
    );
  }

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full bg-pink-soft ring-2 ring-white ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={`${name} 프로필`}
        fill
        className="object-cover object-top"
        sizes={`${size}px`}
        onError={() => setSrcIndex((i) => i + 1)}
      />
    </div>
  );
}

export function isKnownCharacterId(id: string): boolean {
  return (CHARACTER_IDS as readonly string[]).includes(resolveCharacterId(id));
}
