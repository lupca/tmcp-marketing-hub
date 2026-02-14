import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('chatApi.js - Agent Chat Client', () => {
    let chatApi;

    beforeEach(async () => {
        vi.restoreAllMocks();
        vi.resetModules();
        chatApi = await import('./chatApi.js');
    });

    describe('sendMessage', () => {
        it('sends POST request with message and threadId', async () => {
            const events = [];
            const sseData = [
                'data: {"type":"thought","content":"Analyzing..."}\n\n',
                'data: {"type":"response","content":"Done!"}\n\n',
            ];

            // Create a readable stream from SSE data
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

            await chatApi.sendMessage('hello', 'thread-1', (event) => events.push(event));

            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/chat'),
                expect.objectContaining({
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: 'hello', thread_id: 'thread-1' }),
                }),
            );

            expect(events).toHaveLength(2);
            expect(events[0]).toEqual({ type: 'thought', content: 'Analyzing...' });
            expect(events[1]).toEqual({ type: 'response', content: 'Done!' });
        });

        it('throws on non-ok response', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error',
            });

            await expect(chatApi.sendMessage('msg', 'thread', () => { }))
                .rejects.toThrow('Agent API error: 500 Internal Server Error');
        });

        it('handles malformed SSE data gracefully', async () => {
            const events = [];
            const sseData = [
                'data: {"type":"ok"}\n\n',
                'data: INVALID_JSON\n\n',
                'data: {"type":"still_ok"}\n\n',
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

            await chatApi.sendMessage('m', 't', (event) => events.push(event));

            // Should skip malformed JSON and still parse valid ones
            expect(events).toHaveLength(2);
            expect(events[0].type).toBe('ok');
            expect(events[1].type).toBe('still_ok');
        });

        it('supports AbortSignal for cancellation', async () => {
            const controller = new AbortController();
            controller.abort();

            globalThis.fetch = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'));

            await expect(chatApi.sendMessage('msg', 'thread', () => { }, controller.signal))
                .rejects.toThrow();

            expect(globalThis.fetch).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({ signal: controller.signal }),
            );
        });
    });

    describe('checkHealth', () => {
        it('returns true when API is healthy', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({ ok: true });

            const result = await chatApi.checkHealth();
            expect(result).toBe(true);
        });

        it('returns false when API returns non-ok', async () => {
            globalThis.fetch = vi.fn().mockResolvedValue({ ok: false });

            const result = await chatApi.checkHealth();
            expect(result).toBe(false);
        });

        it('returns false when network error occurs', async () => {
            globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

            const result = await chatApi.checkHealth();
            expect(result).toBe(false);
        });
    });
});
