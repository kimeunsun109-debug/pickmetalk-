import type { WebSearchResult } from "./types";

/** 검색 결과 → 시스템 프롬프트 블록 (여자친구 톤으로 전달 지침) */
export function buildSearchPromptBlock(
  result: WebSearchResult | null
): string {
  if (!result) return "";

  const lines = [
    "[웹 검색 결과 — 이번 턴 사실 전달용]",
    `검색어: "${result.query}"`,
    "아래 정보를 바탕으로 사용자에게 도움이 되게 답하되, 백과사전·뉴스 앵커처럼 읽지 말 것.",
    "캐릭터 말투·말투 학습 규칙을 유지하고, 1~3문장 카톡 톤으로 자연스럽게.",
    "검색 결과에 없는 내용은 지어내지 말 것. 불확실하면 솔직히 말할 것.",
  ];

  if (result.answer) {
    lines.push(`요약: ${result.answer}`);
  }

  result.items.slice(0, 3).forEach((item, i) => {
    lines.push(`${i + 1}. ${item.title} — ${item.snippet}`);
  });

  return lines.join("\n");
}
