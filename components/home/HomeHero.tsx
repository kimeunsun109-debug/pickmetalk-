"use client";

import { CharacterPortrait } from "@/components/character/CharacterPortrait";
import { BRAND } from "@/lib/brand";
import type { PublicCharacter } from "@/types";
import Link from "next/link";

interface HomeHeroProps {
  character: PublicCharacter;
  loggedIn: boolean;
}

/** Landing hero — brand + compact portrait on a light paper canvas. */
export function HomeHero({ character, loggedIn }: HomeHeroProps) {
  const primaryHref = loggedIn ? "/characters" : "/login";
  const primaryLabel = loggedIn ? "그녀 만나기" : "시작하기";
  const secondaryHref = loggedIn ? "/conversations" : "/login?mode=signup";
  const secondaryLabel = loggedIn ? "이어서 대화" : "회원가입";

  return (
    <section className="relative isolate flex min-h-[100dvh] w-full flex-col overflow-hidden bg-paper px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-pink-soft/30 via-pink-soft/10 to-transparent"
        aria-hidden
      />

      <header className="relative z-10 animate-hero-rise">
        <p className="font-display text-[2.75rem] leading-[0.92] tracking-tight text-ink">
          {BRAND.name}
        </p>
        <p className="mt-3 max-w-[15.5rem] text-[13px] leading-relaxed text-ink/55">
          {BRAND.tagline}
        </p>
      </header>

      <div className="relative z-10 my-5 flex flex-1 items-center justify-center py-2">
        <CharacterPortrait
          characterId={character.id}
          size="hero"
          priority
          animate
        />
      </div>

      <div className="relative z-10 mt-auto animate-hero-rise-delay">
        <div className="mb-5 h-px w-10 bg-rose-muted/80" aria-hidden />
        <p className="text-[11px] tracking-[0.18em] text-rose-deep/80">
          오늘의 얼굴
        </p>
        <h2 className="mt-2 font-display text-[2rem] leading-none text-ink">
          {character.name}
        </h2>
        <p className="mt-2.5 max-w-[17rem] text-[13.5px] leading-snug text-ink/55">
          {character.tagline.split(" (")[0]}
        </p>

        <div className="mt-7 flex flex-col gap-2.5">
          <Link
            href={primaryHref}
            prefetch
            className="rounded-xl bg-rose-deep py-3.5 text-center text-[13px] font-semibold tracking-wide text-paper transition active:scale-[0.99]"
          >
            {primaryLabel}
          </Link>
          <Link
            href={secondaryHref}
            prefetch
            className="rounded-xl border border-ink/10 bg-white/70 py-3 text-center text-[13px] font-medium tracking-wide text-ink/80 backdrop-blur-[2px] transition active:scale-[0.99]"
          >
            {secondaryLabel}
          </Link>
        </div>

        {!loggedIn && (
          <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-ink/40">
            <Link href="/forgot-id" className="hover:text-rose-deep">
              아이디 찾기
            </Link>
            <span className="h-2.5 w-px bg-ink/15" aria-hidden />
            <Link href="/forgot-password" className="hover:text-rose-deep">
              비밀번호 찾기
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
