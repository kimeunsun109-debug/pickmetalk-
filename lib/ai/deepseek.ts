import type { ChatMessage } from "@/services/ai/provider";
import OpenAI from "openai";

const MODEL = "deepseek-chat";

function getApiKey(): string {
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) {
    throw new Error("DEEPSEEK_API_KEY가 설정되지 않았습니다.");
  }
  return key;
}

function getBaseURL(): string {
  return (
    process.env.DEEPSEEK_BASE_URL?.trim().replace(/\/$/, "") ??
    "https://api.deepseek.com"
  );
}

/**
 * OpenAI SDK 호환 클라이언트 — baseURL만 DeepSeek
 * 요청마다 env를 다시 읽어 dev 서버 재시작 없이 .env 변경이 반영되도록 함
 */
export function createDeepSeekClient(): OpenAI {
  return new OpenAI({
    apiKey: getApiKey(),
    baseURL: getBaseURL(),
  });
}

/** @deprecated createDeepSeekClient() 사용 권장 */
export const deepseek = {
  get chat() {
    return createDeepSeekClient().chat;
  },
};

/** DeepSeek 스트리밍 채팅 — 서버 전용 */
export async function* streamDeepSeekChat(
  messages: ChatMessage[]
): AsyncGenerator<string> {
  const client = createDeepSeekClient();

  try {
    const stream = await client.chat.completions.create({
      model: MODEL,
      messages,
      stream: true,
      temperature: 0.92,
      max_tokens: 512,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) yield content;
    }
  } catch (err) {
    if (err instanceof OpenAI.APIError) {
      if (err.status === 401) {
        throw new Error(
          "DeepSeek API 키가 올바르지 않습니다. .env.local의 DEEPSEEK_API_KEY를 확인하고 개발 서버(npm run dev)를 재시작해 주세요. Vercel 배포 중이라면 대시보드 환경 변수도 확인하세요."
        );
      }
      throw new Error(`DeepSeek API 오류 (${err.status}): ${err.message}`);
    }
    throw err;
  }
}
