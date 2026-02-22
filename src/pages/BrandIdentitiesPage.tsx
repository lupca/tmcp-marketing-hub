import { useEffect, useState } from 'react';
import pb from '../lib/pocketbase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
// @ts-ignore
import BrandIdentityAIModal from '../components/BrandIdentityAIModal';
import { Plus, Search, Edit2, Trash2, Palette, ExternalLink, Sparkles } from 'lucide-react';
import { BrandIdentity, Worksheet } from '../models/schema';

export default function BrandIdentitiesPage() {
    const { currentWorkspace } = useWorkspace();
    const [items, setItems] = useState<BrandIdentity[]>([]);
    const [worksheets] = useState<Worksheet[]>([]); // Schema says workspace_id, but logically linked to worksheets?
    // Schema for brand_identities has workspace_id, but NO worksheet_id.
    // Old code had worksheetId.
    // New schema: brand_identities -> workspace_id (required).
    // Worksheets have `brands` relation (Worksheet -> Brand).
    // So Brands don't point to Worksheets, Worksheets point to Brands.
    // I will remove worksheet selection from Brand creation unless I want to link it reversely,
    // but the schema doesn't support it on Brand side.
    // So I will remove worksheetId from this form.

    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState<'create' | 'edit' | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Form state tailored to new schema
    const [form, setForm] = useState({
        brand_name: '',
        voice_and_tone: '', // Editor type in schema
        core_messaging: '{}', // JSON
        // Helpers for UI only, to be packed into JSON
        slogan: '',
        mission_statement: '',
        logo_url: '',
        color_palette: '[]',
        keywords: '[]'
    });

    const [editId, setEditId] = useState<string | null>(null);
    const [showAIModal, setShowAIModal] = useState(false);
    const toast = useToast();

    const load = async () => {
        if (!currentWorkspace) return;
        setLoading(true);
        try {
            const filter = `workspace_id = "${currentWorkspace.id}"`;
            const res = await pb.collection('brand_identities').getList<BrandIdentity>(1, 200, { filter });
            setItems(res.items);
            // We might not need worksheets if brands don't link to them directly
        } catch (e: any) {
            toast.show(e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [currentWorkspace?.id]);

    const filtered = items.filter(i => i.brand_name?.toLowerCase().includes(search.toLowerCase()));

    const openCreate = () => {
        setForm({
            brand_name: '',
            voice_and_tone: '',
            core_messaging: '{}',
            slogan: '',
            mission_statement: '',
            logo_url: '',
            color_palette: '[]',
            keywords: '[]'
        });
        setEditId(null);
        setModal('create');
    };

    const openEdit = (item: BrandIdentity) => {
        // Unpack JSON fields
        const anyItem = item as any;
        const coreMsg = anyItem.core_messaging || {};
        const visuals = anyItem.visual_assets || {};

        setForm({
            brand_name: item.brand_name || '',
            voice_and_tone: item.voice_and_tone || '',
            core_messaging: JSON.stringify(coreMsg, null, 2),
            slogan: coreMsg.slogan || '',
            mission_statement: coreMsg.mission_statement || '',
            logo_url: visuals.logo_url || '',
            color_palette: JSON.stringify(visuals.color_palette || [], null, 2),
            keywords: JSON.stringify(coreMsg.keywords || [], null, 2),
        });
        setEditId(item.id);
        setModal('edit');
    };

    const handleSave = async () => {
        if (!currentWorkspace) return;
        try {
            let cp: string[], kw: string[];
            try { cp = JSON.parse(form.color_palette); } catch { cp = []; }
            try { kw = JSON.parse(form.keywords); } catch { kw = []; }

            // Construct JSON objects
            const coreMessaging = {
                slogan: form.slogan,
                mission_statement: form.mission_statement,
                keywords: kw
            };

            const visualAssets = {
                logo_url: form.logo_url,
                color_palette: cp
            };

            const body = {
                workspace_id: currentWorkspace.id,
                brand_name: form.brand_name,
                voice_and_tone: form.voice_and_tone,
                core_messaging: coreMessaging,
                visual_assets: visualAssets
            };

            if (modal === 'edit' && editId) {
                await pb.collection('brand_identities').update(editId, body);
                toast.show('Brand updated!', 'success');
            } else {
                await pb.collection('brand_identities').create(body);
                toast.show('Brand created!', 'success');
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
            await pb.collection('brand_identities').delete(deleteId);
            toast.show('Brand deleted', 'success');
            setDeleteId(null);
            load();
        } catch (e: any) {
            toast.show(e.message, 'error');
        }
    };

    return (
        <>
            <div className="glass-panel rounded-xl">
                <div className="p-6 border-b border-glass-border flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-bold text-white text-glow tracking-wide">Brand Identities</h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                className="pl-10 pr-4 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64 text-white placeholder-gray-500 backdrop-blur-md transition-all"
                                placeholder="Search brands..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-lg" onClick={openCreate}>
                            <Plus size={18} /> <span className="hidden sm:inline">New Brand</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 text-center text-gray-400">
                        <Palette size={48} className="mb-4 text-gray-500" />
                        <h3 className="text-lg font-medium text-gray-200">No brands yet</h3>
                        <p className="text-gray-400">Create your first brand identity to ensure consistency.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {filtered.map(item => {
                            const anyItem = item as any;
                            const coreMsg: any = anyItem.core_messaging || {};
                            const visuals: any = anyItem.visual_assets || {};
                            const keywords: string[] = coreMsg.keywords || [];
                            const colorPalette: string[] = visuals.color_palette || [];

                            return (
                                <div key={item.id} className="glass-card rounded-xl shadow-lg p-5 flex flex-col h-full relative group">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-lg text-gray-100 group-hover:text-blue-400 transition-colors">{item.brand_name}</h3>
                                        <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button title="Edit" className="p-1.5 text-gray-400 hover:text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors" onClick={() => openEdit(item)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button title="Delete" className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors" onClick={() => setDeleteId(item.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 flex-1 mt-2">
                                        {coreMsg.slogan && <p className="text-sm italic text-blue-400">"{coreMsg.slogan}"</p>}

                                        {coreMsg.mission_statement && (
                                            <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">{coreMsg.mission_statement}</p>
                                        )}

                                        {visuals.logo_url && (
                                            <a href={visuals.logo_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors mt-2">
                                                <ExternalLink size={12} /> View Logo
                                            </a>
                                        )}

                                        {colorPalette.length > 0 && (
                                            <div className="flex gap-1 pt-2">
                                                {colorPalette.map((c, i) => (
                                                    <div key={i} className="w-6 h-6 rounded-md border border-glass-border shadow-sm shadow-black/20" style={{ backgroundColor: c }} title={c} />
                                                ))}
                                            </div>
                                        )}

                                        {keywords.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-3">
                                                {keywords.slice(0, 5).map((k, i) => (
                                                    <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 text-gray-300 text-[10px] rounded-md tracking-wide">{k}</span>
                                                ))}
                                                {keywords.length > 5 && <span className="text-[10px] text-gray-500 flex items-center">+{keywords.length - 5}</span>}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {modal && (
                <Modal
                    title={modal === 'edit' ? 'Edit Brand' : 'New Brand Identity'}
                    onClose={() => setModal(null)}
                    footer={
                        <div className="flex justify-end gap-3 pt-4 border-t border-glass-border">
                            <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors" onClick={() => setModal(null)}>Cancel</button>
                            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600/80 rounded-lg hover:bg-blue-500 transition-colors shadow-lg" onClick={handleSave}>Save</button>
                        </div>
                    }
                >
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-glass-border">
                            <div>
                                <h4 className="text-sm font-medium text-gray-200">AI Assistance</h4>
                                <p className="text-xs text-gray-400 mt-1">Generate brand identity from scratch</p>
                            </div>
                            <button
                                className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg text-xs font-medium hover:bg-purple-500/30 transition-colors shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                                onClick={() => setShowAIModal(true)}
                            >
                                <Sparkles size={14} /> Auto-Generate
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Brand Name *</label>
                            <input className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors" value={form.brand_name} onChange={e => setForm({ ...form, brand_name: e.target.value })} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Slogan</label>
                            <input className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors" value={form.slogan} onChange={e => setForm({ ...form, slogan: e.target.value })} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Mission Statement</label>
                            <textarea className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-24 text-white placeholder-gray-500 custom-scrollbar transition-colors" value={form.mission_statement} onChange={e => setForm({ ...form, mission_statement: e.target.value })} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Voice & Tone</label>
                            <textarea className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-20 text-white placeholder-gray-500 custom-scrollbar transition-colors" value={form.voice_and_tone} onChange={e => setForm({ ...form, voice_and_tone: e.target.value })} placeholder="E.g. Professional, Authoritative, yet Friendly..." />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Logo URL</label>
                            <input className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors" value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Color Palette (JSON string)</label>
                                <textarea className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs h-20 text-gray-300 placeholder-gray-600 custom-scrollbar transition-colors" value={form.color_palette} onChange={e => setForm({ ...form, color_palette: e.target.value })} placeholder='["#FF0000", "#00FF00"]' />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Keywords (JSON string)</label>
                                <textarea className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs h-20 text-gray-300 placeholder-gray-600 custom-scrollbar transition-colors" value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} placeholder='["innovation", "growth"]' />
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {deleteId && <ConfirmDialog message="Delete this brand identity?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}

            {showAIModal && (
                <BrandIdentityAIModal
                    worksheets={worksheets} // We might fetch worksheets if needed for context in AI modal, even if not linked in DB
                    onClose={() => setShowAIModal(false)}
                    onComplete={(data: any) => {
                        setForm(f => ({
                            ...f,
                            brand_name: data.brandName || f.brand_name,
                            slogan: data.slogan || f.slogan,
                            mission_statement: data.missionStatement || f.mission_statement,
                            keywords: JSON.stringify(data.keywords || [], null, 2),
                            color_palette: JSON.stringify(data.colorPalette || [], null, 2),
                        }));
                        setShowAIModal(false);
                    }}
                />
            )}
        </>
    );
}
