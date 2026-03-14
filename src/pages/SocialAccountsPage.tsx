import { useEffect, useState } from 'react';
import { Edit2, Plus, Search, Share2, Trash2 } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import Modal from '../components/Modal';
import { useToast } from '../components/Toast';
import { useWorkspace } from '../contexts/WorkspaceContext';
import pb from '../lib/pocketbase';
import { SocialAccount } from '../models/schema';

type SocialAccountForm = {
    platform: SocialAccount['platform'];
    account_name: string;
    account_id: string;
    access_token: string;
    refresh_token: string;
    expires_at: string;
};

const defaultForm: SocialAccountForm = {
    platform: 'facebook',
    account_name: '',
    account_id: '',
    access_token: '',
    refresh_token: '',
    expires_at: '',
};

export default function SocialAccountsPage() {
    const { currentWorkspace } = useWorkspace();
    const toast = useToast();

    const [items, setItems] = useState<SocialAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState<'create' | 'edit' | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<SocialAccountForm>(defaultForm);

    const load = async () => {
        if (!currentWorkspace) {
            setItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const filter = `workspace_id = "${currentWorkspace.id}"`;
            const res = await pb.collection('social_accounts').getList<SocialAccount>(1, 200, { filter });
            setItems(res.items);
        } catch (e: any) {
            toast.show(e.message || 'Failed to load social accounts', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [currentWorkspace?.id]);

    const filtered = items.filter((item) => {
        const query = search.toLowerCase().trim();
        if (!query) return true;

        return (
            item.account_name?.toLowerCase().includes(query) ||
            item.platform?.toLowerCase().includes(query) ||
            item.account_id?.toLowerCase().includes(query)
        );
    });

    const openCreate = () => {
        setForm(defaultForm);
        setEditId(null);
        setModal('create');
    };

    const openEdit = (item: SocialAccount) => {
        setForm({
            platform: item.platform,
            account_name: item.account_name || '',
            account_id: item.account_id || '',
            access_token: item.access_token || '',
            refresh_token: item.refresh_token || '',
            expires_at: item.expires_at ? item.expires_at.slice(0, 10) : '',
        });
        setEditId(item.id);
        setModal('edit');
    };

    const handleSave = async () => {
        if (!currentWorkspace) return;

        if (!form.account_name.trim() || !form.account_id.trim() || !form.platform) {
            toast.show('Platform, account name, and account ID are required', 'error');
            return;
        }

        try {
            const body = {
                workspace_id: currentWorkspace.id,
                platform: form.platform,
                account_name: form.account_name.trim(),
                account_id: form.account_id.trim(),
                access_token: form.access_token || null,
                refresh_token: form.refresh_token || null,
                expires_at: form.expires_at || null,
            };

            if (modal === 'edit' && editId) {
                await pb.collection('social_accounts').update(editId, body);
                toast.show('Social account updated', 'success');
            } else {
                await pb.collection('social_accounts').create(body);
                toast.show('Social account created', 'success');
            }

            setModal(null);
            await load();
        } catch (e: any) {
            toast.show(e.message || 'Failed to save social account', 'error');
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;

        try {
            await pb.collection('social_accounts').delete(deleteId);
            toast.show('Social account deleted', 'success');
            setDeleteId(null);
            await load();
        } catch (e: any) {
            toast.show(e.message || 'Failed to delete social account', 'error');
        }
    };

    return (
        <>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-900">Social Accounts</h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                                placeholder="Search accounts..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                            onClick={openCreate}
                        >
                            <Plus size={18} /> <span className="hidden sm:inline">New Account</span>
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
                        <p>Please select a workspace to manage social accounts.</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                        <Share2 size={48} className="mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900">No social accounts yet</h3>
                        <p>Add your first social media account to start publishing.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filtered.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.account_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{item.platform}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.account_id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.expires_at ? item.expires_at.slice(0, 10) : '—'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                    title={modal === 'edit' ? 'Edit Social Account' : 'New Social Account'}
                    onClose={() => setModal(null)}
                    footer={
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                                onClick={() => setModal(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                                onClick={handleSave}
                            >
                                Save
                            </button>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="social-account-platform" className="block text-sm font-medium text-gray-700 mb-1">Platform *</label>
                                <select
                                    id="social-account-platform"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    value={form.platform}
                                    onChange={e => setForm({ ...form, platform: e.target.value as SocialAccount['platform'] })}
                                >
                                    <option value="facebook">Facebook</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="linkedin">LinkedIn</option>
                                    <option value="twitter">Twitter/X</option>
                                    <option value="tiktok">TikTok</option>
                                    <option value="youtube">YouTube</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="social-account-name" className="block text-sm font-medium text-gray-700 mb-1">Account Name *</label>
                                <input
                                    id="social-account-name"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                    value={form.account_name}
                                    onChange={e => setForm({ ...form, account_name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="social-account-id" className="block text-sm font-medium text-gray-700 mb-1">Account ID *</label>
                            <input
                                id="social-account-id"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={form.account_id}
                                onChange={e => setForm({ ...form, account_id: e.target.value })}
                            />
                        </div>

                        <div>
                            <label htmlFor="social-account-access-token" className="block text-sm font-medium text-gray-700 mb-1">Access Token</label>
                            <input
                                id="social-account-access-token"
                                type="password"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={form.access_token}
                                onChange={e => setForm({ ...form, access_token: e.target.value })}
                            />
                        </div>

                        <div>
                            <label htmlFor="social-account-refresh-token" className="block text-sm font-medium text-gray-700 mb-1">Refresh Token</label>
                            <input
                                id="social-account-refresh-token"
                                type="password"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={form.refresh_token}
                                onChange={e => setForm({ ...form, refresh_token: e.target.value })}
                            />
                        </div>

                        <div>
                            <label htmlFor="social-account-expires-at" className="block text-sm font-medium text-gray-700 mb-1">Expires At</label>
                            <input
                                id="social-account-expires-at"
                                type="date"
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={form.expires_at}
                                onChange={e => setForm({ ...form, expires_at: e.target.value })}
                            />
                        </div>
                    </div>
                </Modal>
            )}

            {deleteId && (
                <ConfirmDialog
                    message="Are you sure you want to delete this social account?"
                    onConfirm={handleDelete}
                    onCancel={() => setDeleteId(null)}
                />
            )}
        </>
    );
}
