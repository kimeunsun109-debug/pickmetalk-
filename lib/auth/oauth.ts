import { buildAuthCallbackUrl } from "@/lib/appUrl";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Supabase Auth providers enabled for PickmeTalk social login. */
export const OAUTH_PROVIDERS = ["google", "kakao"] as const;

export type OAuthProviderId = (typeof OAUTH_PROVIDERS)[number];

/**
 * Provider scopes for signInWithOAuth.
 * - Google: keep openid + email + profile.
 * - Kakao: request the Biz App's enabled email + profile consent items.
 *   Kakao returns KOE205 if any requested item is not enabled in its console.
 */
export const OAUTH_SCOPES: Record<OAuthProviderId, string> = {
  google: "openid email profile",
  // Comma-separated: GoTrue Kakao provider splits scopes on ",".
  kakao: "account_email,profile_nickname,profile_image",
};

/**
 * Starts a browser OAuth flow via Supabase Auth.
 * Client IDs / secrets live in the Supabase Dashboard (Auth → Providers) —
 * never in NEXT_PUBLIC_* env vars.
 */
export async function signInWithOAuthProvider(
  supabase: SupabaseClient,
  provider: OAuthProviderId,
  nextPath = "/characters"
) {
  return supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: buildAuthCallbackUrl(nextPath),
      scopes: OAUTH_SCOPES[provider],
      queryParams:
        provider === "google"
          ? { access_type: "online", prompt: "select_account" }
          : undefined,
    },
  });
}
