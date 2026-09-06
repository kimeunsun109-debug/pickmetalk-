"use client";

import { CharacterPortrait } from "@/components/character/CharacterPortrait";
import { characterChatHref, goToCharacterChat } from "@/lib/navigateChat";
import { resolveCharacterId } from "@/lib/chatRoute";
import type { Conversation, PublicCharacter } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

/** Character meet carousel — compact portraits on a light paper canvas. */
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
    <div className="relative min-h-[100dvh] bg-paper">
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
              className="relative flex h-[100dvh] w-full shrink-0 snap-center snap-always flex-col bg-paper px-6"
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-pink-soft/25 to-transparent"
                aria-hidden
              />

              <div className="relative z-10 flex h-full flex-col items-center justify-end pb-[17.5rem] pt-[max(3.25rem,env(safe-area-inset-top))]">
                <CharacterPortrait
                  characterId={id}
                  size="meet"
                  priority={i === initialIndex}
                  animate={i === index}
                />
              </div>

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
            className="rounded-full border border-ink/10 bg-white/85 p-2 text-ink/75 shadow-sm backdrop-blur-sm"
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
            className="rounded-full border border-ink/10 bg-white/85 px-3 py-2 text-[11px] tracking-wide text-ink/75 shadow-sm backdrop-blur-sm"
          >
            대화 목록
          </Link>
        </div>
      </div>

      {current && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <div className="pointer-events-auto animate-hero-rise">
            {error && (
              <p className="mb-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="mb-2 h-px w-10 bg-rose-muted/80" aria-hidden />
            <p className="text-[11px] tracking-[0.14em] text-rose-deep/80">
              {activeCharacterId === current.id ? "지금 함께" : "만나보기"}
            </p>
            <h1 className="mt-1 font-sans text-[1.625rem] font-bold leading-tight text-ink">
              {current.name}
            </h1>
            <p className="mt-1.5 max-w-[20rem] text-[13px] leading-snug text-ink/55">
              {current.tagline.includes("(")
                ? current.tagline.slice(current.tagline.indexOf("(") + 1, -1)
                : current.tagline}
            </p>

            <div className="mt-3 flex items-center gap-1.5">
              {characters.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  aria-label={`${c.name} 보기`}
                  onClick={() => scrollToIndex(i)}
                  className={`h-[2px] transition-all ${
                    i === index ? "w-8 bg-rose-deep" : "w-3 bg-ink/15"
                  }`}
                />
              ))}
            </div>

            <button
              type="button"
              disabled={Boolean(loadingId)}
              onClick={() => current && selectCharacter(current)}
              className="mt-4 w-full rounded-xl bg-rose-deep py-3 text-[13px] font-semibold tracking-wide text-paper disabled:opacity-60"
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
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/20 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          role="dialog"
          aria-modal
          aria-label={`${pickerCharacter.name} 대화 선택`}
        >
          <div className="w-full max-w-md rounded-t-2xl border-t border-ink/10 bg-paper px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:rounded-2xl sm:border sm:border-ink/10">
            <h2 className="font-sans text-xl font-bold text-ink">
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
                className="mt-5 w-full rounded-xl border border-ink/10 bg-white px-4 py-3.5 text-left text-sm disabled:opacity-50"
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
                      className="w-full rounded-xl border border-transparent px-4 py-3 text-left text-sm hover:border-ink/10 hover:bg-white disabled:opacity-50"
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
              className="mt-4 w-full rounded-xl bg-rose-deep py-3 text-[13px] font-semibold tracking-wide text-paper disabled:opacity-50"
            >
              {pickerLoading ? "처리 중..." : "새 대화 시작하기"}
            </button>
            <button
              type="button"
              className="mt-2 w-full rounded-xl py-2.5 text-[13px] text-ink/45"
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
