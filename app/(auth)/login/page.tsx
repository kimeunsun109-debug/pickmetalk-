"use client";

import { Footer } from "@/components/layout/Footer";
import { buildAuthCallbackUrl } from "@/lib/appUrl";
import { markBrowserSessionActive } from "@/lib/auth/clearClientSession";
import {
  ensureDeviceSessionId,
  setDeviceSessionId,
} from "@/lib/auth/deviceSession";
import { BRAND } from "@/lib/brand";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const IDEAL_TYPE_OPTIONS = [
  { value: "", label: "선택 안 함" },
  { value: "warm", label: "다정하고 따뜻한 타입" },
  { value: "funny", label: "유머 있고 재미있는 타입" },
  { value: "calm", label: "차분하고 든든한 타입" },
  { value: "passionate", label: "열정적이고 에너지 넘치는 타입" },
  { value: "intellectual", label: "섬세하고 깊이 있는 타입" },
];

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
  const [nickname, setNickname] = useState("");
  const [gender, setGender] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [interests, setInterests] = useState("");
  const [mbti, setMbti] = useState("");
  const [idealType, setIdealType] = useState("");
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [termsConsent, setTermsConsent] = useState(false);
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

  async function registerDeviceSession() {
    const sessionId = ensureDeviceSessionId();
    try {
      const res = await fetch("/api/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Session": sessionId,
        },
        body: JSON.stringify({ sessionId }),
      });
      const data = (await res.json()) as { sessionId?: string };
      if (data.sessionId) setDeviceSessionId(data.sessionId);
    } catch {
      /* non-blocking */
    }
  }

  async function saveSignupProfile() {
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: nickname.trim(),
        gender,
        birthDate,
        interests: interests.trim() || undefined,
        hobbies: interests.trim() || undefined,
        mbti: mbti.trim() || undefined,
        idealType: idealType || undefined,
        privacyConsent: true,
        termsConsent: true,
      }),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setError(".env.local에 Supabase URL과 anon key를 설정해주세요.");
      return;
    }

    if (mode === "signup") {
      if (!nickname.trim() || !gender || !birthDate) {
        setError("닉네임, 성별, 생년월일은 필수입니다.");
        return;
      }
      if (!privacyConsent || !termsConsent) {
        setError("개인정보 처리 및 이용약관에 동의해 주세요.");
        return;
      }
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
            data: {
              display_name: nickname.trim(),
              gender,
              birth_date: birthDate,
            },
          },
        });

        if (signUpError) throw signUpError;

        setInfo(
          "가입 확인 메일을 확인해주세요. 이메일 확인 없이 바로 로그인되는 설정이면 곧 이동합니다."
        );

        const { data: session } = await supabase.auth.getSession();
        if (session.session) {
          await saveSignupProfile();
          markBrowserSessionActive();
          await registerDeviceSession();
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
        await registerDeviceSession();
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

  const inputClass =
    "mt-1 w-full rounded-xl border px-4 py-3 text-sm";

  return (
    <main className="flex min-h-screen flex-col justify-center p-6">
      <h1 className="text-2xl font-bold text-pink-accent">{BRAND.name}</h1>
      <p className="mt-2 text-sm text-gray-600">
        {mode === "signup"
          ? "필수 정보를 입력하고 캐릭터를 만나보세요"
          : "다시 만나서 반가워요"}
      </p>

      {mode === "login" && (
        <p className="mt-1 text-xs text-gray-400">
          아이디는 가입한 이메일 주소입니다.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
        {mode === "signup" && (
          <>
            <label className="text-sm font-medium text-gray-700">
              닉네임 <span className="text-pink-accent">*</span>
              <input
                type="text"
                required
                maxLength={20}
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className={inputClass}
                placeholder="외로운늑대"
              />
            </label>

            <label className="text-sm font-medium text-gray-700">
              성별 <span className="text-pink-accent">*</span>
              <select
                required
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={inputClass}
              >
                <option value="">선택해 주세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타 / 밝히지 않음</option>
              </select>
            </label>

            <label className="text-sm font-medium text-gray-700">
              생년월일 <span className="text-pink-accent">*</span>
              <input
                type="date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className={inputClass}
              />
            </label>
          </>
        )}

        <label className="text-sm font-medium text-gray-700">
          이메일 {mode === "signup" && <span className="text-pink-accent">*</span>}
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
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
            className={inputClass}
            placeholder="••••••••"
          />
        </label>

        {mode === "signup" && (
          <>
            <label className="text-sm font-medium text-gray-700">
              관심사 / 취미 (선택)
              <input
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                className={inputClass}
                placeholder="영화, 러닝, 요리..."
              />
            </label>

            <label className="text-sm font-medium text-gray-700">
              MBTI (선택)
              <input
                type="text"
                maxLength={4}
                value={mbti}
                onChange={(e) => setMbti(e.target.value.toUpperCase())}
                className={inputClass}
                placeholder="ENFP"
              />
            </label>

            <label className="text-sm font-medium text-gray-700">
              선호하는 이상형 (선택)
              <select
                value={idealType}
                onChange={(e) => setIdealType(e.target.value)}
                className={inputClass}
              >
                {IDEAL_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="space-y-3 rounded-xl border border-pink-100 bg-pink-50/40 p-4 text-xs text-gray-700">
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  required
                  checked={privacyConsent}
                  onChange={(e) => setPrivacyConsent(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  <Link href="/privacy" className="text-pink-accent underline">
                    개인정보처리방침
                  </Link>
                  에 동의합니다. (필수) 수집 목적: 회원 관리, 서비스 제공,{" "}
                  <strong>맞춤형 캐릭터 대화 제공</strong>을 포함합니다.
                </span>
              </label>
              <label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  required
                  checked={termsConsent}
                  onChange={(e) => setTermsConsent(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  <Link href="/terms" className="text-pink-accent underline">
                    이용약관
                  </Link>
                  에 동의합니다. (필수) 대화 내용의 공유·유출에 대한 책임은
                  사용자 본인에게 있습니다.
                </span>
              </label>
            </div>
          </>
        )}

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
