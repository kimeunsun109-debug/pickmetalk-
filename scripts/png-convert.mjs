/**
 * scripts/png-convert.mjs
 *
 * SVG → PNG 일괄 변환 (sharp 사용)
 *
 * 사전 설치: npm install -D sharp
 * 실행:      node scripts/png-convert.mjs
 *
 * 또는 진짜 디자인 파일이 있다면:
 *   node scripts/png-convert.mjs --source=./my-icon.png
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = path.join(__dirname, "../public/icons");
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("❌ sharp 패키지가 없습니다. 먼저 실행하세요:");
  console.error("   npm install -D sharp");
  process.exit(1);
}

// 소스 SVG (512x512 기준으로 리사이즈)
const SOURCE_SVG = path.join(ICONS_DIR, "icon-512x512.svg");

if (!fs.existsSync(SOURCE_SVG)) {
  console.error("❌ icon-512x512.svg 가 없습니다. 먼저 실행하세요:");
  console.error("   node scripts/generate-icons.mjs");
  process.exit(1);
}

const svgBuffer = fs.readFileSync(SOURCE_SVG);

for (const size of SIZES) {
  const outPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);
  await sharp(svgBuffer).resize(size, size).png().toFile(outPath);
  console.log(`✓ icon-${size}x${size}.png (${size}px)`);
}

console.log("\n✅ PNG 아이콘 생성 완료!");
console.log("   public/icons/ 폴더를 확인하세요.\n");
