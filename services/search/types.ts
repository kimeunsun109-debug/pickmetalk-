export interface WebSearchItem {
  title: string;
  url: string;
  snippet: string;
}

export interface WebSearchResult {
  query: string;
  answer: string | null;
  items: WebSearchItem[];
  fetchedAt: string;
}

export interface SearchIntent {
  needed: true;
  query: string;
}
