/**
 * test_gifts.mts — 선물 카탈로그·호감도·반응 생성 검증
 *
 * 실행: npx tsx scripts/test_gifts.mts
 */

import {
  applyGiftAffection,
  buildGiftReaction,
  getGiftById,
  getGiftCatalog,
} from "../services/gifts";

let passed = 0;
let failed = 0;

function test(desc: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    console.log(`  ✓ ${desc}`);
    passed++;
  } else {
    console.error(`  ✗ ${desc}`);
    console.error(`    expected: ${JSON.stringify(expected)}`);
    console.error(`    actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`  ✓ ${desc}`);
    passed++;
  } else {
    console.error(`  ✗ ${desc}`);
    failed++;
  }
}

console.log("\n[1] gift catalog");

const catalog = getGiftCatalog();
assert(catalog.length >= 3, `catalog has ${catalog.length} gifts (>= 3)`);
assert(
  catalog.every((gift) => gift.affectionBonus > 0),
  "every gift has positive affectionBonus"
);

console.log("\n[2] getGiftById");

test("coffee exists", getGiftById("coffee")?.name, "커피");
test("unknown gift", getGiftById("missing"), undefined);

console.log("\n[3] applyGiftAffection");

test(
  "clamps at max 100",
  applyGiftAffection(95, 12),
  { affection: 100, relationshipLevel: 5 }
);
test(
  "adds bonus within range",
  applyGiftAffection(10, 5),
  { affection: 15, relationshipLevel: 1 }
);

console.log("\n[4] buildGiftReaction");

for (const characterId of ["yuna", "narin", "yoonseo", "eunha", "jiyu"]) {
  const gift = getGiftById("coffee");
  if (!gift) throw new Error("coffee gift missing");
  const reaction = buildGiftReaction(characterId, gift);
  assert(reaction.message.length > 0, `${characterId}: reaction message`);
  assert(
    reaction.affectionBonus === gift.affectionBonus,
    `${characterId}: affectionBonus matches gift`
  );
  assert(
    reaction.emotion === "happy" || reaction.emotion === "excited",
    `${characterId}: emotion is happy or excited`
  );
}

const necklace = getGiftById("necklace");
if (necklace) {
  test(
    "high bonus gift → excited",
    buildGiftReaction("yuna", necklace).emotion,
    "excited"
  );
}

console.log("\n[5] deterministic reaction");

const coffee = getGiftById("coffee");
if (coffee) {
  const first = buildGiftReaction("yuna", coffee);
  const second = buildGiftReaction("yuna", coffee);
  test("same character+gift → same message", first.message, second.message);
}

console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
console.log(`결과: ${passed} passed, ${failed} failed (총 ${passed + failed}개)`);

if (failed > 0) {
  process.exit(1);
}
