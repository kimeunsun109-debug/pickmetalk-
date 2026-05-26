import type { AIProvider, ChatMessage } from "./provider";

/** DeepSeek API — env: DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL */
export function createDeepSeekProvider(): AIProvider {
  return {
    async *streamChat(_messages: ChatMessage[]) {
      // TODO: fetch streaming to DeepSeek chat/completions
      yield "[DeepSeek 연동 예정]";
    },
  };
}
