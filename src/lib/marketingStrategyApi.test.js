import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateMarketingStrategy } from './marketingStrategyApi';

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

describe('marketingStrategyApi.js - AI Marketing Strategy Client', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    describe('generateMarketingStrategy', () => {
        it('sends POST request with all 5 required parameters', async () => {
            const events = [
                { type: 'status', status: 'fetching_worksheet', agent: 'MarketingStrategist' },
                { type: 'chunk', content: '{"positioning":"Test"}' },
                { type: 'done', marketingStrategy: { positioning: 'Test' } },
            ];

            vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockFetchResponse(events)));

            const received = [];
            const params = {
                worksheetId: 'ws_1',
                brandIdentityId: 'bi_1',
                customerProfileId: 'icp_1',
                goal: 'Grow fast',
                language: 'English'
            };

            await generateMarketingStrategy(params, (e) => received.push(e));

            expect(fetch).toHaveBeenCalledWith(
                expect.stringContaining('/generate-marketing-strategy'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify(params),
                })
            );

            expect(received.length).toBe(3);
            expect(received[0].status).toBe('fetching_worksheet');
            expect(received[2].type).toBe('done');
            expect(received[2].marketingStrategy.positioning).toBe('Test');
        });

        it('throws on non-ok response', async () => {
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));

            await expect(generateMarketingStrategy({}, vi.fn()))
                .rejects.toThrow('Server error: 500');
        });

        it('supports AbortSignal', async () => {
            const controller = new AbortController();
            controller.abort();

            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError')));

            await expect(generateMarketingStrategy({}, vi.fn(), controller.signal))
                .rejects.toThrow('Aborted');
        });
    });
});
