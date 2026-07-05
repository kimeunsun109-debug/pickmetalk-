import charactersJson from "@/data/characters.json";
import type { Character } from "@/types";

const characters = charactersJson as Character[];

const characterMap = new Map<string, Character>(
  characters.map((c) => [c.id, c])
);

const DEFAULT_CHARACTER_ID = "yuna";

/** Server-only full character data (prompts, personality). */
export function getCharacterById(id: string): Character | undefined {
  return characterMap.get(id) ?? characterMap.get(DEFAULT_CHARACTER_ID);
}

export function getAllCharacters(): Character[] {
  return characters;
}
