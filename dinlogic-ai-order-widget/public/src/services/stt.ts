export type SpeechRecognitionLike = SpeechRecognition & {
    lang: string;
};

export type SpeechRecognitionResultHandler = (transcript: string) => void;
export type SpeechRecognitionErrorHandler = (error: string) => void;

export function hasBrowserSTT(): boolean {
    return typeof window !== 'undefined' && (!!(window as any).webkitSpeechRecognition || !!(window as any).SpeechRecognition);
}

export function createRecognition(onResult: SpeechRecognitionResultHandler, onError: SpeechRecognitionErrorHandler): {
    start: () => void;
    stop: () => void;
    active: () => boolean;
} {
    if (!hasBrowserSTT()) {
        throw new Error('Speech recognition API is not supported in this browser.');
    }

    const RecognitionConstructor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition: SpeechRecognitionLike = new RecognitionConstructor();
    recognition.lang = (window as any).DinlogicAIWConfig?.locale || 'pl-PL';
    recognition.continuous = false;
    recognition.interimResults = false;

    let isActive = false;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = Array.from(event.results)
            .map((result) => result[0])
            .map((result) => result.transcript)
            .join(' ')
            .trim();

        if (transcript) {
            onResult(transcript);
        }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        onError(event.error || 'unknown-error');
    };

    recognition.onstart = () => {
        isActive = true;
    };

    recognition.onend = () => {
        isActive = false;
    };

    return {
        start: () => {
            recognition.start();
        },
        stop: () => {
            recognition.stop();
        },
        active: () => isActive,
    };
}
