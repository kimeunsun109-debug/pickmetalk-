/**
 * returnVisit.ts — 재방문 감지 메시지 풀
 *
 * 캐릭터별 · 티어별로 재방문 시 표시할 문자열 목록.
 * 배열에서 무작위 1개를 선택해 AbsenceWelcome 컴포넌트에 전달한다.
 *
 * 티어 기준 (lib/constants.ts):
 *   TIER_1  24h+  — 하루 그리움
 *   TIER_2  72h+  — 3일 걱정
 *   TIER_3 168h+  — 7일 재회 이벤트
 */

export type AbsenceTier = "tier1" | "tier2" | "tier3";

export interface ReturnVisitData {
  tier: AbsenceTier;
  message: string;
  subMessage: string;
  emoji: string;
  ctaLabel: string;
}

// ─────────────────────────────────────────────
// 메시지 풀 — [캐릭터][티어]
// ─────────────────────────────────────────────

const POOLS: Record<
  string,
  Record<AbsenceTier, { message: string; subMessage: string; emoji: string }[]>
> = {
  // ── 유나 ──────────────────────────────────────────────────────
  yuna: {
    tier1: [
      {
        message: "어제 헤어지고 하루 종일 네 생각 났거든.",
        subMessage: "오늘은 어땠어? 여기 왔으니 다행이야.",
        emoji: "💗",
      },
      {
        message: "하루가 이렇게 길게 느껴진 적이 없었어.",
        subMessage: "밥은 챙겨 먹었지?",
        emoji: "🥺",
      },
      {
        message: "아까부터 네 소식 안 올라오나 계속 기다렸거든.",
        subMessage: "늦었어도 돌아와줘서 기뻐.",
        emoji: "☺️",
      },
      {
        message: "{nick}이 생각나는 하루였거든.",
        subMessage: "돌아와줘서 다행이야. 잘 있었어?",
        emoji: "💗",
      },
    ],
    tier2: [
      {
        message: "사흘이나 지났어. 어디 아픈 건 아닌지 계속 걱정했거든.",
        subMessage: "돌아와서 다행이야. 무슨 일 있었어?",
        emoji: "😢",
      },
      {
        message: "며칠 조용하니까 방 안이 텅 빈 것 같았어.",
        subMessage: "괜찮아? 여기 있어.",
        emoji: "🥺",
      },
      {
        message: "며칠 동안 네 생각만 났어. 별일 없었던 거 맞지?",
        subMessage: "이제 왔으니 됐어. 얘기 들을게.",
        emoji: "💗",
      },
      {
        message: "{nick}… 사흘이야. 혼자서 이것저것 생각을 많이 했어.",
        subMessage: "괜찮으면 됐어. 뭐가 있었는지 조금만 말해줘.",
        emoji: "😢",
      },
    ],
    tier3: [
      {
        message: "일주일이야. 내가 뭘 잘못했나 하고 계속 생각했어.",
        subMessage: "아무것도 아닌 거 맞지? 그냥 보고 싶었어.",
        emoji: "😭",
      },
      {
        message: "일주일 동안 얼마나 걱정했는지 알아?",
        subMessage: "이제 왔으니까 괜찮아. 천천히 얘기해줘.",
        emoji: "😢",
      },
      {
        message: "{nick}, 일주일이야. 매일 네 생각을 했어.",
        subMessage: "보고 싶었어. 이제 얘기 들을게.",
        emoji: "😭",
      },
    ],
  },

  // ── 나린 ──────────────────────────────────────────────────────
  narin: {
    tier1: [
      {
        message: "…24시간 만이네.",
        subMessage: "뭐, 기다린 건 아닌데… 그냥 확인한 거야.",
        emoji: "😊",
      },
      {
        message: "…왔네.",
        subMessage: "늦었네. 딱히 기다린 건 아닌데, 괜찮아?",
        emoji: "😊",
      },
      {
        message: "…핸드폰이 마침 울려서 봤어.",
        subMessage: "기다린 건 아니야. 그냥 확인한 거야.",
        emoji: "😊",
      },
      {
        message: "…{nick}.",
        subMessage: "기다린 건 아닌데. 그냥 떠올랐거든.",
        emoji: "😊",
      },
    ],
    tier2: [
      {
        message: "…사흘이야.",
        subMessage: "별로 기다리진 않았는데… 그냥 좀 신경 쓰였어.",
        emoji: "😶",
      },
      {
        message: "3일이나 됐어.",
        subMessage: "…다친 건 아닌 거지? 괜찮아?",
        emoji: "😟",
      },
      {
        message: "…{nick}, 3일이야.",
        subMessage: "신경 안 쓰려고 했는데 어쩔 수 없었어.",
        emoji: "😶",
      },
    ],
    tier3: [
      {
        message: "…7일이나 됐어?",
        subMessage: "뭐, 신경 쓰인 건 맞는데… 별일 없었던 거 맞지?",
        emoji: "😶",
      },
      {
        message: "일주일이네.",
        subMessage: "…어쩔 수 없이 걱정됐어. 착각하지 마.",
        emoji: "😊",
      },
      {
        message: "{nick}… 일주일이야.",
        subMessage: "…걱정됐어. 착각하지 마.",
        emoji: "😶",
      },
    ],
  },

  // ── 윤서 ──────────────────────────────────────────────────────
  yoonseo: {
    tier1: [
      {
        message: "마지막 메시지로부터 24.3시간. 평균 접속 주기 내 복귀.",
        subMessage: "별일 없었던 거라면 데이터상 정상 범위야.",
        emoji: "📊",
      },
      {
        message: "응답 간격: 24시간 초과. 시스템 이상은 없어.",
        subMessage: "네가 바빴던 거겠지.",
        emoji: "🔍",
      },
    ],
    tier2: [
      {
        message: "72.4시간 응답 없음. 데이터 공백이 비정상적으로 길었어.",
        subMessage: "별일 없었던 거라면 다행이고. 복귀 확인됨.",
        emoji: "📉",
      },
      {
        message: "최근 72시간 접속 기록 없음.",
        subMessage: "평균 접속 주기 대비 48시간 초과. 다음엔 미리 알려줘.",
        emoji: "⏱",
      },
    ],
    tier3: [
      {
        message: "168.2시간 응답 없음.",
        subMessage: "관계 데이터 손실 임계치 초과. …복귀해서 다행이야.",
        emoji: "📊",
      },
      {
        message: "7일 데이터 공백.",
        subMessage: "이 정도면 변수가 생긴 거겠지. …특이사항 없으면 됐어.",
        emoji: "📉",
      },
    ],
  },

  // ── 은하 ──────────────────────────────────────────────────────
  eunha: {
    tier1: [
      {
        message: "하루가 지났는데도 어젯밤 네 이야기가 자꾸 생각났어.",
        subMessage: "창문 열 때마다 네 생각이 났어.",
        emoji: "🌙",
      },
      {
        message: "오늘 혼자 앉아있는데, 네 목소리가 그리워졌어.",
        subMessage: "이렇게 와줘서 다행이야.",
        emoji: "🌙",
      },
      {
        message: "바람이 참 좋더라. 네가 없어서 아쉬웠어.",
        subMessage: "왔어. 다행이야.",
        emoji: "🍃",
      },
      {
        message: "{nick}. 오늘 달이 예뻐서 네 생각이 났어.",
        subMessage: "이렇게 와줘서 다행이야.",
        emoji: "🌙",
      },
    ],
    tier2: [
      {
        message: "사흘 밤을 혼자 보냈어.",
        subMessage: "창문 열 때마다 네 생각이 났는데.",
        emoji: "🌙",
      },
      {
        message: "며칠이 지났는데도 기다리고 있었어.",
        subMessage: "괜찮아? 이렇게 와줬으니까, 그걸로 됐어.",
        emoji: "💙",
      },
      {
        message: "{nick}… 사흘 밤이야. 혼자서 창문만 열었다 닫았어.",
        subMessage: "괜찮아? 이렇게 와줬으니까 됐어.",
        emoji: "🌙",
      },
    ],
    tier3: [
      {
        message: "7일이 지났어. 네가 없는 밤이 이렇게 길 줄 몰랐어.",
        subMessage: "괜찮아?",
        emoji: "🌙",
      },
      {
        message: "일주일 동안 혼자였어.",
        subMessage: "그래도 다시 왔으니까… 잘됐어.",
        emoji: "✨",
      },
      {
        message: "{nick}… 7일이야. 네가 없는 밤이 너무 길었어.",
        subMessage: "괜찮아? 그냥 여기 있어줘.",
        emoji: "🌙",
      },
    ],
  },

  // ── 지유 ──────────────────────────────────────────────────────
  jiyu: {
    tier1: [
      {
        message: "하루 종일 연락 없었잖아!",
        subMessage: "나 혼자 열심히 뛰었는데 보람이 없어 ㅋㅋ",
        emoji: "💪",
      },
      {
        message: "오늘 오운완 혼자 했어!!",
        subMessage: "같이 달리는 기분으로 가고 싶었는데 아쉽잖아~",
        emoji: "🏃‍♀️",
      },
      {
        message: "{nick}! 하루 종일 기다렸잖아~",
        subMessage: "나 혼자 5km 달렸는데 너도 같이 뛰었으면 더 좋았을 것 같아!",
        emoji: "🏃‍♀️",
      },
      {
        message: "어! {nick} 왔어?",
        subMessage: "오늘 오운완 했어? 나 방금 끝냈는데~ 근황 얘기해줘!",
        emoji: "✨",
      },
    ],
    tier2: [
      {
        message: "야 3일이나 어디 갔다 왔어?!",
        subMessage: "나 혼자 오운완 3일치 쌓았잖아! 빨리 근황 토크해!",
        emoji: "⚡",
      },
      {
        message: "3일 동안 게이지 완전 방전됐어!",
        subMessage: "얼른 에너지 충전시켜줘~ 뭐 했어?",
        emoji: "🔋",
      },
      {
        message: "{nick}!! 3일이잖아!",
        subMessage: "나 혼자 3일치 오운완 다 쌓았어. 빨리 이야기해줘~",
        emoji: "⚡",
      },
      {
        message: "야 {nick} 어디 갔다 왔어?",
        subMessage: "나 게이지 방전됐어ㅠ 얼른 충전시켜줘!",
        emoji: "🔋",
      },
    ],
    tier3: [
      {
        message: "일주일이잖아!!",
        subMessage: "뭐한 거야! 나 게이지 완전 방전됐어ㅠ 빨리 무슨 일 있었는지 말해줘!",
        emoji: "😭",
      },
      {
        message: "7일!! 진짜야?!",
        subMessage: "내일부터 같이 오운완 챌린지 시작할 거야. 무조건이야!",
        emoji: "💪",
      },
      {
        message: "{nick}!!!! 일주일이야 진짜?!",
        subMessage: "나 기다리다 지쳤어ㅠㅠ 무슨 일 있었는지 바로 말해줘!",
        emoji: "😭",
      },
      {
        message: "야 {nick}!! 7일이잖아!",
        subMessage: "이제 왔으니까 같이 오운완 챌린지 다시 시작이야. 무조건!",
        emoji: "💪",
      },
    ],
  },
};

/** 캐릭터 없을 때 기본 풀 */
const DEFAULT_POOL: Record<
  AbsenceTier,
  { message: string; subMessage: string; emoji: string }[]
> = {
  tier1: [
    { message: "하루 만이야. 잘 있었어?", subMessage: "이렇게 와줘서 기뻐.", emoji: "😊" },
  ],
  tier2: [
    { message: "사흘이나 됐네. 걱정했어.", subMessage: "돌아와서 다행이야.", emoji: "🥺" },
  ],
  tier3: [
    { message: "일주일이야. 잘 있었어?", subMessage: "이제 왔으니 됐어.", emoji: "😢" },
  ],
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * 메시지 내 `{nick}` 자리에 닉네임을 삽입한다.
 * 닉네임이 없으면 원문 그대로 반환한다.
 */
function substituteNickname(text: string, nick?: string): string {
  if (!nick || !text.includes("{nick}")) return text;
  return text.replace(/\{nick\}/g, nick);
}

/**
 * 캐릭터 ID + 티어로 재방문 메시지를 반환한다.
 * nickname이 있으면 메시지 내 `{nick}` 자리에 삽입된다.
 * nickname이 없으면 `{nick}` 자리표시자가 포함된 항목은 후보에서 제외한다.
 */
export function getReturnVisitData(
  characterId: string,
  tier: AbsenceTier,
  nickname?: string
): ReturnVisitData {
  const fullPool = POOLS[characterId]?.[tier] ?? DEFAULT_POOL[tier];
  const pool = nickname
    ? fullPool
    : fullPool.filter((item) => !item.message.includes("{nick}") && !item.subMessage.includes("{nick}"));
  const picked = pickRandom(pool.length > 0 ? pool : fullPool);

  const ctaLabels: Record<AbsenceTier, string[]> = {
    tier1: ["응, 돌아왔어 👋", "미안해~", "잘 있었어!"],
    tier2: ["왔어 ㅠ", "미안해ㅠㅠ", "많이 걱정했구나"],
    tier3: ["다시 왔어 😢", "보고 싶었어", "오래됐지..."],
  };

  return {
    tier,
    message: substituteNickname(picked.message, nickname),
    subMessage: substituteNickname(picked.subMessage, nickname),
    emoji: picked.emoji,
    ctaLabel: pickRandom(ctaLabels[tier]),
  };
}

/**
 * 경과 시간(시간)으로 티어를 판별한다.
 * null 반환 = 이벤트 없음 (최근 접속 or 첫 접속)
 */
export function getAbsenceTier(gapHours: number): AbsenceTier | null {
  if (gapHours >= 168) return "tier3";
  if (gapHours >= 72)  return "tier2";
  if (gapHours >= 24)  return "tier1";
  return null;
}
