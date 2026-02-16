
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateWorksheet } from './worksheetApi';
import * as chatApi from './chatApi';

// Mock streamSSE
vi.mock('./chatApi', () => ({
    streamSSE: vi.fn().mockImplementation((res, onEvent) => {
        // Simulate event stream
        onEvent({ type: 'message', data: 'chunk1' });
        onEvent({ type: 'message', data: 'chunk2' });
        return Promise.resolve();
    }),
}));

describe('generateWorksheet', () => {
    let fetchMock;

    beforeEach(() => {
        fetchMock = vi.fn();
        global.fetch = fetchMock;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should call API with correct parameters and stream events', async () => {
        const mockResponse = {
            ok: true,
            body: 'stream',
        };
        fetchMock.mockResolvedValue(mockResponse);

        const onEvent = vi.fn();
        const data = {
            businessDescription: 'A startup',
            targetAudience: 'Everyone',
            painPoints: 'None',
            uniqueSellingProposition: 'Best',
            language: 'en'
        };

        await generateWorksheet(data, onEvent);

        // Verify fetch call
        expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('/generate-worksheet'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            signal: undefined,
        });

        // Verify streamSSE call
        expect(chatApi.streamSSE).toHaveBeenCalledWith(mockResponse, onEvent);

        // Verify events were triggered (by mock implementation)
        expect(onEvent).toHaveBeenCalledTimes(2);
        expect(onEvent).toHaveBeenCalledWith({ type: 'message', data: 'chunk1' });
    });

    it('should pass abort signal', async () => {
        fetchMock.mockResolvedValue({ ok: true });
        const controller = new AbortController();
        const signal = controller.signal;

        await generateWorksheet({}, vi.fn(), signal);

        expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
            signal: signal
        }));
    });

    it('should throw error on non-ok response', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 500,
            text: () => Promise.resolve('Internal Server Error'),
        });

        await expect(generateWorksheet({}, vi.fn())).rejects.toThrow('Worksheet API error: 500 — Internal Server Error');
    });
});
