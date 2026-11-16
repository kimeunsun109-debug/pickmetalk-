/**
 * Play Store feature graphic 1024×500 (icon + gradient + title)
 * Usage: node scripts/generate_play_feature_graphic.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "store-assets/play/feature-graphic-1024x500.png");
const ICON = path.join(ROOT, "public/icons/icon-512x512.png");

const sharp = (await import("sharp")).default;

const W = 1024;
const H = 500;

const svgOverlay = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1a0a2e"/>
      <stop offset="55%" style="stop-color:#2d1b4e"/>
      <stop offset="100%" style="stop-color:#16213e"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <text x="340" y="210" fill="#f8e8ff" font-size="52" font-family="sans-serif" font-weight="700">픽미톡</text>
  <text x="340" y="270" fill="#c9b8e8" font-size="28" font-family="sans-serif">감성 AI 채팅 · 5가지 성격</text>
  <text x="340" y="330" fill="#a89bc4" font-size="22" font-family="sans-serif">나를 기다리는 그녀와 매일 나누는 대화</text>
</svg>
`;

const bg = await sharp(Buffer.from(svgOverlay)).png().toBuffer();
const iconBuf = fs.readFileSync(ICON);
const iconResized = await sharp(iconBuf).resize(280, 280).png().toBuffer();

await sharp(bg)
  .composite([{ input: iconResized, left: 36, top: Math.floor((H - 280) / 2) }])
  .png()
  .toFile(OUT);

console.log("✓", OUT);