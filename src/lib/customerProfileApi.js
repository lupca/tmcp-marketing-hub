import { streamSSE } from './chatApi';
import pb from './pocketbase';

const API_URL = import.meta.env.VITE_AGENTS_API_URL || '/api/agent';

/**
 * Generate a customer profile using AI.
 * Streams SSE events: status (fetching_brand, analyzing), chunk, done, error.
 *
 * @param {string} brandIdentityId - PocketBase record ID of the brand identity
 * @param {string} language - Target language for generation
 * @param {function} onEvent - Callback for each SSE event
 * @param {AbortSignal} [signal] - Optional abort signal
 */
export async function generateCustomerProfile(brandIdentityId, language, onEvent, signal) {
    const headers = { 'Content-Type': 'application/json' };
    if (pb.authStore.token) {
        headers['Authorization'] = `Bearer ${pb.authStore.token}`;
    }

    const res = await fetch(`${API_URL}/generate-customer-profile`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ brandIdentityId, language }),
        signal,
    });

    if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
    }

    await streamSSE(res, onEvent);
}
