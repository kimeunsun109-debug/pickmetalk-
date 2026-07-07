#!/usr/bin/env npx tsx
/**
 * Apply 007_conversation_preview.sql via Supabase service role (PostgREST rpc or raw SQL).
 * Falls back gracefully if columns already exist.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

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

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const sql = readFileSync(
    resolve(ROOT, "supabase/migrations/007_conversation_preview.sql"),
    "utf-8"
  );

  const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  if (res.ok) {
    console.log("Migration applied via exec_sql");
    return;
  }

  const supabase = createClient(url, key);
  const { error: probe } = await supabase
    .from("conversations")
    .select("last_message_preview")
    .limit(1);

  if (!probe) {
    console.log("Columns already exist (last_message_preview selectable)");
    return;
  }

  console.warn(
    "Could not apply migration automatically. Run supabase/migrations/007_conversation_preview.sql in SQL Editor."
  );
  console.warn("PostgREST error:", await res.text());
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
