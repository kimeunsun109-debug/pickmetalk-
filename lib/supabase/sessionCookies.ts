import type { CookieOptions } from "@supabase/ssr";

/**
 * Convert Supabase auth cookies to browser-session cookies.
 * Removing Max-Age/Expires makes the browser drop them when the browser session
 * ends, while preserving explicit deletion cookies with maxAge: 0.
 */
export function asSessionCookieOptions(
  options: CookieOptions = {}
): CookieOptions {
  if (options.maxAge === 0) {
    return options;
  }
  const session = { ...options };
  delete session.maxAge;
  delete session.expires;
  return session;
}

/** Apply session-cookie options to every cookie set by Supabase SSR. */
export function mapSessionCookies<
  T extends { name: string; value: string; options?: CookieOptions },
>(cookies: T[]): T[] {
  return cookies.map((c) => ({
    ...c,
    options: asSessionCookieOptions(c.options ?? {}),
  }));
}
