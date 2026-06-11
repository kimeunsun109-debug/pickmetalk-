import { Footer } from "@/components/layout/Footer";
import { BRAND } from "@/lib/brand";
import Link from "next/link";

/**
 * 랜딩 — 로그인 / 회원가입 / 비밀번호 찾기 진입
 */
export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold text-pink-accent">{BRAND.name}</h1>
      <p className="text-center text-sm text-gray-600">{BRAND.tagline}</p>

      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/login"
          className="rounded-full bg-pink-accent py-3 text-center text-sm font-semibold text-white"
        >
          로그인
        </Link>
        <Link
          href="/login?mode=signup"
          className="rounded-full border border-pink-accent py-3 text-center text-sm font-semibold text-pink-accent"
        >
          회원가입
        </Link>
        <Link
          href="/characters"
          className="rounded-full border border-gray-200 py-3 text-center text-sm text-gray-600"
        >
          캐릭터 보기
        </Link>
      </div>

      <div className="flex items-center justify-center gap-3 text-xs text-gray-400">
        <Link href="/forgot-id" className="text-pink-accent underline">
          아이디 찾기
        </Link>
        <span>|</span>
        <Link href="/forgot-password" className="text-pink-accent underline">
          비밀번호 찾기
        </Link>
      </div>

      <Footer className="absolute bottom-0 w-full" />
    </main>
  );
}
