import closing from "@/data/kickLines/closing.json";
import comfort from "@/data/kickLines/comfort.json";
import flutter from "@/data/kickLines/flutter.json";
import joke from "@/data/kickLines/joke.json";
import lovingNag from "@/data/kickLines/loving_nag.json";
import masterKick from "@/data/kickLines/master.json";
import touching from "@/data/kickLines/touching.json";
import wit from "@/data/kickLines/wit.json";

export type KickLineCategory =
  | "touching"
  | "comfort"
  | "flutter"
  | "joke"
  | "loving_nag"
  | "wit"
  | "closing";

interface KickLinePack {
  category: KickLineCategory;
  label: string;
  lines: string[];
}

interface MasterKickData {
  source?: string;
  generatedAt?: string | null;
  packs?: KickLinePack[];
}

const PACKS: KickLinePack[] = [
  touching as KickLinePack,
  comfort as KickLinePack,
  flutter as KickLinePack,
  joke as KickLinePack,
  lovingNag as KickLinePack,
  wit as KickLinePack,
  closing as KickLinePack,
];

function mergePacksWithMaster(
  basePacks: KickLinePack[],
  masterData: MasterKickData
): KickLinePack[] {
  const masterByCategory = new Map(
    (masterData.packs ?? []).map((p) => [p.category, p])
  );

  return basePacks.map((basePack) => {
    const masterPack = masterByCategory.get(basePack.category);
    if (!masterPack?.lines?.length) return basePack;

    const deduped = Array.from(
      new Set([...masterPack.lines, ...basePack.lines].map((v) => v.trim()).filter(Boolean))
    );
    return {
      category: basePack.category,
      label: masterPack.label || basePack.label,
      lines: deduped,
    };
  });
}

const FINAL_PACKS = mergePacksWithMaster(PACKS, masterKick as MasterKickData);

const BY_CATEGORY = Object.fromEntries(
  FINAL_PACKS.map((p) => [p.category, p])
) as Record<KickLineCategory, KickLinePack>;

function pickRandom<T>(arr: T[]): T | null {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 킥 문장 힌트 — 약 5% 확률 또는 종료·특수 상황 */
export function buildKickLineHint(options: {
  characterId: string;
  userMessage: string;
  turnCount: number;
}): string {
  const msg = options.userMessage.trim();
  const isClosing = /잘\s?자|나갈게|여기까지|다음에|바이|굿나잇|잘자/u.test(
    msg
  );

  let category: KickLineCategory | null = null;
  const isMomentumTurn = options.turnCount > 0 && options.turnCount % 6 === 0;
  const microKickChanceByCharacter: Record<string, number> = {
    yuna: 0.3,
    narin: 0.45,
    yoonseo: 0.2,
    eunha: 0.4,
    jiyu: 0.45,
  };
  const bigKickChanceByCharacter: Record<string, number> = {
    yuna: 0.03,
    narin: 0.04,
    yoonseo: 0.02,
    eunha: 0.04,
    jiyu: 0.03,
  };

  if (isClosing) {
    category = "closing";
  } else if (options.turnCount > 0 && options.turnCount % 30 === 0) {
    category = "touching";
  } else if (
    isMomentumTurn &&
    Math.random() < (microKickChanceByCharacter[options.characterId] ?? 0.35)
  ) {
    const pool: KickLineCategory[] = [
      "comfort",
      "flutter",
      "joke",
      "wit",
    ];
    category = pickRandom(pool)!;
  } else if (
    Math.random() < (bigKickChanceByCharacter[options.characterId] ?? 0.03)
  ) {
    category = pickRandom(["touching", "loving_nag"])!;
  }

  if (!category) return "";

  const pack = BY_CATEGORY[category];
  const line = pickRandom(pack.lines);
  if (!line) return "";

  return [
    `[킥 문장 힌트 — ${pack.label} · 참고만, 그대로 복붙 금지]`,
    `이번 턴 분위기에 맞으면 아래 느낌을 살려 한마디: "${line}"`,
    "※ 킥 문장은 모멘텀 턴에서만 가끔. 평범한 대화 80% + 모멘텀 20% 리듬 유지.",
  ].join("\n");
}
