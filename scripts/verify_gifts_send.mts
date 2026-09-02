#!/usr/bin/env npx tsx
/**
 * Gifts API integration smoke test (local dev).
 * Usage: npx tsx scripts/verify_gifts_send.mts [baseUrl]
 */
import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env } as Record<string, string>;
  for (const path of [".env.local", ".env"]) {
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf-8").split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#") || !t.includes("=")) continue;
      const eq = t.indexOf("=");
      env[t.slice(0, eq).trim()] = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    }
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !anon || !service) {
    throw new Error("Supabase env vars required");
  }

  const email = env.TEST_USER_EMAIL ?? "tester@pickme.local";
  const password = env.TEST_USER_PASSWORD ?? "test1234!";
  const base = process.argv[2] ?? "http://localhost:3000";

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
  const { data, error } = await browser.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) {
    throw new Error(error?.message ?? "login failed");
  }

  await server.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  const userId = data.user.id;
  const admin = createClient(url, service);
  const characterId = "yuna";

  const { data: convRows } = await admin
    .from("conversations")
    .select("id, affection")
    .eq("user_id", userId)
    .eq("character_id", characterId)
    .order("updated_at", { ascending: false })
    .limit(1);

  let conversationId = convRows?.[0]?.id as string | undefined;
  let beforeAffection = (convRows?.[0]?.affection as number | undefined) ?? 0;

  if (!conversationId) {
    const { data: created, error: createErr } = await admin
      .from("conversations")
      .insert({
        user_id: userId,
        character_id: characterId,
        title: "선물 테스트",
      })
      .select("id, affection")
      .single();
    if (createErr || !created) throw new Error(createErr?.message ?? "conversation create failed");
    conversationId = created.id as string;
    beforeAffection = (created.affection as number) ?? 0;
  }

  const cookie = jar.map((c) => `${c.name}=${c.value}`).join("; ");
  const res = await fetch(`${base}/api/gifts/send`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      characterId,
      giftId: "coffee",
      conversationId,
    }),
  });

  const body = (await res.json()) as {
    error?: string;
    affection?: number;
    messageId?: string;
    reaction?: { message: string; affectionBonus: number };
  };

  if (!res.ok) {
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  const expectedAffection = Math.min(100, beforeAffection + 5);
  if (body.affection !== expectedAffection) {
    throw new Error(`affection mismatch: got ${body.affection}, expected ${expectedAffection}`);
  }
  if (!body.messageId || !body.reaction?.message) {
    throw new Error("missing messageId or reaction");
  }

  const { data: logs, error: logErr } = await admin
    .from("gift_logs")
    .select("gift_id, affection_delta")
    .eq("user_id", userId)
    .eq("character_id", characterId)
    .eq("gift_id", "coffee")
    .order("created_at", { ascending: false })
    .limit(1);

  if (logErr || !logs?.length) {
    throw new Error(logErr?.message ?? "gift_logs row missing");
  }
  if (logs[0].affection_delta !== 5) {
    throw new Error(`gift_logs affection_delta=${logs[0].affection_delta}`);
  }

  const { data: msg } = await admin
    .from("messages")
    .select("content, role")
    .eq("id", body.messageId)
    .maybeSingle();

  if (!msg || msg.role !== "assistant") {
    throw new Error("assistant message not saved");
  }

  console.log("✅ gifts send integration OK");
  console.log(`   conversation=${conversationId}`);
  console.log(`   affection ${beforeAffection} → ${body.affection}`);
  console.log(`   reaction: ${body.reaction.message.slice(0, 60)}…`);
}

main().catch((e) => {
  console.error("❌", e instanceof Error ? e.message : e);
  process.exit(1);
});
