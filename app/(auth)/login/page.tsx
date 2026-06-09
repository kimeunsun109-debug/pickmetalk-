"use client";

import { Footer } from "@/components/layout/Footer";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * 이메일 로그인 / 회원가입
 * 성공 시 /characters 로 이동 (미들웨어에서도 처리)
 */
export default function LoginPage() {
  const router = useRouter();
  // 빌드 시 SSR에서 env 없이 createClient 호출 방지 (클라이언트 마운트 후 생성)
  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(
    null
  );

  useEffect(() => {
    try {
      setSupabase(createClient());
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Supabase 설정을 확인해 주세요."
      );
    }
  }, []);

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setError(".env.local에 Supabase URL/키를 설정해 주세요.");
      return;
    }
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/characters`,
          },
        });
        if (signUpError) throw signUpError;
        setInfo(
          "가입 메일을 확인해 주세요. 이메일 확인 없이 바로 로그인되는 설정이면 곧 이동합니다."
        );
        const { data: session } = await supabase.auth.getSession();
        if (session.session) {
          router.push("/characters");
          router.refresh();
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push("/characters");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col justify-center p-6">
      <h1 className="text-2xl font-bold text-pink-accent">AI 여자친구</h1>
      <p className="mt-2 text-sm text-gray-600">
        {isSignUp ? "이메일로 가입하기" : "다시 만나서 반가워요"}
      </p>

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        <label className="text-sm font-medium text-gray-700">
          이메일
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

        <label className="text-sm font-medium text-gray-700">
          비밀번호 (6자 이상)
          <input
            type="password"
            required
            minLength={6}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-xl border px-4 py-3 text-sm"
            placeholder="••••••••"
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
          {loading ? "처리 중..." : isSignUp ? "회원가입" : "로그인"}
        </button>
      </form>

      <button
        type="button"
        className="mt-4 text-sm text-pink-accent underline"
        onClick={() => {
          setIsSignUp(!isSignUp);
          setError(null);
          setInfo(null);
        }}
      >
        {isSignUp
          ? "이미 계정이 있어요 — 로그인"
          : "처음이에요 — 회원가입"}
      </button>

      <Link href="/" className="mt-8 block text-center text-xs text-gray-400">
        홈으로
      </Link>

      {/* 개인정보처리방침 링크 */}
      <Footer className="mt-4" />
    </main>
  );
}
