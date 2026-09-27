export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
  source?: string;
}

export interface SearchAdapterResult {
  answer: string | null;

  results: SearchResultItem[];

  provider: string;
}

export interface SearchAdapter {
  search(
    query: string,
    limit: number,
  ): Promise<SearchAdapterResult>;
}