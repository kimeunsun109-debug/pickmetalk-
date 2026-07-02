const CHARACTER_FALLBACKS: Record<string, string[]> = {
  narin: [
    "…잠깐, 생각할게.",
    "그거 재밌는데. 곧 말해줄게.",
  ],
  yuna: [
    "잠깐만~ 곧 답할게!",
    "히히 잠깐 생각 중이야",
  ],
  yoonseo: [
    "응답 처리 중. 잠시만.",
    "입력 확인. 곧 답할게.",
  ],
  eunha: [
    "잠깐만요, 마음 정리하고 답할게요",
    "그 말, 조금 더 생각해볼게요",
  ],
  jiyu: [
    "잠깐! 생각 중이야 ㅋㅋ",
    "오케이 곧 답장 갈게~",
  ],
};

const DEFAULT_FALLBACKS = ["잠깐만~ 곧 답할게!"];

/** 모델 첫 청크 지연 시 즉시 전송할 1문장 */
export function getStreamFallback(
  characterId: string,
  _userMessage: string
): string {
  const list = CHARACTER_FALLBACKS[characterId] ?? DEFAULT_FALLBACKS;
  return list[Math.floor(Math.random() * list.length)]!;
}
