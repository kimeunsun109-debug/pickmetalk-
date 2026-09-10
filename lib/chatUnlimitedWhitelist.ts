/**
 * Server-only bypass for daily chat quota (no Stripe / DB premium flag).
 * Comma-separated lists in env — redeploy or restart dev server after changes.
 */

function parseCsvEnv(name: string): string[] {
  const raw = process.env[name]?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

let cachedUserIds: Set<string> | null = null;
let cachedEmails: Set<string> | null = null;

function unlimitedUserIds(): Set<string> {
  if (!cachedUserIds) {
    cachedUserIds = new Set(parseCsvEnv("CHAT_UNLIMITED_USER_IDS"));
  }
  return cachedUserIds;
}

function unlimitedEmails(): Set<string> {
  if (!cachedEmails) {
    cachedEmails = new Set(
      parseCsvEnv("CHAT_UNLIMITED_EMAILS").map((e) => e.toLowerCase())
    );
  }
  return cachedEmails;
}

/** Reset cached env parse (tests only). */
export function resetChatUnlimitedWhitelistCache(): void {
  cachedUserIds = null;
  cachedEmails = null;
}

export function isWhitelistedUnlimitedChat(
  userId: string,
  email?: string | null
): boolean {
  if (unlimitedUserIds().has(userId)) return true;
  const normalized = email?.trim().toLowerCase();
  if (normalized && unlimitedEmails().has(normalized)) return true;
  return false;
}
