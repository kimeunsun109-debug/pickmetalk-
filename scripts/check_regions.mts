#!/usr/bin/env npx tsx
/**
 * Vercel·Supabase 리전 정합성 및 RTT 측정
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  const path = resolve(ROOT, ".env.local");
  if (!existsSync(path)) return env;
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const eq = t.indexOf("=");
    env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

async function timedFetch(label: string, url: string, init?: RequestInit) {
  const t0 = performance.now();
  const res = await fetch(url, init);
  await res.arrayBuffer();
  const ms = Math.round(performance.now() - t0);
  return { label, ms, status: res.status };
}

async function main() {
  const env = loadEnv();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const token = env.SUPABASE_ACCESS_TOKEN;
  const ref = supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

  let supabaseRegion = "unknown";
  let projectName = "";

  if (token && ref) {
    const res = await fetch(`https://api.supabase.com/v1/projects/${ref}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const j = (await res.json()) as { region?: string; name?: string };
      supabaseRegion = j.region ?? "unknown";
      projectName = j.name ?? "";
    }
  }

  const samples: { label: string; ms: number; status: number }[] = [];
  if (supabaseUrl && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    for (let i = 0; i < 5; i++) {
      samples.push(
        await timedFetch(
          "Supabase REST",
          `${supabaseUrl}/rest/v1/`,
          { headers: { apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY } }
        )
      );
    }
  }

  const avg =
    samples.length > 0
      ? Math.round(samples.reduce((s, x) => s + x.ms, 0) / samples.length)
      : null;

  console.log(
    JSON.stringify(
      {
        supabase: {
          project: projectName || ref,
          region: supabaseRegion,
          regionLabel:
            supabaseRegion === "ap-northeast-2" ? "Seoul (AWS)" : supabaseRegion,
        },
        vercel: {
          recommended: "icn1",
          recommendedLabel: "Seoul",
          configuredInRepo: "vercel.json → regions: [icn1]",
        },
        regionMatch:
          supabaseRegion === "ap-northeast-2"
            ? "OK — Vercel icn1과 Supabase 서울 리전 매칭 권장"
            : "CHECK — 리전 수동 확인 필요",
        rttFromThisHost: {
          samples: samples.map((s) => s.ms),
          avgMs: avg,
          note:
            "Cloud VM/로컬 RTT ≠ Vercel Function RTT. Vercel icn1 배포 후 Function→Supabase가 50ms 내외 목표.",
        },
      },
      null,
      2
    )
  );
}

main();
