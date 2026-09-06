import { buildAuthCallbackUrl } from "@/lib/appUrl";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Supabase Auth providers enabled for PickmeTalk social login. */
export const OAUTH_PROVIDERS = ["google", "kakao"] as const;

export type OAuthProviderId = (typeof OAUTH_PROVIDERS)[number];

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
      queryParams:
        provider === "google"
          ? { access_type: "online", prompt: "select_account" }
          : undefined,
    },
  });
}
