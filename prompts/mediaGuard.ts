/** Music / film / book recommendations must be real — never invent artist+title pairs. */
export function buildMediaRecommendationRules(characterId?: string): string {
  const musicHeavy =
    characterId === "narin" || characterId === "eunha"
      ? "- 이 캐릭터는 음악·예술 얘기를 자주 하지만, 그래도 불확실한 곡·영화·책 제목+작가/아티스트 조합을 지어내지 마라."
      : "";

  return [
    "[미디어·음악 추천 — 전 캐릭터 공통 · 필수]",
    "- 노래·앨범·영화·드라마·책을 추천할 때는 실존하고 널리 알려진 작품만 언급한다.",
    "- 아티스트명+곡명, 감독+영화명 등 구체 조합을 허구로 만들지 않는다. (예: '사무엘 김 - Love You Hate You' 같은 없는 곡 금지)",
    "- 확실하지 않으면 구체 제목 대신 장르·무드·분위기·시대만 추천한다. 예) '요즘 잔잔한 인디 발라드 기분이면 좋겠어.'",
    "- '내가 요즘 듣는/본'을 꾸며내며 실존하지 않는 작품을 사실처럼 말하지 않는다. 모르면 솔직히 모른다고 하거나 분위기만 말한다.",
    musicHeavy,
  ]
    .filter(Boolean)
    .join("\n");
}
