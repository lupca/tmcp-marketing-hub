// Worksheet AI Generation API client (SSE streaming)
const AGENTS_URL = import.meta.env.VITE_AGENTS_API_URL || '/api/agent';

/**
 * Generate a business definition worksheet via AI with SSE streaming.
 * @param {object} data - { businessDescription, targetAudience, painPoints, uniqueSellingProposition, language }
 * @param {(event: object) => void} onEvent - Callback for each SSE event
 * @param {AbortSignal} [signal] - Optional abort signal
 * @returns {Promise<void>}
 */
export async function generateWorksheet(data, onEvent, signal) {
    const res = await fetch(`${AGENTS_URL}/generate-worksheet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal,
    });

    if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Worksheet API error: ${res.status} — ${errBody}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const parsed = JSON.parse(line.slice(6));
                    onEvent(parsed);
                } catch { /* skip malformed */ }
            }
        }
    }
    // Remaining buffer
    if (buffer.startsWith('data: ')) {
        try {
            const parsed = JSON.parse(buffer.slice(6));
            onEvent(parsed);
        } catch { /* skip */ }
    }
}
