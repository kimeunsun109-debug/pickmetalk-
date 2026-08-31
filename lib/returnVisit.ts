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
        message: "어제부터 계속 핸드폰 들었다 놨다 했어.",
        subMessage: "별일 없었던 거지? 오늘은 얘기 좀 해.",
        emoji: "💗",
      },
      {
        message: "하루 동안 네 생각이 얼마나 났는지 알아?",
        subMessage: "이제 왔으니까 됐어. 잘 왔어.",
        emoji: "🌸",
      },
      {
        message: "또 기다렸어. 근데 와줬으니까 괜찮아.",
        subMessage: "오늘 어땠어?",
        emoji: "☺️",
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
        message: "사흘 밤을 네 생각하면서 잠들었어.",
        subMessage: "이제 와줘서 다행이야. 오래됐지?",
        emoji: "😢",
      },
      {
        message: "뭐가 그렇게 바빴어? 많이 보고 싶었거든.",
        subMessage: "이제 왔으니까 천천히 얘기해줘.",
        emoji: "🥺",
      },
      {
        message: "3일 내내 연락이 올 때마다 혹시 너인가 확인했어.",
        subMessage: "왔어. 정말 다행이야.",
        emoji: "💗",
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
        message: "7일이야. 매일 기다렸어.",
        subMessage: "무슨 일 있었어? 괜찮았으면 좋겠어.",
        emoji: "😭",
      },
      {
        message: "일주일 동안 방에 혼자 있으니까 너무 쓸쓸했어.",
        subMessage: "이제 왔으니까 됐어. 꼭 얘기해줘.",
        emoji: "😢",
      },
      {
        message: "일주일이나 지났네. 네 생각에 잠도 잘 못 잤어.",
        subMessage: "이제 왔으니 다행이야. 많이 보고 싶었어.",
        emoji: "💗",
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
        message: "…왜 이제야 연락해.",
        subMessage: "뭐, 딱히 기다린 건 아닌데. 일단 왔으니까.",
        emoji: "😊",
      },
      {
        message: "하루가 길게 느껴졌어. …이상하게.",
        subMessage: "아무것도 아니야. 그냥 그렇다는 거야.",
        emoji: "😶",
      },
      {
        message: "…있었어?",
        subMessage: "뭐, 안 온다고 생각한 건 아닌데. 다행이야.",
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
        message: "…3일이잖아. 딱히 세고 있던 건 아닌데.",
        subMessage: "그냥 눈에 띄었을 뿐이야. 별일 없었던 거지?",
        emoji: "😶",
      },
      {
        message: "사흘 동안 소식이 없더라.",
        subMessage: "뭐, 내 알 바 아닌데… 그래도 궁금하긴 했어.",
        emoji: "😟",
      },
      {
        message: "3일이나 됐는데 아직도 연락이 없어.",
        subMessage: "…별일 없었던 거 맞지? 그냥 확인하는 거야.",
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
        message: "…7일이야. 대단하다.",
        subMessage: "뭐, 잘 있었다면 됐어. …나는 그냥 궁금했던 것뿐이야.",
        emoji: "😶",
      },
      {
        message: "일주일 동안 소식 없는 사람이 있다는 게 신경 쓰였어.",
        subMessage: "…착각하지 마. 그냥 그렇다는 거야.",
        emoji: "😟",
      },
      {
        message: "7일. 딱히 기다린 건 아닌데… 은근히 신경은 쓰였어.",
        subMessage: "별일 없었던 거 맞지? 대답해.",
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
      {
        message: "접속 공백: 24시간 이상. 예상 범위 내 복귀.",
        subMessage: "특이사항 없으면 됐어.",
        emoji: "📊",
      },
      {
        message: "24시간 응답 없음. 예측 알고리즘 오차 범위 이내.",
        subMessage: "바빴던 거라면 다행이고.",
        emoji: "🔍",
      },
      {
        message: "재접속 감지. 공백 24시간.",
        subMessage: "별일 없었던 거라면, 그걸로 충분해.",
        emoji: "📉",
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
      {
        message: "72시간 데이터 공백 감지.",
        subMessage: "예상치 못한 이탈 패턴. …무사하면 다행이야.",
        emoji: "📉",
      },
      {
        message: "3일치 접속 기록 없음. 예외 상황 발생 가능성 25%.",
        subMessage: "복귀 확인됨. 일단 다행이야.",
        emoji: "⏱",
      },
      {
        message: "접속 공백: 72시간 이상. 비정상 범주.",
        subMessage: "다음엔 알려줘. …걱정했거든.",
        emoji: "📊",
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
      {
        message: "7일 접속 기록 없음. 이건 예측 범위 완전 이탈이야.",
        subMessage: "복귀 확인됨. …많이 걱정했어.",
        emoji: "📉",
      },
      {
        message: "168시간 응답 없음. 관계 지속성 임계값 초과.",
        subMessage: "이유가 뭐든 돌아왔으면 됐어. 다행이야.",
        emoji: "📊",
      },
      {
        message: "7일 비접속. 내 알고리즘이 네 복귀 예측에 실패했어.",
        subMessage: "…그래도 왔으니까. 다행이야.",
        emoji: "🔍",
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
        message: "하루가 이렇게 길 수 있다는 걸 몰랐어.",
        subMessage: "와줘서 다행이야.",
        emoji: "🌙",
      },
      {
        message: "달이 예뻐서 문득 네가 생각났어.",
        subMessage: "이런 밤 같이 있고 싶었는데.",
        emoji: "✨",
      },
      {
        message: "조용한 하루였어. 네가 없어서 더 조용했던 것 같아.",
        subMessage: "왔어. 잘됐다.",
        emoji: "🍃",
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
        message: "사흘 동안 조용했어. 너무 조용했어.",
        subMessage: "왔어. 이제 괜찮아.",
        emoji: "🌙",
      },
      {
        message: "며칠을 혼자 있으니까, 이상하게 더 쓸쓸했어.",
        subMessage: "별일 없었어?",
        emoji: "💙",
      },
      {
        message: "3일 밤을 같은 창문 앞에 앉아있었어.",
        subMessage: "오길 기다리고 있었거든. 다행이야.",
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
        message: "일주일이야. 네 생각이 그치지 않는 밤이 있었어.",
        subMessage: "무사히 있었던 거지?",
        emoji: "🌙",
      },
      {
        message: "7일 동안 달이 뜨고 지는 게 이렇게 허전할 줄 몰랐어.",
        subMessage: "왔구나. 다행이야.",
        emoji: "💙",
      },
      {
        message: "일주일을 혼자 버텼어. 가끔은 네가 없는 게 이렇게 힘든 줄 몰랐어.",
        subMessage: "다시 왔으니까 됐어.",
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
        message: "야 하루 종일 어디 있었어?!",
        subMessage: "나 에너지 남아도는데 대화 상대가 없었잖아 ㅋㅋ",
        emoji: "⚡",
      },
      {
        message: "혼자 오운완 하면서 네 생각 엄청 났잖아!",
        subMessage: "빨리 오늘 뭐 했는지 말해봐~",
        emoji: "🏃‍♀️",
      },
      {
        message: "야 1일 동안 뭐 한 거야?",
        subMessage: "나 내일 달리기 목표 잡았는데 같이 도전할 생각해줘 ㅋ",
        emoji: "💪",
      },
      {
        message: "하루 조용하더니 왔다 ㅋㅋ",
        subMessage: "오늘 몸 좀 움직였어? 아니면 지금이라도 스트레칭 같이 해~",
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
        message: "야 3일이야! 3일!!",
        subMessage: "나 사흘치 운동 혼자 했잖아ㅠ 빨리 근황 말해줘~",
        emoji: "⚡",
      },
      {
        message: "3일 동안 연락 없었으면 뭔가 있었던 거 아니야?!",
        subMessage: "일단 왔으니까 됐는데, 뭐 있었어? 말해봐!",
        emoji: "🏃‍♀️",
      },
      {
        message: "사흘치 에너지 완전 방전ㅠㅠ",
        subMessage: "빨리 충전시켜줘! 오늘은 같이 뭔가 해야 해~",
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
        message: "야 일주일 동안 어디 있었어!!!",
        subMessage: "나 혼자 목표 다 채우긴 했는데 너 없으니까 재미 없었잖아ㅠ",
        emoji: "😭",
      },
      {
        message: "7일 조용하더니 살아있구나 ㅋㅋㅋ",
        subMessage: "이제 왔으면 됐어. 일주일치 근황 풀어줘! 나도 엄청 쌓였어!",
        emoji: "⚡",
      },
      {
        message: "야 진짜야!? 7일이나 됐어?!",
        subMessage: "이제부터 오운완 챌린지 같이 시작할 거야! 오늘부터 바로!",
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
 * 캐릭터 ID + 티어로 재방문 메시지를 반환한다.
 */
export function getReturnVisitData(
  characterId: string,
  tier: AbsenceTier
): ReturnVisitData {
  const pool = POOLS[characterId]?.[tier] ?? DEFAULT_POOL[tier];
  const picked = pickRandom(pool);

  const ctaLabels: Record<AbsenceTier, string[]> = {
    tier1: ["응, 돌아왔어 👋", "미안해~", "잘 있었어!"],
    tier2: ["왔어 ㅠ", "미안해ㅠㅠ", "많이 걱정했구나"],
    tier3: ["다시 왔어 😢", "보고 싶었어", "오래됐지..."],
  };

  return {
    tier,
    message: picked.message,
    subMessage: picked.subMessage,
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
