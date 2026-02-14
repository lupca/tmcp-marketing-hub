import { useEffect, useState } from 'react';
import { list, create, update, remove, getUserId } from '../lib/pb';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, ChevronLeft, ChevronRight, CalendarDays, Edit2, Trash2 } from 'lucide-react';

const eventTypes = ['Holiday', 'Trending Topic', 'Cultural Event', 'Brand Milestone'];
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const empty = { title: '', description: '', eventDate: '', eventType: 'Holiday', aiAnalysis: '', contentSuggestion: '', campaignId: '' };

export default function CalendarPage() {
    const [events, setEvents] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [modal, setModal] = useState(null);
    const [deleteId, setDeleteId] = useState(null);
    const [form, setForm] = useState({ ...empty });
    const [editId, setEditId] = useState(null);
    const toast = useToast();

    const load = async () => {
        setLoading(true);
        try {
            const [evRes, cpRes] = await Promise.all([
                list('content_calendar_events', { perPage: 500, sort: 'eventDate' }),
                list('marketing_campaigns', { perPage: 200 }),
            ]);
            setEvents(evRes.items || []);
            setCampaigns(cpRes.items || []);
        } catch (e) { toast(e.message, 'error'); }
        setLoading(false);
    };
    useEffect(() => { load(); }, []);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const cells = [];
    // Prev month days
    for (let i = firstDay - 1; i >= 0; i--) cells.push({ day: daysInPrevMonth - i, other: true, date: null });
    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        cells.push({ day: d, other: false, date: dateStr, isToday: dateStr === todayStr });
    }
    // Next month fill
    const remaining = 42 - cells.length;
    for (let i = 1; i <= remaining; i++) cells.push({ day: i, other: true, date: null });

    const getEventsForDate = (dateStr) => events.filter(e => e.eventDate?.startsWith(dateStr));

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1));
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1));
    const goToday = () => setCurrentMonth(new Date());

    const openCreate = (date = '') => { setForm({ ...empty, eventDate: date }); setEditId(null); setModal('create'); };
    const openEdit = (item) => {
        setForm({ title: item.title || '', description: item.description || '', eventDate: item.eventDate?.split(' ')[0] || '', eventType: item.eventType || 'Holiday', aiAnalysis: item.aiAnalysis || '', contentSuggestion: item.contentSuggestion || '', campaignId: item.campaignId || '' });
        setEditId(item.id); setModal('edit');
    };

    const handleSave = async () => {
        try {
            const body = { ...form, ...(modal === 'create' && { userId: getUserId() }) };
            if (modal === 'edit') { await update('content_calendar_events', editId, body); toast('Event updated!'); }
            else { await create('content_calendar_events', body); toast('Event created!'); }
            setModal(null); load();
        } catch (e) { toast(e.message, 'error'); }
    };

    const handleDelete = async () => {
        try { await remove('content_calendar_events', deleteId); toast('Event deleted'); setDeleteId(null); load(); }
        catch (e) { toast(e.message, 'error'); }
    };

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    const monthStr = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="btn-icon" onClick={prevMonth}><ChevronLeft size={18} /></button>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 700, minWidth: 200, textAlign: 'center' }}>{monthStr}</h2>
                    <button className="btn-icon" onClick={nextMonth}><ChevronRight size={18} /></button>
                    <button className="btn btn-secondary btn-sm" onClick={goToday}>Today</button>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => openCreate()}><Plus size={16} /> Add Event</button>
            </div>

            <div className="calendar-grid">
                {dayNames.map(d => <div key={d} className="calendar-header-cell">{d}</div>)}
                {cells.map((cell, i) => (
                    <div key={i} className={`calendar-cell ${cell.other ? 'other-month' : ''} ${cell.isToday ? 'today' : ''}`} onClick={() => cell.date && openCreate(cell.date)}>
                        <div className="calendar-day">{cell.day}</div>
                        {cell.date && getEventsForDate(cell.date).map(ev => (
                            <div key={ev.id} className={`calendar-event ${ev.eventType?.split(' ')[0] || ''}`} onClick={e => { e.stopPropagation(); openEdit(ev); }}>
                                {ev.title}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* Events list below calendar */}
            <div className="table-container" style={{ marginTop: 24 }}>
                <div className="table-header">
                    <div className="table-title">All Events</div>
                </div>
                {events.length === 0 ? (
                    <div className="empty-state"><CalendarDays /><h3>No events</h3><p>Click on a date to add an event</p></div>
                ) : (
                    <table>
                        <thead><tr><th>Title</th><th>Date</th><th>Type</th><th>Suggestion</th><th style={{ width: 100 }}>Actions</th></tr></thead>
                        <tbody>
                            {events.map(item => (
                                <tr key={item.id}>
                                    <td style={{ fontWeight: 600 }}>{item.title}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{item.eventDate ? new Date(item.eventDate).toLocaleDateString() : '—'}</td>
                                    <td><span className={`badge ${item.eventType === 'Holiday' ? 'badge-danger' : item.eventType === 'Trending Topic' ? 'badge-primary' : item.eventType === 'Cultural Event' ? 'badge-info' : 'badge-warning'}`}>{item.eventType}</span></td>
                                    <td style={{ maxWidth: 200, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.contentSuggestion || '—'}</td>
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
                <Modal title={modal === 'edit' ? 'Edit Event' : 'New Calendar Event'} onClose={() => setModal(null)} footer={
                    <><button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleSave}>Save</button></>
                }>
                    <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
                    <div className="form-row">
                        <div className="form-group"><label className="form-label">Date</label><input className="form-input" type="date" value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })} /></div>
                        <div className="form-group">
                            <label className="form-label">Event Type</label>
                            <select className="form-select" value={form.eventType} onChange={e => setForm({ ...form, eventType: e.target.value })}>
                                {eventTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Campaign</label>
                        <select className="form-select" value={form.campaignId} onChange={e => setForm({ ...form, campaignId: e.target.value })}>
                            <option value="">No campaign</option>
                            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">AI Analysis</label><textarea className="form-textarea" value={form.aiAnalysis} onChange={e => setForm({ ...form, aiAnalysis: e.target.value })} /></div>
                    <div className="form-group"><label className="form-label">Content Suggestion</label><textarea className="form-textarea" value={form.contentSuggestion} onChange={e => setForm({ ...form, contentSuggestion: e.target.value })} /></div>
                </Modal>
            )}
            {deleteId && <ConfirmDialog message="Delete this event?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
        </>
    );
}
