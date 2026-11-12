/**
 * Play 출시 사전 점검 (로컬 파일·설정만, Console/API 없음)
 * npx tsx scripts/verify_play_store_ready.mts
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let ok = 0;
let fail = 0;

function check(label: string, pass: boolean, detail?: string) {
  if (pass) {
    console.log(`  ✅ ${label}`);
    ok++;
  } else {
    console.error(`  ❌ ${label}${detail ? ` — ${detail}` : ""}`);
    fail++;
  }
}

const cap = readFileSync(path.join(ROOT, "capacitor.config.ts"), "utf8");
check(
  "capacitor default server is pickmetalk.com",
  cap.includes('DEFAULT_SERVER_URL = "https://pickmetalk.com"')
);

const manifest = readFileSync(
  path.join(ROOT, "android/app/src/main/AndroidManifest.xml"),
  "utf8"
);
check("AndroidManifest has INTERNET", manifest.includes("INTERNET"));

const gradle = readFileSync(
  path.join(ROOT, "android/app/build.gradle"),
  "utf8"
);
check(
  "applicationId com.pickmetalk.app",
  gradle.includes('applicationId "com.pickmetalk.app"')
);

const checklist = path.join(ROOT, "docs/launch/PLAY_STORE_CHECKLIST.md");
check("PLAY_STORE_CHECKLIST exists", readFileSync(checklist, "utf8").includes("pickmetalk.com/privacy"));

console.log(`\n${ok} passed, ${fail} failed`);
if (fail > 0) process.exit(1);
