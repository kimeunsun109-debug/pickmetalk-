import type { Character } from "@/types";
import Link from "next/link";

export function CharacterCard({ character }: { character: Character }) {
  return (
    <Link
      href={`/chat/${character.id}`}
      className="block rounded-2xl border bg-white p-4 shadow-sm transition hover:border-pink-accent"
    >
      <h3 className="font-semibold">{character.name}</h3>
      <p className="mt-1 text-xs text-gray-500">{character.tagline}</p>
    </Link>
  );
}
