import { useEffect, useState } from 'react';
import { list, create, update, remove, getUserId } from '../lib/pb';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Edit2, Trash2, ListTodo, Filter } from 'lucide-react';

const statuses = ['To Do', 'In Progress', 'Done'];
const statusColors = { 'To Do': 'var(--info)', 'In Progress': 'var(--warning)', 'Done': 'var(--success)' };
const empty = { taskName: '', description: '', campaignId: '', language: 'en', week: 1, status: 'To Do' };

export default function CampaignTasksPage() {
    const [items, setItems] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [form, setForm] = useState({ ...empty });
    const [editId, setEditId] = useState(null);
    const [filterCampaign, setFilterCampaign] = useState('');
    const toast = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const [taskRes, campRes] = await Promise.all([
                list('campaign_tasks', { perPage: 200, sort: 'week', expand: 'campaignId' }),
                list('marketing_campaigns', { perPage: 200 }),
            ]);
            setItems(taskRes.items || []);
            setCampaigns(campRes.items || []);
        } catch (e) { toast(e.message, 'error'); }
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const filtered = filterCampaign ? items.filter(i => i.campaignId === filterCampaign) : items;
    const grouped = {};
    statuses.forEach(s => { grouped[s] = filtered.filter(i => i.status === s); });

    const openCreate = (status = 'To Do') => { setForm({ ...empty, status }); setEditId(null); setModal('create'); };
    const openEdit = (item) => {
        setForm({ taskName: item.taskName || '', description: item.description || '', campaignId: item.campaignId || '', language: item.language || 'en', week: item.week || 1, status: item.status || 'To Do' });
        setEditId(item.id); setModal('edit');
    };

    const handleSave = async () => {
        try {
            const body = { ...form, week: Number(form.week), ...(modal === 'create' && { userId: getUserId() }) };
            if (modal === 'edit') { await update('campaign_tasks', editId, body); toast('Task updated!'); }
            else { await create('campaign_tasks', body); toast('Task created!'); }
            setModal(null); load();
        } catch (e) { toast(e.message, 'error'); }
    };

    const moveTask = async (id, newStatus) => {
        try { await update('campaign_tasks', id, { status: newStatus }); toast(`Moved to ${newStatus}`); load(); }
        catch (e) { toast(e.message, 'error'); }
    };

    const handleDelete = async () => {
        try { await remove('campaign_tasks', deleteId); toast('Task deleted'); setDeleteId(null); load(); }
        catch (e) { toast(e.message, 'error'); }
    };

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <Filter size={16} color="var(--text-muted)" />
                <select className="form-select" style={{ width: 240 }} value={filterCampaign} onChange={e => setFilterCampaign(e.target.value)}>
                    <option value="">All Campaigns</option>
                    {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <button className="btn btn-primary btn-sm" onClick={() => openCreate()}><Plus size={16} /> Add Task</button>
            </div>

            <div className="kanban-board">
                {statuses.map(status => (
                    <div key={status} className="kanban-column">
                        <div className="kanban-column-header" style={{ borderBottom: `2px solid ${statusColors[status]}` }}>
                            <span>{status}</span>
                            <span className="count">{grouped[status].length}</span>
                        </div>
                        <div className="kanban-cards">
                            {grouped[status].length === 0 ? (
                                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No tasks</div>
                            ) : grouped[status].map(item => (
                                <div key={item.id} className="kanban-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                        <h4>{item.taskName}</h4>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            <button className="btn-icon" style={{ width: 28, height: 28 }} onClick={() => openEdit(item)}><Edit2 size={12} /></button>
                                            <button className="btn-icon" style={{ width: 28, height: 28, borderColor: 'var(--danger)', color: 'var(--danger)' }} onClick={() => setDeleteId(item.id)}><Trash2 size={12} /></button>
                                        </div>
                                    </div>
                                    {item.description && <p>{item.description}</p>}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                                        <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>Week {item.week}</span>
                                        <div style={{ display: 'flex', gap: 4 }}>
                                            {statuses.filter(s => s !== item.status).map(s => (
                                                <button key={s} className="btn btn-ghost btn-sm" style={{ padding: '2px 8px', fontSize: '0.7rem' }} onClick={() => moveTask(item.id, s)}>→ {s}</button>
                                            ))}
                                        </div>
                                    </div>
                                    {item.expand?.campaignId && <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>📋 {item.expand.campaignId.name}</div>}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {modal && (
                <Modal title={modal === 'edit' ? 'Edit Task' : 'New Task'} onClose={() => setModal(null)} footer={
                    <><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>
                }>
                    <div className="form-group"><label className="form-label">Task Name *</label><input className="form-input" value={form.taskName} onChange={e => setForm({ ...form, taskName: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Campaign</label>
                            <select className="form-select" value={form.campaignId} onChange={e => setForm({ ...form, campaignId: e.target.value })}>
                                <option value="">Select campaign...</option>
                                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Status</label>
                            <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Week</label><input className="form-input" type="number" min="1" value={form.week} onChange={e => setForm({ ...form, week: e.target.value })} /></div>
                        <div className="form-group">
                            <label className="form-label">Language</label>
                            <select className="form-select" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}><option value="en">English</option><option value="vi">Vietnamese</option></select>
                        </div>
                    </div>
                </Modal>
            )}
            {deleteId && <ConfirmDialog message="Delete this task?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
        </>
    );
}
