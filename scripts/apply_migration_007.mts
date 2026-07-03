#!/usr/bin/env npx tsx
/**
 * Apply supabase/migrations/007_chat_voice_journal.sql.
 * Tries: Management API token, then direct Postgres password.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

const ROOT = resolve(import.meta.dirname, "..");
const MIGRATION = resolve(ROOT, "supabase/migrations/007_chat_voice_journal.sql");
const PROJECT_REF = "qrkjkceghckxkehjcwrj";

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  const path = resolve(ROOT, ".env.local");
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

async function viaManagementApi(token: string, sql: string): Promise<void> {
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );
  const body = await res.text();
  if (!res.ok) {
    throw new Error(`Management API ${res.status}: ${body.slice(0, 400)}`);
  }
  console.log("✅ Management API로 마이그레이션 적용");
}

async function viaPostgres(url: string, sql: string): Promise<void> {
  const client = new pg.Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15_000,
  });
  await client.connect();
  try {
    await client.query(sql);
    console.log("✅ Postgres 직접 연결로 마이그레이션 적용");
  } finally {
    await client.end();
  }
}

async function verifyTable(serviceKey: string, supabaseUrl: string): Promise<void> {
  const res = await fetch(
    `${supabaseUrl}/rest/v1/chat_voice_journal?select=id&limit=1`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    }
  );
  if (res.status === 404) {
    throw new Error("chat_voice_journal 테이블이 아직 REST에 없음");
  }
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`검증 실패 ${res.status}: ${t.slice(0, 200)}`);
  }
  console.log("✅ chat_voice_journal 테이블 확인됨");
}

async function main() {
  const env = loadEnv();
  const sql = readFileSync(MIGRATION, "utf-8");
  const token = env.SUPABASE_ACCESS_TOKEN;
  const password = env.SUPABASE_DB_PASSWORD ?? env.DATABASE_PASSWORD;
  const dbUrl =
    env.DATABASE_URL ??
    (password
      ? `postgresql://postgres:${encodeURIComponent(password)}@db.${PROJECT_REF}.supabase.co:5432/postgres`
      : "");

  if (token) {
    await viaManagementApi(token, sql);
  } else if (dbUrl) {
    await viaPostgres(dbUrl, sql);
  } else {
    console.error(
      "마이그레이션 자동 적용에 인증 정보가 필요합니다.\n\n" +
        "방법 1 — Access Token (권장):\n" +
        "  1) https://supabase.com/dashboard/account/tokens 에서 토큰 생성\n" +
        "  2) .env.local 에 SUPABASE_ACCESS_TOKEN=... 추가\n" +
        "  3) npx tsx scripts/apply_migration_007.mts\n\n" +
        "방법 2 — DB 비밀번호:\n" +
        "  Project Settings → Database → SUPABASE_DB_PASSWORD in .env.local\n\n" +
        "방법 3 — SQL Editor:\n" +
        "  /sql/new → 007_chat_voice_journal.sql 붙여넣기 → Run"
    );
    process.exit(1);
  }

  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  if (serviceKey && supabaseUrl) {
    await new Promise((r) => setTimeout(r, 2000));
    await verifyTable(serviceKey, supabaseUrl);
  }
}

main().catch((e) => {
  console.error("마이그레이션 실패:", e instanceof Error ? e.message : e);
  process.exit(1);
});
