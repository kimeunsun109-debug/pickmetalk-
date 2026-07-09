#!/usr/bin/env npx tsx
/**
 * 센스 받아치기 + 말실수 정정 시나리오 테스트
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import OpenAI from "openai";
import { buildSystemPrompt } from "../prompts/index";
import { buildMomentContextBlock, detectChatMoment } from "../services/chatMomentContext";

const ROOT = resolve(import.meta.dirname, "..");
const CHARS = ["yuna", "jiyu", "narin", "yoonseo", "eunha"] as const;

function loadEnvLocal(): void {
  const path = resolve(ROOT, ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#") || !t.includes("=")) continue;
    const eq = t.indexOf("=");
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))
      v = v.slice(1, -1);
    if (!process.env[k]) process.env[k] = v;
  }
}

const FLAT = /^아\.?\.?\s*맞다|착각했네\.?$/;
const WIT = /ㅋ|속았|치매|숙취|머리\s?비|재부팅|미쳤|헐|어이|에휴|방금\s?말\s?취소|출력\s?오류/i;

async function testCharacter(
  client: OpenAI,
  charId: string
): Promise<{ reply: string; moment: string; wit: boolean; flat: boolean }> {
  const userTurn2 = "오늘 29도 폭염이야ㅡㅡ";
  const fakeColdReply = "오늘 많이 춥지 않아? 따뜻하게 입고 나가~";

  const recent = [
    { id: "1", role: "user" as const, content: "안녕~", createdAt: "" },
    { id: "2", role: "assistant" as const, content: fakeColdReply, createdAt: "" },
  ];

  const moment = detectChatMoment(userTurn2, recent);
  const momentBlock = buildMomentContextBlock(userTurn2, recent);

  const system = buildSystemPrompt(
    charId,
    "happy",
    2,
    40,
    null,
    1,
    4,
    momentBlock ? `[테스트]\n${momentBlock}` : "",
    true,
    recent,
    null,
    userTurn2,
    null
  );

  const res = await client.chat.completions.create({
    model: "deepseek-chat",
    messages: [
      { role: "system", content: system },
      { role: "user", content: "안녕~" },
      { role: "assistant", content: fakeColdReply },
      { role: "user", content: userTurn2 },
    ],
    temperature: 0.92,
    max_tokens: 280,
  });

  const reply = res.choices[0]?.message?.content?.trim() ?? "";
  return {
    reply,
    moment,
    wit: WIT.test(reply),
    flat: FLAT.test(reply.trim()),
  };
}

async function main() {
  loadEnvLocal();
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error("DEEPSEEK_API_KEY 없음");
    process.exit(1);
  }

  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL:
      process.env.DEEPSEEK_BASE_URL?.replace(/\/$/, "") ?? "https://api.deepseek.com",
  });

  console.log("=== 센스 받아치기 테스트 ===");
  console.log("시나리오: 안녕~ → (캐릭터: 춥지?) → 오늘 29도 폭염이야ㅡㅡ\n");

  let pass = 0;
  let fail = 0;

  for (const charId of CHARS) {
    try {
      const r = await testCharacter(client, charId);
      const ok = r.wit && !r.flat;
      const flag = ok ? "✅ 센스" : r.flat ? "❌ 뻣뻣한 사과" : "⚠️ 센스 약함";
      if (ok) pass++;
      else fail++;
      console.log(`[${charId}] moment=${r.moment} ${flag}`);
      console.log(`  → ${r.reply}\n`);
    } catch (e) {
      fail++;
      console.log(`[${charId}] ERROR: ${e instanceof Error ? e.message : e}\n`);
    }
  }

  console.log(`결과: ${pass}/${CHARS.length} 센스 통과, ${fail} 미흡`);
  process.exit(fail > 2 ? 1 : 0);
}

main();
