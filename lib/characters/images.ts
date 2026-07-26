/** Public image paths for character faces (confirmed portraits). */

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
  return `/assets/characters/${characterId}/${emotion}.jpg`;
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
