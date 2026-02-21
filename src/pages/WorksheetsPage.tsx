import { useEffect, useState } from 'react';
import pb from '../lib/pocketbase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
// We need to keep these as JS/JSX until refactored, or rely on implicit any if no types
// @ts-ignore
import WorksheetAIModal from '../components/WorksheetAIModal';
// @ts-ignore
import { renderMarkdown, getContentString } from '../lib/markdown'; // Assuming this is a utility file

import { Plus, Search, Edit2, Trash2, Sparkles, Eye, Pencil, FileText } from 'lucide-react';
import { Worksheet, BrandIdentity, CustomerPersona } from '../models/schema';

export default function WorksheetsPage() {
    const { currentWorkspace } = useWorkspace();
    const [items, setItems] = useState<Worksheet[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState<'create' | 'edit' | null>(null);
    const [aiModal, setAiModal] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Form state including relation fields
    const [form, setForm] = useState<{
        title: string;
        content: string;
        brandRefs: string[];
        customerRefs: string[];
    }>({
        title: '',
        content: '',
        brandRefs: [],
        customerRefs: []
    });

    const [editId, setEditId] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState(false);

    // Select options
    const [brands, setBrands] = useState<BrandIdentity[]>([]);
    const [customers, setCustomers] = useState<CustomerPersona[]>([]);

    const toast = useToast();

    const load = async () => {
        if (!currentWorkspace) return;
        setLoading(true);
        try {
            const filter = `workspace_id = "${currentWorkspace.id}"`;
            const expanded = 'brandRefs,customerRefs'; // Expand relations

            const [res, brandRes, custRes] = await Promise.all([
                pb.collection('worksheets').getList<Worksheet>(1, 200, {
                    filter,
                    expand: expanded
                }),
                pb.collection('brand_identities').getFullList<BrandIdentity>({ filter }),
                pb.collection('customer_personas').getFullList<CustomerPersona>({ filter })
            ]);

            setItems(res.items);
            setBrands(brandRes);
            setCustomers(custRes);
        } catch (e: any) {
            toast.show(e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [currentWorkspace?.id]);

    const filtered = items.filter(i => i.title?.toLowerCase().includes(search.toLowerCase()));

    const openCreate = () => {
        setForm({ title: '', content: '', brandRefs: [], customerRefs: [] });
        setEditId(null);
        setPreviewMode(false);
        setModal('create');
    };

    const openEdit = (item: Worksheet) => {
        // Extract content from agent_context if it exists there
        let content = '';
        if (item.agent_context && typeof item.agent_context === 'object' && item.agent_context.content) {
            content = item.agent_context.content;
        } else if (typeof item.agent_context === 'string') {
            // Legacy handling or direct string
            content = item.agent_context;
        }

        setForm({
            title: item.title || '',
            content: content,
            brandRefs: item.brandRefs || [],
            customerRefs: item.customerRefs || [],
        });
        setEditId(item.id);
        setPreviewMode(false);
        setModal('edit');
    };

    const handleSave = async () => {
        if (!currentWorkspace) return;
        try {
            const body = {
                workspace_id: currentWorkspace.id,
                title: form.title,
                // Store content in agent_context as JSON
                agent_context: { content: form.content },
                brandRefs: form.brandRefs,
                customerRefs: form.customerRefs,
                status: 'draft' // Default status
            };

            if (modal === 'edit' && editId) {
                await pb.collection('worksheets').update(editId, body);
                toast.show('Worksheet updated!', 'success');
            } else {
                await pb.collection('worksheets').create(body);
                toast.show('Worksheet created!', 'success');
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
            await pb.collection('worksheets').delete(deleteId);
            toast.show('Worksheet deleted', 'success');
            setDeleteId(null);
            load();
        } catch (e: any) {
            toast.show(e.message, 'error');
        }
    };

    const handleAIComplete = (generatedContent: string) => {
        setForm(prev => ({ ...prev, content: generatedContent }));
        setAiModal(false);
    };

    // Safe access to expanded relations
    const getExpandedNames = (item: any, field: string) => {
        if (!item.expand || !item.expand[field]) return null;
        const refs = Array.isArray(item.expand[field]) ? item.expand[field] : [item.expand[field]];
        return refs.map((r: any) => r.name).join(', ');
    };

    return (
        <>
            <div className="glass-panel rounded-xl">
                <div className="p-6 border-b border-glass-border flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-bold text-white text-glow tracking-wide">Worksheets</h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                className="pl-10 pr-4 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64 text-white placeholder-gray-500 backdrop-blur-md transition-all"
                                placeholder="Search worksheets..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-lg" onClick={openCreate}>
                            <Plus size={18} /> <span className="hidden sm:inline">New Worksheet</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 text-center text-gray-400">
                        <FileText size={48} className="mb-4 text-gray-500" />
                        <h3 className="text-lg font-medium text-gray-200">No worksheets yet</h3>
                        <p className="text-gray-400">Create your first worksheet to start planning.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {filtered.map(item => (
                            <div key={item.id} className="glass-card rounded-xl shadow-lg p-5 flex flex-col h-full group">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-lg text-gray-100 line-clamp-1 group-hover:text-blue-400 transition-colors" title={item.title}>{item.title}</h3>
                                    <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <button title="Edit" className="p-1.5 text-gray-400 hover:text-blue-400 rounded-lg hover:bg-blue-500/10 transition-colors" onClick={() => openEdit(item)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button title="Delete" className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors" onClick={() => setDeleteId(item.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4 flex-1">
                                    {/* Relation chips */}
                                    {item.brandRefs && item.brandRefs.length > 0 && (
                                        <div className="text-xs text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-1.5 rounded-md inline-block mr-2 backdrop-blur-sm">
                                            Brand: {getExpandedNames(item, 'brandRefs') || item.brandRefs.length}
                                        </div>
                                    )}
                                    {item.customerRefs && item.customerRefs.length > 0 && (
                                        <div className="text-xs text-teal-300 bg-teal-500/10 border border-teal-500/20 px-2 py-1.5 rounded-md inline-block backdrop-blur-sm">
                                            Persona: {getExpandedNames(item, 'customerRefs') || item.customerRefs.length}
                                        </div>
                                    )}

                                    {/* Preview Content */}
                                    <div className="mt-4 text-sm text-gray-400 line-clamp-3 leading-relaxed">
                                        {item.agent_context?.content ?
                                            getContentString(item.agent_context.content) :
                                            <span className="italic text-gray-600">No content</span>
                                        }
                                    </div>
                                </div>

                                <div className="text-xs text-gray-500 pt-4 border-t border-glass-border flex justify-between items-center">
                                    <span>{new Date(item.created).toLocaleDateString()}</span>
                                    <span className={`px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wide ${item.status === 'completed' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                        item.status === 'processing' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                                        }`}>
                                        {item.status || 'draft'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            {modal && (
                <Modal
                    title={modal === 'edit' ? 'Edit Worksheet' : 'New Worksheet'}
                    onClose={() => setModal(null)}
                    footer={
                        <div className="flex justify-end gap-3 pt-4 border-t border-glass-border">
                            <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors" onClick={() => setModal(null)}>Cancel</button>
                            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600/80 rounded-lg hover:bg-blue-500 transition-colors shadow-lg" onClick={handleSave}>Save</button>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Title *</label>
                            <input
                                className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="Worksheet title..."
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Related Brands <span className="text-gray-500 text-xs font-normal">(hold Ctrl/Cmd)</span></label>
                                <select
                                    multiple
                                    className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-32 text-gray-300 custom-scrollbar transition-colors"
                                    value={form.brandRefs}
                                    onChange={e => {
                                        const options = Array.from(e.target.selectedOptions, option => option.value);
                                        setForm({ ...form, brandRefs: options });
                                    }}
                                >
                                    {brands.map(b => (
                                        <option key={b.id} value={b.id} className="py-1 px-2 hover:bg-white/10">{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Related Personas <span className="text-gray-500 text-xs font-normal">(hold Ctrl/Cmd)</span></label>
                                <select
                                    multiple
                                    className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-32 text-gray-300 custom-scrollbar transition-colors"
                                    value={form.customerRefs}
                                    onChange={e => {
                                        const options = Array.from(e.target.selectedOptions, option => option.value);
                                        setForm({ ...form, customerRefs: options });
                                    }}
                                >
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id} className="py-1 px-2 hover:bg-white/10">{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-300 tracking-wide">Content</label>
                                <div className="flex gap-2">
                                    <button
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${!previewMode ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 bg-white/5 hover:bg-white/10 border border-transparent'}`}
                                        onClick={() => setPreviewMode(false)}
                                    >
                                        <Pencil size={12} className="inline mr-1" /> Edit
                                    </button>
                                    <button
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${previewMode ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 bg-white/5 hover:bg-white/10 border border-transparent'}`}
                                        onClick={() => setPreviewMode(true)}
                                    >
                                        <Eye size={12} className="inline mr-1" /> Preview
                                    </button>
                                    <button
                                        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 hover:bg-purple-500/30 transition-colors shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                                        onClick={() => setAiModal(true)}
                                    >
                                        <Sparkles size={12} className="inline mr-1" /> AI Generate
                                    </button>
                                </div>
                            </div>
                            {previewMode ? (
                                <div
                                    className="prose prose-sm prose-invert max-w-none p-4 border border-glass-border rounded-lg bg-black/20 h-64 overflow-y-auto custom-scrollbar"
                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content) }}
                                />
                            ) : (
                                <textarea
                                    className="w-full px-4 py-3 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm text-gray-300 placeholder-gray-600 custom-scrollbar transition-colors"
                                    style={{ minHeight: '250px' }}
                                    value={form.content}
                                    onChange={e => setForm({ ...form, content: e.target.value })}
                                    placeholder="# Worksheet Title&#10;&#10;Write your content here..."
                                />
                            )}
                        </div>
                    </div>
                </Modal>
            )}

            {/* AI Generation Modal - Placeholder for now until that component is refactored */}
            {aiModal && (
                <WorksheetAIModal
                    onClose={() => setAiModal(false)}
                    onComplete={handleAIComplete}
                />
            )}

            {deleteId && <ConfirmDialog message="Delete this worksheet? All related data will also be deleted." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
        </>
    );
}
