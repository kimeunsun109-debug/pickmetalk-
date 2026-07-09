import type { Message } from "@/types";

/** 상대가 정정·반박·장난을 던진 순간 */
export type ChatMomentKind =
  | "correction"
  | "banter"
  | "absurd"
  | "none";

const CORRECTION_PATTERN =
  /ㅡㅡ|ㅜㅜ.*아니|아니야|아닌데|틀렸|맞아\?|뭐야|헐|거짓|착각|폭염|말도\s?안|그건\s?아니|반대|덥.*잖|춥.*잖/i;

const BANTER_PATTERN =
  /안녕|ㅎㅇ|하이|ㅋㅋ|ㅎㅎ|장난|놀리|속았|어이|야~|뭐하|심심/i;

const ABSURD_PATTERN = /치매|술\s?먹|폭염|39도|40도|얼어|녹아/i;

export function detectChatMoment(
  userMessage: string,
  recent: Message[] = []
): ChatMomentKind {
  const msg = userMessage.trim();
  if (!msg) return "none";

  const lastAssistant = [...recent]
    .reverse()
    .find((m) => m.role === "assistant")?.content;

  if (CORRECTION_PATTERN.test(msg)) {
    if (
      lastAssistant &&
      /춥|추워|따뜻|덥|더워|날씨|기온|우산|비\s?온/i.test(lastAssistant)
    ) {
      return "correction";
    }
    if (/아니|틀렸|맞아\?|ㅡㅡ|착각|뭐야/i.test(msg)) {
      return "correction";
    }
  }

  if (ABSURD_PATTERN.test(msg) && BANTER_PATTERN.test(msg)) {
    return "banter";
  }

  if (BANTER_PATTERN.test(msg) && msg.length <= 40) {
    return "banter";
  }

  return "none";
}

/**
 * 실수·당황·가벼운 티키타카 순간 — 센스 있게 받아치라는 맥락만 준다 (대사 예시 복붙 금지).
 */
export function buildMomentContextBlock(
  userMessage: string,
  recent: Message[] = []
): string {
  const moment = detectChatMoment(userMessage, recent);
  if (moment === "none") return "";

  if (moment === "correction") {
    return [
      "[지금 이 순간 — 말실수·정정]",
      "네가 방금 틀리거나 엇나간 말을 했고, 상대가 바로잡았다.",
      "뻣뻣한 '아 맞다 미안'·'착각했네' 한 줄로 끝내지 마라.",
      "친구 카톡하듯 센스 있게 받아쳐라: 가벼운 자기비하, 드립, ㅋㅋ, 황당함 인정.",
      "성격(자기소개서) 안에서 새로운 말을 만든다. 정해진 멘트를 복사하지 않는다.",
    ].join("\n");
  }

  if (moment === "banter") {
    return [
      "[지금 이 순간 — 가벼운 티키타카]",
      "인사·장난·가벼운 말투다. 딱딱하게 받지 말고 센스 있게 맞받아쳐라.",
      "재치·리액션·짧은 드립 OK. 상대를 무시하거나 교훈적으로 말하지 않는다.",
    ].join("\n");
  }

  return [
    "[지금 이 순간 — 황당·에피소드]",
    "웃긴·황당한 흐름이면 분위기를 살려라. 진지한 설명체보다 친구 톤.",
  ].join("\n");
}
