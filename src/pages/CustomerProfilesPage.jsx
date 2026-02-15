import { useEffect, useState } from 'react';
import { list, create, update, remove, getUserId } from '../lib/pb';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import CustomerProfileAIModal from '../components/CustomerProfileAIModal';
import { Plus, Search, Edit2, Trash2, Users, Sparkles } from 'lucide-react';

const empty = { worksheetId: '', personaName: '', summary: '', demographics: '{}', psychographics: '{}', goalsAndMotivations: '{}', painPointsAndChallenges: '{}', painPoints: '[]' };

export default function CustomerProfilesPage() {
    const [items, setItems] = useState([]);
    const [worksheets, setWorksheets] = useState([]);
    const [brandIdentities, setBrandIdentities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [form, setForm] = useState({ ...empty });
    const [editId, setEditId] = useState(null);
    const [showAI, setShowAI] = useState(false);
    const toast = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const [res, wsRes, biRes] = await Promise.all([
                list('ideal_customer_profiles', { perPage: 200, expand: 'worksheetId' }),
                list('worksheets', { perPage: 200 }),
                list('brand_identities', { perPage: 200 }),
            ]);
            setItems(res.items || []);
            setWorksheets(wsRes.items || []);
            setBrandIdentities(biRes.items || []);
        } catch (e) { toast(e.message, 'error'); }
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const filtered = items.filter(i => i.personaName?.toLowerCase().includes(search.toLowerCase()));

    const openCreate = () => { setForm({ ...empty }); setEditId(null); setModal('create'); };
    const openEdit = (item) => {
        setForm({
            worksheetId: item.worksheetId || '',
            personaName: item.personaName || '', summary: item.summary || '',
            demographics: JSON.stringify(item.demographics || {}, null, 2),
            psychographics: JSON.stringify(item.psychographics || {}, null, 2),
            goalsAndMotivations: JSON.stringify(item.goalsAndMotivations || {}, null, 2),
            painPointsAndChallenges: JSON.stringify(item.painPointsAndChallenges || {}, null, 2),
            painPoints: JSON.stringify(item.painPoints || [], null, 2),
        });
        setEditId(item.id); setModal('edit');
    };

    const handleSave = async () => {
        try {
            const parse = s => { try { return JSON.parse(s); } catch { return {}; } };
            const parseArr = s => { try { return JSON.parse(s); } catch { return []; } };
            const body = {
                worksheetId: form.worksheetId,
                personaName: form.personaName, summary: form.summary,
                demographics: parse(form.demographics), psychographics: parse(form.psychographics),
                goalsAndMotivations: parse(form.goalsAndMotivations), painPointsAndChallenges: parse(form.painPointsAndChallenges),
                painPoints: parseArr(form.painPoints),
                ...(modal === 'create' && { userId: getUserId() }),
            };
            if (modal === 'edit') { await update('ideal_customer_profiles', editId, body); toast('Profile updated!'); }
            else { await create('ideal_customer_profiles', body); toast('Profile created!'); }
            setModal(null); load();
        } catch (e) { toast(e.message, 'error'); }
    };

    const handleDelete = async () => {
        try { await remove('ideal_customer_profiles', deleteId); toast('Profile deleted'); setDeleteId(null); load(); }
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
                                {item.expand?.worksheetId && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>📋 {item.expand.worksheetId.title}</div>}
                                {item.summary && <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 10, lineHeight: 1.5 }}>{item.summary}</p>}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {item.demographics && Object.keys(item.demographics).length > 0 && <span className="badge badge-info">Demographics ✓</span>}
                                    {item.psychographics && Object.keys(item.psychographics).length > 0 && <span className="badge badge-primary">Psychographics ✓</span>}
                                    {item.goalsAndMotivations && Object.keys(item.goalsAndMotivations).length > 0 && <span className="badge badge-success">Goals ✓</span>}
                                    {item.painPointsAndChallenges && Object.keys(item.painPointsAndChallenges).length > 0 && <span className="badge badge-warning">Pain Points ✓</span>}
                                    {Array.isArray(item.painPoints) && item.painPoints.length > 0 && <span className="badge badge-danger">Pain Points List ({item.painPoints.length})</span>}
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
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                        <button className="btn btn-sm" style={{ background: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setShowAI(true)}>
                            <Sparkles size={14} /> Generate with AI
                        </button>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Worksheet *</label>
                        <select className="form-select" value={form.worksheetId} onChange={e => setForm({ ...form, worksheetId: e.target.value })}>
                            <option value="">Select worksheet...</option>
                            {worksheets.map(w => <option key={w.id} value={w.id}>{w.title}</option>)}
                        </select>
                    </div>
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
                        <div className="form-group"><label className="form-label">Pain Points & Challenges (JSON)</label><textarea className="form-textarea" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} value={form.painPointsAndChallenges} onChange={e => setForm({ ...form, painPointsAndChallenges: e.target.value })} /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Pain Points (JSON Array)</label><textarea className="form-textarea" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} value={form.painPoints} onChange={e => setForm({ ...form, painPoints: e.target.value })} placeholder='["Pain point 1", "Pain point 2"]' /></div>
                </Modal>
            )}
            {showAI && (
                <CustomerProfileAIModal
                    brandIdentities={brandIdentities}
                    onClose={() => setShowAI(false)}
                    onComplete={(data) => {
                        setForm(f => ({
                            ...f,
                            personaName: data.personaName || f.personaName,
                            summary: data.summary || f.summary,
                            demographics: data.demographics ? JSON.stringify(data.demographics, null, 2) : f.demographics,
                            psychographics: data.psychographics ? JSON.stringify(data.psychographics, null, 2) : f.psychographics,
                            goalsAndMotivations: data.goalsAndMotivations ? JSON.stringify(data.goalsAndMotivations, null, 2) : f.goalsAndMotivations,
                            painPointsAndChallenges: data.painPointsAndChallenges ? JSON.stringify(data.painPointsAndChallenges, null, 2) : f.painPointsAndChallenges,
                        }));
                        toast('AI data applied to form!', 'success');
                    }}
                />
            )}
            {deleteId && <ConfirmDialog message="Delete this customer profile?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
        </>
    );
}
