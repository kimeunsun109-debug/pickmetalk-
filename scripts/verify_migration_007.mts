#!/usr/bin/env npx tsx
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
  const sb = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await sb
    .from("conversations")
    .select("id, last_message_preview, last_message_role")
    .limit(5);

  if (error) {
    console.error("FAIL:", error.message);
    process.exit(1);
  }

  const withPreview = (data ?? []).filter((r) => r.last_message_preview);
  console.log(
    JSON.stringify({
      ok: true,
      rowsSampled: data?.length ?? 0,
      withPreview: withPreview.length,
      sample: (data ?? []).slice(0, 2).map((r) => ({
        id: r.id,
        role: r.last_message_role,
        previewLen: r.last_message_preview?.length ?? 0,
      })),
    })
  );
}

main();
