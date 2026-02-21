import { useEffect, useState } from 'react';
import pb from '../lib/pocketbase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
// @ts-ignore
import MarketingStrategyAIModal from '../components/MarketingStrategyAIModal';
import { Plus, Search, Edit2, Trash2, Megaphone, Sparkles, Target, FileText } from 'lucide-react';
import { MarketingCampaign, Worksheet, ProductService } from '../models/schema';

// Helper to extract strategy from kpi_targets (JSON)
const getStrategy = (campaign: MarketingCampaign) => {
    // We are storing strategy fields in kpi_targets.strategy for now
    // as there are no dedicated fields in the new schema.
    const kpis: any = campaign.kpi_targets || {};
    return kpis.strategy || {};
};

export default function CampaignsPage() {
    const { currentWorkspace } = useWorkspace();
    const [items, setItems] = useState<MarketingCampaign[]>([]);
    const [worksheets, setWorksheets] = useState<Worksheet[]>([]);
    const [products, setProducts] = useState<ProductService[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState<'create' | 'edit' | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Form now includes mapping to JSON storage
    const [form, setForm] = useState({
        worksheetId: '',
        productId: '',
        name: '',
        goal: '',
        acquisitionStrategy: '',
        positioning: '',
        valueProposition: '',
        toneOfVoice: '',
        campaign_type: 'awareness',
        status: 'planned',
        budget: 0
    });

    const [editId, setEditId] = useState<string | null>(null);
    const [showAI, setShowAI] = useState(false);
    const toast = useToast();

    const load = async () => {
        if (!currentWorkspace) return;
        setLoading(true);
        try {
            const filter = `workspace_id = "${currentWorkspace.id}"`;
            const [res, wsRes, prodRes] = await Promise.all([
                pb.collection('marketing_campaigns').getList<MarketingCampaign>(1, 200, {
                    filter,
                    expand: 'worksheetId,product_id'
                }),
                pb.collection('worksheets').getFullList<Worksheet>({ filter }),
                pb.collection('products_services').getFullList<ProductService>({ filter }),
            ]);
            setItems(res.items);
            setWorksheets(wsRes);
            setProducts(prodRes);
        } catch (e: any) {
            toast.show(e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [currentWorkspace?.id]);

    const filtered = items.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()));

    const openCreate = () => {
        setForm({
            worksheetId: '',
            productId: '',
            name: '',
            goal: '',
            acquisitionStrategy: '',
            positioning: '',
            valueProposition: '',
            toneOfVoice: '',
            campaign_type: 'awareness',
            status: 'planned',
            budget: 0
        });
        setEditId(null);
        setModal('create');
    };

    const openEdit = (item: MarketingCampaign) => {
        const strategy = getStrategy(item);
        setForm({
            worksheetId: item.worksheet_id || '',
            productId: item.product_id || '',
            name: item.name || '',
            goal: strategy.goal || '',
            acquisitionStrategy: strategy.acquisitionStrategy || '',
            positioning: strategy.positioning || '',
            valueProposition: strategy.valueProposition || '',
            toneOfVoice: strategy.toneOfVoice || '',
            campaign_type: item.campaign_type || 'awareness',
            status: item.status || 'planned',
            budget: item.budget || 0
        });
        setEditId(item.id);
        setModal('edit');
    };

    const handleSave = async () => {
        if (!currentWorkspace) return;
        try {
            // Pack strategy fields into kpi_targets JSON
            const kpi_targets = {
                strategy: {
                    goal: form.goal,
                    acquisitionStrategy: form.acquisitionStrategy,
                    positioning: form.positioning,
                    valueProposition: form.valueProposition,
                    toneOfVoice: form.toneOfVoice
                }
            };

            const body = {
                workspace_id: currentWorkspace.id,
                worksheet_id: form.worksheetId,
                product_id: form.productId || null,
                name: form.name,
                campaign_type: form.campaign_type,
                status: form.status,
                budget: Number(form.budget),
                kpi_targets: kpi_targets
            };

            if (modal === 'edit' && editId) {
                await pb.collection('marketing_campaigns').update(editId, body);
                toast.show('Campaign updated!', 'success');
            } else {
                await pb.collection('marketing_campaigns').create(body);
                toast.show('Campaign created!', 'success');
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
            await pb.collection('marketing_campaigns').delete(deleteId);
            toast.show('Campaign deleted', 'success');
            setDeleteId(null);
            load();
        } catch (e: any) {
            toast.show(e.message, 'error');
        }
    };

    // Helper to safety get expanded worksheet title
    const getWorksheetTitle = (item: any) => {
        return item.expand?.worksheet_id?.title || item.expand?.worksheetId?.title || '—';
    };

    const getProductName = (item: any) => {
        return item.expand?.product_id?.name || '—';
    };

    return (
        <>
            <div className="glass-panel rounded-xl">
                <div className="p-6 border-b border-glass-border flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-bold text-white text-glow tracking-wide">Marketing Campaigns</h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                className="pl-10 pr-4 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64 text-white placeholder-gray-500 backdrop-blur-md transition-all"
                                placeholder="Search campaigns..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-lg" onClick={openCreate}>
                            <Plus size={18} /> <span className="hidden sm:inline">New Campaign</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 text-center text-gray-400">
                        <Megaphone size={48} className="mb-4 text-gray-500" />
                        <h3 className="text-lg font-medium text-gray-200">No campaigns yet</h3>
                        <p className="mt-1 text-gray-400">Launch your first marketing campaign to start tracking.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-white/5 border-b border-glass-border/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Campaign</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Worksheet</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Goal</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-glass-border/50">
                                {filtered.map(item => {
                                    const strategy = getStrategy(item);
                                    return (
                                        <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-200 group-hover:text-blue-400 transition-colors">{item.name}</div>
                                                <div className="text-xs text-gray-500 capitalize">{item.campaign_type}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {getWorksheetTitle(item)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                                                {getProductName(item)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 inline-flex text-[10px] leading-4 font-bold uppercase tracking-wider rounded-md border ${item.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                                                    item.status === 'completed' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                                                        'bg-white/10 text-gray-300 border-white/20'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate" title={strategy.goal}>
                                                {strategy.goal || '—'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <a title="Content Briefs" className="p-1.5 text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-md transition-colors" href={`/campaigns/${item.id}/briefs`}>
                                                        <FileText size={16} />
                                                    </a>
                                                    <button title="Edit" className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors" onClick={() => openEdit(item)}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button title="Delete" className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors" onClick={() => setDeleteId(item.id)}>
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
            </div>

            {modal && (
                <Modal
                    title={modal === 'edit' ? 'Edit Campaign' : 'New Campaign'}
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
                                <p className="text-xs text-gray-400 mt-1">Generate campaign strategy from worksheet data</p>
                            </div>
                            <button
                                className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-xs font-medium hover:bg-green-500/30 transition-colors shadow-[0_0_10px_rgba(34,197,94,0.2)]"
                                onClick={() => setShowAI(true)}
                            >
                                <Sparkles size={14} /> Auto-Fill Strategy
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Campaign Name *</label>
                                <input className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Status</label>
                                <select className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white transition-colors [&>option]:bg-gray-800" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                    <option value="planned">Planned</option>
                                    <option value="active">Active</option>
                                    <option value="paused">Paused</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Worksheet *</label>
                                <select className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white transition-colors [&>option]:bg-gray-800" value={form.worksheetId} onChange={e => setForm({ ...form, worksheetId: e.target.value })}>
                                    <option value="">Select worksheet...</option>
                                    {worksheets.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Product</label>
                                <select className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white transition-colors [&>option]:bg-gray-800" value={form.productId} onChange={e => setForm({ ...form, productId: e.target.value })}>
                                    <option value="">Select product...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Type</label>
                                <select className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white transition-colors [&>option]:bg-gray-800" value={form.campaign_type} onChange={e => setForm({ ...form, campaign_type: e.target.value })}>
                                    <option value="awareness">Awareness</option>
                                    <option value="conversion">Conversion</option>
                                    <option value="retargeting">Retargeting</option>
                                    <option value="newsletter">Newsletter</option>
                                    <option value="social_series">Social Series</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Budget</label>
                                <input type="number" className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white transition-colors" value={form.budget} onChange={e => setForm({ ...form, budget: Number(e.target.value) })} />
                            </div>
                        </div>

                        <div className="border-t border-glass-border pt-5 mt-5">
                            <h4 className="text-sm font-bold text-gray-200 mb-4 flex items-center tracking-wide"><Target size={16} className="mr-2 text-blue-400" /> Strategy & Positioning</h4>

                            <div className="space-y-4">
                                <div><label className="block text-sm font-medium text-gray-400 mb-1">Campaign Goal</label><textarea className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-20 text-white custom-scrollbar transition-colors" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} /></div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium text-gray-400 mb-1">Acquisition Strategy</label><textarea className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-20 text-white custom-scrollbar transition-colors" value={form.acquisitionStrategy} onChange={e => setForm({ ...form, acquisitionStrategy: e.target.value })} /></div>
                                    <div><label className="block text-sm font-medium text-gray-400 mb-1">Positioning</label><textarea className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-20 text-white custom-scrollbar transition-colors" value={form.positioning} onChange={e => setForm({ ...form, positioning: e.target.value })} /></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium text-gray-400 mb-1">Value Proposition</label><textarea className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-20 text-white custom-scrollbar transition-colors" value={form.valueProposition} onChange={e => setForm({ ...form, valueProposition: e.target.value })} /></div>
                                    <div><label className="block text-sm font-medium text-gray-400 mb-1">Tone of Voice</label><input className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors" value={form.toneOfVoice} onChange={e => setForm({ ...form, toneOfVoice: e.target.value })} placeholder="Professional, Friendly..." /></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {showAI && (
                <MarketingStrategyAIModal
                    worksheets={worksheets}
                    // Pass empty arrays for now or fetch them if needed for the modal to work fully
                    brandIdentities={[]}
                    customerProfiles={[]}
                    onClose={() => setShowAI(false)}
                    onComplete={(data: any) => {
                        setForm(f => ({
                            ...f,
                            goal: data.goal || f.goal,
                            acquisitionStrategy: data.acquisitionStrategy || f.acquisitionStrategy,
                            positioning: data.positioning || f.positioning,
                            valueProposition: data.valueProposition || f.valueProposition,
                            toneOfVoice: data.toneOfVoice || f.toneOfVoice,
                        }));
                        toast.show('AI Strategy applied!', 'success');
                    }}
                />
            )}

            {deleteId && <ConfirmDialog message="Delete this campaign?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
        </>
    );
}
