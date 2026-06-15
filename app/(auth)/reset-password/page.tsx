"use client";

import { markBrowserSessionActive } from "@/lib/auth/clearClientSession";
import { BRAND } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/** Lets the user set a new password after opening a reset email link. */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(
    null
  );
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    function getRecoveryHashParams() {
      if (!window.location.hash.startsWith("#")) return null;
      const params = new URLSearchParams(window.location.hash.slice(1));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type");

      if (type !== "recovery" || !accessToken || !refreshToken) return null;
      return { accessToken, refreshToken };
    }

    async function prepareSession() {
      try {
        const client = createClient();
        setSupabase(client);

        const authError = new URLSearchParams(window.location.search).get("error");
        if (authError === "auth") {
          if (!cancelled) {
            setError(
              "링크가 만료되었거나 유효하지 않아요. 비밀번호 찾기에서 다시 요청해주세요."
            );
          }
          return;
        }

        const recoveryTokens = getRecoveryHashParams();
        if (recoveryTokens) {
          const { error: sessionError } = await client.auth.setSession({
            access_token: recoveryTokens.accessToken,
            refresh_token: recoveryTokens.refreshToken,
          });
          if (sessionError) throw sessionError;

          if (!cancelled) {
            markBrowserSessionActive();
            setReady(true);
            router.replace("/reset-password");
          }
          return;
        }

        const { data } = await client.auth.getSession();
        if (!cancelled) {
          if (data.session) {
            markBrowserSessionActive();
            setReady(true);
            const params = new URLSearchParams(window.location.search);
            if (params.has("session_start") || params.has("error")) {
              router.replace("/reset-password");
            }
          } else {
            setError(
              "링크가 만료되었거나 유효하지 않아요. 비밀번호 찾기에서 다시 요청해주세요."
            );
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : "비밀번호 재설정 링크를 확인하지 못했습니다."
          );
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    prepareSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError) throw updateError;

      markBrowserSessionActive();
      router.push("/characters");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "비밀번호 변경에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col justify-center p-6">
      <h1 className="text-2xl font-bold text-pink-accent">{BRAND.name}</h1>
      <p className="mt-2 text-lg font-semibold text-gray-900">
        새 비밀번호 설정
      </p>
      <p className="mt-1 text-sm text-gray-500">
        앞으로 사용할 새 비밀번호를 입력해주세요.
      </p>

      {checking ? (
        <p className="mt-8 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
          재설정 링크를 확인하는 중이에요.
        </p>
      ) : ready ? (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
          <label className="text-sm font-medium text-gray-700">
            새 비밀번호 (6자 이상)
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border px-4 py-3 text-sm"
              placeholder="••••••••"
            />
          </label>

          <label className="text-sm font-medium text-gray-700">
            비밀번호 확인
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-xl border px-4 py-3 text-sm"
              placeholder="••••••••"
            />
          </label>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="rounded-full bg-pink-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            {loading ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>
      ) : (
        error && (
          <p className="mt-8 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )
      )}

      <div className="mt-6 flex justify-center gap-4 text-sm">
        <Link href="/forgot-password" className="text-pink-accent underline">
          비밀번호 찾기
        </Link>
        <Link href="/login" className="text-gray-500 underline">
          로그인
        </Link>
      </div>
    </main>
  );
}
