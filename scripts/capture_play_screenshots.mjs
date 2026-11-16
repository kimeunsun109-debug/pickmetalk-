/**
 * Play Store phone screenshots (1080×1920) via headless Chromium.
 * Prereq: dev server on BASE_URL, test account exists.
 *   npm run dev
 *   node scripts/capture_play_screenshots.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../store-assets/play");

const BASE_URL = process.env.PLAYSHOT_BASE_URL || "https://pickmetalk.com";
const MODE = process.env.PLAYSHOT_MODE || (BASE_URL.includes("127.0.0.1") ? "local" : "public");
const EMAIL = process.env.PLAYSHOT_EMAIL || "tester@pickme.local";
const PASSWORD = process.env.PLAYSHOT_PASSWORD || "test1234!";

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch {
  console.error("Install: npx playwright install chromium");
  process.exit(1);
}

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  locale: "ko-KR",
});
const page = await context.newPage();

async function shot(name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage: false });
  const meta = await import("sharp").then((m) => m.default(file).metadata());
  console.log(`✓ ${name} (${meta.width}×${meta.height})`);
}

try {
  if (MODE === "public") {
    await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 120_000 });
    await page.waitForTimeout(1500);
    await shot("screenshot-01-home.png");

    await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle", timeout: 120_000 });
    await page.waitForTimeout(1500);
    await shot("screenshot-02-login.png");
  } else {
    await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.waitForFunction(
      () => {
        const btn = document.querySelector('form button[type="submit"]');
        return btn && !btn.disabled;
      },
      { timeout: 90_000 }
    );
    await page.waitForTimeout(500);
    await shot("screenshot-01-login.png");

    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL(/\/(characters|chat)/, { timeout: 60_000 });
    await page.waitForTimeout(1500);

    if (!page.url().includes("/characters")) {
      await page.goto(`${BASE_URL}/characters`, { waitUntil: "networkidle" });
    }
    await page.waitForTimeout(1000);
    await shot("screenshot-02-characters.png");

    const firstCard = page.locator('a[href*="/chat"]').first();
    if (await firstCard.count()) {
      await firstCard.click();
      await page.waitForURL(/\/chat/, { timeout: 30_000 });
      await page.waitForTimeout(2000);
      await shot("screenshot-03-chat.png");
    }
  }
} catch (e) {
  console.error("Capture failed:", e.message);
  process.exitCode = 1;
} finally {
  await browser.close();
}