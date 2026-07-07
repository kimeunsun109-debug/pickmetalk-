/** Supported locales — extend in Phase 3 (EN, JA, …). */
export const locales = ["ko"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ko";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
