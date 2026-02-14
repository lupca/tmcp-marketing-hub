import { useEffect, useState } from 'react';
import { list, create, update, remove, getUserId } from '../lib/pb';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Search, Edit2, Trash2, Megaphone, Globe } from 'lucide-react';

const empty = { name: '', goal: '', language: 'en', acquisitionStrategy: '', positioning: '', valueProposition: '', toneOfVoice: '' };

export default function CampaignsPage() {
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
        try { const res = await list('marketing_campaigns', { perPage: 200 }); setItems(res.items || []); }
        catch (e) { toast(e.message, 'error'); }
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const filtered = items.filter(i => i.name?.toLowerCase().includes(search.toLowerCase()));

    const openCreate = () => { setForm({ ...empty }); setEditId(null); setModal('create'); };
    const openEdit = (item) => {
        setForm({ name: item.name || '', goal: item.goal || '', language: item.language || 'en', acquisitionStrategy: item.acquisitionStrategy || '', positioning: item.positioning || '', valueProposition: item.valueProposition || '', toneOfVoice: item.toneOfVoice || '' });
        setEditId(item.id); setModal('edit');
    };

    const handleSave = async () => {
        try {
            const body = { ...form, ...(modal === 'create' && { userId: getUserId() }) };
            if (modal === 'edit') { await update('marketing_campaigns', editId, body); toast('Campaign updated!'); }
            else { await create('marketing_campaigns', body); toast('Campaign created!'); }
            setModal(null); load();
        } catch (e) { toast(e.message, 'error'); }
    };

    const handleDelete = async () => {
        try { await remove('marketing_campaigns', deleteId); toast('Campaign deleted'); setDeleteId(null); load(); }
        catch (e) { toast(e.message, 'error'); }
    };

    return (
        <>
            <div className="table-container">
                <div className="table-header">
                    <div className="table-title">Marketing Campaigns</div>
                    <div className="table-actions">
                        <div className="search-wrapper"><Search /><input className="search-input" placeholder="Search campaigns..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={16} /> New Campaign</button>
                    </div>
                </div>
                {loading ? <div className="loading-center"><div className="spinner" /></div> : filtered.length === 0 ? (
                    <div className="empty-state"><Megaphone /><h3>No campaigns yet</h3><p>Launch your first marketing campaign</p></div>
                ) : (
                    <table>
                        <thead><tr><th>Campaign</th><th>Goal</th><th>Language</th><th>Tone</th><th style={{ width: 100 }}>Actions</th></tr></thead>
                        <tbody>
                            {filtered.map(item => (
                                <tr key={item.id}>
                                    <td style={{ fontWeight: 600 }}>{item.name}</td>
                                    <td style={{ maxWidth: 200, color: 'var(--text-secondary)' }}>{item.goal || '—'}</td>
                                    <td><span className="badge badge-info"><Globe size={12} style={{ marginRight: 4 }} />{item.language?.toUpperCase()}</span></td>
                                    <td><span className="badge badge-primary">{item.toneOfVoice || '—'}</span></td>
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
                <Modal title={modal === 'edit' ? 'Edit Campaign' : 'New Campaign'} onClose={() => setModal(null)} footer={
                    <><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>
                }>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Campaign Name *</label><input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                        <div className="form-group">
                            <label className="form-label">Language</label>
                            <select className="form-select" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}><option value="en">English</option><option value="vi">Vietnamese</option></select>
                        </div>
                    </div>
                    <div className="form-group"><label className="form-label">Goal</label><textarea className="form-textarea" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} /></div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Acquisition Strategy</label><textarea className="form-textarea" value={form.acquisitionStrategy} onChange={e => setForm({ ...form, acquisitionStrategy: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">Positioning</label><textarea className="form-textarea" value={form.positioning} onChange={e => setForm({ ...form, positioning: e.target.value })} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Value Proposition</label><textarea className="form-textarea" value={form.valueProposition} onChange={e => setForm({ ...form, valueProposition: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">Tone of Voice</label><input className="form-input" value={form.toneOfVoice} onChange={e => setForm({ ...form, toneOfVoice: e.target.value })} placeholder="Professional, Friendly..." /></div>
                    </div>
                </Modal>
            )}
            {deleteId && <ConfirmDialog message="Delete this campaign?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
        </>
    );
}
