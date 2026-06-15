import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

/** Exchanges email token_hash for a session (password reset, signup confirm). */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/reset-password";

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      const redirectUrl = new URL(next, origin);
      redirectUrl.searchParams.set("session_start", "1");
      return NextResponse.redirect(redirectUrl);
    }
  }

  const fallback = new URL(next, origin);
  fallback.searchParams.set("error", "auth");
  return NextResponse.redirect(fallback);
}
