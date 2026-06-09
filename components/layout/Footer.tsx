import Link from "next/link";

/**
 * Footer — 앱 공통 하단 푸터
 *
 * 사용 위치:
 *   - app/page.tsx (홈/랜딩)
 *   - app/(auth)/login/page.tsx (로그인 화면)
 *   - app/privacy/page.tsx 에는 인라인으로 포함됨
 */
export function Footer({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-4 text-xs text-gray-400 ${className}`}
    >
      <span>© 2026 픽미픽미</span>
      <span className="hidden sm:inline">·</span>
      <Link
        href="/privacy"
        className="underline-offset-2 hover:text-gray-600 hover:underline"
      >
        개인정보처리방침
      </Link>
    </footer>
  );
}
