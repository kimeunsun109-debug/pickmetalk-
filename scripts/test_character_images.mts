/**
 * test_character_images.mts — emotion portrait paths resolve to on-disk assets
 *
 * 실행: npx tsx scripts/test_character_images.mts
 */

import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  characterEmotionSrc,
  resolveCharacterEmotionAsset,
} from "../lib/characters/images";

const CHARACTERS = ["yuna", "narin", "yoonseo", "eunha", "jiyu"] as const;
const EMOTIONS = [
  "happy",
  "excited",
  "hurt",
  "pouty",
  "miss_you",
  "bored",
  "special_day",
] as const;

let passed = 0;
let failed = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`  ✓ ${desc}`);
    passed++;
  } else {
    console.error(`  ✗ ${desc}`);
    failed++;
  }
}

console.log("\n[1] miss_you maps to smile (not miss_you.jpg)");

for (const id of CHARACTERS) {
  assert(
    resolveCharacterEmotionAsset(id, "miss_you") === "smile",
    `${id} miss_you -> smile`
  );
}

console.log("\n[2] resolved paths exist under public/");

for (const id of CHARACTERS) {
  for (const emotion of EMOTIONS) {
    const src = characterEmotionSrc(id, emotion);
    const rel = src.replace(/^\//, "");
    const disk = join(process.cwd(), "public", rel);
    assert(existsSync(disk), `${id}+${emotion} -> ${rel}`);
    assert(!src.includes("miss_you"), `${id}+${emotion}: URL has no miss_you segment`);
  }
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`결과: ${passed} passed, ${failed} failed (총 ${passed + failed}개)`);

if (failed > 0) process.exit(1);
