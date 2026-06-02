"use client";

import type { Character } from "@/types";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CharacterCard } from "./CharacterCard";

/** 캐릭터 카드 클릭 → API 저장 후 /chat 이동 */
export function CharacterSelectClient({
  characters,
  activeCharacterId,
}: {
  characters: Character[];
  activeCharacterId: string | null;
}) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function selectCharacter(characterId: string) {
    setLoadingId(characterId);
    setError(null);
    try {
      const res = await fetch("/api/characters/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "선택 실패");
      router.push("/chat");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {activeCharacterId && (
        <button
          type="button"
          onClick={() => router.push("/chat")}
          className="rounded-full border border-pink-accent py-2 text-sm text-pink-accent"
        >
          이전에 선택한 캐릭터와 채팅하기 →
        </button>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="grid gap-3">
        {characters.map((c) => (
          <CharacterCard
            key={c.id}
            character={c}
            isLoading={loadingId === c.id}
            isActive={activeCharacterId === c.id}
            onSelect={() => selectCharacter(c.id)}
          />
        ))}
      </div>
    </div>
  );
}
