import { characterHeroSrc } from "@/lib/characters/images";
import Image from "next/image";

type PortraitSize = "hero" | "meet";

const SIZE_CLASS: Record<PortraitSize, string> = {
  hero: "aspect-[3/4] w-full max-w-[240px]",
  meet: "aspect-[3/4] w-full max-w-[260px]",
};

interface CharacterPortraitProps {
  characterId: string;
  src?: string;
  size?: PortraitSize;
  priority?: boolean;
  animate?: boolean;
  className?: string;
}

/** Rounded portrait card — crops letterboxed heroes onto a light pink/paper frame. */
export function CharacterPortrait({
  characterId,
  src,
  size = "hero",
  priority = false,
  animate = false,
  className = "",
}: CharacterPortraitProps) {
  const imageSrc = src ?? characterHeroSrc(characterId);

  return (
    <div
      className={`relative overflow-hidden rounded-[1.75rem] bg-gradient-to-b from-pink-soft/45 via-paper to-rose-muted/15 shadow-[0_8px_28px_rgba(184,106,122,0.1)] ring-1 ring-pink-soft/55 ${SIZE_CLASS[size]} ${className}`}
    >
      <div
        className={`absolute inset-0 ${animate ? "animate-hero-breath" : ""}`}
      >
        <Image
          src={imageSrc}
          alt=""
          fill
          priority={priority}
          sizes="(max-width: 448px) 260px, 260px"
          className="object-cover object-[center_20%] scale-[1.1]"
        />
      </div>
    </div>
  );
}
