import { useEffect, useState } from 'react';
import { list, create, update, remove, getUserId } from '../lib/pb';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Search, Edit2, Trash2, Users } from 'lucide-react';

const empty = { personaName: '', summary: '', demographics: '{}', psychographics: '{}', goalsAndMotivations: '{}', painPointsAndChallenges: '{}' };

export default function CustomerProfilesPage() {
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
        try { const res = await list('customer_profiles', { perPage: 200 }); setItems(res.items || []); }
        catch (e) { toast(e.message, 'error'); }
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const filtered = items.filter(i => i.personaName?.toLowerCase().includes(search.toLowerCase()));

    const openCreate = () => { setForm({ ...empty }); setEditId(null); setModal('create'); };
    const openEdit = (item) => {
        setForm({
            personaName: item.personaName || '', summary: item.summary || '',
            demographics: JSON.stringify(item.demographics || {}, null, 2),
            psychographics: JSON.stringify(item.psychographics || {}, null, 2),
            goalsAndMotivations: JSON.stringify(item.goalsAndMotivations || {}, null, 2),
            painPointsAndChallenges: JSON.stringify(item.painPointsAndChallenges || {}, null, 2),
        });
        setEditId(item.id); setModal('edit');
    };

    const handleSave = async () => {
        try {
            const parse = s => { try { return JSON.parse(s); } catch { return {}; } };
            const body = {
                personaName: form.personaName, summary: form.summary,
                demographics: parse(form.demographics), psychographics: parse(form.psychographics),
                goalsAndMotivations: parse(form.goalsAndMotivations), painPointsAndChallenges: parse(form.painPointsAndChallenges),
                ...(modal === 'create' && { userId: getUserId() }),
            };
            if (modal === 'edit') { await update('customer_profiles', editId, body); toast('Profile updated!'); }
            else { await create('customer_profiles', body); toast('Profile created!'); }
            setModal(null); load();
        } catch (e) { toast(e.message, 'error'); }
    };

    const handleDelete = async () => {
        try { await remove('customer_profiles', deleteId); toast('Profile deleted'); setDeleteId(null); load(); }
        catch (e) { toast(e.message, 'error'); }
    };

    return (
        <>
            <div className="table-container">
                <div className="table-header">
                    <div className="table-title">Customer Profiles</div>
                    <div className="table-actions">
                        <div className="search-wrapper"><Search /><input className="search-input" placeholder="Search personas..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={16} /> New Profile</button>
                    </div>
                </div>
                {loading ? <div className="loading-center"><div className="spinner" /></div> : filtered.length === 0 ? (
                    <div className="empty-state"><Users /><h3>No profiles yet</h3><p>Create your ideal customer profile</p></div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16, padding: 20 }}>
                        {filtered.map(item => (
                            <div key={item.id} className="card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--gradient-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1rem', color: '#fff', flexShrink: 0 }}>
                                            {item.personaName?.[0]?.toUpperCase() || '?'}
                                        </div>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{item.personaName}</h3>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button className="btn-icon" onClick={() => openEdit(item)}><Edit2 size={14} /></button>
                                        <button className="btn-icon" onClick={() => setDeleteId(item.id)} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                {item.summary && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 10, lineHeight: 1.5 }}>{item.summary}</p>}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {item.demographics && Object.keys(item.demographics).length > 0 && <span className="badge badge-info">Demographics ✓</span>}
                                    {item.psychographics && Object.keys(item.psychographics).length > 0 && <span className="badge badge-primary">Psychographics ✓</span>}
                                    {item.goalsAndMotivations && Object.keys(item.goalsAndMotivations).length > 0 && <span className="badge badge-success">Goals ✓</span>}
                                    {item.painPointsAndChallenges && Object.keys(item.painPointsAndChallenges).length > 0 && <span className="badge badge-warning">Pain Points ✓</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {modal && (
                <Modal title={modal === 'edit' ? 'Edit Profile' : 'New Customer Profile'} onClose={() => setModal(null)} footer={
                    <><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>
                }>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Persona Name *</label><input className="form-input" value={form.personaName} onChange={e => setForm({ ...form, personaName: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">Summary</label><input className="form-input" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Demographics (JSON)</label><textarea className="form-textarea" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} value={form.demographics} onChange={e => setForm({ ...form, demographics: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">Psychographics (JSON)</label><textarea className="form-textarea" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} value={form.psychographics} onChange={e => setForm({ ...form, psychographics: e.target.value })} /></div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Goals & Motivations (JSON)</label><textarea className="form-textarea" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} value={form.goalsAndMotivations} onChange={e => setForm({ ...form, goalsAndMotivations: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">Pain Points (JSON)</label><textarea className="form-textarea" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} value={form.painPointsAndChallenges} onChange={e => setForm({ ...form, painPointsAndChallenges: e.target.value })} /></div>
                    </div>
                </Modal>
            )}
            {deleteId && <ConfirmDialog message="Delete this customer profile?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
        </>
    );
}
