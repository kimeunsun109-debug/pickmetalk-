import type { ChatMessage } from "@/services/ai/provider";
import OpenAI from "openai";

/** Legacy `deepseek-chat` retired 2026-07-24 UTC — use v4 ids only. */
const MODEL =
  process.env.DEEPSEEK_MODEL?.trim() || "deepseek-v4-flash";

let deepseekClientInstance: OpenAI | null = null;

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

/** 싱글톤 — 요청마다 OpenAI 클라이언트 재생성 방지 */
export function getDeepSeekClient(): OpenAI {
  if (!deepseekClientInstance) {
    deepseekClientInstance = new OpenAI({
      apiKey: getApiKey(),
      baseURL: getBaseURL(),
    });
  }
  return deepseekClientInstance;
}

/** @deprecated getDeepSeekClient() 사용 권장 */
export function createDeepSeekClient(): OpenAI {
  return getDeepSeekClient();
}

/** @deprecated getDeepSeekClient() 사용 권장 */
export const deepseek = {
  get chat() {
    return getDeepSeekClient().chat;
  },
};

/** DeepSeek 스트리밍 채팅 — 서버 전용 */
export async function* streamDeepSeekChat(
  messages: ChatMessage[]
): AsyncGenerator<string> {
  const client = getDeepSeekClient();

  try {
    const stream = await client.chat.completions.create({
      model: MODEL,
      messages,
      stream: true,
      temperature: 0.85,
      max_tokens: 640,
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

/** DeepSeek 단발 완성 — 새 대화 첫 인사 등 짧은 비스트리밍 호출용 */
export async function completeDeepSeekChat(
  messages: ChatMessage[],
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const client = getDeepSeekClient();
  const completion = await client.chat.completions.create({
    model: MODEL,
    messages,
    stream: false,
    temperature: options?.temperature ?? 0.9,
    max_tokens: options?.maxTokens ?? 200,
  });
  return completion.choices[0]?.message?.content?.trim() ?? "";
}
