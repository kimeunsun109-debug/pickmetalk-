"use client";

import {
  signInWithOAuthProvider,
  type OAuthProviderId,
} from "@/lib/auth/oauth";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

type SocialLoginButtonsProps = {
  /** Return true to proceed, or an error string to block (e.g. missing consent). */
  beforeStart?: () => true | string;
  onError?: (message: string) => void;
  disabled?: boolean;
  nextPath?: string;
};

/** Google + Kakao OAuth buttons (Supabase Auth). Email/password flow stays separate. */
export function SocialLoginButtons({
  beforeStart,
  onError,
  disabled = false,
  nextPath = "/characters",
}: SocialLoginButtonsProps) {
  const [busy, setBusy] = useState<OAuthProviderId | null>(null);

  async function handleOAuth(provider: OAuthProviderId) {
    if (disabled || busy) return;

    const gate = beforeStart?.() ?? true;
    if (gate !== true) {
      onError?.(gate);
      return;
    }

    setBusy(provider);
    onError?.(""); // clear via empty — parent may ignore

    try {
      const supabase = createClient();
      const { data, error } = await signInWithOAuthProvider(
        supabase,
        provider,
        nextPath
      );
      if (error) throw error;
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      throw new Error("OAuth 리다이렉트 URL을 받지 못했습니다.");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "소셜 로그인에 실패했습니다.";
      if (msg === "Failed to fetch" || msg.includes("fetch")) {
        onError?.(
          "Supabase 서버에 연결할 수 없습니다. .env.local의 NEXT_PUBLIC_SUPABASE_URL을 확인해주세요."
        );
      } else {
        onError?.(msg);
      }
      setBusy(null);
    }
  }

  const baseBtn =
    "flex w-full items-center justify-center gap-2 rounded-full border py-3 text-sm font-semibold transition disabled:opacity-50";

  return (
    <div className="flex flex-col gap-2.5">
      <button
        type="button"
        disabled={disabled || busy !== null}
        onClick={() => void handleOAuth("google")}
        className={`${baseBtn} border-gray-200 bg-white text-gray-800 hover:bg-gray-50`}
        aria-label="Google로 계속"
      >
        <GoogleIcon />
        {busy === "google" ? "이동 중..." : "Google로 계속"}
      </button>

      <button
        type="button"
        disabled={disabled || busy !== null}
        onClick={() => void handleOAuth("kakao")}
        className={`${baseBtn} border-[#FEE500] bg-[#FEE500] text-[#191919] hover:brightness-95`}
        aria-label="카카오로 계속"
      >
        <KakaoIcon />
        {busy === "kakao" ? "이동 중..." : "카카오로 계속"}
      </button>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#191919"
        d="M12 3C6.48 3 2 6.58 2 11c0 2.82 1.84 5.3 4.62 6.72-.15.54-.96 3.48-.99 3.7 0 0-.2.12.08.24.11.05.25.01.25.01.33-.05 3.83-2.52 4.43-2.94.52.07 1.06.11 1.61.11 5.52 0 10-3.58 10-8S17.52 3 12 3z"
      />
    </svg>
  );
}
