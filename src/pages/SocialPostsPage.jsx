import { useEffect, useState } from 'react';
import { list, create, update, remove, getUserId } from '../lib/pb';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Search, Edit2, Trash2, Share2 } from 'lucide-react';

const platforms = ['Web', 'LinkedIn', 'Facebook', 'Twitter', 'Instagram'];
const empty = { platform: 'Web', content: '', seoTitle: '', seoDescription: '', imageUrl: '', campaignId: '', eventId: '' };

export default function SocialPostsPage() {
    const [items, setItems] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
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
            const [postRes, campRes] = await Promise.all([
                list('social_posts', { perPage: 200, expand: 'campaignId' }),
                list('marketing_campaigns', { perPage: 200 }),
            ]);
            setItems(postRes.items || []);
            setCampaigns(campRes.items || []);
        } catch (e) { toast(e.message, 'error'); }
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const filtered = items.filter(i => i.content?.toLowerCase().includes(search.toLowerCase()) || i.seoTitle?.toLowerCase().includes(search.toLowerCase()));

    const openCreate = () => { setForm({ ...empty }); setEditId(null); setModal('create'); };
    const openEdit = (item) => {
        setForm({ platform: item.platform || 'Web', content: item.content || '', seoTitle: item.seoTitle || '', seoDescription: item.seoDescription || '', imageUrl: item.imageUrl || '', campaignId: item.campaignId || '', eventId: item.eventId || '' });
        setEditId(item.id); setModal('edit');
    };

    const handleSave = async () => {
        try {
            const body = { ...form, ...(modal === 'create' && { userId: getUserId() }) };
            if (modal === 'edit') { await update('social_posts', editId, body); toast('Post updated!'); }
            else { await create('social_posts', body); toast('Post created!'); }
            setModal(null); load();
        } catch (e) { toast(e.message, 'error'); }
    };

    const handleDelete = async () => {
        try { await remove('social_posts', deleteId); toast('Post deleted'); setDeleteId(null); load(); }
        catch (e) { toast(e.message, 'error'); }
    };

    return (
        <>
            <div className="table-container">
                <div className="table-header">
                    <div className="table-title">Social Posts</div>
                    <div className="table-actions">
                        <div className="search-wrapper"><Search /><input className="search-input" placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={16} /> New Post</button>
                    </div>
                </div>
                {loading ? <div className="loading-center"><div className="spinner" /></div> : filtered.length === 0 ? (
                    <div className="empty-state"><Share2 /><h3>No posts yet</h3><p>Create your first social media post</p></div>
                ) : (
                    <table>
                        <thead><tr><th>Platform</th><th>Content</th><th>SEO Title</th><th>Campaign</th><th style={{ width: 100 }}>Actions</th></tr></thead>
                        <tbody>
                            {filtered.map(item => (
                                <tr key={item.id}>
                                    <td><span className={`platform-badge ${item.platform}`}>{item.platform}</span></td>
                                    <td style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.content}</td>
                                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.seoTitle || '—'}</td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{item.expand?.campaignId?.name || '—'}</td>
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
                <Modal title={modal === 'edit' ? 'Edit Social Post' : 'New Social Post'} onClose={() => setModal(null)} footer={
                    <><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>
                }>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Platform</label>
                            <select className="form-select" value={form.platform} onChange={e => setForm({ ...form, platform: e.target.value })}>
                                {platforms.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Campaign</label>
                            <select className="form-select" value={form.campaignId} onChange={e => setForm({ ...form, campaignId: e.target.value })}>
                                <option value="">No campaign</option>
                                {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-group"><label className="form-label">Content *</label><textarea className="form-textarea" style={{ minHeight: 140 }} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="Write your social post content..." /></div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">SEO Title</label><input className="form-input" value={form.seoTitle} onChange={e => setForm({ ...form, seoTitle: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">Image URL</label><input className="form-input" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} /></div>
                    </div>
                    <div className="form-group"><label className="form-label">SEO Description</label><textarea className="form-textarea" value={form.seoDescription} onChange={e => setForm({ ...form, seoDescription: e.target.value })} /></div>
                </Modal>
            )}
            {deleteId && <ConfirmDialog message="Delete this social post?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
        </>
    );
}
