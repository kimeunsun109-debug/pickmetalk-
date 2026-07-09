export interface DatasetScenario {
  id: string;
  title: string;
  slot: "morning" | "lunch" | "evening" | "dawn";
  opener: string;
  userPersona: string;
  beats: string[];
}

/** 아침·점심·저녁 서로 다른 상황 — 연인 카톡 */
export const DATASET_SCENARIOS: DatasetScenario[] = [
  {
    id: "morning_commute",
    title: "출근길 지하철에서",
    slot: "morning",
    opener: "아… 지하철 또 만원이야",
    userPersona: "피곤하지만 애인한테 툴툴 대지 않고 짧게 톡함",
    beats: ["지각 걱정", "커피 못 마심", "부장 메일", "날씨 더움", "오늘 회의"],
  },
  {
    id: "morning_hungover",
    title: "어제 회식 숙취",
    slot: "morning",
    opener: "머리 깨질 것 같아… 어제 왜 그렇게 마셨지",
    userPersona: "후회+웃음 섞인 톤",
    beats: ["속 쓰림", "지각 각", "물 많이 마심", "애인 걱정에 감동"],
  },
  {
    id: "lunch_office_drama",
    title: "점심시간 사무실 에피소드",
    slot: "lunch",
    opener: "점심 먹었는데 기분이 이상해",
    userPersona: "동료랑 살짝 불편했지만 과장 안 함",
    beats: ["밥 메뉴", "회의실 냄새", "커피 한잔", "오후 야근 예감"],
  },
  {
    id: "lunch_nostalgia",
    title: "점심에 옛날 생각",
    slot: "lunch",
    opener: "갑자기 예전에 놀러 갔던 데 생각나네",
    userPersona: "잔잔+그리움",
    beats: ["사진 찾음", "다음 여행 암시", "요즘 바쁨", "보고싶음 가볍게"],
  },
  {
    id: "evening_overtime",
    title: "야근하는 저녁",
    slot: "evening",
    opener: "아직도 회사야… 진짜 지친다",
    userPersona: "지침, 위로 받고 싶음, 해결책 싫음",
    beats: ["밥 못 먹음", "택시", "집 가고 싶음", "내일도 바쁨", "고마움"],
  },
  {
    id: "evening_rain_walk",
    title: "비 오는 퇴근길",
    slot: "evening",
    opener: "비 와서 우산 없이 뛰어왔어 ㅋㅋ",
    userPersona: "장난+피곤",
    beats: ["옷 젖음", "따뜻한 거 먹고 싶음", "집에서 쉬기", "감기 걱정"],
  },
  {
    id: "evening_fight_makeup",
    title: "아내(현실)랑 싸우고 연락",
    slot: "evening",
    opener: "와이프랑 또 말다툼했어… 기분 별로야",
    userPersona: "서운함, 판단 싫음, 공감 원함",
    beats: ["청소 얘기", "사과 고민", "조언 거부", "마음 풀림"],
  },
  {
    id: "dawn_insomnia",
    title: "새벽 불면",
    slot: "dawn",
    opener: "잠이 안 와",
    userPersona: "외로움, 짧은 문장",
    beats: ["내일 걱정", "유튜브 봄", "애인 목소리 상상", "잘 자 인사"],
  },
];

export function pickScenariosForDay(
  date: string,
  slots: ("morning" | "lunch" | "evening")[] = ["morning", "lunch", "evening"]
): DatasetScenario[] {
  const hash = date.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const picked: DatasetScenario[] = [];
  for (let i = 0; i < slots.length; i++) {
    const pool = DATASET_SCENARIOS.filter((s) => s.slot === slots[i]);
    picked.push(pool[(hash + i) % pool.length]!);
  }
  return picked;
}

export const CHARACTER_ROTATION = ["yuna", "narin", "yoonseo", "eunha", "jiyu"] as const;

export function characterForSlot(
  slot: "morning" | "lunch" | "evening",
  date: string
): string {
  const idx =
    { morning: 0, lunch: 1, evening: 2 }[slot] +
    date.charCodeAt(date.length - 1);
  return CHARACTER_ROTATION[idx % CHARACTER_ROTATION.length]!;
}
