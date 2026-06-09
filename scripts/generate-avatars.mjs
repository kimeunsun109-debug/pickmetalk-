/**
 * scripts/generate-avatars.mjs
 *
 * 배포 전 실제 캐릭터 아바타 이미지가 없을 때 사용하는 SVG 플레이스홀더 생성기.
 *
 * 실행: node scripts/generate-avatars.mjs
 *
 * 📌 실제 배포 전에는 디자이너/AI 이미지 생성 도구로 만든 PNG로 교체해야 합니다.
 *    권장 사이즈: 400x400px (정사각형, 얼굴 중심)
 *    저장 경로:  public/avatars/{character_id}.png
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../public/avatars");

const CHARACTERS = [
  {
    id: "yuna",
    name: "유나",
    color: "#FF8FAB",
    bg: "#FFF0F5",
    emoji: "☺️",
    desc: "따뜻하고 다정한 유나",
  },
  {
    id: "narin",
    name: "나린",
    color: "#A78BFA",
    bg: "#F5F0FF",
    emoji: "😑",
    desc: "츤데레 나린",
  },
  {
    id: "yoonseo",
    name: "윤서",
    color: "#60A5FA",
    bg: "#F0F5FF",
    emoji: "🔍",
    desc: "냉정 분석가 윤서",
  },
  {
    id: "eunha",
    name: "은하",
    color: "#818CF8",
    bg: "#F0F0FF",
    emoji: "🌙",
    desc: "감성적인 은하",
  },
  {
    id: "jiyu",
    name: "지유",
    color: "#34D399",
    bg: "#F0FFF8",
    emoji: "⚡",
    desc: "활기찬 지유",
  },
];

fs.mkdirSync(OUT_DIR, { recursive: true });

for (const c of CHARACTERS) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">
  <!-- 배경 -->
  <rect width="400" height="400" rx="200" fill="${c.bg}"/>
  <!-- 원형 테두리 -->
  <circle cx="200" cy="200" r="196" fill="none" stroke="${c.color}" stroke-width="8" opacity="0.4"/>
  <!-- 이니셜 배경 원 -->
  <circle cx="200" cy="175" r="90" fill="${c.color}" opacity="0.15"/>
  <!-- 이모지 (폴백 텍스트) -->
  <text x="200" y="195" font-size="90" text-anchor="middle" dominant-baseline="middle"
        font-family="Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji, sans-serif">${c.emoji}</text>
  <!-- 이름 -->
  <text x="200" y="310" font-size="36" font-weight="700" text-anchor="middle"
        font-family="Noto Sans KR, Malgun Gothic, sans-serif" fill="${c.color}">${c.name}</text>
  <!-- 설명 -->
  <text x="200" y="348" font-size="16" text-anchor="middle"
        font-family="Noto Sans KR, Malgun Gothic, sans-serif" fill="${c.color}" opacity="0.6">${c.desc}</text>
</svg>`;

  const outPath = path.join(OUT_DIR, `${c.id}.svg`);
  fs.writeFileSync(outPath, svg, "utf-8");
  console.log(`✓ ${c.id}.svg — ${c.name}`);
}

console.log("\n📌 PNG 변환이 필요하다면:");
console.log("   node scripts/png-convert.mjs --source=avatars");
console.log("\n✅ 아바타 SVG 플레이스홀더 생성 완료!");
