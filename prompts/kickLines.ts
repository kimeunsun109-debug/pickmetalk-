import closing from "@/data/kickLines/closing.json";
import comfort from "@/data/kickLines/comfort.json";
import flutter from "@/data/kickLines/flutter.json";
import joke from "@/data/kickLines/joke.json";
import lovingNag from "@/data/kickLines/loving_nag.json";
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

const PACKS: KickLinePack[] = [
  touching as KickLinePack,
  comfort as KickLinePack,
  flutter as KickLinePack,
  joke as KickLinePack,
  lovingNag as KickLinePack,
  wit as KickLinePack,
  closing as KickLinePack,
];

const BY_CATEGORY = Object.fromEntries(
  PACKS.map((p) => [p.category, p])
) as Record<KickLineCategory, KickLinePack>;

function pickRandom<T>(arr: T[]): T | null {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

/** 킥 문장 힌트 — 약 5% 확률 또는 종료·특수 상황 */
export function buildKickLineHint(options: {
  userMessage: string;
  turnCount: number;
}): string {
  const msg = options.userMessage.trim();
  const isClosing = /잘\s?자|나갈게|여기까지|다음에|바이|굿나잇|잘자/u.test(
    msg
  );

  let category: KickLineCategory | null = null;

  if (isClosing) {
    category = "closing";
  } else if (options.turnCount > 0 && options.turnCount % 20 === 0) {
    category = "touching";
  } else if (Math.random() < 0.05) {
    const pool: KickLineCategory[] = [
      "touching",
      "comfort",
      "flutter",
      "joke",
      "wit",
    ];
    category = pickRandom(pool)!;
  }

  if (!category) return "";

  const pack = BY_CATEGORY[category];
  const line = pickRandom(pack.lines);
  if (!line) return "";

  return [
    `[킥 문장 힌트 — ${pack.label} · 참고만, 그대로 복붙 금지]`,
    `이번 턴 분위기에 맞으면 아래 느낌을 살려 한마디: "${line}"`,
    "※ 킥 문장은 남발하지 말 것. 평범한 대화 80% + 센스 리액션 15% + 킥 5% 비율 유지.",
  ].join("\n");
}
