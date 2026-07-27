"use client";

import { characterHeroSrc } from "@/lib/characters/images";
import { BRAND } from "@/lib/brand";
import type { PublicCharacter } from "@/types";
import Image from "next/image";
import Link from "next/link";

interface HomeHeroProps {
  character: PublicCharacter;
  loggedIn: boolean;
}

/** Full-bleed first viewport: brand first, one face as the visual plane. */
export function HomeHero({ character, loggedIn }: HomeHeroProps) {
  const heroSrc = characterHeroSrc(character.id);
  const primaryHref = loggedIn ? "/characters" : "/login";
  const primaryLabel = loggedIn ? "그녀 만나기" : "시작하기";
  const secondaryHref = loggedIn ? "/conversations" : "/login?mode=signup";
  const secondaryLabel = loggedIn ? "이어서 대화" : "회원가입";

  return (
    <section className="relative isolate min-h-[100dvh] w-full overflow-hidden bg-night">
      <div className="absolute inset-0 animate-hero-breath">
        <Image
          src={heroSrc}
          alt=""
          fill
          priority
          sizes="(max-width: 448px) 100vw, 448px"
          className="object-cover object-[center_18%]"
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-night/70 via-night/10 to-night/85"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-night via-night/55 to-transparent"
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 film-grain opacity-[0.35]" aria-hidden />
      <div className="pointer-events-none absolute inset-0 animate-hero-shimmer opacity-30" aria-hidden />

      <div className="relative z-10 flex min-h-[100dvh] flex-col px-6 pb-[max(1.75rem,env(safe-area-inset-bottom))] pt-[max(1.5rem,env(safe-area-inset-top))]">
        <header className="animate-hero-rise">
          <p className="font-display text-[3.1rem] leading-[0.92] tracking-tight text-paper drop-shadow-[0_2px_24px_rgba(0,0,0,0.5)]">
            {BRAND.name}
          </p>
          <p className="mt-3 max-w-[15.5rem] text-[13px] leading-relaxed text-paper/70">
            {BRAND.tagline}
          </p>
        </header>

        <div className="mt-auto animate-hero-rise-delay">
          <div className="mb-5 h-px w-10 bg-rose-muted/80" aria-hidden />
          <p className="text-[11px] tracking-[0.18em] text-rose-muted">오늘의 얼굴</p>
          <h2 className="mt-2 font-display text-[2.15rem] leading-none text-paper">
            {character.name}
          </h2>
          <p className="mt-2.5 max-w-[17rem] text-[13.5px] leading-snug text-paper/65">
            {character.tagline.split(" (")[0]}
          </p>

          <div className="mt-7 flex flex-col gap-2.5">
            <Link
              href={primaryHref}
              prefetch
              className="bg-rose-deep py-3.5 text-center text-[13px] font-semibold tracking-wide text-paper transition active:scale-[0.99]"
            >
              {primaryLabel}
            </Link>
            <Link
              href={secondaryHref}
              prefetch
              className="border border-paper/30 bg-paper/5 py-3 text-center text-[13px] font-medium tracking-wide text-paper/90 backdrop-blur-[2px] transition active:scale-[0.99]"
            >
              {secondaryLabel}
            </Link>
          </div>

          {!loggedIn && (
            <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-paper/40">
              <Link href="/forgot-id" className="hover:text-paper/75">
                아이디 찾기
              </Link>
              <span className="h-2.5 w-px bg-paper/25" aria-hidden />
              <Link href="/forgot-password" className="hover:text-paper/75">
                비밀번호 찾기
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
