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
    <div className="relative min-h-[100dvh] bg-night">
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
                  alt=""
                  fill
                  priority={i === initialIndex}
                  sizes="(max-width: 448px) 100vw, 448px"
                  className="object-cover object-[center_18%]"
                />
              </div>
              <div
                className="absolute inset-0 bg-gradient-to-b from-night/65 via-transparent to-night/90"
                aria-hidden
              />
              <div className="absolute inset-0 film-grain opacity-[0.28]" aria-hidden />

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
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href="/"
            className="border border-paper/20 bg-night/35 p-2 text-paper/90 backdrop-blur-sm"
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
            className="border border-paper/20 bg-night/35 px-3 py-2 text-[11px] tracking-wide text-paper/90 backdrop-blur-sm"
          >
            대화 목록
          </Link>
        </div>
      </div>

      {current && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto animate-hero-rise">
            {error && (
              <p className="mb-3 bg-red-700/90 px-3 py-2 text-sm text-paper">
                {error}
              </p>
            )}
            <div className="mb-4 h-px w-10 bg-rose-muted/80" aria-hidden />
            <p className="text-[11px] tracking-[0.18em] text-rose-muted">
              {activeCharacterId === current.id ? "지금 함께" : "만나보기"}
            </p>
            <h1 className="mt-2 font-display text-[2.45rem] leading-none text-paper">
              {current.name}
            </h1>
            <p className="mt-2.5 max-w-[20rem] text-[13.5px] leading-snug text-paper/68">
              {current.tagline.includes("(")
                ? current.tagline.slice(current.tagline.indexOf("(") + 1, -1)
                : current.tagline}
            </p>

            <div className="mt-5 flex items-center gap-1.5">
              {characters.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  aria-label={`${c.name} 보기`}
                  onClick={() => scrollToIndex(i)}
                  className={`h-[2px] transition-all ${
                    i === index ? "w-8 bg-rose-deep" : "w-3 bg-paper/30"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              disabled={Boolean(loadingId)}
              onClick={() => current && selectCharacter(current)}
              className="mt-6 w-full bg-rose-deep py-3.5 text-[13px] font-semibold tracking-wide text-paper disabled:opacity-60"
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-night/55 p-0 sm:items-center sm:p-4"
          role="dialog"
          aria-modal
          aria-label={`${pickerCharacter.name} 대화 선택`}
        >
          <div className="w-full max-w-md border-t border-ink/10 bg-paper px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:border sm:border-ink/10">
            <h2 className="font-display text-2xl text-ink">
              {pickerCharacter.name}
            </h2>
            <p className="mt-1 text-[13px] text-ink/55">
              이어갈 대화를 고르거나 새로 시작하세요.
            </p>

            {conversations[0] && (
              <button
                type="button"
                disabled={pickerLoading}
                onClick={() =>
                  continueConversation(pickerCharacter.id, conversations[0].id)
                }
                className="mt-5 w-full border border-ink/10 bg-white px-4 py-3.5 text-left text-sm disabled:opacity-50"
              >
                <span className="text-[11px] tracking-wide text-rose-deep">최근 대화</span>
                <span className="mt-0.5 block font-medium text-ink">
                  {conversations[0].title}
                </span>
              </button>
            )}

            {conversations.length > 1 && (
              <ul className="mt-2 max-h-40 space-y-1.5 overflow-y-auto">
                {conversations.slice(1).map((conv) => (
                  <li key={conv.id}>
                    <button
                      type="button"
                      disabled={pickerLoading}
                      onClick={() =>
                        continueConversation(pickerCharacter.id, conv.id)
                      }
                      className="w-full border border-transparent px-4 py-3 text-left text-sm hover:border-ink/10 hover:bg-white disabled:opacity-50"
                    >
                      <span className="font-medium text-ink">{conv.title}</span>
                      <span className="mt-0.5 block text-[11px] text-ink/40">
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
              className="mt-4 w-full bg-rose-deep py-3 text-[13px] font-semibold tracking-wide text-paper disabled:opacity-50"
            >
              {pickerLoading ? "처리 중..." : "새 대화 시작하기"}
            </button>
            <button
              type="button"
              className="mt-2 w-full py-2.5 text-[13px] text-ink/45"
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
