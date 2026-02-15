import { useEffect, useState } from 'react';
import { list, create, update, remove, getUserId } from '../lib/pb';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import WorksheetAIModal from '../components/WorksheetAIModal';
import { Plus, Search, Edit2, Trash2, Layout, Users as UsersIcon, Sparkles, Eye, Pencil } from 'lucide-react';

/* ---- Lightweight Markdown renderer ---- */
function renderMarkdown(md) {
    if (!md || typeof md !== 'string') return '';
    let html = md
        // Escape HTML
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        // Headers
        .replace(/^#### (.+)$/gm, '<h4>$1</h4>')
        .replace(/^### (.+)$/gm, '<h3>$1</h3>')
        .replace(/^## (.+)$/gm, '<h2>$1</h2>')
        .replace(/^# (.+)$/gm, '<h1>$1</h1>')
        // Bold & Italic
        .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        // Unordered lists
        .replace(/^[\-\*] (.+)$/gm, '<li>$1</li>')
        // Horizontal rule
        .replace(/^---$/gm, '<hr/>')
        // Line breaks (double newline = paragraph, single = <br>)
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>');
    // Wrap <li> groups in <ul>
    html = html.replace(/((?:<li>.*?<\/li><br\/>?)+)/g, '<ul>$1</ul>');
    html = html.replace(/<ul>(.*?)<\/ul>/gs, (_, inner) => '<ul>' + inner.replace(/<br\/>/g, '') + '</ul>');
    return '<p>' + html + '</p>';
}

/* ---- Content display: handle both old JSON and new string content ---- */
function getContentString(content) {
    if (!content) return '';
    if (typeof content === 'string') return content;
    if (typeof content === 'object') return JSON.stringify(content, null, 2);
    return String(content);
}

const empty = { title: '', content: '' };

export default function WorksheetsPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null); // 'create' | 'edit' | null
    const [aiModal, setAiModal] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [form, setForm] = useState({ ...empty });
    const [editId, setEditId] = useState(null);
    const [previewMode, setPreviewMode] = useState(false);
    const toast = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const res = await list('worksheets', { perPage: 200, sort: '-created', expand: 'ownerId' });
            setItems(res.items || []);
        } catch (e) { toast(e.message, 'error'); }
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const filtered = items.filter(i => i.title?.toLowerCase().includes(search.toLowerCase()));

    const openCreate = () => { setForm({ ...empty }); setEditId(null); setPreviewMode(false); setModal('create'); };
    const openEdit = (item) => {
        setForm({
            title: item.title || '',
            content: getContentString(item.content),
        });
        setEditId(item.id);
        setPreviewMode(false);
        setModal('edit');
    };

    const handleSave = async () => {
        try {
            const body = {
                title: form.title,
                content: form.content, // Save as string directly
                ...(modal === 'create' && { ownerId: getUserId() }),
            };
            if (modal === 'edit') { await update('worksheets', editId, body); toast('Worksheet updated!'); }
            else { await create('worksheets', body); toast('Worksheet created!'); }
            setModal(null); load();
        } catch (e) { toast(e.message, 'error'); }
    };

    const handleDelete = async () => {
        try { await remove('worksheets', deleteId); toast('Worksheet deleted'); setDeleteId(null); load(); }
        catch (e) { toast(e.message, 'error'); }
    };

    const handleAIComplete = (generatedContent) => {
        setForm(prev => ({ ...prev, content: generatedContent }));
        setAiModal(false);
    };

    return (
        <>
            <div className="table-container">
                <div className="table-header">
                    <div className="table-title">Worksheets</div>
                    <div className="table-actions">
                        <div className="search-wrapper"><Search /><input className="search-input" placeholder="Search worksheets..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={16} /> New Worksheet</button>
                    </div>
                </div>
                {loading ? <div className="loading-center"><div className="spinner" /></div> : filtered.length === 0 ? (
                    <div className="empty-state"><Layout /><h3>No worksheets yet</h3><p>Create your first worksheet</p></div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, padding: 20 }}>
                        {filtered.map(item => (
                            <div key={item.id} className="card" style={{ position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{item.title}</h3>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn-icon" onClick={() => openEdit(item)}><Edit2 size={14} /></button>
                                        <button className="btn-icon" onClick={() => setDeleteId(item.id)} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                {item.expand?.ownerId && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <UsersIcon size={12} /> {item.expand.ownerId.name || item.expand.ownerId.email}
                                    </div>
                                )}
                                {/* Markdown content preview */}
                                {item.content && (
                                    <div
                                        className="markdown-preview card-md-preview"
                                        dangerouslySetInnerHTML={{ __html: renderMarkdown(getContentString(item.content)) }}
                                    />
                                )}
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 10 }}>
                                    {new Date(item.created).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Create / Edit Modal */}
            {modal && (
                <Modal title={modal === 'edit' ? 'Edit Worksheet' : 'New Worksheet'} onClose={() => setModal(null)} footer={
                    <><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>
                }>
                    <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Worksheet title..." /></div>
                    <div className="form-group">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <label className="form-label" style={{ margin: 0 }}>Content</label>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                    className={`btn btn-sm ${!previewMode ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setPreviewMode(false)}
                                    style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                                >
                                    <Pencil size={12} /> Edit
                                </button>
                                <button
                                    className={`btn btn-sm ${previewMode ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setPreviewMode(true)}
                                    style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                                >
                                    <Eye size={12} /> Preview
                                </button>
                                <button
                                    className="btn btn-ai btn-sm"
                                    onClick={() => setAiModal(true)}
                                    style={{ padding: '3px 10px', fontSize: '0.75rem' }}
                                >
                                    <Sparkles size={12} /> AI Generate
                                </button>
                            </div>
                        </div>
                        {previewMode ? (
                            <div
                                className="markdown-preview form-md-preview"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(form.content) }}
                            />
                        ) : (
                            <textarea
                                className="form-textarea"
                                style={{ minHeight: 200, fontFamily: "'Inter', monospace", fontSize: '0.85rem' }}
                                value={form.content}
                                onChange={e => setForm({ ...form, content: e.target.value })}
                                placeholder="Write your worksheet content in Markdown..."
                            />
                        )}
                    </div>
                </Modal>
            )}

            {/* AI Generation Modal */}
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
