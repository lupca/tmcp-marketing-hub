import { useEffect, useState } from 'react';
import pb from '../lib/pocketbase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
// @ts-ignore
import CustomerProfileAIModal from '../components/CustomerProfileAIModal';
import { Plus, Search, Edit2, Trash2, Users, Sparkles } from 'lucide-react';
import { CustomerPersona, BrandIdentity } from '../models/schema';
export default function CustomerProfilesPage() {
    const { currentWorkspace } = useWorkspace();
    const [items, setItems] = useState<CustomerPersona[]>([]);
    const [brandIdentities, setBrandIdentities] = useState<BrandIdentity[]>([]);

    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState<'create' | 'edit' | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [form, setForm] = useState({
        persona_name: '',
        demographics: '{}',
        psychographics: '{}',
        // Helpers for things that might go into JSON but aren't top-level columns in new schema
        goals: '[]',
        pain_points: '[]'
    });

    const [editId, setEditId] = useState<string | null>(null);
    const [showAI, setShowAI] = useState(false);
    const toast = useToast();

    const load = async () => {
        if (!currentWorkspace) return;
        setLoading(true);
        try {
            const filter = `workspace_id = "${currentWorkspace.id}"`;

            const [personasRes, brandsRes] = await Promise.all([
                pb.collection('customer_personas').getList<CustomerPersona>(1, 200, { filter }),
                pb.collection('brand_identities').getFullList<BrandIdentity>({ filter }),
            ]);

            setItems(personasRes.items);
            setBrandIdentities(brandsRes);
        } catch (e: any) {
            toast.show(e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [currentWorkspace?.id]);

    const filtered = items.filter(i => i.persona_name?.toLowerCase().includes(search.toLowerCase()));

    const openCreate = () => {
        setForm({
            persona_name: '',
            demographics: '{}',
            psychographics: '{}',
            goals: '[]',
            pain_points: '[]'
        });
        setEditId(null);
        setModal('create');
    };

    const openEdit = (item: CustomerPersona) => {
        const psycho: any = item.psychographics || {};

        setForm({
            persona_name: item.persona_name || '',
            demographics: JSON.stringify(item.demographics || {}, null, 2),
            psychographics: JSON.stringify(item.psychographics || {}, null, 2),
            goals: JSON.stringify(psycho.goals || [], null, 2),
            pain_points: JSON.stringify(psycho.pain_points || [], null, 2),
        });
        setEditId(item.id);
        setModal('edit');
    };

    const handleSave = async () => {
        if (!currentWorkspace) return;
        try {
            const parse = (s: string) => { try { return JSON.parse(s); } catch { return {}; } };
            const parseArr = (s: string) => { try { return JSON.parse(s); } catch { return []; } };

            // Merge goals and pain points into psychographics as per common practice if no dedicated columns
            const psycho = parse(form.psychographics);
            psycho.goals = parseArr(form.goals);
            psycho.pain_points = parseArr(form.pain_points);

            const body = {
                workspace_id: currentWorkspace.id,
                persona_name: form.persona_name,
                demographics: parse(form.demographics),
                psychographics: psycho
            };

            if (modal === 'edit' && editId) {
                await pb.collection('customer_personas').update(editId, body);
                toast.show('Profile updated!', 'success');
            } else {
                await pb.collection('customer_personas').create(body);
                toast.show('Profile created!', 'success');
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
            await pb.collection('customer_personas').delete(deleteId);
            toast.show('Profile deleted', 'success');
            setDeleteId(null);
            load();
        } catch (e: any) {
            toast.show(e.message, 'error');
        }
    };

    return (
        <>
            <div className="glass-panel text-white rounded-xl shadow-lg border border-glass-border">
                <div className="p-6 border-b border-glass-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-black/20">
                    <h2 className="text-xl font-bold text-white text-glow tracking-wide">Customer Personas</h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                className="pl-10 pr-4 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64 text-white placeholder-gray-500 backdrop-blur-md transition-all"
                                placeholder="Search personas..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 text-white rounded-lg hover:bg-blue-500 shadow-lg transition-colors" onClick={openCreate}>
                            <Plus size={18} /> <span className="hidden sm:inline">New Persona</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 text-center text-gray-400">
                        <Users size={48} className="mb-4 text-gray-500" />
                        <h3 className="text-lg font-medium text-gray-200">No personas yet</h3>
                        <p className="mt-1 text-gray-400">Create your ideal customer profiles to target the right audience.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {filtered.map(item => {
                            const psycho: any = item.psychographics || {};
                            const goals = psycho.goals || [];
                            const pains = psycho.pain_points || [];

                            return (
                                <div key={item.id} className="glass-card border border-glass-border rounded-xl shadow-sm hover:shadow-lg transition-all p-5 flex flex-col h-full group">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white font-bold text-lg">
                                                {item.persona_name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                            <h3 className="font-bold text-lg text-white group-hover:text-blue-400 transition-colors line-clamp-1">{item.persona_name}</h3>
                                        </div>
                                        <div className="flex gap-1">
                                            <button title="Edit" className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100" onClick={() => openEdit(item)}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button title="Delete" className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100" onClick={() => setDeleteId(item.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 flex-1">
                                        {(item as any).summary && <p className="text-sm text-gray-400 font-light line-clamp-3">{(item as any).summary}</p>}

                                        <div className="flex flex-wrap gap-2 pt-2">
                                            {item.demographics && Object.keys(item.demographics).length > 0 && (
                                                <span className="px-2 py-1 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-bold uppercase tracking-wider rounded-md">Demographics</span>
                                            )}
                                            {goals.length > 0 && (
                                                <span className="px-2 py-1 bg-green-500/20 text-green-300 border border-green-500/30 text-[10px] font-bold uppercase tracking-wider rounded-md">{goals.length} Goals</span>
                                            )}
                                            {pains.length > 0 && (
                                                <span className="px-2 py-1 bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold uppercase tracking-wider rounded-md">{pains.length} Pain Points</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {modal && (
                <Modal
                    title={modal === 'edit' ? 'Edit Profile' : 'New Customer Profile'}
                    onClose={() => setModal(null)}
                    footer={
                        <div className="flex justify-end gap-3 pt-5 border-t border-glass-border">
                            <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors" onClick={() => setModal(null)}>Cancel</button>
                            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600/80 rounded-lg hover:bg-blue-500 transition-colors shadow-lg" onClick={handleSave}>Save</button>
                        </div>
                    }
                >
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div className="flex justify-between items-center bg-black/20 p-4 rounded-xl border border-glass-border shadow-inner">
                            <div>
                                <h4 className="text-sm font-bold text-white tracking-wide">AI Assistance</h4>
                                <p className="text-xs text-gray-400 mt-0.5">Generate persona details deeply</p>
                            </div>
                            <button
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600/80 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-500 transition-colors shadow-lg"
                                onClick={() => setShowAI(true)}
                            >
                                <Sparkles size={14} /> Auto-Generate
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Persona Name *</label>
                            <input className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors" value={form.persona_name} onChange={e => setForm({ ...form, persona_name: e.target.value })} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Demographics (JSON)</label>
                                <textarea className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/40 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs h-32 text-blue-300 custom-scrollbar transition-colors" value={form.demographics} onChange={e => setForm({ ...form, demographics: e.target.value })} spellCheck={false} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Psychographics (JSON)</label>
                                <textarea className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/40 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs h-32 text-blue-300 custom-scrollbar transition-colors" value={form.psychographics} onChange={e => setForm({ ...form, psychographics: e.target.value })} spellCheck={false} />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Goals (JSON Array)</label>
                                <textarea className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/40 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs h-32 text-green-300 custom-scrollbar transition-colors" value={form.goals} onChange={e => setForm({ ...form, goals: e.target.value })} placeholder='["Grow revenue", "Improve efficiency"]' spellCheck={false} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Pain Points (JSON Array)</label>
                                <textarea className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/40 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-xs h-32 text-red-300 custom-scrollbar transition-colors" value={form.pain_points} onChange={e => setForm({ ...form, pain_points: e.target.value })} placeholder='["High costs", "Low conversion"]' spellCheck={false} />
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {showAI && (
                <CustomerProfileAIModal
                    brandIdentities={brandIdentities}
                    onClose={() => setShowAI(false)}
                    onComplete={(data: any) => {
                        setForm(f => ({
                            ...f,
                            persona_name: data.personaName || data.name || f.persona_name,
                            demographics: data.demographics ? JSON.stringify(data.demographics, null, 2) : f.demographics,
                            psychographics: data.psychographics ? JSON.stringify(data.psychographics, null, 2) : f.psychographics,
                            goals: data.goalsAndMotivations ? JSON.stringify(data.goalsAndMotivations, null, 2) : f.goals,
                            pain_points: data.painPointsAndChallenges ? JSON.stringify(data.painPointsAndChallenges, null, 2) : f.pain_points,
                        }));
                        toast.show('AI data applied to form!', 'success');
                    }}
                />
            )}
            {deleteId && <ConfirmDialog message="Delete this customer profile?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
        </>
    );
}
