import { BRAND } from "@/lib/brand";
import Link from "next/link";

/** 아이디(이메일) 찾기 — 이메일 로그인 안내 */
export default function ForgotIdPage() {
  return (
    <main className="flex min-h-screen flex-col justify-center p-6">
      <h1 className="text-2xl font-bold text-pink-accent">{BRAND.name}</h1>
      <p className="mt-2 text-lg font-semibold text-gray-900">아이디 찾기</p>

      <div className="mt-8 space-y-4 rounded-2xl border border-gray-100 bg-white p-5 text-sm text-gray-700 shadow-sm">
        <p>
          {BRAND.name}은 <strong>이메일 주소</strong>로 로그인합니다.
        </p>
        <p>
          가입할 때 사용한 이메일이 곧 아이디입니다. 메일함에서 가입 확인
          메일을 검색해 보세요.
        </p>
        <p className="text-gray-500">
          이메일이 기억나지 않으면, 가입에 사용한 메일 서비스(네이버, Gmail
          등)에서 &quot;픽미톡&quot; 또는 &quot;pickmetalk&quot;으로 검색해
          보세요.
        </p>
      </div>

      <Link
        href="/login"
        className="mt-8 rounded-full bg-pink-accent py-3 text-center text-sm font-semibold text-white"
      >
        로그인으로 돌아가기
      </Link>

      <p className="mt-4 text-center text-sm text-gray-500">
        비밀번호를 잊으셨나요?{" "}
        <Link href="/forgot-password" className="text-pink-accent underline">
          비밀번호 찾기
        </Link>
      </p>
    </main>
  );
}
