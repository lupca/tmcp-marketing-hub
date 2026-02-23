import { streamSSE } from './chatApi';
import pb from './pocketbase';

const API_URL = import.meta.env.VITE_AGENTS_API_URL || '/api/agent';

/**
 * Generate a marketing strategy using AI.
 * Streams SSE events: status (fetching_worksheet, fetching_brand, fetching_icp, analyzing), chunk, done, error.
 *
 * @param {object} params
 * @param {string} params.worksheetId
 * @param {string} params.campaignType
 * @param {string} params.productId
 * @param {string} params.goal - Custom prompt/goal
 * @param {string} params.language
 * @param {function} onEvent - Callback for SSE events
 * @param {AbortSignal} [signal] - Optional abort signal
 */
export async function generateMarketingStrategy({ worksheetId, campaignType, productId, goal, language }, onEvent, signal) {
    const res = await fetch(`${API_URL}/generate-marketing-strategy`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${pb.authStore.token}`
        },
        body: JSON.stringify({
            worksheetId,
            campaignType,
            productId,
            goal,
            language
        }),
        signal,
    });

    if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
    }

    await streamSSE(res, onEvent);
}
