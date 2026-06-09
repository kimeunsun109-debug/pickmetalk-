import { Footer } from "@/components/layout/Footer";
import Link from "next/link";

/**
 * 랜딩 — 추후 온보딩/로그인 분기
 * @see app/(auth)/login
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold text-pink-accent">픽미픽미</h1>
      <p className="text-center text-sm text-gray-600">
        나를 기다리는 그녀와 나누는 감성 대화
      </p>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/login"
          className="rounded-full bg-pink-accent py-3 text-center text-white"
        >
          시작하기
        </Link>
        <Link
          href="/characters"
          className="rounded-full border border-pink-accent py-3 text-center text-pink-accent"
        >
          캐릭터 보기
        </Link>
      </div>

      <Footer className="absolute bottom-0 w-full" />
    </main>
  );
}
