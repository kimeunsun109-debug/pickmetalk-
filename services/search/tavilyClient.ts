import {
  ENABLE_WEB_SEARCH,
  WEB_SEARCH_MAX_RESULTS,
  WEB_SEARCH_TIMEOUT_MS,
} from "@/lib/constants";
import type { WebSearchResult } from "./types";

interface TavilyResponse {
  answer?: string;
  results?: {
    title?: string;
    url?: string;
    content?: string;
  }[];
}

function getApiKey(): string | null {
  const key = process.env.TAVILY_API_KEY?.trim();
  return key || null;
}

export function isWebSearchConfigured(): boolean {
  return ENABLE_WEB_SEARCH && !!getApiKey();
}

/** Tavily Search API — 서버 전용 */
export async function searchWeb(query: string): Promise<WebSearchResult | null> {
  const apiKey = getApiKey();
  if (!apiKey || !ENABLE_WEB_SEARCH) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEB_SEARCH_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        max_results: WEB_SEARCH_MAX_RESULTS,
        include_answer: true,
        topic: "general",
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error("[webSearch] Tavily HTTP", res.status);
      return null;
    }

    const data = (await res.json()) as TavilyResponse;
    const items = (data.results ?? [])
      .map((r) => ({
        title: (r.title ?? "").trim(),
        url: (r.url ?? "").trim(),
        snippet: (r.content ?? "").trim().slice(0, 280),
      }))
      .filter((r) => r.title && r.snippet);

    if (items.length === 0 && !data.answer) return null;

    return {
      query,
      answer: data.answer?.trim() || null,
      items,
      fetchedAt: new Date().toISOString(),
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      console.error("[webSearch] timeout", query);
    } else {
      console.error("[webSearch] error", err);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}
