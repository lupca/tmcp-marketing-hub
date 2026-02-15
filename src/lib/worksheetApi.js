// Worksheet AI Generation API client (SSE streaming)
import { streamSSE } from './chatApi';

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

    await streamSSE(res, onEvent);
}
