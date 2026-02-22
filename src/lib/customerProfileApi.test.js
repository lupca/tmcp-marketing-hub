import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateCustomerProfile } from './customerProfileApi';

const API_URL = '/api/agent';

function mockFetchResponse(events) {
    const text = events.map(e => `data: ${JSON.stringify(e)}\n\n`).join('');
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
        start(controller) {
            controller.enqueue(encoder.encode(text));
            controller.close();
        },
    });
    return { ok: true, body: stream };
}

describe('customerProfileApi.js - Customer Profile AI Client', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe('generateCustomerProfile', () => {
        it('sends POST request with brandIdentityId and language', async () => {
            const events = [
                { type: 'status', status: 'fetching_brand', agent: 'MarketResearcher' },
                { type: 'status', status: 'analyzing', agent: 'MarketResearcher' },
                { type: 'chunk', content: '{"personaName":"Test"}' },
                { type: 'done', customerProfile: { personaName: 'Test' } },
            ];

            vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockFetchResponse(events)));

            const received = [];
            await generateCustomerProfile('bi_123', 'English', (e) => received.push(e));

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/generate-customer-profile'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ brandIdentityId: 'bi_123', language: 'English' }),
                })
            );

            expect(received.length).toBe(4);
            expect(received[0].type).toBe('status');
            expect(received[0].status).toBe('fetching_brand');
            expect(received[3].type).toBe('done');
            expect(received[3].customerProfile.personaName).toBe('Test');
        });

        it('throws on non-ok response', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

            await expect(generateCustomerProfile('bi_123', 'English', vi.fn()))
                .rejects.toThrow('Server error: 500');
        });

        it('handles malformed SSE data gracefully', async () => {
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode('data: not-json\n\n'));
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', customerProfile: {} })}\n\n`));
                    controller.close();
                },
            });
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, body: stream }));

            const received = [];
            await generateCustomerProfile('bi_123', 'English', (e) => received.push(e));
            // Should not crash; valid event eventually received
            expect(received.length).toBeGreaterThanOrEqual(1);
        });

        it('supports AbortSignal for cancellation', async () => {
            const controller = new AbortController();
            controller.abort();

            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')));

            await expect(generateCustomerProfile('bi_123', 'English', vi.fn(), controller.signal))
                .rejects.toThrow('Aborted');
        });
    });
});
