import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { CheckSquare, Edit2, FileImage, FileText, Plus, Search, Square, Trash2 } from 'lucide-react';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { useWorkspace } from '../contexts/WorkspaceContext';
import pb from '../lib/pocketbase';
import { MediaAsset } from '../models/schema';
import {
    countMediaUsages,
    isSupportedMediaMimeType,
    isValidMediaFileType,
    MAX_MEDIA_FILE_SIZE_BYTES,
    MediaAspectRatio,
    MediaFileType,
    MediaUsageSummary,
    parseRecordTags,
    parseTagsInput,
    stringifyTags,
} from './mediaAssets/mediaAssetUtils';
import {
    bulkDeleteMediaAssetsWithCleanup,
    createMediaAsset,
    deleteMediaAssetWithCleanup,
    getMediaAssetUsageSummary,
    listAllMediaAssets,
    updateMediaAsset,
} from './mediaAssets/mediaAssetService';

type AssetModalMode = 'create' | 'edit' | null;

type AssetFormState = {
    fileType: MediaFileType;
    aspectRatio: '' | MediaAspectRatio;
    tagsInput: string;
    file: File | null;
};

const defaultFormState: AssetFormState = {
    fileType: 'image',
    aspectRatio: '',
    tagsInput: '',
    file: null,
};

const aspectRatioOptions: Array<'' | MediaAspectRatio> = ['', '1:1', '16:9', '9:16', '4:5', '4:3', 'N/A'];
const PAGE_SIZE = 12;

const getFileName = (value?: string): string => {
    if (!value) return '';
    return value.split('/').pop() || value;
};

const getMediaUrl = (item: MediaAsset): string => {
    const fileName = getFileName(item.file);
    if (!fileName) return '';
    if ((pb as unknown as { files?: { getURL?: (record: unknown, filename: string) => string } }).files?.getURL) {
        return (pb as unknown as { files: { getURL: (record: unknown, filename: string) => string } }).files.getURL(item, fileName);
    }
    const collectionName = item.collectionName || 'media_assets';
    return `/pb/api/files/${collectionName}/${item.id}/${fileName}`;
};

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleString();
};

const getUsageMessage = (summary: MediaUsageSummary): string => {
    const parts: string[] = [];
    if (summary.brands.length > 0) parts.push(`${summary.brands.length} brand`);
    if (summary.customers.length > 0) parts.push(`${summary.customers.length} customer`);
    if (summary.masterContents.length > 0) parts.push(`${summary.masterContents.length} master content`);
    if (summary.platformVariants.length > 0) parts.push(`${summary.platformVariants.length} platform variant`);
    return parts.join(', ');
};

const getFileExtension = (filename?: string): string => {
    const file = getFileName(filename);
    const extension = file.split('.').pop();
    return extension ? extension.toUpperCase() : 'FILE';
};

export default function MediaAssetsPage() {
    const { currentWorkspace } = useWorkspace();
    const toast = useToast();

    const [items, setItems] = useState<MediaAsset[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [fileTypeFilter, setFileTypeFilter] = useState<'all' | MediaFileType>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const [modal, setModal] = useState<AssetModalMode>(null);
    const [editItem, setEditItem] = useState<MediaAsset | null>(null);
    const [form, setForm] = useState<AssetFormState>(defaultFormState);
    const [saving, setSaving] = useState(false);

    const [deleteItem, setDeleteItem] = useState<MediaAsset | null>(null);
    const [deleteUsageSummary, setDeleteUsageSummary] = useState<MediaUsageSummary | null>(null);
    const [checkingUsage, setCheckingUsage] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [bulkDeleteIds, setBulkDeleteIds] = useState<string[]>([]);
    const [bulkUsageSummary, setBulkUsageSummary] = useState<Record<string, MediaUsageSummary>>({});
    const [bulkDeleteProgressText, setBulkDeleteProgressText] = useState('');

    const load = async () => {
        if (!currentWorkspace) {
            setItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const records = await listAllMediaAssets(currentWorkspace.id);
            setItems(records);
            setSelectedIds([]);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Failed to load media assets';
            toast.show(message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [currentWorkspace?.id]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, fileTypeFilter]);

    const filteredItems = useMemo(() => {
        const query = search.trim().toLowerCase();
        return items.filter((item) => {
            if (fileTypeFilter !== 'all' && item.file_type !== fileTypeFilter) {
                return false;
            }

            if (!query) {
                return true;
            }

            const fileName = getFileName(item.file).toLowerCase();
            const tags = parseRecordTags(item.tags).join(' ').toLowerCase();
            const aspectRatio = (item.aspect_ratio || '').toLowerCase();
            return fileName.includes(query) || tags.includes(query) || aspectRatio.includes(query);
        });
    }, [items, search, fileTypeFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
    const pageStart = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filteredItems.slice(pageStart, pageStart + PAGE_SIZE);
    const allCurrentPageSelected = pageItems.length > 0 && pageItems.every((item) => selectedIds.includes(item.id));

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const openCreate = () => {
        setEditItem(null);
        setForm(defaultFormState);
        setModal('create');
    };

    const openEdit = (item: MediaAsset) => {
        setEditItem(item);
        setForm({
            fileType: item.file_type,
            aspectRatio: item.aspect_ratio ?? '',
            tagsInput: parseRecordTags(item.tags).join(', '),
            file: null,
        });
        setModal('edit');
    };

    const validateFile = (file: File): string | null => {
        if (!isSupportedMediaMimeType(file.type)) {
            return `Unsupported file type: ${file.type || 'unknown'}`;
        }
        if (file.size > MAX_MEDIA_FILE_SIZE_BYTES) {
            return 'File is too large. Max size is 100MB.';
        }
        return null;
    };

    const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0] || null;
        if (!selectedFile) {
            setForm((prev) => ({ ...prev, file: null }));
            return;
        }

        const validationError = validateFile(selectedFile);
        if (validationError) {
            toast.show(validationError, 'error');
            event.target.value = '';
            return;
        }

        setForm((prev) => ({ ...prev, file: selectedFile }));
    };

    const buildPayload = (): FormData | Record<string, unknown> => {
        const tags = parseTagsInput(form.tagsInput);

        if (form.file) {
            const payload = new FormData();
            payload.append('file_type', form.fileType);
            payload.append('tags', stringifyTags(tags));
            payload.append('file', form.file);
            if (form.aspectRatio) {
                payload.append('aspect_ratio', form.aspectRatio);
            }
            return payload;
        }

        return {
            file_type: form.fileType,
            aspect_ratio: form.aspectRatio || null,
            tags,
        };
    };

    const handleSave = async () => {
        if (!currentWorkspace) {
            toast.show('Please select a workspace first', 'error');
            return;
        }

        if (!isValidMediaFileType(form.fileType)) {
            toast.show('Please choose a valid file type', 'error');
            return;
        }

        if (modal === 'create' && !form.file) {
            toast.show('Please select a file to upload', 'error');
            return;
        }

        setSaving(true);
        try {
            const payload = buildPayload();

            if (modal === 'create') {
                await createMediaAsset(currentWorkspace.id, payload);
                toast.show('Media asset created', 'success');
            } else if (modal === 'edit' && editItem) {
                await updateMediaAsset(editItem.id, payload);
                toast.show('Media asset updated', 'success');
            }

            setModal(null);
            setEditItem(null);
            setForm(defaultFormState);
            await load();
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Failed to save media asset';
            toast.show(message, 'error');
        } finally {
            setSaving(false);
        }
    };

    const fetchUsageSummary = async (assetId: string): Promise<MediaUsageSummary> => {
        if (!currentWorkspace) return { brands: [], customers: [], masterContents: [], platformVariants: [] };
        return getMediaAssetUsageSummary(currentWorkspace.id, assetId);
    };

    const openDelete = async (item: MediaAsset) => {
        setDeleteItem(item);
        setDeleteUsageSummary(null);
        setCheckingUsage(true);
        try {
            const summary = await fetchUsageSummary(item.id);
            setDeleteUsageSummary(summary);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Failed to analyze references';
            toast.show(message, 'error');
        } finally {
            setCheckingUsage(false);
        }
    };

    const closeDeleteModal = () => {
        if (deleting) return;
        setDeleteItem(null);
        setDeleteUsageSummary(null);
        setBulkDeleteIds([]);
        setBulkUsageSummary({});
        setBulkDeleteProgressText('');
        setCheckingUsage(false);
    };

    const cleanupAndDelete = async () => {
        if (!currentWorkspace) return;
        if (!deleteItem && bulkDeleteIds.length === 0) return;

        setDeleting(true);
        try {
            if (deleteItem) {
                await deleteMediaAssetWithCleanup(currentWorkspace.id, deleteItem.id);
                toast.show('Media asset deleted and references cleaned', 'success');
            } else {
                const result = await bulkDeleteMediaAssetsWithCleanup(
                    currentWorkspace.id,
                    bulkDeleteIds,
                    (progress) => setBulkDeleteProgressText(`Deleting ${progress.current}/${progress.total}...`),
                );

                if (result.failed.length > 0) {
                    toast.show(
                        `Bulk delete finished: ${result.deletedIds.length} deleted, ${result.failed.length} failed`,
                        'info',
                    );
                } else {
                    toast.show(
                        `Bulk delete successful: ${result.deletedIds.length} assets, ${result.cleanedReferenceCount} references cleaned`,
                        'success',
                    );
                }
            }

            closeDeleteModal();
            await load();
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Failed to delete media asset';
            toast.show(`Delete failed: ${message}`, 'error');
            await load();
        } finally {
            setDeleting(false);
            setBulkDeleteProgressText('');
        }
    };

    const toggleSelectItem = (assetId: string) => {
        setSelectedIds((prev) => (prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]));
    };

    const toggleSelectCurrentPage = () => {
        const currentIds = pageItems.map((item) => item.id);
        setSelectedIds((prev) => {
            if (allCurrentPageSelected) {
                return prev.filter((id) => !currentIds.includes(id));
            }
            const next = new Set([...prev, ...currentIds]);
            return Array.from(next);
        });
    };

    const openBulkDelete = async () => {
        if (!currentWorkspace || selectedIds.length === 0) return;
        setDeleteItem(null);
        setDeleteUsageSummary(null);
        setBulkDeleteIds(selectedIds);
        setBulkUsageSummary({});
        setCheckingUsage(true);
        try {
            const summaries = await Promise.all(
                selectedIds.map(async (assetId) => ({ assetId, summary: await getMediaAssetUsageSummary(currentWorkspace.id, assetId) })),
            );
            const next: Record<string, MediaUsageSummary> = {};
            for (const entry of summaries) next[entry.assetId] = entry.summary;
            setBulkUsageSummary(next);
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : 'Failed to analyze bulk references';
            toast.show(message, 'error');
        } finally {
            setCheckingUsage(false);
        }
    };

    const totalBulkReferences = Object.values(bulkUsageSummary).reduce((sum, summary) => sum + countMediaUsages(summary), 0);

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex flex-col lg:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-900">Media Assets</h2>
                    <div className="flex gap-2 w-full lg:w-auto">
                        <div className="relative flex-1 lg:flex-initial">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full lg:w-64"
                                placeholder="Search file/tags..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <select
                            aria-label="Filter by type"
                            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            value={fileTypeFilter}
                            onChange={(e) => setFileTypeFilter(e.target.value as 'all' | MediaFileType)}
                        >
                            <option value="all">All types</option>
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                            <option value="doc">Document</option>
                        </select>
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                            disabled={selectedIds.length === 0}
                            onClick={() => void openBulkDelete()}
                        >
                            <Trash2 size={18} /> <span className="hidden sm:inline">Delete Selected ({selectedIds.length})</span>
                        </button>
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            onClick={openCreate}
                        >
                            <Plus size={18} /> <span className="hidden sm:inline">New Asset</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : !currentWorkspace ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                        <h3 className="text-lg font-medium text-gray-900">No workspace selected</h3>
                        <p>Please select a workspace to manage media assets.</p>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                        <FileImage size={48} className="mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900">No media assets yet</h3>
                        <p>Upload files to build your reusable media library.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <button
                                            type="button"
                                            aria-label="Select current page"
                                            onClick={toggleSelectCurrentPage}
                                            className="text-gray-500 hover:text-gray-700"
                                        >
                                            {allCurrentPageSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                                        </button>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preview</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aspect Ratio</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tags</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pageItems.map((item) => {
                                    const mediaUrl = getMediaUrl(item);
                                    const tags = parseRecordTags(item.tags);
                                    const isImage = item.file_type === 'image';
                                    const isVideo = item.file_type === 'video';
                                    const isSelected = selectedIds.includes(item.id);

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    title={isSelected ? 'Unselect asset' : 'Select asset'}
                                                    onClick={() => toggleSelectItem(item.id)}
                                                    className="text-gray-500 hover:text-gray-700"
                                                >
                                                    {isSelected ? <CheckSquare size={16} /> : <Square size={16} />}
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-20 w-28 rounded border border-gray-200 bg-gray-100 flex items-center justify-center overflow-hidden">
                                                        {isImage && mediaUrl ? (
                                                            <img src={mediaUrl} alt={getFileName(item.file)} className="h-full w-full object-cover" />
                                                        ) : isVideo && mediaUrl ? (
                                                            <video className="h-full w-full object-cover" src={mediaUrl} controls muted preload="metadata" />
                                                        ) : (
                                                            <div className="flex flex-col items-center gap-1 text-gray-700">
                                                                <FileText size={18} className="text-gray-600" />
                                                                <span className="text-[10px] font-semibold px-1 py-0.5 rounded bg-gray-200 text-gray-700">
                                                                    {getFileExtension(item.file)}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-gray-900 truncate max-w-[240px]">{getFileName(item.file)}</p>
                                                        {mediaUrl && (
                                                            <a
                                                                href={mediaUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="text-xs text-blue-600 hover:underline"
                                                            >
                                                                Open file
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 uppercase">{item.file_type}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.aspect_ratio || 'N/A'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                <div className="flex flex-wrap gap-1 max-w-[280px]">
                                                    {tags.length === 0 ? (
                                                        <span className="text-gray-400">No tags</span>
                                                    ) : (
                                                        tags.map((tag) => (
                                                            <span key={`${item.id}-${tag}`} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                                                                {tag}
                                                            </span>
                                                        ))
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{formatDate(item.updated)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <button title="Edit" className="text-gray-400 hover:text-blue-600" onClick={() => openEdit(item)}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button title="Delete" className="text-gray-400 hover:text-red-600" onClick={() => void openDelete(item)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {!loading && filteredItems.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <p className="text-sm text-gray-600">
                            Showing {pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, filteredItems.length)} of {filteredItems.length} assets
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-50"
                                disabled={currentPage <= 1}
                                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            >
                                Previous
                            </button>
                            <span className="text-sm text-gray-700">Page {currentPage} / {totalPages}</span>
                            <button
                                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md disabled:opacity-50"
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {modal && (
                <Modal
                    title={modal === 'create' ? 'Upload Media Asset' : 'Edit Media Asset'}
                    onClose={() => {
                        if (saving) return;
                        setModal(null);
                        setEditItem(null);
                        setForm(defaultFormState);
                    }}
                    footer={
                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                onClick={() => {
                                    if (saving) return;
                                    setModal(null);
                                    setEditItem(null);
                                    setForm(defaultFormState);
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-60"
                                onClick={() => void handleSave()}
                                disabled={saving}
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="media-file" className="block text-sm font-medium text-gray-700 mb-1">
                                File {modal === 'create' ? '*' : '(optional)'}
                            </label>
                            <input
                                id="media-file"
                                type="file"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                onChange={handleFileSelect}
                            />
                            {modal === 'edit' && editItem && (
                                <p className="mt-1 text-xs text-gray-500">Current file: {getFileName(editItem.file)}</p>
                            )}
                            {form.file && (
                                <p className="mt-1 text-xs text-gray-500">Selected file: {form.file.name}</p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="media-file-type" className="block text-sm font-medium text-gray-700 mb-1">
                                    File Type *
                                </label>
                                <select
                                    id="media-file-type"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    value={form.fileType}
                                    onChange={(e) => setForm((prev) => ({ ...prev, fileType: e.target.value as MediaFileType }))}
                                >
                                    <option value="image">Image</option>
                                    <option value="video">Video</option>
                                    <option value="doc">Document</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="media-aspect-ratio" className="block text-sm font-medium text-gray-700 mb-1">
                                    Aspect Ratio
                                </label>
                                <select
                                    id="media-aspect-ratio"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    value={form.aspectRatio}
                                    onChange={(e) => setForm((prev) => ({ ...prev, aspectRatio: e.target.value as '' | MediaAspectRatio }))}
                                >
                                    {aspectRatioOptions.map((option) => (
                                        <option key={option || 'empty'} value={option}>
                                            {option || 'Not set'}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="media-tags" className="block text-sm font-medium text-gray-700 mb-1">
                                Tags
                            </label>
                            <input
                                id="media-tags"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                placeholder="banner, sale, social"
                                value={form.tagsInput}
                                onChange={(e) => setForm((prev) => ({ ...prev, tagsInput: e.target.value }))}
                            />
                            <p className="mt-1 text-xs text-gray-500">Separate tags with commas.</p>
                        </div>
                    </div>
                </Modal>
            )}

            {(deleteItem || bulkDeleteIds.length > 0) && (
                <Modal
                    title={deleteItem ? 'Delete Media Asset' : `Delete ${bulkDeleteIds.length} Media Assets`}
                    onClose={closeDeleteModal}
                    footer={
                        <div className="flex justify-end gap-3">
                            <button
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                onClick={closeDeleteModal}
                                disabled={deleting}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-60"
                                onClick={() => void cleanupAndDelete()}
                                disabled={checkingUsage || deleting || (!deleteUsageSummary && bulkDeleteIds.length === 0)}
                            >
                                {deleting ? 'Deleting...' : deleteItem ? 'Delete Asset' : `Delete ${bulkDeleteIds.length} Assets`}
                            </button>
                        </div>
                    }
                >
                    {checkingUsage ? (
                        <div className="py-4 text-gray-700">Checking related records...</div>
                    ) : deleteItem && deleteUsageSummary ? (
                        <div className="space-y-3 text-gray-700">
                            <p>
                                This will delete <strong>{getFileName(deleteItem.file)}</strong>.
                            </p>
                            <p>
                                The system found <strong>{countMediaUsages(deleteUsageSummary)}</strong> reference(s):{' '}
                                {getUsageMessage(deleteUsageSummary) || 'none'}.
                            </p>
                            <p className="text-sm text-amber-600">
                                Before deleting, all related references will be removed automatically.
                            </p>
                            <p className="text-sm text-red-600 font-medium">This action cannot be undone.</p>
                        </div>
                    ) : bulkDeleteIds.length > 0 ? (
                        <div className="space-y-3 text-gray-700">
                            <p>
                                You are deleting <strong>{bulkDeleteIds.length}</strong> assets.
                            </p>
                            <p>
                                Total related references to cleanup: <strong>{totalBulkReferences}</strong>.
                            </p>
                            {bulkDeleteProgressText && <p className="text-sm text-blue-600">{bulkDeleteProgressText}</p>}
                            <p className="text-sm text-amber-600">
                                Every selected asset will be cleaned from Brand, Customer, Master Content, and Platform Variant references before deletion.
                            </p>
                            <p className="text-sm text-red-600 font-medium">This action cannot be undone.</p>
                        </div>
                    ) : (
                        <div className="py-4 text-sm text-red-600">Unable to inspect references. Please close and try again.</div>
                    )}
                </Modal>
            )}
        </>
    );
}
