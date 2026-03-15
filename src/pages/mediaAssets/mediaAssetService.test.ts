import { beforeEach, describe, expect, it, vi } from 'vitest';
import pb from '../../lib/pocketbase';
import {
    bulkDeleteMediaAssetsWithCleanup,
    createMediaAsset,
    deleteMediaAssetWithCleanup,
    listAllMediaAssets,
    updateMediaAsset,
} from './mediaAssetService';

describe('mediaAssetService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('lists and sorts all media assets across pages', async () => {
        const mediaCollection = pb.collection('media_assets') as any;
        mediaCollection.getList
            .mockResolvedValueOnce({
                items: [
                    { id: 'a1', updated: '2026-03-01', created: '2026-03-01' },
                    { id: 'a2', updated: '2026-03-03', created: '2026-03-03' },
                ],
                totalPages: 2,
            })
            .mockResolvedValueOnce({
                items: [{ id: 'a3', updated: '2026-03-02', created: '2026-03-02' }],
                totalPages: 2,
            });

        const items = await listAllMediaAssets('ws-1');

        expect(items.map((item: any) => item.id)).toEqual(['a2', 'a3', 'a1']);
        expect(mediaCollection.getList).toHaveBeenNthCalledWith(1, 1, 200, { filter: 'workspace_id = "ws-1"' });
        expect(mediaCollection.getList).toHaveBeenNthCalledWith(2, 2, 200, { filter: 'workspace_id = "ws-1"' });
    });

    it('creates and updates via service wrapper', async () => {
        const payload = new FormData();
        payload.append('file_type', 'image');

        await createMediaAsset('ws-1', payload);
        expect((pb.collection('media_assets') as any).create).toHaveBeenCalledTimes(1);
        expect(payload.get('workspace_id')).toBe('ws-1');

        await updateMediaAsset('asset-1', { tags: ['x'] });
        expect((pb.collection('media_assets') as any).update).toHaveBeenCalledWith('asset-1', { tags: ['x'] });
    });

    it('deletes one media asset with relation cleanup', async () => {
        const brandCollection = pb.collection('brand_identities') as any;
        const sharedGetFullList = brandCollection.getFullList;
        sharedGetFullList
            .mockResolvedValueOnce([{ id: 'b1', workspace_id: 'ws-1', logo: 'asset-1' }])
            .mockResolvedValueOnce([{ id: 'c1', workspace_id: 'ws-1', avatar: 'asset-1' }])
            .mockResolvedValueOnce([
            { id: 'm1', workspace_id: 'ws-1', primaryMediaIds: ['asset-1', 'other'] },
            ])
            .mockResolvedValueOnce([{ id: 'v1', workspace_id: 'ws-1', platformMediaIds: ['asset-1'] }]);

        const summary = await deleteMediaAssetWithCleanup('ws-1', 'asset-1');

        expect(summary.brands).toHaveLength(1);
        const updateCalls = brandCollection.update.mock.calls;
        expect(updateCalls).toEqual(
            expect.arrayContaining([
                expect.arrayContaining([expect.any(String), { logo: null }]),
                expect.arrayContaining([expect.any(String), { avatar: null }]),
                expect.arrayContaining([expect.any(String), { primaryMediaIds: expect.any(Array) }]),
                expect.arrayContaining([expect.any(String), { platformMediaIds: expect.any(Array) }]),
            ]),
        );
        expect((pb.collection('media_assets') as any).delete).toHaveBeenCalledWith('asset-1');
    });

    it('bulk deletes and reports failures', async () => {
        const mediaCollection = pb.collection('media_assets') as any;
        const brandCollection = pb.collection('brand_identities') as any;
        const sharedGetFullList = brandCollection.getFullList;
        sharedGetFullList
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([]);

        mediaCollection.delete
            .mockResolvedValueOnce(true)
            .mockRejectedValueOnce(new Error('cannot delete'));

        const progress = vi.fn();
        const result = await bulkDeleteMediaAssetsWithCleanup('ws-1', ['a1', 'a2'], progress);

        expect(progress).toHaveBeenCalledTimes(2);
        expect(result.deletedIds).toEqual(['a1']);
        expect(result.failed).toEqual([{ id: 'a2', error: 'cannot delete' }]);
    });
});
