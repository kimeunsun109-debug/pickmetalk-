const CHARACTER_FALLBACKS: Record<string, string[]> = {
  narin: [
    "음... 뭐라고 할까?",
    "생각할게, 잠깐만.",
    "그거 재밌는데, 곧 말해줄게.",
  ],
  yuna: [
    "잠깐만~ 곧 답할게!",
    "히히, 생각 중이야.",
    "응, 잠깐만 기다려!",
  ],
  yoonseo: [
    "입력 확인했어. 곧 답할게.",
    "응답 정리 중이야, 잠시만.",
    "잠깐, 정리하고 말해줄게.",
  ],
  eunha: [
    "잠깐만요, 마음 정리하고 답할게요.",
    "그 말, 조금 더 생각해볼게요.",
    "곧 답할게요, 잠시만요.",
  ],
  jiyu: [
    "잠깐! 생각 중이야 ㅋㅋ",
    "오케이 곧 답장 갈게~",
    "응응 잠깐만!",
  ],
};

const DEFAULT_FALLBACKS = [
  "잠깐만~ 곧 답할게!",
  "생각 중이야, 조금만 기다려!",
];

/** 모델 첫 청크 지연 시 즉시 전송할 1문장 (… 단독 문구 사용 안 함) */
export function getStreamFallback(
  characterId: string,
  _userMessage: string
): string {
  const list = CHARACTER_FALLBACKS[characterId] ?? DEFAULT_FALLBACKS;
  return list[Math.floor(Math.random() * list.length)]!;
}
