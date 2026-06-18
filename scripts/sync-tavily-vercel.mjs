import fs from "node:fs";
import { execSync } from "node:child_process";

const env = fs.readFileSync(".env.local", "utf8");
const m = env.match(/^TAVILY_API_KEY=(.+)$/m);
const key = m?.[1]?.trim().replace(/^["']|["']$/g, "");
if (!key) {
  console.error("FAIL: .env.local에 TAVILY_API_KEY 없음");
  process.exit(1);
}

for (const envName of ["production", "preview", "development"]) {
  try {
    execSync(`npx vercel env rm tavilY_API_KEY ${envName} --yes`, {
      stdio: "pipe",
    });
    console.log(`removed typo tavilY_API_KEY from ${envName}`);
  } catch {
    /* 없으면 무시 */
  }
}

for (const envName of ["production", "preview", "development"]) {
  try {
    execSync(`npx vercel env rm TAVILY_API_KEY ${envName} --yes`, {
      stdio: "pipe",
    });
  } catch {
    /* 없으면 무시 */
  }
  execSync(`npx vercel env add TAVILY_API_KEY ${envName}`, {
    input: key,
    stdio: ["pipe", "inherit", "inherit"],
  });
  console.log(`OK: TAVILY_API_KEY → ${envName}`);
}
