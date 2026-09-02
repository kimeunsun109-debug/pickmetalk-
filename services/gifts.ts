import giftsJson from "@/data/gifts.json";
import { affectionToLevel, clampAffection } from "@/services/affection";
import type { EmotionState, Gift, GiftReaction, RelationshipLevel } from "@/types";

export function getGiftCatalog(): Gift[] {
  return giftsJson as Gift[];
}

export function getGiftById(giftId: string): Gift | undefined {
  return getGiftCatalog().find((gift) => gift.id === giftId);
}

function pickIndex(seed: string, length: number): number {
  if (length <= 1) return 0;
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % length;
}

function giftEmotion(bonus: number): EmotionState {
  if (bonus >= 12) return "excited";
  if (bonus >= 8) return "happy";
  return "happy";
}

const GENERIC_REACTIONS = (gift: Gift) => [
  `${gift.emoji} ${gift.name}! 고마워, 이런 선물 받으면 기분 좋아져.`,
  `${gift.name} ${gift.emoji} … 갑자기? 근데 마음에 들어.`,
  `와 ${gift.emoji} ${gift.name}…! 생각해 준 거야? 고마워.`,
];

const CHARACTER_REACTIONS: Record<string, (gift: Gift) => string[]> = {
  yuna: (gift) => [
    `${gift.emoji} ${gift.name}! … 고마워, 오늘 하루가 더 따뜻해졌어.`,
    `${gift.name} ${gift.emoji} 받았어. 이런 작은 선물도 좋아.`,
    `갑자기 ${gift.emoji}? … ${gift.name} 고마워, 잘 마실게.`,
  ],
  narin: (gift) => [
    `…${gift.emoji} ${gift.name}? 뭐야, 갑자기 그런 거 주면… 고마워.`,
    `흥, ${gift.name} ${gift.emoji} … 별로 기대 안 했는데, 괜찮네.`,
    `${gift.emoji} … ${gift.name}이야? 바보… 고마워.`,
  ],
  yoonseo: (gift) => [
    `${gift.emoji} ${gift.name}! 선택 고민 끝— 이 선물, 내가 받을게.`,
    `${gift.name} ${gift.emoji} … 딱 내 취향이야. 고마워.`,
    `오 ${gift.emoji} ${gift.name}! 오늘은 이걸로 기분 업.`,
  ],
  eunha: (gift) => [
    `${gift.emoji} ${gift.name}! … 예상 밖인데, 좋은 서프라이즈야.`,
    `${gift.name} ${gift.emoji} … 색다른 선물이네. 고마워.`,
    `와 ${gift.emoji} … ${gift.name}, 이런 걸 생각했어? 재밌다.`,
  ],
  jiyu: (gift) => [
    `${gift.emoji} ${gift.name}! … 고마워, 오늘도 네 덕에 웃었어.`,
    `${gift.name} ${gift.emoji} 받았어! 다음에 나도 챙겨줄게.`,
    `${gift.emoji} ${gift.name}…! 갑자기? … 근데 진짜 고마워.`,
  ],
};

export function buildGiftReaction(characterId: string, gift: Gift): GiftReaction {
  const templates =
    CHARACTER_REACTIONS[characterId]?.(gift) ?? GENERIC_REACTIONS(gift);
  const message = templates[pickIndex(`${characterId}:${gift.id}`, templates.length)];

  return {
    message,
    emotion: giftEmotion(gift.affectionBonus),
    affectionBonus: gift.affectionBonus,
  };
}

export function applyGiftAffection(
  currentAffection: number,
  bonus: number
): { affection: number; relationshipLevel: RelationshipLevel } {
  const affection = clampAffection(currentAffection + bonus);
  return {
    affection,
    relationshipLevel: affectionToLevel(affection),
  };
}
