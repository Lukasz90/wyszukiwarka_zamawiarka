import type { CartLinePayload, SearchResponse, TranscriptLine } from '../types';

type RestConfig = {
    restUrl: string;
    nonce: string;
};

function getConfig(): RestConfig {
    const config = (window as any).DinlogicAIWConfig;
    if (!config || !config.restUrl) {
        throw new Error('DinlogicAIWConfig is not defined');
    }
    return config;
}

function withNonce(options: RequestInit = {}): RequestInit {
    const config = getConfig();
    const headers = new Headers(options.headers || undefined);
    headers.set('X-WP-Nonce', config.nonce);
    return { ...options, headers };
}

export async function searchProducts(query: string, page = 1, perPage = 10): Promise<SearchResponse> {
    if (!query.trim()) {
        return {
            items: [],
            pagination: { page: 1, per_page: perPage, total: 0 },
        };
    }

    const config = getConfig();
    const params = new URLSearchParams({ q: query, page: String(page), per_page: String(perPage) });
    const response = await fetch(`${config.restUrl}/search?${params.toString()}`);

    if (!response.ok) {
        throw new Error('Nie udało się pobrać wyników wyszukiwania.');
    }

    return response.json();
}

export async function addLinesToCart(lines: CartLinePayload[]): Promise<Response> {
    const config = getConfig();
    const response = await fetch(`${config.restUrl}/lines/add`, withNonce({
        method: 'POST',
        body: JSON.stringify({ lines }),
        headers: {
            'Content-Type': 'application/json',
        },
    }));

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Nie udało się dodać pozycji do koszyka.');
    }

    return response;
}

export async function parseTranscript(transcript: string): Promise<TranscriptLine[]> {
    const config = getConfig();
    const response = await fetch(`${config.restUrl}/voice/parse`, withNonce({
        method: 'POST',
        body: JSON.stringify({ transcript }),
        headers: {
            'Content-Type': 'application/json',
        },
    }));

    if (!response.ok) {
        throw new Error('Nie udało się zinterpretować komendy głosowej.');
    }

    const data = await response.json();
    return data.lines ?? [];
}

export async function extractOcrText(file: File): Promise<string> {
    const config = getConfig();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${config.restUrl}/ocr/extract`, withNonce({
        method: 'POST',
        body: formData,
    }));

    if (!response.ok) {
        throw new Error('Nie udało się przetworzyć pliku.');
    }

    const data = await response.json();
    return data.text ?? '';
}
