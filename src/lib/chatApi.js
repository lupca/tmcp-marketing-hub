// Chat API client for Agents SSE streaming
const AGENTS_URL = import.meta.env.VITE_AGENTS_API_URL || '/api/agent';

/**
 * Read an SSE stream from a fetch Response and dispatch parsed events.
 * Shared by all API clients that consume SSE from the agents backend.
 *
 * @param {Response} response - Fetch response with SSE body
 * @param {(event: object) => void} onEvent - Callback for each parsed event
 */
export async function streamSSE(response, onEvent) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete line in buffer

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const data = JSON.parse(line.slice(6));
                    onEvent(data);
                } catch { /* skip malformed JSON */ }
            }
        }
    }
    // Process remaining buffer
    if (buffer.startsWith('data: ')) {
        try {
            const data = JSON.parse(buffer.slice(6));
            onEvent(data);
        } catch { /* skip */ }
    }
}

/**
 * Send a message to the marketing agents and stream SSE events.
 * @param {string} message - User message
 * @param {string} threadId - Conversation thread ID
 * @param {(event: object) => void} onEvent - Callback for each parsed SSE event
 * @param {AbortSignal} [signal] - Optional abort signal for cancellation
 * @returns {Promise<void>}
 */
export async function sendMessage(message, threadId, onEvent, signal) {
    const res = await fetch(`${AGENTS_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, thread_id: threadId }),
        signal,
    });

    if (!res.ok) {
        throw new Error(`Agent API error: ${res.status} ${res.statusText}`);
    }

    await streamSSE(res, onEvent);
}

/**
 * Check agent API health.
 * @returns {Promise<boolean>}
 */
export async function checkHealth() {
    try {
        const res = await fetch(`${AGENTS_URL}/health`, { signal: AbortSignal.timeout(3000) });
        return res.ok;
    } catch {
        return false;
    }
}
