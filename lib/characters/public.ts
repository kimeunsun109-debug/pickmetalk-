import type { Character, PublicCharacter } from "@/types";

/** Strip personality/prompt fields before sending to the client bundle. */
export function toPublicCharacter(character: Character): PublicCharacter {
  return {
    id: character.id,
    name: character.name,
    age: character.age,
    tagline: character.tagline,
    avatar: character.avatar,
    defaultEmotion: character.defaultEmotion,
    defaultExpression: character.defaultExpression,
  };
}
