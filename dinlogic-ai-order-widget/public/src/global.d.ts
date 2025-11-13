interface DinlogicAIWConfig {
    restUrl: string;
    nonce: string;
    currency: string;
    currencySymbol: string;
    locale: string;
    priceDecimals: number;
}

declare global {
    interface Window {
        DinlogicAIWConfig: DinlogicAIWConfig;
    }
}

export {};
