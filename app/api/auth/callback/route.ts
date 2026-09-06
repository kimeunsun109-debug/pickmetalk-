import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Only allow relative in-app paths (blocks open redirects). */
function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/characters";
  }
  return raw;
}

/**
 * Supabase email / OAuth callback: exchange PKCE code, set session cookies, redirect.
 * Provider client secrets stay in Supabase Dashboard — this route only finishes the app redirect.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));
  const oauthError = searchParams.get("error_description") ?? searchParams.get("error");

  if (oauthError) {
    const login = new URL("/login", origin);
    login.searchParams.set("error", "oauth");
    login.searchParams.set("message", oauthError.slice(0, 200));
    return NextResponse.redirect(login);
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      const base =
        !isLocalEnv && forwardedHost
          ? `https://${forwardedHost}`
          : origin;

      const redirectUrl = new URL(next, base);
      redirectUrl.searchParams.set("session_start", "1");
      return NextResponse.redirect(redirectUrl);
    }
  }

  const login = new URL("/login", origin);
  login.searchParams.set("error", "auth");
  return NextResponse.redirect(login);
}
