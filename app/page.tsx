import Link from "next/link";

/**
 * 랜딩 — 추후 온보딩/로그인 분기
 * @see app/(auth)/login
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-2xl font-bold text-pink-accent">AI 여자친구</h1>
      <p className="text-center text-sm text-gray-600">
        나를 기다리는 존재와의 감성 채팅 (MVP 구조 준비 중)
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
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
    </main>
  );
}
