import {
  asSessionCookieOptions,
  mapSessionCookies,
} from "@/lib/supabase/sessionCookies";
import { createBrowserClient, type CookieOptions } from "@supabase/ssr";
import { parse, serialize } from "cookie";

const PLACEHOLDER_PATTERN = /YOUR_PROJECT|your_project|example\.supabase/i;

/** Supabase browser client that stores auth in session cookies. */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase URL 또는 anon key가 없습니다. .env.local에 값을 입력해주세요."
    );
  }
  if (PLACEHOLDER_PATTERN.test(url) || PLACEHOLDER_PATTERN.test(key)) {
    throw new Error(
      "Supabase가 아직 설정되지 않았습니다. .env.local의 URL과 anon key를 실제 프로젝트 값으로 바꿔주세요."
    );
  }

  return createBrowserClient(url, key, {
    cookies: {
      getAll() {
        const parsed = parse(document.cookie);
        return Object.keys(parsed).map((name) => ({
          name,
          value: parsed[name] ?? "",
        }));
      },
      setAll(
        cookiesToSet: {
          name: string;
          value: string;
          options?: CookieOptions;
        }[]
      ) {
        mapSessionCookies(cookiesToSet).forEach(({ name, value, options }) => {
          document.cookie = serialize(name, value, asSessionCookieOptions(options));
        });
      },
    },
  });
}
