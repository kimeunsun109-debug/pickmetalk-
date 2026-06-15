import type { Character } from "@/types";

/** Character selection card. */
export function CharacterCard({
  character,
  onSelect,
  isLoading,
  isActive,
}: {
  character: Character;
  onSelect: () => void;
  isLoading?: boolean;
  isActive?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={isLoading}
      className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition hover:border-pink-accent disabled:opacity-60 ${
        isActive ? "border-pink-accent ring-1 ring-pink-accent" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-pink-soft text-lg font-bold text-pink-accent">
          {character.name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold">{character.name}</h3>
          <p className="mt-0.5 truncate text-xs text-gray-500">
            {character.tagline}
          </p>
        </div>
      </div>
      {isLoading && (
        <p className="mt-2 text-xs text-pink-accent">선택 중...</p>
      )}
    </button>
  );
}
