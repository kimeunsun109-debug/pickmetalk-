#!/usr/bin/env npx tsx
/**
 * Backfill conversations.last_message_preview / last_message_role from messages.
 * Run after migration 007 when previews are empty.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { truncatePreview } from "../lib/formatMessageTime";

const ROOT = resolve(import.meta.dirname, "..");
const BATCH = 50;

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

  const { data: convs, error } = await sb
    .from("conversations")
    .select("id, user_id")
    .or("last_message_preview.is.null,last_message_role.is.null");

  if (error) {
    console.error("FAIL list:", error.message);
    process.exit(1);
  }

  const targets = convs ?? [];
  console.log(`Backfill targets: ${targets.length}`);
  if (targets.length === 0) {
    console.log(JSON.stringify({ ok: true, updated: 0 }));
    return;
  }

  let updated = 0;

  for (let i = 0; i < targets.length; i += BATCH) {
    const batch = targets.slice(i, i + BATCH);
    const ids = batch.map((c) => c.id);

    const { data: rows, error: msgErr } = await sb
      .from("messages")
      .select("conversation_id, content, role, created_at")
      .in("conversation_id", ids)
      .in("role", ["user", "assistant"])
      .order("created_at", { ascending: false })
      .limit(ids.length * 4);

    if (msgErr) {
      console.error("FAIL messages:", msgErr.message);
      process.exit(1);
    }

    const latest = new Map<
      string,
      { content: string; role: string; created_at: string }
    >();
    for (const row of rows ?? []) {
      const cid = row.conversation_id as string;
      if (!cid || latest.has(cid)) continue;
      latest.set(cid, {
        content: row.content as string,
        role: row.role as string,
        created_at: row.created_at as string,
      });
    }

    await Promise.all(
      batch.map(async (conv) => {
        const hit = latest.get(conv.id);
        if (!hit) return;
        const { error: upErr } = await sb
          .from("conversations")
          .update({
            last_message_preview: truncatePreview(hit.content, 200),
            last_message_role: hit.role,
            last_message_at: hit.created_at,
          })
          .eq("id", conv.id)
          .eq("user_id", conv.user_id);
        if (!upErr) updated += 1;
      })
    );
  }

  const { count } = await sb
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .not("last_message_preview", "is", null);

  console.log(
    JSON.stringify({ ok: true, updated, withPreviewTotal: count ?? 0 })
  );
}

main();
