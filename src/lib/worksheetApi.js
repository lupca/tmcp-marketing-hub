// Worksheet AI Generation API client (SSE streaming)
import { streamSSE } from './chatApi';
import pb from './pocketbase';

const AGENTS_URL = import.meta.env.VITE_AGENTS_API_URL || '/api/agent';

/**
 * Generate a strategic worksheet via AI with SSE streaming.
 * @param {object} data - { brandIds, customerIds, language }
 * @param {(event: object) => void} onEvent - Callback for each SSE event
 * @param {AbortSignal} [signal] - Optional abort signal
 * @returns {Promise<void>}
 */
export async function generateWorksheet(data, onEvent, signal) {
    const res = await fetch(`${AGENTS_URL}/generate-worksheet`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(pb.authStore.token ? { 'Authorization': `Bearer ${pb.authStore.token}` } : {})
        },
        body: JSON.stringify(data),
        signal,
    });

    if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Worksheet API error: ${res.status} — ${errBody}`);
    }

    await streamSSE(res, onEvent);
}
