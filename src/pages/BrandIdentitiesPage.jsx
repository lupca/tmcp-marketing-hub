import { useEffect, useState } from 'react';
import { list, create, update, remove, getUserId } from '../lib/pb';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Search, Edit2, Trash2, Palette, ExternalLink } from 'lucide-react';

const empty = { worksheetId: '', brandName: '', slogan: '', missionStatement: '', logoUrl: '', colorPalette: '[]', keywords: '[]' };

export default function BrandIdentitiesPage() {
    const [items, setItems] = useState([]);
    const [worksheets, setWorksheets] = useState([]);
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
            const [res, wsRes] = await Promise.all([
                list('brand_identities', { perPage: 200, expand: 'worksheetId' }),
                list('worksheets', { perPage: 200 }),
            ]);
            setItems(res.items || []);
            setWorksheets(wsRes.items || []);
        } catch (e) { toast(e.message, 'error'); }
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const filtered = items.filter(i => i.brandName?.toLowerCase().includes(search.toLowerCase()));

    const openCreate = () => { setForm({ ...empty }); setEditId(null); setModal('create'); };
    const openEdit = (item) => {
        setForm({
            worksheetId: item.worksheetId || '',
            brandName: item.brandName || '', slogan: item.slogan || '', missionStatement: item.missionStatement || '',
            logoUrl: item.logoUrl || '', colorPalette: JSON.stringify(item.colorPalette || [], null, 2),
            keywords: JSON.stringify(item.keywords || [], null, 2),
        });
        setEditId(item.id); setModal('edit');
    };

    const handleSave = async () => {
        try {
            let cp, kw;
            try { cp = JSON.parse(form.colorPalette); } catch { cp = []; }
            try { kw = JSON.parse(form.keywords); } catch { kw = []; }
            const body = { worksheetId: form.worksheetId, brandName: form.brandName, slogan: form.slogan, missionStatement: form.missionStatement, logoUrl: form.logoUrl, colorPalette: cp, keywords: kw, ...(modal === 'create' && { userId: getUserId() }) };
            if (modal === 'edit') { await update('brand_identities', editId, body); toast('Brand updated!'); }
            else { await create('brand_identities', body); toast('Brand created!'); }
            setModal(null); load();
        } catch (e) { toast(e.message, 'error'); }
    };

    const handleDelete = async () => {
        try { await remove('brand_identities', deleteId); toast('Brand deleted'); setDeleteId(null); load(); }
        catch (e) { toast(e.message, 'error'); }
    };

    return (
        <>
            <div className="table-container">
                <div className="table-header">
                    <div className="table-title">Brand Identities</div>
                    <div className="table-actions">
                        <div className="search-wrapper"><Search /><input className="search-input" placeholder="Search brands..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={16} /> New Brand</button>
                    </div>
                </div>
                {loading ? <div className="loading-center"><div className="spinner" /></div> : filtered.length === 0 ? (
                    <div className="empty-state"><Palette /><h3>No brands yet</h3><p>Create your first brand identity</p></div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16, padding: 20 }}>
                        {filtered.map(item => (
                            <div key={item.id} className="card" style={{ position: 'relative' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{item.brandName}</h3>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn-icon" onClick={() => openEdit(item)}><Edit2 size={14} /></button>
                                        <button className="btn-icon" onClick={() => setDeleteId(item.id)} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                {item.expand?.worksheetId && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>📋 {item.expand.worksheetId.title}</div>}
                                {item.slogan && <p style={{ color: 'var(--primary-light)', fontStyle: 'italic', marginBottom: 8, fontSize: '0.9rem' }}>"{item.slogan}"</p>}
                                {item.missionStatement && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>{item.missionStatement}</p>}
                                {item.logoUrl && <a href={item.logoUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.8rem' }}><ExternalLink size={12} /> Logo</a>}
                                {Array.isArray(item.colorPalette) && item.colorPalette.length > 0 && (
                                    <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
                                        {item.colorPalette.map((c, i) => <div key={i} style={{ width: 24, height: 24, borderRadius: 6, background: c, border: '1px solid var(--border)' }} title={c} />)}
                                    </div>
                                )}
                                {Array.isArray(item.keywords) && item.keywords.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 10 }}>
                                        {item.keywords.map((k, i) => <span key={i} className="badge badge-primary">{k}</span>)}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {modal && (
                <Modal title={modal === 'edit' ? 'Edit Brand' : 'New Brand Identity'} onClose={() => setModal(null)} footer={
                    <><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>
                }>
                    <div className="form-group">
                        <label className="form-label">Worksheet *</label>
                        <select className="form-select" value={form.worksheetId} onChange={e => setForm({ ...form, worksheetId: e.target.value })}>
                            <option value="">Select worksheet...</option>
                            {worksheets.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
                        </select>
                    </div>
                    <div className="form-group"><label className="form-label">Brand Name *</label><input className="form-input" value={form.brandName} onChange={e => setForm({ ...form, brandName: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Slogan</label><input className="form-input" value={form.slogan} onChange={e => setForm({ ...form, slogan: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Mission Statement</label><textarea className="form-textarea" value={form.missionStatement} onChange={e => setForm({ ...form, missionStatement: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Logo URL</label><input className="form-input" value={form.logoUrl} onChange={e => setForm({ ...form, logoUrl: e.target.value })} /></div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Color Palette (JSON)</label><textarea className="form-textarea" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} value={form.colorPalette} onChange={e => setForm({ ...form, colorPalette: e.target.value })} placeholder='["#6c5ce7","#00cec9"]' /></div>
                        <div className="form-group"><label className="form-label">Keywords (JSON)</label><textarea className="form-textarea" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} value={form.keywords} onChange={e => setForm({ ...form, keywords: e.target.value })} placeholder='["marketing","growth"]' /></div>
                    </div>
                </Modal>
            )}
            {deleteId && <ConfirmDialog message="Delete this brand identity?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
        </>
    );
}
