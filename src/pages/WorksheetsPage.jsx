import { useEffect, useState } from 'react';
import { list, create, update, remove, getUserId } from '../lib/pb';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Search, Edit2, Trash2, Layout, Users as UsersIcon } from 'lucide-react';

const empty = { title: '', content: '{}' };

export default function WorksheetsPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [form, setForm] = useState({ ...empty });
    const [editId, setEditId] = useState(null);
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

    const openCreate = () => { setForm({ ...empty }); setEditId(null); setModal('create'); };
    const openEdit = (item) => {
        setForm({
            title: item.title || '',
            content: JSON.stringify(item.content || {}, null, 2),
        });
        setEditId(item.id); setModal('edit');
    };

    const handleSave = async () => {
        try {
            let parsed;
            try { parsed = JSON.parse(form.content); } catch { parsed = {}; }
            const body = {
                title: form.title,
                content: parsed,
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
                    <div className="empty-state"><Layout /><h3>No worksheets yet</h3><p>Create your first workspace</p></div>
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
                                {Array.isArray(item.members) && item.members.length > 0 && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                                        <span className="badge badge-info">{item.members.length} member{item.members.length > 1 ? 's' : ''}</span>
                                    </div>
                                )}
                                {item.content && typeof item.content === 'object' && Object.keys(item.content).length > 0 && (
                                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 8 }}>
                                        {Object.keys(item.content).map(k => <span key={k} className="badge badge-primary">{k}</span>)}
                                    </div>
                                )}
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 10 }}>
                                    {new Date(item.created).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {modal && (
                <Modal title={modal === 'edit' ? 'Edit Worksheet' : 'New Worksheet'} onClose={() => setModal(null)} footer={
                    <><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>
                }>
                    <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Worksheet title..." /></div>
                    <div className="form-group">
                        <label className="form-label">Content (JSON)</label>
                        <textarea className="form-textarea" style={{ fontFamily: 'monospace', fontSize: '0.8rem', minHeight: 160 }} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder='{"key": "value"}' />
                    </div>
                </Modal>
            )}
            {deleteId && <ConfirmDialog message="Delete this worksheet? All related data will also be deleted." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
        </>
    );
}
