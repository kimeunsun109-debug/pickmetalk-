"use client";

import { characterChatHref, goToCharacterChat } from "@/lib/navigateChat";
import { resolveCharacterId } from "@/lib/chatRoute";
import type { Character, Conversation } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CharacterCard } from "./CharacterCard";

/** Character card click flow: select character, then choose or create a room. */
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
  const [pickerCharacter, setPickerCharacter] = useState<Character | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  async function selectCharacter(character: Character) {
    const characterId = resolveCharacterId(character.id);
    router.prefetch(characterChatHref(characterId));
    setLoadingId(characterId);
    setError(null);
    setPickerLoading(true);

    try {
      void fetch("/api/characters/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });

      const res = await fetch(`/api/conversations?characterId=${characterId}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "대화 목록을 불러오지 못했습니다.");
      }

      const convs: Conversation[] = data.conversations ?? [];

      if (convs.length === 0) {
        goToCharacterChat(router, characterId);
        return;
      }

      setConversations(convs);
      setPickerCharacter({ ...character, id: characterId });
    } catch {
      goToCharacterChat(router, characterId);
    } finally {
      setLoadingId(null);
      setPickerLoading(false);
    }
  }

  async function startNewConversation(characterId: string) {
    setPickerLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "새 대화를 만들지 못했습니다.");
      }
      setPickerCharacter(null);
      goToCharacterChat(router, characterId, data.conversation.id);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "오류가 발생했습니다. 다시 시도해주세요."
      );
    } finally {
      setPickerLoading(false);
    }
  }

  function continueConversation(characterId: string, conversationId: string) {
    setPickerCharacter(null);
    goToCharacterChat(router, characterId, conversationId);
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/conversations"
        className="rounded-full border border-pink-accent py-2 text-center text-sm text-pink-accent"
      >
        대화 목록 보기
      </Link>

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
            onSelect={() => selectCharacter(c)}
          />
        ))}
      </div>

      {pickerCharacter && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal
          aria-label={`${pickerCharacter.name} 대화 선택`}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              {pickerCharacter.name}와 대화하기
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              이어갈 대화를 선택하거나 새 대화를 시작하세요.
            </p>

            {conversations[0] && (
              <button
                type="button"
                disabled={pickerLoading}
                onClick={() =>
                  continueConversation(
                    pickerCharacter.id,
                    conversations[0].id
                  )
                }
                className="mt-4 w-full rounded-xl bg-pink-soft px-4 py-3 text-left text-sm hover:bg-pink-100 disabled:opacity-50"
              >
                <span className="font-semibold text-pink-accent">
                  최근 대화 이어가기
                </span>
                <span className="mt-0.5 block font-medium text-gray-900">
                  {conversations[0].title}
                </span>
              </button>
            )}

            {conversations.length > 1 && (
              <ul className="mt-3 max-h-40 space-y-2 overflow-y-auto">
                {conversations.slice(1).map((conv) => (
                  <li key={conv.id}>
                    <button
                      type="button"
                      disabled={pickerLoading}
                      onClick={() =>
                        continueConversation(pickerCharacter.id, conv.id)
                      }
                      className="w-full rounded-xl border border-gray-100 px-4 py-3 text-left text-sm hover:border-pink-soft hover:bg-pink-50/40 disabled:opacity-50"
                    >
                      <span className="font-medium text-gray-900">
                        {conv.title}
                      </span>
                      <span className="mt-0.5 block text-[11px] text-gray-400">
                        호감도 {conv.affection}% · Lv{conv.relationshipLevel}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button
              type="button"
              disabled={pickerLoading}
              onClick={() => startNewConversation(pickerCharacter.id)}
              className="mt-4 w-full rounded-full bg-pink-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pickerLoading ? "처리 중..." : "새 대화 시작하기"}
            </button>

            <button
              type="button"
              className="mt-3 w-full py-2 text-sm text-gray-400"
              onClick={() => setPickerCharacter(null)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
