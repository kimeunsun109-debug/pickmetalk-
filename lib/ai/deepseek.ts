import type { ChatMessage } from "@/services/ai/provider";

const MODEL = "deepseek-chat";

/**
 * DeepSeek 스트리밍 채팅 — 서버 전용 (DEEPSEEK_API_KEY는 클라이언트에 노출 금지)
 */
export async function* streamDeepSeekChat(
  messages: ChatMessage[]
): AsyncGenerator<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseURL =
    process.env.DEEPSEEK_BASE_URL?.replace(/\/$/, "") ??
    "https://api.deepseek.com";

  if (!apiKey) {
    throw new Error("DEEPSEEK_API_KEY가 설정되지 않았습니다.");
  }

  const res = await fetch(`${baseURL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: true,
      temperature: 0.85,
      max_tokens: 512,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`DeepSeek API 오류 (${res.status}): ${errText}`);
  }

  if (!res.body) {
    throw new Error("DeepSeek 응답 본문이 없습니다.");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (data === "[DONE]") return;

      try {
        const parsed = JSON.parse(data) as {
          choices?: { delta?: { content?: string } }[];
        };
        const chunk = parsed.choices?.[0]?.delta?.content;
        if (chunk) yield chunk;
      } catch {
        /* SSE 파싱 실패 줄은 무시 */
      }
    }
  }
}
