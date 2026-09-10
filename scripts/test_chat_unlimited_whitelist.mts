/**
 * Smoke test for CHAT_UNLIMITED_* env bypass (no Supabase required).
 * Usage: CHAT_UNLIMITED_EMAILS=a@b.com npx tsx scripts/test_chat_unlimited_whitelist.mts
 */
import {
  isWhitelistedUnlimitedChat,
  resetChatUnlimitedWhitelistCache,
} from "../lib/chatUnlimitedWhitelist";
import { hasUnlimitedChatAccess } from "../services/chatPremiumAccess";
import type { UserProfile } from "../types";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("OK:", msg);
}

const baseProfile = (overrides: Partial<UserProfile> = {}): UserProfile =>
  ({
    id: "11111111-1111-1111-1111-111111111111",
    email: "free@pickme.local",
    displayName: null,
    trialEndsAt: null,
    isPremium: false,
    dailyMessageCount: 50,
    dailyMessageResetAt: new Date().toISOString(),
    userContext: {},
    speechProfile: null,
    ...overrides,
  }) as UserProfile;

resetChatUnlimitedWhitelistCache();
assert(!isWhitelistedUnlimitedChat("any-id", "any@email.com"), "empty env → not whitelisted");

process.env.CHAT_UNLIMITED_USER_IDS =
  "22222222-2222-2222-2222-222222222222,33333333-3333-3333-3333-333333333333";
process.env.CHAT_UNLIMITED_EMAILS = "Owner@Example.COM";
resetChatUnlimitedWhitelistCache();

assert(
  isWhitelistedUnlimitedChat("22222222-2222-2222-2222-222222222222"),
  "UUID in CHAT_UNLIMITED_USER_IDS"
);
assert(
  isWhitelistedUnlimitedChat("99999999-9999-9999-9999-999999999999", "owner@example.com"),
  "email match is case-insensitive"
);
assert(
  !isWhitelistedUnlimitedChat("99999999-9999-9999-9999-999999999999", "other@example.com"),
  "non-listed email rejected"
);

const freeAtLimit = baseProfile({ dailyMessageCount: 50 });
assert(
  hasUnlimitedChatAccess(freeAtLimit, "owner@example.com"),
  "whitelisted email → unlimited even when is_premium=false"
);
assert(
  !hasUnlimitedChatAccess(freeAtLimit, "free@pickme.local"),
  "non-whitelisted free user still limited"
);

const paid = baseProfile({ isPremium: true, dailyMessageCount: 50 });
assert(hasUnlimitedChatAccess(paid), "is_premium still grants unlimited");

console.log("\nAll chat unlimited whitelist checks passed.");
