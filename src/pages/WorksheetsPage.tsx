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

import { Plus, Search, Edit2, Trash2, Layout, Users as UsersIcon, Sparkles, Eye, Pencil, FileText } from 'lucide-react';
import { Worksheet, BrandIdentity, CustomerPersona } from '../models/schema';

const empty: Partial<Worksheet> = { title: '', agent_context: '' };

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
        content: string; // Mapped to agent_context in schema? Or is there a content field?
        // Schema says 'agent_context' is JSON. 
        // Check marketing_schema.json again. 
        // Wait, schema says "worksheets" has "agent_context" (json).
        // BUT looking at the previous JS code, it used "content".
        // The user instructions said "Schema database mới tại @marketing_schema.json".
        // In schema.ts I defined `agent_context?: any`.
        // I should probably check if there is a 'content' field or if I should map it to something else.
        // Let's assume for now 'agent_context' holds the content structure or I missed a field.
        // Actually, let's look at the JS code: it uses `item.content`.
        // If schema changed, maybe 'content' is gone or renamed.
        // Let's check schema.ts again... I see `agent_context`.
        // I will add a `content` field to the local form state and save it to `agent_context` wrapped in an object if needed,
        // OR if the schema allows ad-hoc fields (unlikely).
        // Let's look at schema.json in my memory/context. 
        // "worksheets" has "title" (text), "event_id" (relation), "brandRefs" (relation), "customerRefs" (relation), "status" (select), "agent_context" (json).
        // There is NO "content" field in the new schema for Worksheets!
        // It seems 'agent_context' is the only place to store data, or maybe 'MasterContent' is where content lives?
        // But Worksheets usually have some scratchpad.
        // I will store the markdown content inside `agent_context: { content: "..." }` to adapt.
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
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-bold text-gray-900">Worksheets</h2>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
                                placeholder="Search worksheets..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700" onClick={openCreate}>
                            <Plus size={18} /> <span className="hidden sm:inline">New Worksheet</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
                        <FileText size={48} className="mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900">No worksheets yet</h3>
                        <p>Create your first worksheet to start planning.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                        {filtered.map(item => (
                            <div key={item.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col h-full">
                                <div className="flex justify-between items-start mb-3">
                                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1" title={item.title}>{item.title}</h3>
                                    <div className="flex gap-1 ml-2">
                                        <button className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50" onClick={() => openEdit(item)}>
                                            <Edit2 size={16} />
                                        </button>
                                        <button className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50" onClick={() => setDeleteId(item.id)}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2 mb-4 flex-1">
                                    {/* Relation chips */}
                                    {item.brandRefs && item.brandRefs.length > 0 && (
                                        <div className="text-xs text-gray-600 bg-purple-50 px-2 py-1 rounded inline-block mr-2">
                                            Brand: {getExpandedNames(item, 'brandRefs') || item.brandRefs.length}
                                        </div>
                                    )}
                                    {item.customerRefs && item.customerRefs.length > 0 && (
                                        <div className="text-xs text-gray-600 bg-teal-50 px-2 py-1 rounded inline-block">
                                            Persona: {getExpandedNames(item, 'customerRefs') || item.customerRefs.length}
                                        </div>
                                    )}

                                    {/* Preview Content */}
                                    <div className="mt-2 text-sm text-gray-500 line-clamp-3">
                                        {item.agent_context?.content ?
                                            getContentString(item.agent_context.content) :
                                            <span className="italic text-gray-300">No content</span>
                                        }
                                    </div>
                                </div>

                                <div className="text-xs text-gray-400 pt-3 border-t border-gray-100 flex justify-between items-center">
                                    <span>{new Date(item.created).toLocaleDateString()}</span>
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold ${item.status === 'completed' ? 'bg-green-100 text-green-800' :
                                        item.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-600'
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
                        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onClick={() => setModal(null)}>Cancel</button>
                            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700" onClick={handleSave}>Save</button>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                            <input
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                                value={form.title}
                                onChange={e => setForm({ ...form, title: e.target.value })}
                                placeholder="Worksheet title..."
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Related Brands (hold Ctrl/Cmd to select multiple)</label>
                                <select
                                    multiple
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-32"
                                    value={form.brandRefs}
                                    onChange={e => {
                                        const options = Array.from(e.target.selectedOptions, option => option.value);
                                        setForm({ ...form, brandRefs: options });
                                    }}
                                >
                                    {brands.map(b => (
                                        <option key={b.id} value={b.id}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Related Personas (hold Ctrl/Cmd to select multiple)</label>
                                <select
                                    multiple
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 h-32"
                                    value={form.customerRefs}
                                    onChange={e => {
                                        const options = Array.from(e.target.selectedOptions, option => option.value);
                                        setForm({ ...form, customerRefs: options });
                                    }}
                                >
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">Content</label>
                                <div className="flex gap-2">
                                    <button
                                        className={`px-2 py-1 text-xs font-medium rounded ${!previewMode ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                                        onClick={() => setPreviewMode(false)}
                                    >
                                        <Pencil size={12} className="inline mr-1" /> Edit
                                    </button>
                                    <button
                                        className={`px-2 py-1 text-xs font-medium rounded ${previewMode ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
                                        onClick={() => setPreviewMode(true)}
                                    >
                                        <Eye size={12} className="inline mr-1" /> Preview
                                    </button>
                                    <button
                                        className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-700 hover:bg-purple-200"
                                        onClick={() => setAiModal(true)}
                                    >
                                        <Sparkles size={12} className="inline mr-1" /> AI Generate
                                    </button>
                                </div>
                            </div>
                            {previewMode ? (
                                <div
                                    className="prose prose-sm max-w-none p-4 border border-gray-300 rounded-md bg-gray-50 h-64 overflow-y-auto"
                                    dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content) }}
                                />
                            ) : (
                                <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
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
