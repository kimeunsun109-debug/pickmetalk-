/**
 * scripts/generate-icons.mjs
 *
 * Node.js 스크립트로 PWA 아이콘 SVG 파일을 생성합니다.
 *
 * 실행: node scripts/generate-icons.mjs
 *
 * 📌 실제 배포 전에는 Figma/Illustrator에서 만든 실제 PNG로 교체해야 합니다.
 *    빠른 방법: https://realfavicongenerator.net 에 512x512 PNG 업로드 → 자동 생성
 *
 * 이 스크립트는 SVG → PNG 변환 없이 SVG 파일을 아이콘 경로에 저장합니다.
 * (PNG가 필요한 경우 아래 sharp 패키지 사용 섹션 참고)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ICONS_DIR = path.join(__dirname, "../public/icons");

const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

/** 핑크 하트 SVG 아이콘 템플릿 */
function makeSvg(size) {
  const r = size / 2;
  const heart = size * 0.55;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${r * 0.22}" fill="#FF8FAB"/>
  <text x="50%" y="54%" font-size="${heart}" text-anchor="middle" dominant-baseline="middle" font-family="Apple Color Emoji, Segoe UI Emoji, sans-serif">💗</text>
</svg>`;
}

fs.mkdirSync(ICONS_DIR, { recursive: true });

for (const size of SIZES) {
  const svgPath = path.join(ICONS_DIR, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, makeSvg(size), "utf-8");
  console.log(`✓ icon-${size}x${size}.svg`);
}

console.log("\n⚠️  SVG 아이콘이 생성되었습니다.");
console.log("   PWA manifest는 PNG를 요구합니다.");
console.log("   PNG 변환 방법:");
console.log("   1) https://realfavicongenerator.net 에 512x512 이미지 업로드");
console.log("   2) 또는: npm install -D sharp  →  scripts/png-convert.mjs 실행\n");
