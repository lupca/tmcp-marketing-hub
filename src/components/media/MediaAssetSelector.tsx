import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { Loader2, Upload, X } from 'lucide-react';
import { MediaAsset } from '../../models/schema';
import { getMediaAssetFileName, getMediaAssetUrl } from '../../lib/mediaAssetUrl';
import {
    isSupportedMediaMimeType,
    isValidMediaFileType,
    MAX_MEDIA_FILE_SIZE_BYTES,
    MediaFileType,
    parseRecordTags,
} from '../../pages/mediaAssets/mediaAssetUtils';
import { createMediaAsset, listAllMediaAssets } from '../../pages/mediaAssets/mediaAssetService';

interface MediaAssetSelectorProps {
    workspaceId: string;
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    multiple?: boolean;
    label: string;
    helperText?: string;
}

const inferFileType = (mimeType?: string): MediaFileType => {
    if (!mimeType) return 'doc';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('video/')) return 'video';
    return 'doc';
};

const renderPreview = (asset: MediaAsset) => {
    const url = getMediaAssetUrl(asset);
    if (!url) {
        return <span className="text-xs text-gray-400">No preview</span>;
    }

    if (asset.file_type === 'image') {
        return <img src={url} alt={getMediaAssetFileName(asset.file)} className="h-20 w-full object-cover rounded-md" />;
    }

    if (asset.file_type === 'video') {
        return <video src={url} className="h-20 w-full object-cover rounded-md" muted preload="metadata" controls={false} />;
    }

    return (
        <div className="h-20 w-full rounded-md bg-black/30 border border-glass-border flex items-center justify-center text-xs text-gray-300">
            {asset.file_type.toUpperCase()}
        </div>
    );
};

export default function MediaAssetSelector({
    workspaceId,
    selectedIds,
    onChange,
    multiple = true,
    label,
    helperText,
}: MediaAssetSelectorProps) {
    const [items, setItems] = useState<MediaAsset[]>([]);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState('');
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        try {
            const records = await listAllMediaAssets(workspaceId);
            setItems(records);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void load();
    }, [workspaceId]);

    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

    const filteredItems = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return items;

        return items.filter((item) => {
            const name = getMediaAssetFileName(item.file).toLowerCase();
            const tags = parseRecordTags(item.tags).join(' ').toLowerCase();
            return name.includes(q) || tags.includes(q) || item.file_type.includes(q);
        });
    }, [items, query]);

    const toggleItem = (assetId: string) => {
        if (!multiple) {
            onChange(selectedSet.has(assetId) ? [] : [assetId]);
            return;
        }

        if (selectedSet.has(assetId)) {
            onChange(selectedIds.filter((id) => id !== assetId));
            return;
        }
        onChange([...selectedIds, assetId]);
    };

    const handleQuickUpload = async (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0] || null;
        event.target.value = '';
        if (!file) return;
        setUploadError(null);

        if (!isSupportedMediaMimeType(file.type)) {
            setUploadError(`Unsupported file type: ${file.type || 'unknown'}`);
            return;
        }
        if (file.size > MAX_MEDIA_FILE_SIZE_BYTES) {
            setUploadError('File is too large. Max size is 100MB.');
            return;
        }

        const fileType = inferFileType(file.type);
        if (!isValidMediaFileType(fileType)) {
            setUploadError('Unable to determine file type for upload.');
            return;
        }

        const payload = new FormData();
        payload.append('file', file);
        payload.append('file_type', fileType);
        payload.append('tags', JSON.stringify([]));

        setUploading(true);
        try {
            const created = await createMediaAsset(workspaceId, payload);
            await load();

            if (created?.id) {
                if (multiple) {
                    if (!selectedSet.has(created.id)) {
                        onChange([...selectedIds, created.id]);
                    }
                } else {
                    onChange([created.id]);
                }
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Upload failed';
            setUploadError(message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <label className="block text-sm font-medium text-gray-300">{label}</label>
                    {helperText && <p className="text-xs text-gray-400 mt-1">{helperText}</p>}
                </div>
                <label className="inline-flex items-center gap-2 px-3 py-2 text-xs font-medium border border-blue-500/30 bg-blue-500/10 text-blue-300 rounded-md cursor-pointer hover:bg-blue-500/20 transition-colors">
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                    {uploading ? 'Uploading...' : 'Quick upload'}
                    <input
                        type="file"
                        className="hidden"
                        onChange={handleQuickUpload}
                        disabled={uploading}
                        data-testid="quick-upload-input"
                    />
                </label>
            </div>

            <input
                className="w-full px-3 py-2 text-sm border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors"
                placeholder="Search media by filename or tag..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            />

            {uploadError && <p className="text-xs text-red-300">{uploadError}</p>}

            <div className="max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                {loading ? (
                    <p className="text-sm text-gray-400">Loading media...</p>
                ) : filteredItems.length === 0 ? (
                    <p className="text-sm text-gray-400">No media assets found.</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {filteredItems.map((asset) => {
                            const checked = selectedSet.has(asset.id);
                            const tags = parseRecordTags(asset.tags);
                            return (
                                <button
                                    key={asset.id}
                                    type="button"
                                    onClick={() => toggleItem(asset.id)}
                                    className={`text-left p-2 rounded-lg border transition-colors ${
                                        checked
                                            ? 'border-blue-500/70 bg-blue-500/15'
                                            : 'border-glass-border bg-black/20 hover:bg-white/5'
                                    }`}
                                    data-testid={`media-option-${asset.id}`}
                                >
                                    {renderPreview(asset)}
                                    <p className="mt-2 text-xs text-gray-200 line-clamp-1">{getMediaAssetFileName(asset.file)}</p>
                                    <p className="text-[10px] text-gray-500 uppercase">{asset.file_type}</p>
                                    {tags.length > 0 && (
                                        <p className="text-[10px] text-gray-400 line-clamp-1 mt-1">{tags.join(', ')}</p>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedIds.map((id) => {
                        const item = items.find((asset) => asset.id === id);
                        if (!item) return null;
                        return (
                            <span
                                key={id}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-200"
                            >
                                {getMediaAssetFileName(item.file)}
                                <button
                                    type="button"
                                    className="text-blue-200 hover:text-white"
                                    onClick={() => onChange(selectedIds.filter((currentId) => currentId !== id))}
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
