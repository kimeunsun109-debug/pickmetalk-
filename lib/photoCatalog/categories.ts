/**
 * Category slug helpers for product photo catalog.
 * Prisma-free rewrite of ops category-mapper (slug/aliases only).
 */

export interface CategoryDef {
  slug: string;
  defaultEmotion: string;
  aliases: string[];
}

export const CATEGORY_DEFS: CategoryDef[] = [
  { slug: "hair", defaultEmotion: "shy", aliases: ["hair", "salon", "머리", "미용실"] },
  {
    slug: "coffee",
    defaultEmotion: "happy",
    aliases: ["coffee", "cafe", "커피", "카페"],
  },
  { slug: "nail", defaultEmotion: "happy", aliases: ["nail", "네일"] },
  {
    slug: "tteokbokki",
    defaultEmotion: "excited",
    aliases: ["tteok", "tteokbokki", "떡볶이"],
  },
  { slug: "rain", defaultEmotion: "loving", aliases: ["rain", "비", "우산"] },
  {
    slug: "alcohol",
    defaultEmotion: "tired",
    aliases: ["drink", "alcohol", "술"],
  },
  {
    slug: "morning",
    defaultEmotion: "sleepy",
    aliases: ["morning", "bed", "아침", "침대"],
  },
  { slug: "selfie", defaultEmotion: "happy", aliases: ["selfie", "셀카"] },
  {
    slug: "weekend",
    defaultEmotion: "happy",
    aliases: ["weekend", "주말"],
  },
  { slug: "game", defaultEmotion: "excited", aliases: ["game", "게임"] },
  {
    slug: "overtime",
    defaultEmotion: "tired",
    aliases: ["overtime", "야근"],
  },
  { slug: "leave", defaultEmotion: "happy", aliases: ["leave", "퇴근"] },
  {
    slug: "exercise",
    defaultEmotion: "excited",
    aliases: ["gym", "exercise", "운동"],
  },
  { slug: "walk", defaultEmotion: "happy", aliases: ["walk", "산책"] },
  { slug: "snow", defaultEmotion: "excited", aliases: ["snow", "눈"] },
  {
    slug: "cherry",
    defaultEmotion: "loving",
    aliases: ["cherry", "blossom", "벚꽃"],
  },
  { slug: "brunch", defaultEmotion: "happy", aliases: ["brunch", "브런치"] },
  { slug: "home", defaultEmotion: "neutral", aliases: ["home", "집"] },
  { slug: "reading", defaultEmotion: "neutral", aliases: ["read", "독서"] },
  {
    slug: "dessert",
    defaultEmotion: "happy",
    aliases: ["dessert", "bakery", "디저트"],
  },
  { slug: "sad", defaultEmotion: "sad", aliases: ["sad", "슬픔"] },
  { slug: "happy", defaultEmotion: "happy", aliases: ["happy", "기쁨"] },
];

/** Album UI grouping for product memories page. */
export const ALBUM_CATEGORY_MAP: Record<string, string> = {
  selfie: "셀카",
  coffee: "카페",
  cafe: "카페",
  tteokbokki: "음식",
  food: "음식",
  dessert: "음식",
  brunch: "음식",
  rain: "비 오는 날",
  cherry: "봄",
  snow: "겨울",
  happy: "추억",
  weekend: "데이트",
  hair: "셀카",
  nail: "셀카",
  morning: "일상",
  home: "일상",
  overtime: "일상",
  leave: "일상",
  game: "취미",
  exercise: "취미",
  walk: "산책",
  sad: "감정",
  alcohol: "저녁",
  reading: "일상",
};

export const EMOTION_FALLBACK_CATEGORIES: Record<string, string[]> = {
  sleepy: ["morning", "home", "selfie"],
  sad: ["sad", "home", "selfie"],
  happy: ["happy", "selfie", "weekend"],
  neutral: ["selfie", "home", "coffee"],
  excited: ["weekend", "game", "selfie"],
  shy: ["hair", "selfie", "happy"],
  tired: ["overtime", "alcohol", "morning"],
  loving: ["rain", "happy", "selfie"],
};

export function scenarioToCategory(scenarioId: string): string {
  const lower = scenarioId.toLowerCase();
  for (const def of CATEGORY_DEFS) {
    if (def.slug === lower || def.aliases.some((a) => lower.includes(a))) {
      return def.slug;
    }
  }
  return "selfie";
}

export function albumLabelForCategory(category: string): string {
  return ALBUM_CATEGORY_MAP[category] ?? "추억";
}
