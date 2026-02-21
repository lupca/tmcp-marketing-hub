import { useEffect, useState } from 'react';
import pb from '../lib/pocketbase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Search, Edit2, Trash2, Package, X } from 'lucide-react';
import { ProductService, BrandIdentity } from '../models/schema';

export default function ProductsServicesPage() {
    const { currentWorkspace } = useWorkspace();
    const [items, setItems] = useState<ProductService[]>([]);
    const [brands, setBrands] = useState<BrandIdentity[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState<'create' | 'edit' | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);

    const emptyForm = {
        name: '',
        brand_id: '',
        description: '',
        usp: '',
        key_features: [] as string[],
        key_benefits: [] as string[],
        default_offer: '',
    };
    const [form, setForm] = useState(emptyForm);
    const [featureInput, setFeatureInput] = useState('');
    const [benefitInput, setBenefitInput] = useState('');

    const toast = useToast();

    const load = async () => {
        if (!currentWorkspace) return;
        setLoading(true);
        try {
            const filter = `workspace_id = "${currentWorkspace.id}"`;
            const [res, brandRes] = await Promise.all([
                pb.collection('products_services').getList<ProductService>(1, 200, {
                    filter,
                    expand: 'brand_id',
                }),
                pb.collection('brand_identities').getFullList<BrandIdentity>({ filter }),
            ]);
            setItems(res.items);
            setBrands(brandRes);
        } catch (e: any) {
            toast.show(e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [currentWorkspace?.id]);

    const filtered = items.filter(i =>
        i.name?.toLowerCase().includes(search.toLowerCase()) ||
        i.usp?.toLowerCase().includes(search.toLowerCase())
    );

    const openCreate = () => {
        setForm(emptyForm);
        setEditId(null);
        setModal('create');
    };

    const openEdit = (item: ProductService) => {
        setForm({
            name: item.name || '',
            brand_id: item.brand_id || '',
            description: item.description || '',
            usp: item.usp || '',
            key_features: Array.isArray(item.key_features) ? item.key_features : [],
            key_benefits: Array.isArray(item.key_benefits) ? item.key_benefits : [],
            default_offer: item.default_offer || '',
        });
        setEditId(item.id);
        setModal('edit');
    };

    const handleSave = async () => {
        if (!currentWorkspace) return;
        try {
            const body = {
                workspace_id: currentWorkspace.id,
                brand_id: form.brand_id,
                name: form.name,
                description: form.description,
                usp: form.usp,
                key_features: form.key_features,
                key_benefits: form.key_benefits,
                default_offer: form.default_offer,
            };

            if (modal === 'edit' && editId) {
                await pb.collection('products_services').update(editId, body);
                toast.show('Product updated!', 'success');
            } else {
                await pb.collection('products_services').create(body);
                toast.show('Product created!', 'success');
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
            await pb.collection('products_services').delete(deleteId);
            toast.show('Product deleted', 'success');
            setDeleteId(null);
            load();
        } catch (e: any) {
            toast.show(e.message, 'error');
        }
    };

    const addFeature = () => {
        if (featureInput.trim()) {
            setForm(f => ({ ...f, key_features: [...f.key_features, featureInput.trim()] }));
            setFeatureInput('');
        }
    };

    const removeFeature = (idx: number) => {
        setForm(f => ({ ...f, key_features: f.key_features.filter((_, i) => i !== idx) }));
    };

    const addBenefit = () => {
        if (benefitInput.trim()) {
            setForm(f => ({ ...f, key_benefits: [...f.key_benefits, benefitInput.trim()] }));
            setBenefitInput('');
        }
    };

    const removeBenefit = (idx: number) => {
        setForm(f => ({ ...f, key_benefits: f.key_benefits.filter((_, i) => i !== idx) }));
    };

    const getBrandName = (item: any) => {
        return item.expand?.brand_id?.brand_name || item.expand?.brand_id?.name || '—';
    };

    return (
        <>
            <div className="glass-panel rounded-xl shadow-lg border border-glass-border">
                <div className="p-6 border-b border-glass-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-black/20">
                    <h2 className="text-xl font-bold text-white text-glow tracking-wide">Products & Services</h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                className="pl-10 pr-4 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64 text-white placeholder-gray-500 backdrop-blur-md transition-all"
                                placeholder="Search products..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 text-white rounded-lg hover:bg-blue-500 shadow-lg transition-colors" onClick={openCreate}>
                            <Plus size={18} /> <span className="hidden sm:inline">New Product</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 text-center text-gray-400">
                        <Package size={48} className="mb-4 text-gray-500" />
                        <h3 className="text-lg font-medium text-gray-200">No products yet</h3>
                        <p className="mt-1 text-gray-400">Add your first product or service to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-glass-border/50">
                                <tr>
                                    <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase tracking-wider text-[11px]">Product</th>
                                    <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase tracking-wider text-[11px]">Brand</th>
                                    <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase tracking-wider text-[11px]">USP</th>
                                    <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase tracking-wider text-[11px]">Offer</th>
                                    <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase tracking-wider text-[11px] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-glass-border/50">
                                {filtered.map(item => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-200 group-hover:text-blue-400 transition-colors">{item.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                            {getBrandName(item)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate" title={item.usp || ''}>
                                            {item.usp ? item.usp.replace(/<[^>]+>/g, '').slice(0, 80) : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate">
                                            {item.default_offer || '—'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button title="Edit" className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors" onClick={() => openEdit(item)}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button title="Delete" className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors" onClick={() => setDeleteId(item.id)}>
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
                    title={modal === 'edit' ? 'Edit Product' : 'New Product'}
                    onClose={() => setModal(null)}
                    footer={
                        <div className="flex justify-end gap-3 pt-5 border-t border-glass-border">
                            <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors" onClick={() => setModal(null)}>Cancel</button>
                            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600/80 rounded-lg hover:bg-blue-500 transition-colors shadow-lg" onClick={handleSave}>Save</button>
                        </div>
                    }
                >
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Product Name *</label>
                                <input className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Brand *</label>
                                <select className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white transition-colors [&>option]:bg-gray-800" value={form.brand_id} onChange={e => setForm({ ...form, brand_id: e.target.value })}>
                                    <option value="">Select brand...</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{(b as any).brand_name || b.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Description</label>
                            <textarea className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-24 text-white custom-scrollbar transition-colors placeholder-gray-500" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Unique Selling Proposition (USP)</label>
                            <textarea className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-20 text-white custom-scrollbar transition-colors placeholder-gray-500" value={form.usp} onChange={e => setForm({ ...form, usp: e.target.value })} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Key Features</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    className="flex-1 px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors"
                                    placeholder="Add a feature..."
                                    value={featureInput}
                                    onChange={e => setFeatureInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                                />
                                <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm text-white transition-colors" onClick={addFeature}>Add</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {form.key_features.map((f, i) => (
                                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full text-sm">
                                        {f}
                                        <button onClick={() => removeFeature(i)} className="hover:text-blue-100 transition-colors"><X size={14} /></button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Key Benefits</label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    className="flex-1 px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors"
                                    placeholder="Add a benefit..."
                                    value={benefitInput}
                                    onChange={e => setBenefitInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                                />
                                <button className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-sm text-white transition-colors" onClick={addBenefit}>Add</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {form.key_benefits.map((b, i) => (
                                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/20 text-green-300 border border-green-500/30 rounded-full text-sm">
                                        {b}
                                        <button onClick={() => removeBenefit(i)} className="hover:text-green-100 transition-colors"><X size={14} /></button>
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Default Offer</label>
                            <input className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors" value={form.default_offer} onChange={e => setForm({ ...form, default_offer: e.target.value })} placeholder="e.g., Free trial for 30 days" />
                        </div>
                    </div>
                </Modal>
            )}

            {deleteId && <ConfirmDialog message="Delete this product?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
        </>
    );
}
