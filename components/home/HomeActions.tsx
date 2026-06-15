"use client";

import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useEffect, useState } from "react";

interface HomeActionsProps {
  initialLoggedIn: boolean;
}

export function HomeActions({ initialLoggedIn }: HomeActionsProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(initialLoggedIn);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!cancelled) {
          setIsLoggedIn(Boolean(user));
        }
      } catch {
        if (!cancelled) {
          setIsLoggedIn(false);
        }
      }
    }

    checkSession();

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoggedIn) {
    return (
      <div className="flex w-full max-w-xs flex-col gap-3">
        <Link
          href="/conversations"
          className="rounded-full bg-pink-accent py-3 text-center text-sm font-semibold text-white"
        >
          대화 계속하기
        </Link>
        <Link
          href="/characters"
          className="rounded-full border border-pink-accent py-3 text-center text-sm font-semibold text-pink-accent"
        >
          캐릭터 선택
        </Link>
      </div>
    );
  }

  return (
    <>
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
    </>
  );
}
