// Content Briefs AI Generation API client (SSE streaming)
import { streamSSE } from './chatApi';

const AGENTS_URL = import.meta.env.VITE_AGENTS_API_URL || '/api/agent';

/**
 * Generate content briefs via AI with SSE streaming.
 * @param {object} data - { campaignId, workspaceId, language, anglesPerStage }
 * @param {(event: object) => void} onEvent - Callback for each SSE event
 * @param {AbortSignal} [signal] - Optional abort signal
 * @returns {Promise<void>}
 */
export async function generateContentBriefs(data, onEvent, signal) {
    const res = await fetch(`${AGENTS_URL}/generate-content-briefs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal,
    });

    if (!res.ok) {
        const errBody = await res.text();
        throw new Error(`Content Briefs API error: ${res.status} — ${errBody}`);
    }

    await streamSSE(res, onEvent);
}
