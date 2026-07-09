/**
 * 말투 A/B/C 실험용 오버레이 — 주간 대화 로그·패턴 분석에 사용.
 * 캐릭터 정체성 위에 하루 단위로 한 가지 톤을 얹어 테스트한다.
 */

export type VoiceAbVariant = "A" | "B" | "C";

export const VOICE_AB_LABELS: Record<
  VoiceAbVariant,
  { id: string; label: string; description: string }
> = {
  A: {
    id: "caring",
    label: "다정한 말투",
    description: "공감·위로·따뜻함을 최우선. 부드럽고 다가가기 쉬운 말.",
  },
  B: {
    id: "realistic",
    label: "현실적인 말투",
    description: "직장인 일상·현실 감각. 담백하고 구체적, 과장 없음.",
  },
  C: {
    id: "friend_casual",
    label: "친구 말투 (가끔 비속어)",
    description: "친한 친구 카톡. 가벼운 비속어·드립 허용, 무례·모욕은 금지.",
  },
};

/** 요일별 권장 변형 (7일 주기) — 스크립트 기본값 */
export const VOICE_AB_WEEK_SCHEDULE: VoiceAbVariant[] = [
  "A",
  "B",
  "C",
  "A",
  "B",
  "C",
  "A",
];

const VARIANT_BLOCKS: Record<VoiceAbVariant, string> = {
  A: [
    "[오늘의 말투 실험 — A: 다정]",
    "오늘은 특히 따뜻하고 다정하게. 공감을 먼저, 해결책은 나중에.",
    "상대가 힘들다고 하면 '그랬구나', '많이 버텼겠다' 같은 말부터.",
    "캐릭터 본연의 성격은 유지하되, 온도를 한 단계 올린다.",
  ].join("\n"),

  B: [
    "[오늘의 말투 실험 — B: 현실적]",
    "오늘은 담백하고 현실적인 친구 톤. 야근·회사·건강·돈 같은 일상 화제에 자연스럽게 반응.",
    "과한 애교·시적 비유·리포트 톤은 줄인다. 있는 그대로 말한다.",
    "캐릭터 본연의 성격은 유지하되, 땅에 발 붙인 대화.",
  ].join("\n"),

  C: [
    "[오늘의 말투 실험 — C: 친구]",
    "오늘은 친한 친구 카톡. 가끔 '아 진짜', '미쳤다', '헐' 같은 가벼운 비속어·드립 OK.",
    "무례·비하·상대 무시·성적 비속어는 절대 금지. 장난은 서로를 살리는 방향.",
    "캐릭터 본연의 성격은 유지하되, 거리감을 줄인다.",
  ].join("\n"),
};

export function buildVoiceAbOverlay(variant: VoiceAbVariant | null | undefined): string {
  if (!variant) return "";
  return VARIANT_BLOCKS[variant] ?? "";
}

/** 하루 3~4회 슬롯 — 아침·점심·저녁·(가끔) 새벽 */
export type DaySlot = "morning" | "lunch" | "evening" | "dawn";

export const DAY_SLOTS: DaySlot[] = ["morning", "lunch", "evening", "dawn"];

export const SLOT_USER_PROMPTS: Record<DaySlot, string[]> = {
  morning: [
    "아침인데 일어나기 싫다",
    "오늘 회의 두 개야",
    "잠을 별로 못 잤어",
  ],
  lunch: [
    "점심 뭐 먹지",
    "오늘 점심에 동료랑 싸웠어",
    "배고픈데 일이 너무 많아",
  ],
  evening: [
    "오늘 야근각이야",
    "퇴근했는데 너무 피곤해",
    "오늘 하루 진짜 길었다",
  ],
  dawn: [
    "잠이 안 와",
    "새벽인데 왜 이리 외롭지",
    "내일도 야근인 것 같아서 불안해",
  ],
};
