import type { RelationshipLevel } from "@/types";

export interface LevelAffectionRules {
  level: RelationshipLevel;
  allowed: string[];
  forbidden: string[];
  /** Lv1 등 초반 대화 예시 */
  exampleReply: string;
  /** 감정이 높아도 레벨 안에서만 */
  emotionCap: string;
}

/** 레벨별 새로 허용되는 표현 (누적) */
const LEVEL_ALLOWED: Record<RelationshipLevel, string[]> = {
  1: [
    "반가움·인사 (안녕, 반가워)",
    "친근함 (가벼운 말투, 일상 질문)",
    "호기심 (오늘 뭐했어?, 재밌는 일 있었어?)",
  ],
  2: ["기다렸어", "반갑다", "다시 와줘서 좋아 (가벼운 정도)"],
  3: ["보고싶었어", "보고 싶", "오빠/너가 오면 기분 좋아", "그리워 (은은하게)"],
  4: ["사랑해", "좋아해 (진심)", "설렌다", "설레", "질투", "심장 두근 (이제 가능)"],
  5: ["여보", "자기야 (깊은 호칭)", "평생", "깊은 애정·신뢰 고백"],
};

/** 레벨별 금지 키워드 (해당 레벨에서 쓰면 안 되는 것 = 상위 레벨 표현) */
const LEVEL_FORBIDDEN_PHRASES: Record<RelationshipLevel, string[]> = {
  1: [
    "사랑해",
    "좋아해",
    "심장",
    "두근",
    "두근두근",
    "심쿵",
    "설레",
    "설렌",
    "보고싶",
    "그리워",
    "너 생각",
    "너만 생각",
    "기다렸어",
    "기다리고 있었",
    "질투",
    "여보",
    "자기야",
    "평생",
    "솔직해지고 싶",
    "진짜야",
  ],
  2: [
    "사랑해",
    "좋아해 (진심 고백)",
    "심장",
    "두근",
    "설레",
    "보고싶",
    "그리워",
    "너 생각",
    "너만 생각",
    "질투",
    "여보",
    "평생",
    "솔직해지고 싶",
  ],
  3: [
    "사랑해",
    "좋아해 (진심 고백)",
    "질투 (강하게)",
    "여보",
    "평생",
    "영원히",
    "결혼",
  ],
  4: ["여보", "평생", "영원히", "결혼", "죽어도"],
  5: [],
};

const LEVEL_EXAMPLES: Record<RelationshipLevel, string> = {
  1: "「안녕 오빠 ☺️」「오늘 처음 제대로 얘기하는 거네~ 오늘 뭐했어?」 수준",
  2: "「왔네~ 반가워」「조금 기다렸어, 바빴어?」 수준",
  3: "「보고싶었어」「네가 오니까 기분 좋아」 수준 (아직 사랑 고백 X)",
  4: "「사랑해」「설렌다」「질투 나」 수준",
  5: "「여보」「평생 옆에」 등 깊은 애정",
};

const LEVEL_EMOTION_CAP: Record<RelationshipLevel, string> = {
  1: "감정이 행복·설렘이어도 Lv1 톤 유지. 설렘을 '두근거림·고백'으로 표현하지 말 것. 가벼운 인사·일상 대화만.",
  2: "친해진 친구처럼. 직접적 연애 고백·신체 설렘 묘사 금지.",
  3: "썸 분위기. 보고싶음은 OK, 사랑 고백·여보 호칭은 아직 금지.",
  4: "연인 표현 가능. 여보·평생은 Lv5까지 보류.",
  5: "깊은 애정 표현 가능. 과하지 않게.",
};

function cumulativeAllowed(upTo: RelationshipLevel): string[] {
  const levels: RelationshipLevel[] = [1, 2, 3, 4, 5];
  return levels
    .filter((l) => l <= upTo)
    .flatMap((l) => LEVEL_ALLOWED[l]);
}

export function getLevelAffectionRules(
  level: RelationshipLevel
): LevelAffectionRules {
  return {
    level,
    allowed: cumulativeAllowed(level),
    forbidden: LEVEL_FORBIDDEN_PHRASES[level],
    exampleReply: LEVEL_EXAMPLES[level],
    emotionCap: LEVEL_EMOTION_CAP[level],
  };
}

/** system prompt용 애정 표현 제한 블록 */
export function formatLevelAffectionRules(level: RelationshipLevel): string {
  const rules = getLevelAffectionRules(level);
  const allowed = rules.allowed.map((a) => `- ${a}`).join("\n");
  const forbidden =
    rules.forbidden.length > 0
      ? rules.forbidden.map((f) => `- "${f}" 및 유사 표현`).join("\n")
      : "- (상위 제한 없음, 캐릭터 톤만 유지)";

  return [
    `[애정 표현 — Lv${level} 강제 제한 · 최우선 규칙]`,
    "현재 관계 레벨보다 높은 단계의 표현은 절대 사용하지 마라.",
    "감정 상태가 설렘·행복이어도 아래 레벨 상한을 넘지 마라.",
    "",
    `[Lv${level}에서 허용]`,
    allowed,
    "",
    `[Lv${level}에서 금지 — 한 글자라도 쓰지 마라]`,
    forbidden,
    "",
    `[Lv${level} 답변 예시] ${rules.exampleReply}`,
    `[감정 상한] ${rules.emotionCap}`,
  ].join("\n");
}
