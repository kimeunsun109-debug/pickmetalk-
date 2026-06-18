import { buildSearchPromptBlock } from "./buildSearchPrompt";
import { detectSearchIntent } from "./detectIntent";
import { isWebSearchConfigured, searchWeb } from "./tavilyClient";

function localizeQuery(query: string): string {
  if (/한국|서울|부산|코스피|코스닥|KRW|원화/u.test(query)) return query;
  if (/날씨|기온|미세머지|코스피|코스닥|환율|증시/u.test(query)) {
    return `${query} 한국`;
  }
  return query;
}

/**
 * 사용자 메시지에 사실 확인이 필요하면 웹 검색 후 프롬프트 블록 반환.
 * API 키 없거나 검색 불필요 시 빈 문자열.
 */
export async function getSearchContextForMessage(
  userMessage: string
): Promise<string> {
  if (!isWebSearchConfigured()) return "";

  const intent = detectSearchIntent(userMessage);
  if (!intent) return "";

  const result = await searchWeb(localizeQuery(intent.query));
  return buildSearchPromptBlock(result);
}

export { detectSearchIntent } from "./detectIntent";
export { isWebSearchConfigured } from "./tavilyClient";
export type { WebSearchResult, SearchIntent } from "./types";
