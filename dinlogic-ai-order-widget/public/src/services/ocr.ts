export async function extractText(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${(window as any).DinlogicAIWConfig.restUrl}/ocr/extract`, {
        method: 'POST',
        body: formData,
        headers: {
            'X-WP-Nonce': (window as any).DinlogicAIWConfig.nonce,
        },
    });
    if (!response.ok) {
        throw new Error('Failed to extract text');
    }
    const data = await response.json();
    return data.text ?? '';
}
