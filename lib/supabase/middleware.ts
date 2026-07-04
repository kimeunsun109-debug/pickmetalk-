import { hasSupabaseAuthCookies } from "@/lib/supabase/fastAuth";
import { mapSessionCookies } from "@/lib/supabase/sessionCookies";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

/** .env.example 기본값 — Auth 호출 시 요청이 멈출 수 있어 세션 갱신 생략 */
function isSupabaseEnvPlaceholder(url: string, key: string): boolean {
  return /YOUR_PROJECT|your_project/i.test(url) || /your_anon/i.test(key);
}

/**
 * 미들웨어: 보호 라우트는 JWT 로컬 검증만 (getUser 서버 왕복 제거).
 * getClaims() → 쿠키 JWT 서명·만료 검사 (대부분 네트워크 없음).
 */
export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const path = request.nextUrl.pathname;
  const isAuthPage = path === "/login" || path === "/signup";
  const isProtected =
    path.startsWith("/chat") ||
    path.startsWith("/characters") ||
    path.startsWith("/conversations") ||
    path.startsWith("/settings") ||
    path.startsWith("/gifts");

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    isSupabaseEnvPlaceholder(supabaseUrl, supabaseAnonKey)
  ) {
    if (isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (isProtected && !hasSupabaseAuthCookies(request)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        const sessionCookies = mapSessionCookies(cookiesToSet);
        sessionCookies.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        sessionCookies.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const isAuthenticated = Boolean(claimsData?.claims?.sub);

  if (!isAuthenticated && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthenticated && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/characters";
    return NextResponse.redirect(url);
  }

  if (claimsError && !isProtected && !isAuthPage) {
    return supabaseResponse;
  }

  return supabaseResponse;
}
