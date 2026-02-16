import { useEffect, useState } from 'react';
import pb from '../lib/pocketbase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Search, Edit2, Trash2, Share2, Globe, Send } from 'lucide-react';
import { PlatformVariant, MasterContent, MarketingCampaign } from '../models/schema';

// Platforms allowed in schema: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'tiktok' | 'youtube' | 'blog' | 'email'
const platforms = ['facebook', 'instagram', 'linkedin', 'twitter', 'tiktok', 'youtube', 'blog', 'email'];

export default function SocialPostsPage() {
    const { currentWorkspace } = useWorkspace();
    const [items, setItems] = useState<PlatformVariant[]>([]);
    const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState<'create' | 'edit' | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState({
        platform: 'facebook',
        content: '', // Maps to adapted_copy
        scheduled_at: '',
        status: 'draft',
        publication_url: '' // Not in schema explicitly, but maybe metadata
    });

    const [editId, setEditId] = useState<string | null>(null); // This tracks the VARIANT ID
    const toast = useToast();

    const load = async () => {
        if (!currentWorkspace) return;
        setLoading(true);
        try {
            const filter = `workspace_id = "${currentWorkspace.id}"`;

            // We list platform_variants as the main items
            const [res, campRes] = await Promise.all([
                pb.collection('platform_variants').getList<PlatformVariant>(1, 200, {
                    filter,
                    sort: '-created',
                    expand: 'master_content_id'
                }),
                pb.collection('marketing_campaigns').getList<MarketingCampaign>(1, 200, { filter })
            ]);

            setItems(res.items);
            setCampaigns(campRes.items);
        } catch (e: any) {
            toast.show(e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [currentWorkspace?.id]);

    const filtered = items.filter(i =>
        i.adapted_copy?.toLowerCase().includes(search.toLowerCase()) ||
        i.platform.toLowerCase().includes(search.toLowerCase())
    );

    const openCreate = () => {
        setForm({
            platform: 'facebook',
            content: '',
            scheduled_at: '',
            status: 'draft',
            publication_url: ''
        });
        setEditId(null);
        setModal('create');
    };

    const openEdit = (item: PlatformVariant) => {
        setForm({
            platform: item.platform || 'facebook',
            content: item.adapted_copy || '',
            scheduled_at: item.scheduled_at || '',
            status: item.publish_status || 'draft',
            publication_url: '' // TODO: map from metadata if exists
        });
        setEditId(item.id);
        setModal('edit');
    };

    const handleSave = async () => {
        if (!currentWorkspace) return;
        try {
            // New Schema Workflow:
            // 1. Ensure a MasterContent exists. 
            //    For "Quick Posts" locally, we create a MasterContent generated on the fly.

            if (modal === 'create') {
                // Step 1: Create generic Master Content container
                const masterBody = {
                    workspace_id: currentWorkspace.id,
                    core_message: form.content, // Use the post content as core message too
                    primaryMediaIds: [],
                    approval_status: 'approved' // Auto-approve quick posts
                };
                const masterRecord = await pb.collection('master_contents').create<MasterContent>(masterBody);

                // Step 2: Create Platform Variant
                const variantBody = {
                    workspace_id: currentWorkspace.id,
                    master_content_id: masterRecord.id,
                    platform: form.platform,
                    adapted_copy: form.content,
                    publish_status: form.status,
                    scheduled_at: form.scheduled_at || null,
                    platformMediaIds: []
                };
                await pb.collection('platform_variants').create(variantBody);
                toast.show('Post created!', 'success');
            } else if (modal === 'edit' && editId) {
                const body = {
                    platform: form.platform,
                    adapted_copy: form.content,
                    publish_status: form.status,
                    scheduled_at: form.scheduled_at || null
                };
                await pb.collection('platform_variants').update(editId, body);

                // We typically don't update the master content from a specific variant edit
                // unless we want two-way sync, which is complex. Keeping it simple.
                toast.show('Post updated!', 'success');
            }

            setModal(null);
            load();
        } catch (e: any) {
            toast.show(e.message, 'error');
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            // Optional: Check if we should delete the master content too if it's the only variant?
            // For now, just deleting the variant is safe.
            await pb.collection('platform_variants').delete(deleteId);
            toast.show('Post deleted', 'success');
            setDeleteId(null);
            load();
        } catch (e: any) {
            toast.show(e.message, 'error');
        }
    };

    const getPlatformColor = (p: string) => {
        const map: any = {
            facebook: 'bg-blue-100 text-blue-800',
            twitter: 'bg-sky-100 text-sky-800',
            linkedin: 'bg-indigo-100 text-indigo-800',
            instagram: 'bg-pink-100 text-pink-800',
            tiktok: 'bg-gray-800 text-white',
            youtube: 'bg-red-100 text-red-800',
            blog: 'bg-orange-100 text-orange-800',
            email: 'bg-purple-100 text-purple-800'
        };
        return map[p] || 'bg-gray-100 text-gray-800';
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-900">Social Posts</h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                                placeholder="Search content..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" onClick={openCreate}>
                            <Plus size={18} /> <span className="hidden sm:inline">New Post</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                        <Share2 size={48} className="mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900">No posts yet</h3>
                        <p>Create content and adapt it for different platforms.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500">Platform</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500">Content</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                                    <th className="px-6 py-3 text-left font-medium text-gray-500">Scheduled</th>
                                    <th className="px-6 py-3 text-right font-medium text-gray-500">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filtered.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-xs font-semibold capitalize ${getPlatformColor(item.platform)}`}>
                                                {item.platform}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 max-w-sm truncate" title={item.adapted_copy}>
                                            {item.adapted_copy || <span className="italic text-gray-400">No content</span>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border capitalize ${item.publish_status === 'published' ? 'bg-green-50 text-green-700 border-green-200' :
                                                item.publish_status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                    item.publish_status === 'failed' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-gray-50 text-gray-600 border-gray-200'
                                                }`}>
                                                {item.publish_status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {item.scheduled_at ? new Date(item.scheduled_at).toLocaleString() : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button title="Edit" className="text-gray-400 hover:text-blue-600" onClick={() => openEdit(item)}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button title="Delete" className="text-gray-400 hover:text-red-600" onClick={() => setDeleteId(item.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {modal && (
                <Modal
                    title={modal === 'edit' ? 'Edit Social Post' : 'New Social Post'}
                    onClose={() => setModal(null)}
                    footer={
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onClick={() => setModal(null)}>Cancel</button>
                            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700" onClick={handleSave}>Save</button>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Platform</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 capitalize" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
                                    {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 capitalize" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                    <option value="draft">Draft</option>
                                    <option value="scheduled">Scheduled</option>
                                    <option value="published">Published</option>
                                    <option value="failed">Failed</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                            <input type="datetime-local" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                            <textarea className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-32" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write your post content here..." />
                        </div>
                    </div>
                </Modal>
            )}

            {deleteId && <ConfirmDialog message="Delete this post?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
        </>
    );
}
