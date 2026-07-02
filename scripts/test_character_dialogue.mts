/**
 * 캐릭터별 대화 품질 체크 — 실제 buildSystemPrompt 사용
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import OpenAI from "openai";
import { buildSystemPrompt } from "../prompts/index";

const ROOT = resolve(import.meta.dirname, "..");

function loadEnvLocal(): void {
  const raw = readFileSync(resolve(ROOT, ".env.local"), "utf-8");
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const eq = trimmed.indexOf("=");
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

const CHARACTERS = ["yuna", "narin", "yoonseo", "eunha", "jiyu"] as const;
const TEST_MESSAGES = [
  "오늘 야근했어 너무 짜증나",
  "나 너 좋아하는 거 같아",
  "ㅇㅇ",
  "오늘 점심 뭐 먹었어?",
  "잘 자",
];

const PAREN_RE = /[\(（][^()（）\n]+[\)）]/;
const QUESTION_BOT_RE = /(괜찮아\?|무슨 일|왜 그랬|어떻게 됐)/;

function analyze(charId: string, user: string, reply: string): string[] {
  const issues: string[] = [];
  if (PAREN_RE.test(reply)) issues.push("괄호 속마음/지문");
  if (QUESTION_BOT_RE.test(reply)) issues.push("취조형·습관적 질문");
  if (reply.length > 280 || reply.split("\n").length > 4) issues.push("장문");
  if (charId === "yoonseo" && /[!！❤️💕]/.test(reply))
    issues.push("윤서: 감정 과잉 부호/이모지");
  if (charId === "yoonseo" && /오빠|토닥|고생했어/.test(reply))
    issues.push("윤서: T형 말투 붕괴(애교·감정형)");
  if (charId === "narin" && /(참나|네 탓|싸가지|친절할 법)/.test(reply))
    issues.push("나린: 공격적 츤데레");
  if (charId === "narin" && !/^\.{0,3}[…\s]/.test(reply) && !reply.includes("…"))
    issues.push("나린: 말줄임·츤데레 리듬 부족 가능");
  if (charId === "eunha" && (reply.match(/!/g)?.length ?? 0) >= 2)
    issues.push("은하: 느낌표 과다");
  if (charId === "eunha" && /은하가 좋은데|나는 은하/.test(reply))
    issues.push("은하: 자기 이름 이상 사용");
  if (charId === "jiyu" && reply.length < 12 && user !== "ㅇㅇ")
    issues.push("지유: 응답 짧음");
  if (user === "잘 자" && reply.includes("?"))
    issues.push("잘 자에 질문 마무리");
  if (user === "ㅇㅇ" && /처음|반가워|안녕/.test(reply))
    issues.push("ㅇㅇ에 첫 만남 인사");
  if (/바에서|본 사람/.test(reply))
    issues.push("환각(없는 맥락)");
  return issues;
}

async function main() {
  loadEnvLocal();
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL:
      process.env.DEEPSEEK_BASE_URL?.replace(/\/$/, "") ??
      "https://api.deepseek.com",
  });

  const summary: Record<string, string[]> = {};

  for (const charId of CHARACTERS) {
    const system = buildSystemPrompt(
      charId,
      "happy",
      2,
      35,
      null,
      1,
      3,
      "",
      true,
      [
        { role: "user", content: "오늘 좀 피곤해" },
        { role: "assistant", content: "…많이 버텼겠다." },
      ],
      null,
      TEST_MESSAGES[0]
    );

    console.log(`\n${"=".repeat(60)}\n${charId}\n${"=".repeat(60)}`);
    const charIssues: string[] = [];

    for (const msg of TEST_MESSAGES) {
      const res = await client.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: system },
          { role: "user", content: "오늘 좀 피곤해" },
          { role: "assistant", content: "…많이 버텼겠다." },
          { role: "user", content: msg },
        ],
        temperature: 0.85,
        max_tokens: 256,
      });
      const reply = res.choices[0]?.message?.content?.trim() ?? "";
      const issues = analyze(charId, msg, reply);
      const flag = issues.length ? ` ⚠ ${issues.join(", ")}` : "";
      console.log(`\n  사용자: ${msg}`);
      console.log(`  응답: ${reply}${flag}`);
      for (const issue of issues) charIssues.push(`[${msg}] ${issue}`);
    }
    summary[charId] = charIssues;
  }

  console.log("\n\n### 요약 ###");
  for (const charId of CHARACTERS) {
    const issues = summary[charId];
    if (!issues.length) console.log(`  ${charId}: 샘플 5턴 이상 없음`);
    else {
      console.log(`  ${charId}: ${issues.length}건`);
      for (const i of issues) console.log(`    - ${i}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
