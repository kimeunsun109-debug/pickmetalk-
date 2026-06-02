import { createBrowserClient } from "@supabase/ssr";

/** 클라이언트 컴포넌트용 Supabase */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase URL/키가 없습니다. .env.local을 확인해 주세요."
    );
  }
  return createBrowserClient(url, key);
}
