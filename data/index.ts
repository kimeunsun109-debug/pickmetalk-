import charactersPublicJson from "./characters-public.json";
import giftsJson from "./gifts.json";
import relationshipLevelsJson from "./relationship-levels.json";
import subscriptionPlansJson from "./subscription-plans.json";
import type { Gift, PublicCharacter, SubscriptionPlan } from "@/types";

/** Client-safe character list (no personality / prompt data). */
export const characters = charactersPublicJson as PublicCharacter[];
export const gifts = giftsJson as Gift[];
export const relationshipLevels = relationshipLevelsJson;
export const subscriptionPlans = subscriptionPlansJson as SubscriptionPlan[];

const characterMap = new Map<string, PublicCharacter>(
  characters.map((c) => [c.id, c])
);

const DEFAULT_CHARACTER_ID = "yuna";

export function getCharacterById(id: string): PublicCharacter | undefined {
  return characterMap.get(id) ?? characterMap.get(DEFAULT_CHARACTER_ID);
}
