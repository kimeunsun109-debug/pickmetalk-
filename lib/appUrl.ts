/** Canonical app origin for auth email links (client falls back to current origin). */
export function getAppOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

/** PKCE code exchange after OAuth / signup email (same browser). */
export function buildAuthCallbackUrl(next: string): string {
  const url = new URL("/api/auth/callback", getAppOrigin());
  url.searchParams.set("next", next);
  return url.toString();
}

/** token_hash verify endpoint for password reset (works from any browser/email app). */
export function buildAuthConfirmUrl(next: string): string {
  const url = new URL("/api/auth/confirm", getAppOrigin());
  url.searchParams.set("next", next);
  return url.toString();
}
