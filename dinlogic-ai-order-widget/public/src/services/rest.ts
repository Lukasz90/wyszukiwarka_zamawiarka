export interface SearchResponse {
    items: unknown[];
    pagination: { page: number; per_page: number; total: number };
}

export async function searchProducts(query: string): Promise<SearchResponse> {
    const params = new URLSearchParams({ q: query });
    const response = await fetch(`${(window as any).DinlogicAIWConfig.restUrl}/search?${params.toString()}`);
    if (!response.ok) {
        throw new Error('Failed to fetch search results');
    }
    return response.json();
}
