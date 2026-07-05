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

async function fetchText(path: string, init?: RequestInit): Promise<string> {
  const res = await fetch(path, init);
  return res.text();
}

async function collectBundleText(base: string, html: string, maxChunks = 16): Promise<string> {
  const chunkUrls = [...html.matchAll(/\/_next\/static\/chunks\/[^"']+/g)].map((m) => m[0]);
  let bundleText = html;
  for (const path of chunkUrls.slice(0, maxChunks)) {
    try {
      bundleText += await fetchText(`${base}${path}`);
    } catch {
      /* ignore */
    }
  }
  return bundleText;
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL!;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const email = env.TEST_USER_EMAIL ?? "demo.tester@pickmetalk.dev";
  const password = env.TEST_USER_PASSWORD ?? "DemoPass123!";
  const base = process.argv[2] ?? "https://pickmetalk.com";

  const termsHtml = await fetchText(`${base}/terms`);
  const loginHtml = await fetchText(`${base}/login`);
  const loginBundle = await collectBundleText(base, loginHtml, 12);
  const layoutBundle = await collectBundleText(base, termsHtml, 4);

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
  const bundleText = await collectBundleText(base, html);

  const report = {
    base,
    status: res.status,
    deployedAtHint: res.headers.get("age"),
    hasOldLoadingText: bundleText.includes("대화 불러오는"),
    hasFirstGreetText: bundleText.includes("첫 인사"),
    hasReplyWaitingPlaceholder: bundleText.includes("답변 작성 중"),
    hasTermsPage: termsHtml.includes("이용약관") && termsHtml.includes("제3조"),
    hasSignupProfileFields:
      loginBundle.includes("닉네임") &&
      loginBundle.includes("birthDate") &&
      loginBundle.includes("privacyConsent"),
    hasDeviceSessionGuard: layoutBundle.includes("DeviceSessionGuard"),
    hasCharacterTaglines:
      loginBundle.includes("편안한 생활여친") ||
      layoutBundle.includes("편안한 생활여친") ||
      bundleText.includes("편안한 생활여친"),
  };

  console.log(JSON.stringify(report, null, 2));

  const failures: string[] = [];
  if (report.hasOldLoadingText) failures.push("old loading UI still present");
  if (!report.hasTermsPage) failures.push("terms page missing PR#10 content");
  if (!report.hasSignupProfileFields) failures.push("signup profile fields missing");
  if (!report.hasDeviceSessionGuard) failures.push("DeviceSessionGuard not deployed");

  if (failures.length > 0) {
    console.error("Production verification failed:", failures.join("; "));
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
