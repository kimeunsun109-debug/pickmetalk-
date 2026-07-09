#!/usr/bin/env npx tsx
/**
 * Supabase 마이그레이션 적용
 * 1) SUPABASE_ACCESS_TOKEN → supabase link + db push
 * 2) SUPABASE_DB_PASSWORD → 직접 SQL (pg)
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import pg from "pg";

const ROOT = resolve(import.meta.dirname, "..");

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  const p = resolve(ROOT, ".env.local");
  if (!existsSync(p)) return env;
  for (const line of readFileSync(p, "utf-8").split("\n")) {
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

function projectRef(url: string): string {
  const m = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  if (!m) throw new Error("NEXT_PUBLIC_SUPABASE_URL에서 project ref 추출 실패");
  return m[1]!;
}

async function pushViaPg(env: Record<string, string>): Promise<boolean> {
  const password = env.SUPABASE_DB_PASSWORD;
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!password || !url) return false;

  const ref = projectRef(url);
  const connectionString =
    env.SUPABASE_DB_URL ??
    `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`;

  const migrationsDir = resolve(ROOT, "supabase/migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("✅ Postgres 직접 연결");

  for (const file of files) {
    const sql = readFileSync(resolve(migrationsDir, file), "utf-8");
    console.log(`  적용: ${file}`);
    await client.query(sql);
  }

  await client.end();
  return true;
}

function pushViaCli(env: Record<string, string>): boolean {
  const token = env.SUPABASE_ACCESS_TOKEN;
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!token || !url) return false;

  const ref = projectRef(url);
  process.env.SUPABASE_ACCESS_TOKEN = token;

  const link = spawnSync(
    "npx",
    ["supabase", "link", "--project-ref", ref],
    { cwd: ROOT, stdio: "inherit", env: process.env }
  );
  if (link.status !== 0) return false;

  const push = spawnSync("npx", ["supabase", "db", "push"], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  return push.status === 0;
}

async function main() {
  const env = loadEnv();

  if (pushViaCli(env)) {
    console.log("\n✅ supabase db push 완료 (CLI)");
    process.exit(0);
  }

  try {
    if (await pushViaPg(env)) {
      console.log("\n✅ 마이그레이션 SQL 직접 적용 완료");
      process.exit(0);
    }
  } catch (e) {
    console.error("Postgres 직접 적용 실패:", e instanceof Error ? e.message : e);
  }

  console.error(`
❌ supabase db push 실패 — 아래 중 하나를 .env.local 또는 Cursor Secrets에 추가하세요:

  SUPABASE_ACCESS_TOKEN=...   (대시보드 → Account → Access Tokens)
  또는
  SUPABASE_DB_PASSWORD=...    (Project Settings → Database → password)

그 다음: npx tsx scripts/supabase_db_push.mts
`);
  process.exit(1);
}

main();
