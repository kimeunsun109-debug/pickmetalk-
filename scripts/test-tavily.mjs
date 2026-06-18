import fs from "node:fs";

const envPath = ".env.local";
if (!fs.existsSync(envPath)) {
  console.error("FAIL: .env.local 없음");
  process.exit(1);
}

/** @type {Record<string, string>} */
const env = {};
for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("=");
  if (i <= 0) continue;
  const k = t.slice(0, i).trim();
  let v = t.slice(i + 1).trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1);
  }
  env[k] = v;
}

const key = env.TAVILY_API_KEY;
if (!key) {
  console.error("FAIL: TAVILY_API_KEY 없음");
  process.exit(1);
}

console.log("OK: TAVILY_API_KEY 설정됨");

const res = await fetch("https://api.tavily.com/search", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    api_key: key,
    query: "서울 오늘 날씨",
    search_depth: "basic",
    max_results: 2,
    include_answer: true,
  }),
});

const data = await res.json();
if (!res.ok) {
  console.error("FAIL: Tavily HTTP", res.status, data.detail || data.error || "");
  process.exit(1);
}

console.log("OK: Tavily 검색 성공");
if (data.answer) console.log("요약:", String(data.answer).slice(0, 200));
const first = data.results?.[0];
if (first?.title) console.log("1건:", first.title.slice(0, 80));
