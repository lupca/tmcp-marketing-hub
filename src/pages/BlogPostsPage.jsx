import { useEffect, useState } from 'react';
import { list, create, update, remove, getUserId } from '../lib/pb';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Search, Edit2, Trash2, FileText, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const empty = { title: '', slug: '', content: '', summary: '', status: 'draft' };
const PER_PAGE = 10;

export default function BlogPostsPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [form, setForm] = useState({ ...empty });
    const [editId, setEditId] = useState(null);
    const [preview, setPreview] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const toast = useToast();

    const load = async (p = page) => {
        setLoading(true);
        try {
            const res = await list('posts', { page: p, perPage: PER_PAGE, sort: '-created' });
            setItems(res.items || []);
            setTotalPages(res.totalPages || 1);
            setTotalItems(res.totalItems || 0);
        } catch (e) { toast(e.message, 'error'); }
        setLoading(false);
    };
    useEffect(() => { load(page); }, [page]);

    const filtered = items.filter(i => i.title?.toLowerCase().includes(search.toLowerCase()));

    const openCreate = () => { setForm({ ...empty }); setEditId(null); setModal('create'); };
    const openEdit = (item) => {
        setForm({ title: item.title || '', slug: item.slug || '', content: item.content || '', summary: item.summary || '', status: item.status || 'draft' });
        setEditId(item.id); setModal('edit');
    };

    const handleSave = async () => {
        try {
            const body = { ...form, ...(modal === 'create' && { userId: getUserId() }) };
            if (modal === 'edit') { await update('posts', editId, body); toast('Post updated!'); }
            else { await create('posts', body); toast('Post created!'); }
            setModal(null); load(page);
        } catch (e) { toast(e.message, 'error'); }
    };

    const handleDelete = async () => {
        try {
            await remove('posts', deleteId); toast('Post deleted'); setDeleteId(null);
            // If we deleted the last item on this page, go back one page
            if (items.length === 1 && page > 1) setPage(page - 1);
            else load(page);
        } catch (e) { toast(e.message, 'error'); }
    };

    const goToPage = (p) => { if (p >= 1 && p <= totalPages) setPage(p); };

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages = [];
        const maxVisible = 5;
        let start = Math.max(1, page - Math.floor(maxVisible / 2));
        let end = Math.min(totalPages, start + maxVisible - 1);
        if (end - start + 1 < maxVisible) start = Math.max(1, end - maxVisible + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    const startItem = (page - 1) * PER_PAGE + 1;
    const endItem = Math.min(page * PER_PAGE, totalItems);

    return (
        <>
            <div className="table-container">
                <div className="table-header">
                    <div className="table-title">Blog Posts</div>
                    <div className="table-actions">
                        <div className="search-wrapper"><Search /><input className="search-input" placeholder="Search posts..." value={search} onChange={e => setSearch(e.target.value)} /></div>
                        <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={16} /> New Post</button>
                    </div>
                </div>
                {loading ? <div className="loading-center"><div className="spinner" /></div> : filtered.length === 0 ? (
                    <div className="empty-state"><FileText /><h3>No blog posts</h3><p>Write your first blog post</p></div>
                ) : (
                    <>
                        <table>
                            <thead><tr><th>Title</th><th>Slug</th><th>Status</th><th>Summary</th><th>Created</th><th style={{ width: 130 }}>Actions</th></tr></thead>
                            <tbody>
                                {filtered.map(item => (
                                    <tr key={item.id}>
                                        <td style={{ fontWeight: 600 }}>{item.title || 'Untitled'}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'monospace' }}>{item.slug || '—'}</td>
                                        <td><span className={`badge ${item.status === 'published' ? 'badge-success' : 'badge-warning'}`}>{item.status || 'draft'}</span></td>
                                        <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.summary || '—'}</td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{new Date(item.created).toLocaleDateString()}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: 6 }}>
                                                {item.content && <button className="btn-icon" onClick={() => setPreview(item)}><Eye size={15} /></button>}
                                                <button className="btn-icon" onClick={() => openEdit(item)}><Edit2 size={15} /></button>
                                                <button className="btn-icon" onClick={() => setDeleteId(item.id)} style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}><Trash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="pagination">
                                <span className="pagination-info">
                                    Hiển thị {startItem}–{endItem} / {totalItems} bài viết
                                </span>
                                <div className="pagination-controls">
                                    <button className="pagination-btn" disabled={page === 1} onClick={() => goToPage(1)} title="Trang đầu">
                                        <ChevronsLeft size={16} />
                                    </button>
                                    <button className="pagination-btn" disabled={page === 1} onClick={() => goToPage(page - 1)} title="Trang trước">
                                        <ChevronLeft size={16} />
                                    </button>
                                    {getPageNumbers().map(p => (
                                        <button key={p} className={`pagination-btn ${p === page ? 'active' : ''}`} onClick={() => goToPage(p)}>
                                            {p}
                                        </button>
                                    ))}
                                    <button className="pagination-btn" disabled={page === totalPages} onClick={() => goToPage(page + 1)} title="Trang sau">
                                        <ChevronRight size={16} />
                                    </button>
                                    <button className="pagination-btn" disabled={page === totalPages} onClick={() => goToPage(totalPages)} title="Trang cuối">
                                        <ChevronsRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Preview modal */}
            {preview && (
                <Modal title={preview.title || 'Preview'} onClose={() => setPreview(null)}>
                    <div dangerouslySetInnerHTML={{ __html: preview.content }} style={{ lineHeight: 1.7, color: 'var(--text-secondary)' }} />
                </Modal>
            )}

            {modal && (
                <Modal title={modal === 'edit' ? 'Edit Blog Post' : 'New Blog Post'} onClose={() => setModal(null)} footer={
                    <><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>
                }>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                        <div className="form-group"><label className="form-label">Slug</label><input className="form-input" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder="my-blog-post" /></div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Content (HTML)</label>
                        <textarea className="form-textarea" style={{ minHeight: 200, fontFamily: 'monospace', fontSize: '0.8rem' }} value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="<p>Write your content here...</p>" />
                    </div>
                    <div className="form-group"><label className="form-label">Summary</label><textarea className="form-textarea" value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} /></div>
                    <div className="form-group">
                        <label className="form-label">Status</label>
                        <select className="form-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                        </select>
                    </div>
                </Modal>
            )}
            {deleteId && <ConfirmDialog message="Delete this blog post?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
        </>
    );
}
