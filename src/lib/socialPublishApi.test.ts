import { beforeEach, describe, expect, it, vi } from 'vitest';
import pb from './pocketbase';
import { publishFacebookVariant } from './socialPublishApi';

describe('publishFacebookVariant', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
        pb.authStore.token = 'test-token';
    });

    it('sends publish request with bearer token', async () => {
        const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
                variant_id: 'var_1',
                platform: 'facebook',
                publish_status: 'published',
                platform_post_id: '123_456',
            }),
        } as any);

        const res = await publishFacebookVariant({ workspace_id: 'ws_1', variant_id: 'var_1' });

        expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('/api/social/facebook/posts'),
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    Authorization: 'Bearer test-token',
                    'Content-Type': 'application/json',
                }),
            }),
        );
        expect(res.publish_status).toBe('published');
        expect(res.platform_post_id).toBe('123_456');
    });

    it('throws readable error on non-OK response', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValue({
            ok: false,
            status: 400,
            json: vi.fn().mockResolvedValue({ message: 'No facebook social account configured' }),
        } as any);

        await expect(
            publishFacebookVariant({ workspace_id: 'ws_1', variant_id: 'var_1' }),
        ).rejects.toThrow('No facebook social account configured');
    });
});
