"use client";

import { BRAND } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";

/** 비밀번호 재설정 메일 발송 */
export default function ForgotPasswordPage() {
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(
    null
  );
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    try {
      setSupabase(createClient());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Supabase 설정을 확인해 주세요."
      );
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
        }
      );
      if (resetError) throw resetError;
      setInfo(
        "비밀번호 재설정 메일을 보냈어요. 메일함(스팸함 포함)을 확인해 주세요."
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "메일 발송에 실패했습니다."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col justify-center p-6">
      <h1 className="text-2xl font-bold text-pink-accent">{BRAND.name}</h1>
      <p className="mt-2 text-lg font-semibold text-gray-900">비밀번호 찾기</p>
      <p className="mt-1 text-sm text-gray-500">
        가입한 이메일로 재설정 링크를 보내드려요
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="text-sm font-medium text-gray-700">
          이메일 (아이디)
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-xl border px-4 py-3 text-sm"
            placeholder="you@example.com"
          />
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}
        {info && (
          <p className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !supabase}
          className="rounded-full bg-pink-accent py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "발송 중..." : "재설정 메일 보내기"}
        </button>
      </form>

      <div className="mt-6 flex justify-center gap-4 text-sm">
        <Link href="/forgot-id" className="text-pink-accent underline">
          아이디 찾기
        </Link>
        <Link href="/login" className="text-gray-500 underline">
          로그인
        </Link>
      </div>
    </main>
  );
}
