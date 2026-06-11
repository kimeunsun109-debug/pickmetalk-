import { createBrowserClient } from "@supabase/ssr";

const PLACEHOLDER_PATTERN = /YOUR_PROJECT|your_project|example\.supabase/i;

/** 클라이언트 컴포넌트용 Supabase */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase URL/키가 없습니다. .env.local 파일을 만들고 값을 입력해 주세요."
    );
  }
  if (PLACEHOLDER_PATTERN.test(url) || PLACEHOLDER_PATTERN.test(key)) {
    throw new Error(
      "Supabase가 아직 설정되지 않았습니다. .env.local의 NEXT_PUBLIC_SUPABASE_URL과 ANON_KEY를 실제 프로젝트 값으로 바꿔 주세요."
    );
  }
  return createBrowserClient(url, key);
}
