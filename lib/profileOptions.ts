export const GENDER_OPTIONS = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
  { value: "other", label: "기타 / 밝히지 않음" },
] as const;

export const IDEAL_TYPE_OPTIONS = [
  { value: "", label: "선택 안 함" },
  { value: "warm", label: "다정하고 따뜻한 타입" },
  { value: "funny", label: "유머 있고 재미있는 타입" },
  { value: "calm", label: "차분하고 든든한 타입" },
  { value: "passionate", label: "열정적이고 에너지 넘치는 타입" },
  { value: "intellectual", label: "섬세하고 깊이 있는 타입" },
] as const;
