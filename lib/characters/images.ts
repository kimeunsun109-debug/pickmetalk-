import { normalizeEmotion } from "@/lib/emotions";
import type { EmotionState } from "@/types";

/** Public image paths for character faces (confirmed portraits). */

const CHARACTER_EMOTION_FILES: Record<string, readonly string[]> = {
  yuna: ["happy", "neutral", "smile", "hero"],
  narin: ["happy", "neutral", "smile", "hero"],
  yoonseo: ["happy", "neutral", "smile", "hero"],
  eunha: ["happy", "neutral", "smile", "hero"],
  jiyu: ["happy", "neutral", "smile", "hero", "excited"],
};

const DEFAULT_EMOTION_FILES = ["happy", "neutral", "smile", "hero"] as const;

/** Interim map until full emotion portrait sets exist on disk. */
const EMOTION_ASSET_NAME: Record<EmotionState, string> = {
  happy: "happy",
  excited: "excited",
  hurt: "neutral",
  pouty: "neutral",
  miss_you: "smile",
  bored: "neutral",
  special_day: "happy",
};

export function resolveCharacterEmotionAsset(
  characterId: string,
  emotion: string
): string {
  const normalized = normalizeEmotion(emotion);
  const preferred = EMOTION_ASSET_NAME[normalized] ?? "happy";
  const available =
    CHARACTER_EMOTION_FILES[characterId] ?? DEFAULT_EMOTION_FILES;
  if (available.includes(preferred)) return preferred;
  if (available.includes("happy")) return "happy";
  return available[0] ?? "happy";
}

export function characterAvatarSrc(characterId: string): string {
  return `/avatars/${characterId}.jpg`;
}

export function characterHeroSrc(characterId: string): string {
  return `/assets/characters/${characterId}/hero.jpg`;
}

export function characterEmotionSrc(
  characterId: string,
  emotion: string
): string {
  const asset = resolveCharacterEmotionAsset(characterId, emotion);
  return `/assets/characters/${characterId}/${asset}.jpg`;
}

/** Stable "today's pick" index from KST calendar day. */
export function todaysPickIndex(length: number, now = new Date()): number {
  if (length <= 0) return 0;
  const kst = new Date(
    now.toLocaleString("en-US", { timeZone: "Asia/Seoul" })
  );
  const day =
    kst.getFullYear() * 10000 + (kst.getMonth() + 1) * 100 + kst.getDate();
  return day % length;
}
