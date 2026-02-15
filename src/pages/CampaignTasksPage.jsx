import { useEffect, useState } from 'react';
import { list, create, update, remove, getUserId } from '../lib/pb';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Search, Edit2, Trash2, ListTodo } from 'lucide-react';

const statuses = ['To Do', 'In Progress', 'Done', 'Cancelled'];
const empty = { taskName: '', description: '', campaignId: '', week: '', status: 'To Do' };

export default function CampaignTasksPage() {
    const [items, setItems] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterCampaign, setFilterCampaign] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [modal, setModal] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [form, setForm] = useState({ ...empty });
    const [editId, setEditId] = useState(null);
    const toast = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const [taskRes, campRes] = await Promise.all([
                list('campaign_tasks', { perPage: 500, expand: 'campaignId', sort: '-created' }),
                list('marketing_campaigns', { perPage: 200 }),
            ]);
            setItems(taskRes.items || []);
            setCampaigns(campRes.items || []);
        } catch (e) { toast(e.message, 'error'); }
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const filtered = items.filter(i => {
        if (search && !i.taskName?.toLowerCase().includes(search.toLowerCase())) return false;
        if (filterCampaign && i.campaignId !== filterCampaign) return false;
        if (filterStatus && i.status !== filterStatus) return false;
        return true;
    });

    const openCreate = () => { setForm({ ...empty }); setEditId(null); setModal('create'); };
    const openEdit = (item) => {
        setForm({ taskName: item.taskName || '', description: item.description || '', campaignId: item.campaignId || '', week: item.week ?? '', status: item.status || 'To Do' });
        setEditId(item.id); setModal('edit');
    };

    const handleSave = async () => {
        try {
            const body = { ...form, week: form.week === '' ? null : Number(form.week), ...(modal === 'create' && { userId: getUserId() }) };
            if (modal === 'edit') { await update('campaign_tasks', editId, body); toast('Task updated!'); }
            else { await create('campaign_tasks', body); toast('Task created!'); }
            setModal(null); load();
        } catch (e) { toast(e.message, 'error'); }
    };

    const handleDelete = async () => {
        try { await remove('campaign_tasks', deleteId); toast('Task deleted'); setDeleteId(null); load(); }
        catch (e) { toast(e.message, 'error'); }
    };

    const quickStatus = async (item, newStatus) => {
        try { await update('campaign_tasks', item.id, { status: newStatus }); toast(`Status → ${newStatus}`); load(); }
        catch (e) { toast(e.message, 'error'); }
    };

    const statusBadge = s => s === 'Done' ? 'badge-success' : s === 'In Progress' ? 'badge-warning' : s === 'Cancelled' ? 'badge-danger' : 'badge-info';

    return (
        <>
            <div className="table-container">
                <div className="table-header">
                    <div className="table-title">Campaign Tasks</div>
                    <div className="table-actions">
                        <div className="search-wrapper"><Search /><input className="search-input" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                        <select className="form-select" style={{ width: 'auto', minWidth: 140 }} value={filterCampaign} onChange={e => setFilterCampaign(e.target.value)}>
                            <option value="">All campaigns</option>
                            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <select className="form-select" style={{ width: 'auto', minWidth: 120 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                            <option value="">All statuses</option>
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={16} /> New Task</button>
                    </div>
                </div>
                {loading ? <div className="loading-center"><div className="spinner" /></div> : filtered.length === 0 ? (
                    <div className="empty-state"><ListTodo /><h3>No tasks</h3><p>Add your first campaign task</p></div>
                ) : (
                    <table>
                        <thead><tr><th>Task</th><th>Campaign</th><th>Week</th><th>Status</th><th>Description</th><th style={{ width: 100 }}>Actions</th></tr></thead>
                        <tbody>
                            {filtered.map(item => (
                                <tr key={item.id}>
                                    <td style={{ fontWeight: 600 }}>{item.taskName}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.expand?.campaignId?.name || '—'}</td>
                                    <td>{item.week ?? '—'}</td>
                                    <td>
                                        <select className={`badge ${statusBadge(item.status)}`} value={item.status} onChange={e => quickStatus(item, e.target.value)} style={{ cursor: 'pointer', border: 'none', fontSize: '0.75rem', padding: '4px 8px' }}>
                                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
                                    <td style={{ maxWidth: 200, color: 'var(--text-secondary)', fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description || '—'}</td>
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
                <Modal title={modal === 'edit' ? 'Edit Task' : 'New Task'} onClose={() => setModal(null)} footer={
                    <><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>
                }>
                    <div className="form-group"><label className="form-label">Task Name *</label><input className="form-input" value={form.taskName} onChange={e => setForm({ ...form, taskName: e.target.value })} /></div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Campaign *</label>
                            <select className="form-select" value={form.campaignId} onChange={e => setForm({ ...form, campaignId: e.target.value })}>
                                <option value="">Select campaign...</option>
                                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="form-group"><label className="form-label">Week</label><input className="form-input" type="number" value={form.week} onChange={e => setForm({ ...form, week: e.target.value })} /></div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                </Modal>
            )}
            {deleteId && <ConfirmDialog message="Delete this task?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
        </>
    );
}
