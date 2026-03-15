import pb from './pocketbase';
import { MediaAsset } from '../models/schema';

export const getMediaAssetFileName = (value?: string): string => {
    if (!value) return '';
    return value.split('/').pop() || value;
};

export const getMediaAssetUrl = (item: MediaAsset): string => {
    const fileName = getMediaAssetFileName(item.file);
    if (!fileName) return '';

    const filesApi = (pb as unknown as { files?: { getURL?: (record: unknown, filename: string) => string } }).files;
    if (filesApi?.getURL) {
        return filesApi.getURL(item, fileName);
    }

    const collectionName = item.collectionName || 'media_assets';
    return `/pb/api/files/${collectionName}/${item.id}/${fileName}`;
};
