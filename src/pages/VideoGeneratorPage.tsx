import { useCallback, useEffect, useRef, useState } from 'react';
import {
    AlertCircle,
    CheckCircle,
    Clock,
    Film,
    Loader2,
    Play,
    Plus,
    RefreshCw,
    Upload,
    X,
} from 'lucide-react';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { pb } from '../lib/pocketbase';
import { VideoJob, VideoJobStatus } from '../models/schema';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProductInput {
    text: string;
    hook: string;
    file: File | null;
}

const VARIANT_OPTIONS = [
    { value: 'A', label: 'A – Energetic' },
    { value: 'B', label: 'B – Smooth' },
    { value: 'C', label: 'C – Dramatic' },
] as const;

const STATUS_CONFIG: Record<VideoJobStatus, { color: string; icon: typeof Clock }> = {
    queued: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
    claimed: { color: 'bg-blue-100 text-blue-800', icon: Loader2 },
    rendering: { color: 'bg-blue-100 text-blue-800', icon: Loader2 },
    uploading: { color: 'bg-indigo-100 text-indigo-800', icon: Upload },
    done: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
    failed: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function computeIdempotencyKey(workspaceId: string, inputJson: Record<string, unknown>): Promise<string> {
    const payload = workspaceId + JSON.stringify(inputJson, Object.keys(inputJson).sort());
    const data = new TextEncoder().encode(payload);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function VideoGeneratorPage() {
    const { currentWorkspace } = useWorkspace();
    const toast = useToast();

    // Job list state
    const [jobs, setJobs] = useState<VideoJob[]>([]);
    const [loading, setLoading] = useState(true);

    // Create modal state
    const [showCreate, setShowCreate] = useState(false);
    const [introText, setIntroText] = useState('');
    const [outroText, setOutroText] = useState('');
    const [variant, setVariant] = useState('A');
    const [products, setProducts] = useState<ProductInput[]>([
        { text: '', hook: '', file: null },
        { text: '', hook: '', file: null },
    ]);
    const [musicFile, setMusicFile] = useState<File | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Detail modal state
    const [selectedJob, setSelectedJob] = useState<VideoJob | null>(null);

    // Realtime subscription ref
    const unsubRef = useRef<(() => void) | null>(null);

    // ------------------------------------------------------------------
    // Fetch jobs
    // ------------------------------------------------------------------
    const fetchJobs = useCallback(async () => {
        if (!currentWorkspace) return;
        try {
            const result = await pb.collection('video_jobs').getList<VideoJob>(1, 50, {
                filter: `workspace_id='${currentWorkspace.id}'`,
                sort: '-id',
            });
            setJobs(result.items);
        } catch (err) {
            console.error('Failed to fetch video jobs', err);
        } finally {
            setLoading(false);
        }
    }, [currentWorkspace]);

    // ------------------------------------------------------------------
    // Realtime subscription
    // ------------------------------------------------------------------
    useEffect(() => {
        if (!currentWorkspace) return;

        fetchJobs();

        // Subscribe to realtime updates for video_jobs
        const subscribe = async () => {
            try {
                const unsub = await pb.collection('video_jobs').subscribe<VideoJob>('*', (e) => {
                    if (e.record.workspace_id !== currentWorkspace.id) return;
                    setJobs((prev) => {
                        const idx = prev.findIndex((j) => j.id === e.record.id);
                        if (e.action === 'delete') {
                            return prev.filter((j) => j.id !== e.record.id);
                        }
                        if (idx >= 0) {
                            const updated = [...prev];
                            updated[idx] = e.record;
                            return updated;
                        }
                        return [e.record, ...prev];
                    });
                    // Also update detail modal if open
                    setSelectedJob((cur) => (cur?.id === e.record.id ? e.record : cur));
                });
                unsubRef.current = unsub;
            } catch (err) {
                console.error('Realtime subscription failed', err);
            }
        };
        subscribe();

        return () => {
            unsubRef.current?.();
            unsubRef.current = null;
        };
    }, [currentWorkspace, fetchJobs]);

    // ------------------------------------------------------------------
    // Create job
    // ------------------------------------------------------------------
    const handleCreate = async () => {
        if (!currentWorkspace) return;
        const validProducts = products.filter((p) => p.file && p.text);
        if (validProducts.length < 2) {
            toast.show('Cần ít nhất 2 sản phẩm có ảnh và tên', 'error');
            return;
        }
        if (!introText.trim() || !outroText.trim()) {
            toast.show('Vui lòng nhập intro text và outro text', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('workspace_id', currentWorkspace.id);
            formData.append('status', 'queued');
            formData.append('priority', '5');
            formData.append('variant_name', variant);
            formData.append('max_attempts', '3');
            formData.append('progress', '0');
            formData.append('attempt_count', '0');

            // Build input_json
            const inputJson = {
                intro_text: introText.trim(),
                outro_text: outroText.trim(),
                products: validProducts.map((p) => ({
                    image: p.file!.name,
                    text: p.text,
                    hook: p.hook,
                })),
            };
            formData.append('input_json', JSON.stringify(inputJson));

            // Idempotency key to prevent duplicates
            const idempotencyKey = await computeIdempotencyKey(currentWorkspace.id, inputJson);
            formData.append('idempotency_key', idempotencyKey);

            // Attach files
            for (const p of validProducts) {
                formData.append('input_images', p.file!);
            }
            if (musicFile) formData.append('input_music', musicFile);
            if (logoFile) formData.append('input_logo', logoFile);

            await pb.collection('video_jobs').create(formData);
            toast.show('Đã tạo video job thành công', 'success');
            resetForm();
            setShowCreate(false);
        } catch (err) {
            console.error('Failed to create video job', err);
            toast.show('Tạo video job thất bại', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    // ------------------------------------------------------------------
    // Product list management
    // ------------------------------------------------------------------
    const addProduct = () => {
        if (products.length >= 10) return;
        setProducts([...products, { text: '', hook: '', file: null }]);
    };
    const removeProduct = (idx: number) => {
        if (products.length <= 2) return;
        setProducts(products.filter((_, i) => i !== idx));
    };
    const updateProduct = (idx: number, field: keyof ProductInput, value: string | File | null) => {
        const updated = [...products];
        updated[idx] = { ...updated[idx], [field]: value };
        setProducts(updated);
    };

    const resetForm = () => {
        setIntroText('');
        setOutroText('');
        setVariant('A');
        setProducts([
            { text: '', hook: '', file: null },
            { text: '', hook: '', file: null },
        ]);
        setMusicFile(null);
        setLogoFile(null);
    };

    // ------------------------------------------------------------------
    // File URL helpers
    // ------------------------------------------------------------------
    const getVideoUrl = (job: VideoJob) => {
        if (!job.output_video) return '';
        return pb.files.getURL(job, job.output_video);
    };

    const getThumbnailUrl = (job: VideoJob) => {
        if (!job.thumbnail) return '';
        return pb.files.getURL(job, job.thumbnail);
    };

    // ------------------------------------------------------------------
    // Render
    // ------------------------------------------------------------------
    if (!currentWorkspace) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Video Generator</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Tạo video sản phẩm tự động từ ảnh và nội dung
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchJobs}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="h-4 w-4 mr-1" />
                        Tạo Video
                    </button>
                </div>
            </div>

            {/* Job List */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                </div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border">
                    <Film className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có video nào</h3>
                    <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách tạo video mới</p>
                </div>
            ) : (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-16">
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Thời gian
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Variant
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Trạng thái
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Tiến trình
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Hành động
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {jobs.map((job) => {
                                const cfg = STATUS_CONFIG[job.status];
                                const StatusIcon = cfg.icon;
                                return (
                                    <tr
                                        key={job.id}
                                        className="hover:bg-gray-50 cursor-pointer"
                                        onClick={() => setSelectedJob(job)}
                                    >
                                        <td className="px-4 py-4">
                                            {job.thumbnail ? (
                                                <img
                                                    src={getThumbnailUrl(job)}
                                                    alt=""
                                                    className="h-10 w-10 rounded object-cover"
                                                />
                                            ) : (
                                                <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                                                    <Film className="h-5 w-5 text-gray-400" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(job.created).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {job.variant_name || 'A'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}
                                            >
                                                <StatusIcon className="h-3 w-3" />
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {job.status === 'rendering' || job.status === 'uploading' ? (
                                                <div className="w-32">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                            <div
                                                                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                                                                style={{ width: `${job.progress}%` }}
                                                            />
                                                        </div>
                                                        <span className="text-xs text-gray-500">
                                                            {job.progress}%
                                                        </span>
                                                    </div>
                                                    {job.progress_stage && (
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            {job.progress_stage}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : job.status === 'done' ? (
                                                <span className="text-sm text-green-600">100%</span>
                                            ) : null}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            {job.status === 'done' && job.output_video && (
                                                <a
                                                    href={getVideoUrl(job)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800"
                                                >
                                                    <Play className="h-3 w-3 mr-1" />
                                                    Xem
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Detail Modal */}
            {selectedJob && (
                <Modal title="Chi tiết Video Job" onClose={() => setSelectedJob(null)}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Trạng thái</p>
                                <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CONFIG[selectedJob.status].color}`}
                                >
                                    {selectedJob.status}
                                </span>
                            </div>
                            <div>
                                <p className="text-gray-500">Variant</p>
                                <p className="font-medium">{selectedJob.variant_name || 'A'}</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Tiến trình</p>
                                <p className="font-medium">{selectedJob.progress}%</p>
                            </div>
                            <div>
                                <p className="text-gray-500">Tạo lúc</p>
                                <p className="font-medium">
                                    {new Date(selectedJob.created).toLocaleString('vi-VN')}
                                </p>
                            </div>
                            {selectedJob.render_duration_ms != null && selectedJob.render_duration_ms > 0 && (
                                <div>
                                    <p className="text-gray-500">Thời gian render</p>
                                    <p className="font-medium">
                                        {Math.round(selectedJob.render_duration_ms / 1000)}s
                                    </p>
                                </div>
                            )}
                            {selectedJob.error_message && (
                                <div className="col-span-2">
                                    <p className="text-gray-500">Lỗi</p>
                                    <p className="text-red-600 text-xs font-mono whitespace-pre-wrap">
                                        {selectedJob.error_message}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Progress bar */}
                        {(selectedJob.status === 'rendering' || selectedJob.status === 'uploading') && (
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-sm text-gray-600">
                                        {selectedJob.progress_stage || 'Đang xử lý...'}
                                    </span>
                                    <span className="text-sm font-medium">{selectedJob.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${selectedJob.progress}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Video preview */}
                        {selectedJob.status === 'done' && selectedJob.output_video && (
                            <div>
                                <p className="text-sm text-gray-500 mb-2">Video hoàn thành</p>
                                <video
                                    src={getVideoUrl(selectedJob)}
                                    controls
                                    className="w-full rounded-lg bg-black"
                                    style={{ maxHeight: '400px' }}
                                />
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {/* Create Modal */}
            {showCreate && (
                <Modal
                    title="Tạo Video Mới"
                    onClose={() => {
                        setShowCreate(false);
                        resetForm();
                    }}
                    footer={
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setShowCreate(false);
                                    resetForm();
                                }}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={submitting}
                                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                                {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                                Tạo Video
                            </button>
                        </div>
                    }
                >
                    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                        {/* Intro / Outro Text */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Intro Text <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={introText}
                                onChange={(e) => setIntroText(e.target.value)}
                                placeholder="VD: Top sản phẩm bán chạy tháng 6"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Outro Text <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={outroText}
                                onChange={(e) => setOutroText(e.target.value)}
                                placeholder="VD: Mua ngay hôm nay!"
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                        </div>

                        {/* Variant */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Variant</label>
                            <select
                                value={variant}
                                onChange={(e) => setVariant(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                                {VARIANT_OPTIONS.map((v) => (
                                    <option key={v.value} value={v.value}>
                                        {v.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Products */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Sản phẩm ({products.length}/10){' '}
                                    <span className="text-red-500">*</span>
                                </label>
                                {products.length < 10 && (
                                    <button
                                        type="button"
                                        onClick={addProduct}
                                        className="text-xs text-blue-600 hover:text-blue-800"
                                    >
                                        <Plus className="h-3 w-3 inline mr-0.5" />
                                        Thêm sản phẩm
                                    </button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {products.map((p, idx) => (
                                    <div
                                        key={idx}
                                        className="flex gap-2 items-start p-3 border rounded-md bg-gray-50"
                                    >
                                        <div className="flex-1 space-y-2">
                                            <input
                                                type="text"
                                                value={p.text}
                                                onChange={(e) =>
                                                    updateProduct(idx, 'text', e.target.value)
                                                }
                                                placeholder="Tên sản phẩm"
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            />
                                            <input
                                                type="text"
                                                value={p.hook}
                                                onChange={(e) =>
                                                    updateProduct(idx, 'hook', e.target.value)
                                                }
                                                placeholder="Hook (VD: Giảm 50%)"
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                            />
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) =>
                                                    updateProduct(
                                                        idx,
                                                        'file',
                                                        e.target.files?.[0] ?? null
                                                    )
                                                }
                                                className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                        </div>
                                        {products.length > 2 && (
                                            <button
                                                type="button"
                                                onClick={() => removeProduct(idx)}
                                                className="mt-1 text-gray-400 hover:text-red-500"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Optional: Music */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Nhạc nền (tùy chọn)
                            </label>
                            <input
                                type="file"
                                accept="audio/*"
                                onChange={(e) => setMusicFile(e.target.files?.[0] ?? null)}
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>

                        {/* Optional: Logo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Logo (tùy chọn)
                            </label>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)}
                                className="mt-1 block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
