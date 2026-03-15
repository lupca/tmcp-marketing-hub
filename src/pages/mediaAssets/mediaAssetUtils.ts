export const ALLOWED_MEDIA_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

export const MAX_MEDIA_FILE_SIZE_BYTES = 100 * 1024 * 1024;

export type MediaFileType = 'image' | 'video' | 'doc';

export type MediaAspectRatio = '1:1' | '16:9' | '9:16' | '4:5' | '4:3' | 'N/A';

export const isValidMediaFileType = (value: string): value is MediaFileType => {
    return value === 'image' || value === 'video' || value === 'doc';
};

export const parseTagsInput = (value: string): string[] => {
    return value
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
};

export const parseRecordTags = (value: unknown): string[] => {
    if (!value) return [];

    if (Array.isArray(value)) {
        return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
    }

    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean);
            }
        } catch {
            return parseTagsInput(value);
        }
    }

    return [];
};

export const stringifyTags = (tags: string[]): string => JSON.stringify(tags);

export const normalizeRelationArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
};

export interface MediaUsageSummary {
    brands: Array<{ id: string }>;
    customers: Array<{ id: string }>;
    masterContents: Array<{ id: string; primaryMediaIds?: string[] | null }>;
    platformVariants: Array<{ id: string; platformMediaIds?: string[] | null }>;
}

export const countMediaUsages = (summary: MediaUsageSummary): number => {
    return summary.brands.length + summary.customers.length + summary.masterContents.length + summary.platformVariants.length;
};

export const removeMediaReferenceFromArray = (value: unknown, mediaAssetId: string): string[] => {
    return normalizeRelationArray(value).filter((item) => item !== mediaAssetId);
};

export const isSupportedMediaMimeType = (mimeType: string): boolean => {
    return ALLOWED_MEDIA_MIME_TYPES.includes(mimeType as (typeof ALLOWED_MEDIA_MIME_TYPES)[number]);
};
