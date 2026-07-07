import ko from "@/messages/ko.json";
import { defaultLocale, type Locale } from "./config";

type Messages = typeof ko;

const catalogs: Record<Locale, Messages> = { ko };

/** Minimal i18n — extend with next-intl / [locale] routing later. */
export function t(
  key: string,
  locale: Locale = defaultLocale,
  vars?: Record<string, string | number>
): string {
  const parts = key.split(".");
  let node: unknown = catalogs[locale];
  for (const part of parts) {
    if (node == null || typeof node !== "object") return key;
    node = (node as Record<string, unknown>)[part];
  }
  if (typeof node !== "string") return key;
  if (!vars) return node;
  return Object.entries(vars).reduce(
    (acc, [k, v]) => acc.replace(new RegExp(`\\{${k}\\}`, "g"), String(v)),
    node
  );
}

export { defaultLocale, defaultMarket, locales, type Locale, type Market } from "./config";
