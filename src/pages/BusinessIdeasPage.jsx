import { useEffect, useState } from 'react';
import { list, create, update, remove, getUserId } from '../lib/pb';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Search, Edit2, Trash2, Lightbulb, Package } from 'lucide-react';

export default function BusinessIdeasPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null); // 'create' | 'edit'
    const [deleteId, setDeleteId] = useState(null);
    const [form, setForm] = useState({ rawIdea: '', productCore: '{}' });
    const [editId, setEditId] = useState(null);
    const toast = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const res = await list('business_ideas', { perPage: 200, expand: 'userId' });
            setItems(res.items || []);
        } catch (e) { toast(e.message, 'error'); }
        setLoading(false);
    };

    useEffect(() => { load(); }, []);

    const filtered = items.filter(i => i.rawIdea?.toLowerCase().includes(search.toLowerCase()));

    const openCreate = () => { setForm({ rawIdea: '', productCore: '{}' }); setEditId(null); setModal('create'); };
    const openEdit = (item) => {
        setForm({ rawIdea: item.rawIdea || '', productCore: JSON.stringify(item.productCore || {}, null, 2) });
        setEditId(item.id);
        setModal('edit');
    };

    const handleSave = async () => {
        try {
            let parsed;
            try { parsed = JSON.parse(form.productCore); } catch { parsed = {}; }
            const body = { rawIdea: form.rawIdea, productCore: parsed, ...(modal === 'create' && { userId: getUserId() }) };
            if (modal === 'edit') {
                await update('business_ideas', editId, body);
                toast('Idea updated!', 'success');
            } else {
                await create('business_ideas', body);
                toast('Idea created!', 'success');
            }
            setModal(null);
            load();
        } catch (e) { toast(e.message, 'error'); }
    };

    const handleDelete = async () => {
        try {
            await remove('business_ideas', deleteId);
            toast('Idea deleted', 'success');
            setDeleteId(null);
            load();
        } catch (e) { toast(e.message, 'error'); }
    };

    return (
        <>
            <div className="table-container">
                <div className="table-header">
                    <div className="table-title">All Business Ideas</div>
                    <div className="table-actions">
                        <div className="search-wrapper">
                            <Search /><input className="search-input" placeholder="Search ideas..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={16} /> Add Idea</button>
                    </div>
                </div>
                {loading ? <div className="loading-center"><div className="spinner" /></div> : filtered.length === 0 ? (
                    <div className="empty-state"><Lightbulb /><h3>No ideas yet</h3><p>Start capturing your business ideas</p></div>
                ) : (
                    <table>
                        <thead><tr><th>Raw Idea</th><th>Product Core</th><th style={{ width: 100 }}>Actions</th></tr></thead>
                        <tbody>
                            {filtered.map(item => (
                                <tr key={item.id}>
                                    <td style={{ fontWeight: 600, maxWidth: 300 }}>{item.rawIdea}</td>
                                    <td>
                                        {item.productCore && typeof item.productCore === 'object' ? (
                                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                                {Object.keys(item.productCore).map(k => <span key={k} className="badge badge-primary">{k}</span>)}
                                            </div>
                                        ) : <span className="badge badge-info">—</span>}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button className="btn-icon" onClick={() => openEdit(item)}><Edit2 size={15} /></button>
                                            <button className="btn-icon" onClick={() => setDeleteId(item.id)} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}><Trash2 size={15} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {modal && (
                <Modal title={modal === 'edit' ? 'Edit Business Idea' : 'New Business Idea'} onClose={() => setModal(null)} footer={
                    <><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>
                }>
                    <div className="form-group">
                        <label className="form-label">Raw Idea *</label>
                        <textarea className="form-textarea" value={form.rawIdea} onChange={e => setForm({ ...form, rawIdea: e.target.value })} placeholder="Describe your business idea..." />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Product Core (JSON)</label>
                        <textarea className="form-textarea" value={form.productCore} onChange={e => setForm({ ...form, productCore: e.target.value })} placeholder='{"problem": "", "solution": "", "usp": ""}' style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} />
                    </div>
                </Modal>
            )}

            {deleteId && <ConfirmDialog message="Are you sure you want to delete this business idea?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
        </>
    );
}
