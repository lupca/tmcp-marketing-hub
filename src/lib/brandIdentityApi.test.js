import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('brandIdentityApi.js - Brand Identity AI Client', () => {
    let brandApi;

    beforeEach(async () => {
        vi.restoreAllMocks();
        vi.resetModules();
        brandApi = await import('./brandIdentityApi.js');
    });

    describe('generateBrandIdentity', () => {
        it('sends POST request with worksheetId and language', async () => {
            const events = [];
            const sseData = [
                'data: {"type":"status","status":"fetching_worksheet","agent":"BrandExpert"}\n\n',
                'data: {"type":"status","status":"analyzing","agent":"BrandExpert"}\n\n',
                'data: {"type":"chunk","content":"{\\"brandName\\": \\"Test\\"}"}\n\n',
                'data: {"type":"done","brandIdentity":{"brandName":"Test"}}\n\n',
            ];

            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                start(controller) {
                    sseData.forEach(chunk => controller.enqueue(encoder.encode(chunk)));
                    controller.close();
                },
            });

            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                body: stream,
            });

            await brandApi.generateBrandIdentity(
                { worksheetId: 'ws123', language: 'English' },
                (event) => events.push(event),
            );

            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/generate-brand-identity'),
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ worksheetId: 'ws123', language: 'English' }),
                }),
            );

            expect(events).toHaveLength(4);
            expect(events[0]).toEqual({ type: 'status', status: 'fetching_worksheet', agent: 'BrandExpert' });
            expect(events[3]).toEqual({ type: 'done', brandIdentity: { brandName: 'Test' } });
        });

        it('throws on non-ok response', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 422,
                text: async () => 'Validation error',
            });

            await expect(
                brandApi.generateBrandIdentity({ worksheetId: '', language: 'English' }, () => { }),
            ).rejects.toThrow('Brand Identity API error: 422');
        });

        it('handles malformed SSE data gracefully', async () => {
            const events = [];
            const sseData = [
                'data: {"type":"status","status":"analyzing"}\n\n',
                'data: NOT_VALID_JSON\n\n',
                'data: {"type":"done"}\n\n',
            ];

            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                start(controller) {
                    sseData.forEach(chunk => controller.enqueue(encoder.encode(chunk)));
                    controller.close();
                },
            });

            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                body: stream,
            });

            await brandApi.generateBrandIdentity(
                { worksheetId: 'ws1', language: 'Vietnamese' },
                (event) => events.push(event),
            );

            // Should skip malformed JSON
            expect(events).toHaveLength(2);
            expect(events[0].type).toBe('status');
            expect(events[1].type).toBe('done');
        });

        it('supports AbortSignal for cancellation', async () => {
            const controller = new AbortController();
            controller.abort();

            globalThis.fetch = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'));

            await expect(
                brandApi.generateBrandIdentity(
                    { worksheetId: 'ws1', language: 'English' },
                    () => { },
                    controller.signal,
                ),
            ).rejects.toThrow();

            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ signal: controller.signal }),
            );
        });
    });
});
