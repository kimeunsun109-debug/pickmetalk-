"use client";

import { characterChatHref, goToCharacterChat } from "@/lib/navigateChat";
import { resolveCharacterId } from "@/lib/chatRoute";
import { characterHeroSrc } from "@/lib/characters/images";
import type { Conversation, PublicCharacter } from "@/types";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/** Full-bleed character meet carousel — faces first, not a card dashboard. */
export function CharacterMeetClient({
  characters,
  activeCharacterId,
  initialIndex = 0,
}: {
  characters: PublicCharacter[];
  activeCharacterId: string | null;
  initialIndex?: number;
}) {
  const router = useRouter();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(
    Math.min(Math.max(initialIndex, 0), Math.max(characters.length - 1, 0))
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pickerCharacter, setPickerCharacter] = useState<PublicCharacter | null>(
    null
  );
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);

  const current = characters[index] ?? characters[0];

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const child = el.children[initialIndex] as HTMLElement | undefined;
    if (child) {
      el.scrollTo({ left: child.offsetLeft, behavior: "auto" });
    }
  }, [initialIndex]);

  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || characters.length === 0) return;
    const next = Math.round(el.scrollLeft / el.clientWidth);
    setIndex(Math.min(Math.max(next, 0), characters.length - 1));
  }, [characters.length]);

  async function selectCharacter(character: PublicCharacter) {
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
      if (convs.length <= 1) {
        goToCharacterChat(router, characterId, convs[0]?.id);
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

  function scrollToIndex(i: number) {
    const el = scrollerRef.current;
    const child = el?.children[i] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  return (
    <div className="relative min-h-[100dvh] bg-[#1a1216]">
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex h-[100dvh] snap-x snap-mandatory overflow-x-auto scroll-ios"
      >
        {characters.map((c, i) => {
          const id = resolveCharacterId(c.id);
          const busy = loadingId === id;
          return (
            <article
              key={c.id}
              className="relative h-[100dvh] w-full shrink-0 snap-center snap-always"
            >
              <div
                className={`absolute inset-0 transition-transform duration-[2.8s] ease-out ${
                  i === index ? "animate-hero-breath" : "scale-105"
                }`}
              >
                <Image
                  src={characterHeroSrc(id)}
                  alt={c.name}
                  fill
                  priority={i === initialIndex}
                  sizes="(max-width: 448px) 100vw, 448px"
                  className="object-cover object-[center_20%]"
                />
              </div>
              <div
                className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/80"
                aria-hidden
              />

              <button
                type="button"
                disabled={busy}
                onClick={() => selectCharacter(c)}
                className="absolute inset-0 z-10"
                aria-label={`${c.name}와 대화 시작`}
              />
            </article>
          );
        })}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 px-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex items-center gap-3">
          <Link
            href="/"
            className="rounded-full bg-black/25 p-2 text-white/90 backdrop-blur-md"
            aria-label="홈으로"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
              <path
                fillRule="evenodd"
                d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
          <Link
            href="/conversations"
            className="rounded-full bg-black/25 px-3 py-2 text-xs font-medium text-white/90 backdrop-blur-md"
          >
            대화 목록
          </Link>
        </div>
      </div>

      {current && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto animate-hero-rise">
            {error && (
              <p className="mb-3 rounded-xl bg-red-500/90 px-3 py-2 text-sm text-white">
                {error}
              </p>
            )}
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-pink-soft/90">
              {activeCharacterId === current.id ? "지금 함께" : "만나보기"}
            </p>
            <h1 className="mt-1 font-display text-[2.35rem] leading-none text-white">
              {current.name}
            </h1>
            <p className="mt-2 max-w-[20rem] text-sm leading-snug text-white/72">
              {current.tagline.includes("(")
                ? current.tagline.slice(current.tagline.indexOf("(") + 1, -1)
                : current.tagline}
            </p>

            <div className="mt-5 flex items-center gap-2">
              {characters.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  aria-label={`${c.name} 보기`}
                  onClick={() => scrollToIndex(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === index ? "w-7 bg-pink-accent" : "w-1.5 bg-white/35"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              disabled={Boolean(loadingId)}
              onClick={() => current && selectCharacter(current)}
              className="mt-5 w-full rounded-full bg-pink-accent py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(255,143,171,0.35)] disabled:opacity-60"
            >
              {loadingId === resolveCharacterId(current.id)
                ? "들어가는 중…"
                : `${current.name}와 대화하기`}
            </button>
          </div>
        </div>
      )}

      {pickerCharacter && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 sm:items-center"
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
                  continueConversation(pickerCharacter.id, conversations[0].id)
                }
                className="mt-4 w-full rounded-xl bg-pink-soft px-4 py-3 text-left text-sm hover:bg-pink-100 disabled:opacity-50"
              >
                <span className="font-semibold text-pink-accent">최근 대화 이어가기</span>
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
                      <span className="font-medium text-gray-900">{conv.title}</span>
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
