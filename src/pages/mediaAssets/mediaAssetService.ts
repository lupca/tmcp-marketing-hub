import pb from '../../lib/pocketbase';
import { MediaAsset } from '../../models/schema';
import { countMediaUsages, MediaUsageSummary, removeMediaReferenceFromArray } from './mediaAssetUtils';

const LIST_PAGE_SIZE = 200;

const sortMediaAssetsDesc = (items: MediaAsset[]): MediaAsset[] => {
    return [...items].sort((a, b) => {
        const left = a.updated || a.created || a.id;
        const right = b.updated || b.created || b.id;
        return right.localeCompare(left);
    });
};

export const listAllMediaAssets = async (workspaceId: string): Promise<MediaAsset[]> => {
    const filter = `workspace_id = "${workspaceId}"`;
    const firstPage = await pb.collection('media_assets').getList<MediaAsset>(1, LIST_PAGE_SIZE, { filter });

    const items = [...firstPage.items];
    const totalPages = firstPage.totalPages || 1;

    if (totalPages > 1) {
        for (let page = 2; page <= totalPages; page += 1) {
            const nextPage = await pb.collection('media_assets').getList<MediaAsset>(page, LIST_PAGE_SIZE, { filter });
            items.push(...nextPage.items);
        }
    }

    return sortMediaAssetsDesc(items);
};

export const createMediaAsset = async (
    workspaceId: string,
    payload: FormData | Record<string, unknown>,
): Promise<MediaAsset> => {
    if (payload instanceof FormData) {
        payload.append('workspace_id', workspaceId);
    }
    return pb.collection('media_assets').create<MediaAsset>(payload);
};

export const updateMediaAsset = async (assetId: string, payload: FormData | Record<string, unknown>): Promise<void> => {
    await pb.collection('media_assets').update(assetId, payload);
};

export const getMediaAssetUsageSummary = async (workspaceId: string, assetId: string): Promise<MediaUsageSummary> => {
    void workspaceId;

    const [brands, customers, masters, variants] = await Promise.all([
        pb.collection('brand_identities').getFullList<{ id: string; workspace_id?: string; workspace?: string; logo?: string | null }>({}),
        pb.collection('customer_personas').getFullList<{ id: string; workspace_id?: string; workspace?: string; avatar?: string | null }>({}),
        pb.collection('master_contents').getFullList<{
            id: string;
            workspace_id?: string;
            workspace?: string;
            primaryMediaIds?: string[] | null;
        }>({}),
        pb.collection('platform_variants').getFullList<{
            id: string;
            workspace_id?: string;
            workspace?: string;
            platformMediaIds?: string[] | null;
        }>({}),
    ]);

    const brandItems = brands.filter((record) => record.logo === assetId);
    const customerItems = customers.filter((record) => record.avatar === assetId);
    const masterItems = masters.filter(
        (record) => Array.isArray(record.primaryMediaIds) && record.primaryMediaIds.includes(assetId),
    );
    const variantItems = variants.filter(
        (record) => Array.isArray(record.platformMediaIds) && record.platformMediaIds.includes(assetId),
    );

    return {
        brands: brandItems,
        customers: customerItems,
        masterContents: masterItems,
        platformVariants: variantItems,
    };
};

export const cleanupMediaAssetReferences = async (assetId: string, summary: MediaUsageSummary): Promise<void> => {
    for (const record of summary.brands) {
        await pb.collection('brand_identities').update(record.id, { logo: null });
    }

    for (const record of summary.customers) {
        await pb.collection('customer_personas').update(record.id, { avatar: null });
    }

    for (const record of summary.masterContents) {
        const nextIds = removeMediaReferenceFromArray(record.primaryMediaIds, assetId);
        await pb.collection('master_contents').update(record.id, { primaryMediaIds: nextIds });
    }

    for (const record of summary.platformVariants) {
        const nextIds = removeMediaReferenceFromArray(record.platformMediaIds, assetId);
        await pb.collection('platform_variants').update(record.id, { platformMediaIds: nextIds });
    }
};

export const deleteMediaAssetWithCleanup = async (
    workspaceId: string,
    assetId: string,
): Promise<MediaUsageSummary> => {
    const summary = await getMediaAssetUsageSummary(workspaceId, assetId);
    await cleanupMediaAssetReferences(assetId, summary);
    await pb.collection('media_assets').delete(assetId);
    return summary;
};

export interface BulkDeleteProgress {
    current: number;
    total: number;
    assetId: string;
}

export interface BulkDeleteResult {
    deletedIds: string[];
    failed: Array<{ id: string; error: string }>;
    cleanedReferenceCount: number;
}

export const bulkDeleteMediaAssetsWithCleanup = async (
    workspaceId: string,
    assetIds: string[],
    onProgress?: (progress: BulkDeleteProgress) => void,
): Promise<BulkDeleteResult> => {
    const deletedIds: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];
    let cleanedReferenceCount = 0;

    for (let index = 0; index < assetIds.length; index += 1) {
        const assetId = assetIds[index];
        onProgress?.({ current: index + 1, total: assetIds.length, assetId });
        try {
            const summary = await deleteMediaAssetWithCleanup(workspaceId, assetId);
            cleanedReferenceCount += countMediaUsages(summary);
            deletedIds.push(assetId);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Unknown delete failure';
            failed.push({ id: assetId, error: message });
        }
    }

    return { deletedIds, failed, cleanedReferenceCount };
};
