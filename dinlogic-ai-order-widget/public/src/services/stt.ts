export function hasBrowserSTT(): boolean {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
}
