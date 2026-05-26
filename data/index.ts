import charactersJson from "./characters.json";
import giftsJson from "./gifts.json";
import relationshipLevelsJson from "./relationship-levels.json";
import subscriptionPlansJson from "./subscription-plans.json";
import type { Character, Gift, SubscriptionPlan } from "@/types";

/** JSON → 타입 안전 로더 (관리자는 JSON만 수정해도 됨) */
export const characters = charactersJson as Character[];
export const gifts = giftsJson as Gift[];
export const relationshipLevels = relationshipLevelsJson;
export const subscriptionPlans = subscriptionPlansJson as SubscriptionPlan[];

export function getCharacterById(id: string): Character | undefined {
  return characters.find((c) => c.id === id);
}
