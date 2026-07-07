#!/usr/bin/env npx tsx
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  const path = ".env.local";
  if (!existsSync(path)) return env;
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const eq = t.indexOf("=");
    env[t.slice(0, eq).trim()] = t
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const email = env.TEST_USER_EMAIL ?? "demo.tester@pickmetalk.dev";
  const password = env.TEST_USER_PASSWORD ?? "DemoPass123!";
  const base = process.argv[2] ?? "https://pickmetalk.com";

  const jar: { name: string; value: string }[] = [];
  const server = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return jar;
      },
      setAll(cookies) {
        for (const c of cookies) {
          const i = jar.findIndex((x) => x.name === c.name);
          if (!c.value) {
            if (i >= 0) jar.splice(i, 1);
          } else if (i >= 0) jar[i] = { name: c.name, value: c.value };
          else jar.push({ name: c.name, value: c.value });
        }
      },
    },
  });

  const browser = createClient(url, anon);
  const { data, error } = await browser.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.session) throw new Error(error?.message ?? "login fail");

  await server.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  const cookie = jar.map((c) => `${c.name}=${c.value}`).join("; ");
  const res = await fetch(`${base}/chat/yuna`, {
    headers: { Cookie: cookie },
    redirect: "follow",
  });
  const html = await res.text();

  const chunkUrls = [...html.matchAll(/\/_next\/static\/chunks\/[^"']+/g)].map(
    (m) => m[0]
  );

  let bundleText = html;
  for (const path of chunkUrls.slice(0, 12)) {
    try {
      const r = await fetch(`${base}${path}`);
      bundleText += await r.text();
    } catch {
      /* ignore */
    }
  }

  const report = {
    base,
    status: res.status,
    deployedAtHint: res.headers.get("age"),
    hasOldLoadingText: bundleText.includes("대화 불러오는"),
    hasFirstGreetText: bundleText.includes("첫 인사"),
    hasReplyWaitingPlaceholder: bundleText.includes("답변 작성 중"),
  };

  console.log(JSON.stringify(report, null, 2));
  if (report.hasOldLoadingText) {
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
