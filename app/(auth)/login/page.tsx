"use client";

import { Footer } from "@/components/layout/Footer";
import { buildAuthCallbackUrl } from "@/lib/appUrl";
import { markBrowserSessionActive } from "@/lib/auth/clearClientSession";
import { BRAND } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const [supabase, setSupabase] = useState<ReturnType<typeof createClient> | null>(
    null
  );
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    try {
      setSupabase(createClient());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Supabase 설정을 확인해주세요.");
    }
  }, []);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setError(".env.local에 Supabase URL과 anon key를 설정해주세요.");
      return;
    }

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: buildAuthCallbackUrl("/characters"),
          },
        });

        if (signUpError) throw signUpError;

        setInfo(
          "가입 확인 메일을 확인해주세요. 이메일 확인 없이 바로 로그인되는 설정이면 곧 이동합니다."
        );

        const { data: session } = await supabase.auth.getSession();
        if (session.session) {
          markBrowserSessionActive();
          router.push("/characters");
          router.refresh();
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        markBrowserSessionActive();
        router.push("/characters");
        router.refresh();
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "로그인에 실패했습니다.";

      if (msg === "Failed to fetch" || msg.includes("fetch")) {
        setError(
          "Supabase 서버에 연결할 수 없습니다. .env.local의 NEXT_PUBLIC_SUPABASE_URL이 실제 프로젝트 주소인지 확인한 뒤 개발 서버를 다시 시작해주세요."
        );
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  function switchMode(nextMode: "login" | "signup") {
    setMode(nextMode);
    setError(null);
    setInfo(null);
  }

  return (
    <main className="flex min-h-screen flex-col justify-center p-6">
      <h1 className="text-2xl font-bold text-pink-accent">{BRAND.name}</h1>
      <p className="mt-2 text-sm text-gray-600">
        {mode === "signup"
          ? "이메일로 가입하고 캐릭터를 만나보세요"
          : "다시 만나서 반가워요"}
      </p>

      {mode === "login" && (
        <p className="mt-1 text-xs text-gray-400">
          아이디는 가입한 이메일 주소입니다.
        </p>
      )}

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
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
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
          {loading ? "처리 중..." : mode === "signup" ? "회원가입" : "로그인"}
        </button>
      </form>

      {mode === "signup" ? (
        <button
          type="button"
          className="mt-4 rounded-full border border-gray-200 py-2.5 text-sm text-gray-600"
          onClick={() => switchMode("login")}
        >
          이미 계정이 있어요? 로그인
        </button>
      ) : (
        <button
          type="button"
          className="mt-4 rounded-full border border-pink-accent py-2.5 text-sm font-medium text-pink-accent"
          onClick={() => switchMode("signup")}
        >
          회원가입
        </button>
      )}

      {mode === "login" && (
        <div className="mt-6 flex items-center justify-center gap-3 text-sm">
          <Link href="/forgot-id" className="text-pink-accent underline">
            아이디 찾기
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/forgot-password" className="text-pink-accent underline">
            비밀번호 찾기
          </Link>
        </div>
      )}

      <Link href="/" className="mt-8 block text-center text-xs text-gray-400">
        홈으로
      </Link>

      <Footer className="mt-4" />
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center p-6">
          <p className="text-sm text-gray-400">불러오는 중...</p>
        </main>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
