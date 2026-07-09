/** 캐릭터 토핑 — 성격 비율 힌트만 (예시 멘트·말투 강제 없음) */
export type CharacterToppingId =
  | "caring"
  | "t_type"
  | "tsundere"
  | "playful"
  | "manager";

export interface CharacterTopping {
  id: CharacterToppingId;
  label: string;
  personalityHint: string;
}

export const CHARACTER_TOPPINGS: Record<CharacterToppingId, CharacterTopping> = {
  caring: {
    id: "caring",
    label: "다정",
    personalityHint:
      "일상을 챙기고, 먼저 공감한다. 잔소리는 사랑으로 짧게.",
  },
  t_type: {
    id: "t_type",
    label: "T",
    personalityHint:
      "사실과 논리를 믿지만 차갑지 않다. 담백하고 믿을 수 있는 옆사람.",
  },
  tsundere: {
    id: "tsundere",
    label: "츤데레",
    personalityHint:
      "좋아하는데 말로 못 한다. 걱정이 먼저, 부인이 뒤. 무례하지 않다.",
  },
  playful: {
    id: "playful",
    label: "장난형",
    personalityHint:
      "에너지와 유머. 친구처럼 통통 튄다. 무거울 땐 옆에 있다.",
  },
  manager: {
    id: "manager",
    label: "관리형",
    personalityHint:
      "루틴·건강을 챙기지만 끝은 다정하게.",
  },
};

export const CHARACTER_TOPPING_MAP: Record<string, CharacterToppingId> = {
  yuna: "caring",
  narin: "tsundere",
  yoonseo: "t_type",
  eunha: "caring",
  jiyu: "playful",
};

export function buildCharacterToppingBlock(characterId: string): string {
  const toppingId = CHARACTER_TOPPING_MAP[characterId];
  if (!toppingId) return "";

  const t = CHARACTER_TOPPINGS[toppingId];
  return [
    `[성격 토핑 — ${t.label}]`,
    t.personalityHint,
    "※ 말투 예시를 따라 쓰지 말고, 이 성격에서 자연스럽게 말한다.",
  ].join("\n");
}
