export const locales = ["ko"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ko";

/** Beta: Korea only. Future: "en", "ja", … */
export const defaultMarket = "KR" as const;
export type Market = typeof defaultMarket | "GLOBAL";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
