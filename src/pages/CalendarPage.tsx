import { useEffect, useState } from 'react';
import pb from '../lib/pocketbase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, ChevronLeft, ChevronRight, CalendarDays, Edit2, Trash2 } from 'lucide-react';
import { InspirationEvent } from '../models/schema';

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
    const { currentWorkspace } = useWorkspace();
    const [events, setEvents] = useState<InspirationEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [modal, setModal] = useState<'create' | 'edit' | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState({
        title: '',
        event_date: '',
        description: '',
        source_url: ''
    });

    const [editId, setEditId] = useState<string | null>(null);
    const toast = useToast();

    const load = async () => {
        if (!currentWorkspace) return;
        setLoading(true);
        try {
            const filter = `workspace_id = "${currentWorkspace.id}"`;
            const res = await pb.collection('inspiration_events').getList<InspirationEvent>(1, 500, {
                filter,
                sort: 'event_date'
            });
            setEvents(res.items);
        } catch (e: any) {
            toast.show(e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [currentWorkspace?.id]);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const cells: { day: number; other: boolean; date: string | null; isToday?: boolean }[] = [];

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

    const getEventsForDate = (dateStr: string) => events.filter(e => e.event_date?.startsWith(dateStr));

    const prevMonth = () => setCurrentMonth(new Date(year, month - 1));
    const nextMonth = () => setCurrentMonth(new Date(year, month + 1));
    const goToday = () => setCurrentMonth(new Date());

    const openCreate = (date = '') => {
        setForm({ title: '', event_date: date, description: '', source_url: '' });
        setEditId(null);
        setModal('create');
    };

    const openEdit = (item: InspirationEvent) => {
        setForm({
            title: item.title || '',
            event_date: item.event_date?.split(' ')[0] || '', // Handle potential timestamp format
            description: item.description || '',
            source_url: item.source_url || ''
        });
        setEditId(item.id);
        setModal('edit');
    };

    const handleSave = async () => {
        if (!currentWorkspace) return;
        try {
            const body = {
                workspace_id: currentWorkspace.id,
                title: form.title,
                event_date: form.event_date,
                description: form.description,
                source_url: form.source_url
            };

            if (modal === 'edit' && editId) {
                await pb.collection('inspiration_events').update(editId, body);
                toast.show('Event updated!', 'success');
            } else {
                await pb.collection('inspiration_events').create(body);
                toast.show('Event created!', 'success');
            }
            setModal(null);
            load();
        } catch (e: any) {
            toast.show(e.message, 'error');
        }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await pb.collection('inspiration_events').delete(deleteId);
            toast.show('Event deleted', 'success');
            setDeleteId(null);
            load();
        } catch (e: any) {
            toast.show(e.message, 'error');
        }
    };

    const monthStr = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    return (
        <>
            <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3 glass-panel p-2 rounded-xl border border-glass-border">
                    <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" onClick={prevMonth}><ChevronLeft size={20} className="text-gray-400 hover:text-white transition-colors" /></button>
                    <h2 className="text-lg font-bold min-w-[160px] text-center text-white text-glow tracking-wide">{monthStr}</h2>
                    <button className="p-1.5 hover:bg-white/10 rounded-lg transition-colors" onClick={nextMonth}><ChevronRight size={20} className="text-gray-400 hover:text-white transition-colors" /></button>
                    <button className="ml-2 px-3 py-1.5 text-sm bg-black/20 hover:bg-white/10 text-gray-300 rounded-lg transition-colors border border-glass-border font-medium" onClick={goToday}>Today</button>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 text-white rounded-lg hover:bg-blue-500 shadow-lg transition-colors" onClick={() => openCreate()}>
                    <Plus size={18} /> <span className="font-medium">Add Event</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center p-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-7 gap-px bg-glass-border border border-glass-border rounded-xl overflow-hidden shadow-lg glass-panel">
                        {dayNames.map(d => (
                            <div key={d} className="bg-black/40 p-3 text-center text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                {d}
                            </div>
                        ))}
                        {cells.map((cell, i) => (
                            <div
                                key={i}
                                className={`min-h-[120px] p-2 transition-colors ${cell.other ? 'bg-black/20 text-gray-500' : 'bg-black/40 hover:bg-white/5 cursor-pointer text-gray-300'
                                    } ${cell.isToday ? 'ring-1 ring-inset ring-blue-500/50 bg-blue-500/5' : ''}`}
                                onClick={() => cell.date && !cell.other && openCreate(cell.date)}
                            >
                                <div className={`text-sm font-bold mb-2 ${cell.isToday ? 'text-blue-400' : ''}`}>
                                    {cell.day}
                                </div>
                                <div className="space-y-1.5 flex flex-col items-start w-full">
                                    {cell.date && getEventsForDate(cell.date).map(ev => (
                                        <div
                                            key={ev.id}
                                            className="px-2 py-1 text-xs bg-purple-500/20 text-purple-300 rounded-md border border-purple-500/30 truncate cursor-pointer hover:bg-purple-500/30 shadow-sm transition-all w-full text-left"
                                            onClick={e => { e.stopPropagation(); openEdit(ev); }}
                                            title={ev.title}
                                        >
                                            {ev.title}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Events List */}
                    <div className="mt-8 glass-panel rounded-xl overflow-hidden glass-card shadow-lg">
                        <div className="p-5 border-b border-glass-border bg-black/20 flex items-center gap-3">
                            <CalendarDays size={20} className="text-blue-400" />
                            <h3 className="font-bold text-white tracking-wide">Upcoming Events</h3>
                        </div>

                        {events.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400">
                                <p>No events found. Click on a date to add one.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-white/5 border-b border-glass-border/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase tracking-wider text-[11px]">Event</th>
                                            <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase tracking-wider text-[11px]">Date</th>
                                            <th className="px-6 py-4 text-left font-bold text-gray-400 uppercase tracking-wider text-[11px]">Description</th>
                                            <th className="px-6 py-4 text-right font-bold text-gray-400 uppercase tracking-wider text-[11px]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-glass-border/50">
                                        {events.map(item => (
                                            <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-4 font-medium text-gray-200 group-hover:text-blue-400 transition-colors">{item.title}</td>
                                                <td className="px-6 py-4 text-gray-400">
                                                    {item.event_date ? new Date(item.event_date).toLocaleDateString() : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-400 max-w-xs truncate" title={item.description}>
                                                    {item.description || '—'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors" onClick={() => openEdit(item)}>
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors" onClick={() => setDeleteId(item.id)}>
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {modal && (
                <Modal
                    title={modal === 'edit' ? 'Edit Event' : 'New Calendar Event'}
                    onClose={() => setModal(null)}
                    footer={
                        <div className="flex justify-end gap-3 pt-5 border-t border-glass-border">
                            <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors" onClick={() => setModal(null)}>Cancel</button>
                            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600/80 rounded-lg hover:bg-blue-500 transition-colors shadow-lg" onClick={handleSave}>Save</button>
                        </div>
                    }
                >
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Event Title *</label>
                            <input className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Date</label>
                            <input type="date" className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors [color-scheme:dark]" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Description / Notes</label>
                            <textarea className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-24 text-white custom-scrollbar transition-colors placeholder-gray-500" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Add details or AI content suggestions..." />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Source URL (optional)</label>
                            <input className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors" value={form.source_url} onChange={e => setForm({ ...form, source_url: e.target.value })} placeholder="https://..." />
                        </div>
                    </div>
                </Modal>
            )}

            {deleteId && <ConfirmDialog message="Delete this event?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
        </>
    );
}
