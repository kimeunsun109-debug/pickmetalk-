import ko from "@/messages/ko.json";
import { defaultLocale, type Locale } from "./config";

type Messages = typeof ko;

const catalogs: Record<Locale, Messages> = { ko };

/**
 * Minimal i18n for fast MVP — expand with next-intl or [locale] routing later.
 * New UI copy: add a key to messages/ko.json and call t('section.key').
 */
export function t(
  key: string,
  locale: Locale = defaultLocale
): string {
  const parts = key.split(".");
  let node: unknown = catalogs[locale];
  for (const part of parts) {
    if (node == null || typeof node !== "object") return key;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : key;
}

export { defaultLocale, locales, type Locale } from "./config";
