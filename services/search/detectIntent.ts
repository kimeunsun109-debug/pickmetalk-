import type { SearchIntent } from "./types";

const CHITCHAT_ONLY =
  /^(?:ㅋ+|ㅎ+|ㅠ+|ㅜ+|응|네|예|ㅇㅇ|ㅇ|굿|ok|okay|고마워|감사)[.!?~ㅋㅎ\s]*$/iu;

const EMOTIONAL =
  /보고\s?싶|사랑해|힘들|슬프|외로|우울|짜증|미안해|그리워|설레|심심|재밌|웃겨/u;

const EXPLICIT_SEARCH =
  /검색해|검색\s?해|찾아봐|찾아\s?봐|알아봐|알아\s?봐|인터넷|구글/u;

const FACTUAL =
  /날씨|기온|미세머지|황사|강수|습도|우산|태풍|폭염|한파|영하|영상/u;

const FINANCE =
  /주식|코스피|코스닥|환율|금리|비트코인|코인|삼성전자|테슬라|나스닥|증시/u;

const INFO_ASK =
  /뭐야|뭔데|무슨|어떤|얼마|가격|시세|알려줘|알려주|가르쳐|추천해|방법|어떻게\s?해/u;

const CURRENT =
  /오늘|내일|모레|이번\s?주|최신|속보|뉴스|개장|마감|상영|개봉|일정/u;

const HAS_QUESTION = /[?？]|뭐야|뭔데|얼마|어떻게|무슨|알려/u;

function cleanQuery(text: string): string {
  return text
    .replace(/^(?:오빠|언니|야|어|음+|혹시)\s*/u, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

/**
 * 감정 수다가 아닌, 사실·최신 정보가 필요한 메시지인지 판별
 */
export function detectSearchIntent(userMessage: string): SearchIntent | null {
  const text = userMessage.trim();
  if (text.length < 4) return null;
  if (CHITCHAT_ONLY.test(text)) return null;

  const factualHit =
    FACTUAL.test(text) ||
    FINANCE.test(text) ||
    CURRENT.test(text) ||
    EXPLICIT_SEARCH.test(text);

  const askHit = INFO_ASK.test(text) && HAS_QUESTION.test(text);

  if (EMOTIONAL.test(text) && !factualHit && !EXPLICIT_SEARCH.test(text)) {
    return null;
  }

  if (EXPLICIT_SEARCH.test(text)) {
    const query = cleanQuery(
      text.replace(/검색해|찾아봐|알아봐|인터넷에서|구글에서/gu, "").trim()
    );
    return query.length >= 2 ? { needed: true, query } : null;
  }

  if (factualHit && (HAS_QUESTION.test(text) || INFO_ASK.test(text))) {
    const query = cleanQuery(text);
    return query.length >= 3 ? { needed: true, query } : null;
  }

  if (askHit && (factualHit || FINANCE.test(text) || CURRENT.test(text))) {
    const query = cleanQuery(text);
    return query.length >= 3 ? { needed: true, query } : null;
  }

  return null;
}
