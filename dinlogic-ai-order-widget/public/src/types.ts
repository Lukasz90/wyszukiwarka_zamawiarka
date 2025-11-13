export interface ProductAttribute {
    name: string;
    value: string | string[];
}

export interface ProductVariation {
    id: number;
    attributes: Record<string, string>;
    price?: number;
    stock?: boolean;
}

export interface ProductSummary {
    id: number;
    name: string;
    sku: string | null;
    price: number;
    regular_price: number | null;
    sale_price: number | null;
    unit?: string | null;
    stock_status: string;
    thumb?: string | null;
    attributes: ProductAttribute[];
    is_variable: boolean;
    variations?: ProductVariation[];
}

export interface SearchResponse {
    items: ProductSummary[];
    pagination: {
        page: number;
        per_page: number;
        total: number;
    };
}

export interface CartLinePayload {
    product_id: number;
    qty: number;
    variation?: Record<string, string>;
}

export interface TranscriptLine {
    raw: string;
    family?: string | null;
    confidence?: number;
    missing?: string[];
    candidates?: string[];
}

export interface WorkingCartLine {
    product: ProductSummary;
    qty: number;
    variation?: Record<string, string>;
}
