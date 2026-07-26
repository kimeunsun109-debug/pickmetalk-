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

/** Full-bleed first viewport: brand + one character face as the protagonist. */
export function HomeHero({ character, loggedIn }: HomeHeroProps) {
  const heroSrc = characterHeroSrc(character.id);
  const primaryHref = loggedIn ? "/characters" : "/login";
  const primaryLabel = loggedIn ? "그녀 만나기" : "시작하기";
  const secondaryHref = loggedIn ? "/conversations" : "/login?mode=signup";
  const secondaryLabel = loggedIn ? "이어서 대화" : "회원가입";

  return (
    <section className="relative isolate min-h-[100dvh] w-full overflow-hidden bg-[#1a1216]">
      <div className="absolute inset-0 animate-hero-breath">
        <Image
          src={heroSrc}
          alt={character.name}
          fill
          priority
          sizes="(max-width: 448px) 100vw, 448px"
          className="object-cover object-[center_22%]"
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/75"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#1a1216] to-transparent"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 animate-hero-shimmer opacity-40 mix-blend-soft-light"
        aria-hidden
      />

      <div className="relative z-10 flex min-h-[100dvh] flex-col px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))]">
        <header className="animate-hero-rise">
          <p className="font-display text-[2.65rem] leading-none tracking-tight text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.45)]">
            {BRAND.name}
          </p>
          <p className="mt-2 max-w-[16rem] text-[13px] leading-relaxed text-white/75">
            {BRAND.tagline}
          </p>
        </header>

        <div className="mt-auto animate-hero-rise-delay pb-2">
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-pink-soft/90">
            Today&apos;s face
          </p>
          <h2 className="mt-1.5 font-display text-[2rem] leading-none text-white">
            {character.name}
          </h2>
          <p className="mt-2 max-w-[18rem] text-sm leading-snug text-white/70">
            {character.tagline.split(" (")[0]}
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href={primaryHref}
              prefetch
              className="rounded-full bg-pink-accent py-3.5 text-center text-sm font-semibold text-white shadow-[0_10px_30px_rgba(255,143,171,0.35)] transition active:scale-[0.98]"
            >
              {primaryLabel}
            </Link>
            <Link
              href={secondaryHref}
              prefetch
              className="rounded-full border border-white/35 bg-white/8 py-3 text-center text-sm font-medium text-white/90 backdrop-blur-sm transition active:scale-[0.98]"
            >
              {secondaryLabel}
            </Link>
          </div>

          {!loggedIn && (
            <div className="mt-4 flex items-center justify-center gap-3 text-xs text-white/45">
              <Link href="/forgot-id" className="underline-offset-2 hover:text-white/80 hover:underline">
                아이디 찾기
              </Link>
              <span aria-hidden>|</span>
              <Link
                href="/forgot-password"
                className="underline-offset-2 hover:text-white/80 hover:underline"
              >
                비밀번호 찾기
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
