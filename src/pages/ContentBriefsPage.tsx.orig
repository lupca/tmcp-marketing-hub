import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import pb from '../lib/pocketbase';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';
import { Plus, Search, Edit2, Trash2, ArrowLeft, Sparkles, FileText, ChevronDown, ChevronRight } from 'lucide-react';
import { ContentBrief, MarketingCampaign } from '../models/schema';
// @ts-ignore
import { generateContentBriefs } from '../lib/contentBriefsApi';

const FUNNEL_STAGES = ['Awareness', 'Consideration', 'Conversion', 'Retention'] as const;
const PSYCHOLOGICAL_ANGLES = ['Fear', 'Emotion', 'Logic', 'Social Proof', 'Urgency', 'Curiosity'] as const;

interface ActivityLogEvent {
    type: string;
    [key: string]: any;
}

export default function ContentBriefsPage() {
    const { campaignId } = useParams<{ campaignId: string }>();
    const { currentWorkspace } = useWorkspace();
    const [items, setItems] = useState<ContentBrief[]>([]);
    const [campaign, setCampaign] = useState<MarketingCampaign | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState<'create' | 'edit' | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [collapsedStages, setCollapsedStages] = useState<Record<string, boolean>>({});

    // Auto-gen state
    const [showAutoGen, setShowAutoGen] = useState(false);
    const [autoGenLanguage, setAutoGenLanguage] = useState('Vietnamese');
    const [autoGenAnglesPerStage, setAutoGenAnglesPerStage] = useState(6);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activityLog, setActivityLog] = useState<ActivityLogEvent[]>([]);

    const emptyForm = {
        angle_name: '',
        funnel_stage: 'Awareness' as string,
        psychological_angle: 'Fear' as string,
        pain_point_focus: '',
        key_message_variation: '',
        call_to_action_direction: '',
        brief: '',
    };
    const [form, setForm] = useState(emptyForm);

    const toast = useToast();

    const load = useCallback(async () => {
        if (!currentWorkspace || !campaignId) return;
        setLoading(true);
        try {
            const [briefs, camp] = await Promise.all([
                pb.collection('content_briefs').getList<ContentBrief>(1, 200, {
                    filter: `campaign_id = "${campaignId}" && workspace_id = "${currentWorkspace.id}"`,
                    sort: 'funnel_stage,angle_name',
                }),
                pb.collection('marketing_campaigns').getOne<MarketingCampaign>(campaignId),
            ]);
            setItems(briefs.items);
            setCampaign(camp);
        } catch (e: any) {
            toast.show(e.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [currentWorkspace, campaignId]);

    useEffect(() => { load(); }, [load]);

    const filtered = items.filter(i =>
        i.angle_name?.toLowerCase().includes(search.toLowerCase()) ||
        i.funnel_stage?.toLowerCase().includes(search.toLowerCase()) ||
        i.psychological_angle?.toLowerCase().includes(search.toLowerCase())
    );

    const groupedByStage = FUNNEL_STAGES.reduce((acc, stage) => {
        acc[stage] = filtered.filter(i => i.funnel_stage === stage);
        return acc;
    }, {} as Record<string, ContentBrief[]>);

    const toggleStage = (stage: string) => {
        setCollapsedStages(prev => ({ ...prev, [stage]: !prev[stage] }));
    };

    const openCreate = () => {
        setForm(emptyForm);
        setEditId(null);
        setModal('create');
    };

    const openEdit = (item: ContentBrief) => {
        setForm({
            angle_name: item.angle_name || '',
            funnel_stage: item.funnel_stage || 'Awareness',
            psychological_angle: item.psychological_angle || 'Fear',
            pain_point_focus: item.pain_point_focus || '',
            key_message_variation: item.key_message_variation || '',
            call_to_action_direction: item.call_to_action_direction || '',
            brief: item.brief || '',
        });
        setEditId(item.id);
        setModal('edit');
    };

    const handleSave = async () => {
        if (!currentWorkspace || !campaignId) return;
        try {
            const body = {
                workspace_id: currentWorkspace.id,
                campaign_id: campaignId,
                angle_name: form.angle_name,
                funnel_stage: form.funnel_stage,
                psychological_angle: form.psychological_angle,
                pain_point_focus: form.pain_point_focus,
                key_message_variation: form.key_message_variation,
                call_to_action_direction: form.call_to_action_direction,
                brief: form.brief,
            };

            if (modal === 'edit' && editId) {
                await pb.collection('content_briefs').update(editId, body);
                toast.show('Brief updated!', 'success');
            } else {
                await pb.collection('content_briefs').create(body);
                toast.show('Brief created!', 'success');
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
            await pb.collection('content_briefs').delete(deleteId);
            toast.show('Brief deleted', 'success');
            setDeleteId(null);
            load();
        } catch (e: any) {
            toast.show(e.message, 'error');
        }
    };

    // Auto-gen handler
    const handleAutoGen = async () => {
        if (!currentWorkspace || !campaignId) return;
        setIsGenerating(true);
        setActivityLog([]);

        try {
            await generateContentBriefs(
                {
                    campaignId,
                    workspaceId: currentWorkspace.id,
                    language: autoGenLanguage,
                    anglesPerStage: autoGenAnglesPerStage,
                },
                (event: any) => {
                    setActivityLog(prev => [...prev, event]);
                    if (event.type === 'done') {
                        setIsGenerating(false);
                        toast.show(`Generated ${event.totalCreated || 0} content briefs!`, 'success');
                        setShowAutoGen(false);
                        load();
                    } else if (event.type === 'error') {
                        setIsGenerating(false);
                        toast.show(event.error || 'Generation failed', 'error');
                    }
                }
            );
        } catch (e: any) {
            setIsGenerating(false);
            toast.show(e.message, 'error');
        }
    };

    const stageColors: Record<string, string> = {
        'Awareness': 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        'Consideration': 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
        'Conversion': 'bg-green-500/20 text-green-400 border border-green-500/30',
        'Retention': 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
    };

    const angleColors: Record<string, string> = {
        'Fear': 'bg-red-500/20 text-red-400 border border-red-500/30',
        'Emotion': 'bg-pink-500/20 text-pink-400 border border-pink-500/30',
        'Logic': 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
        'Social Proof': 'bg-teal-500/20 text-teal-400 border border-teal-500/30',
        'Urgency': 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
        'Curiosity': 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
    };

    return (
        <>
            {/* Header */}
            <div className="mb-4">
                <Link to="/campaigns" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors">
                    <ArrowLeft size={16} /> Back to Campaigns
                </Link>
            </div>

            <div className="glass-panel rounded-xl">
                <div className="p-6 border-b border-glass-border flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-white text-glow tracking-wide">Content Briefs</h2>
                        {campaign && <p className="text-sm text-gray-400 mt-1">Campaign: <span className="text-gray-200">{campaign.name}</span></p>}
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:flex-initial">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                className="pl-10 pr-4 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64 text-white placeholder-gray-500 backdrop-blur-md transition-all"
                                placeholder="Search briefs..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-green-600/80 text-white rounded-lg hover:bg-green-500 transition-colors shadow-lg" onClick={() => setShowAutoGen(true)}>
                            <Sparkles size={18} /> Auto Gen
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600/80 text-white rounded-lg hover:bg-blue-500 transition-colors shadow-lg" onClick={openCreate}>
                            <Plus size={18} /> <span className="hidden sm:inline">New Brief</span>
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center p-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-16 text-center text-gray-400">
                        <FileText size={48} className="mb-4 text-gray-500" />
                        <h3 className="text-lg font-medium text-gray-200">No content briefs yet</h3>
                        <p className="mt-1 text-gray-400">Use "Auto Gen" to generate briefs or create one manually.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-glass-border/50 pb-2">
                        {FUNNEL_STAGES.map(stage => {
                            const stageBriefs = groupedByStage[stage];
                            if (stageBriefs.length === 0) return null;
                            const isCollapsed = collapsedStages[stage];

                            return (
                                <div key={stage}>
                                    <button
                                        onClick={() => toggleStage(stage)}
                                        className="w-full px-6 py-4 flex items-center justify-between bg-black/20 hover:bg-white/5 transition-colors group"
                                    >
                                        <div className="flex items-center gap-3">
                                            {isCollapsed ? <ChevronRight size={16} className="text-gray-400 group-hover:text-blue-400" /> : <ChevronDown size={16} className="text-gray-400 group-hover:text-blue-400" />}
                                            <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${stageColors[stage] || 'bg-white/10 text-gray-300 border border-white/20'}`}>
                                                {stage}
                                            </span>
                                            <span className="text-sm text-gray-500 group-hover:text-gray-400 transition-colors">{stageBriefs.length} briefs</span>
                                        </div>
                                    </button>

                                    {!isCollapsed && (
                                        <div className="overflow-x-auto bg-black/10">
                                            <table className="w-full">
                                                <thead className="bg-white/5 border-b border-glass-border/50">
                                                    <tr>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Angle</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Psych. Angle</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Pain Point</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Key Message</th>
                                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">CTA</th>
                                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-glass-border/50">
                                                    {stageBriefs.map(item => (
                                                        <tr key={item.id} className="hover:bg-white/5 transition-colors group/row">
                                                            <td className="px-6 py-4 text-sm font-medium text-gray-200 group-hover/row:text-blue-400 transition-colors">{item.angle_name}</td>
                                                            <td className="px-6 py-4">
                                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${angleColors[item.psychological_angle] || 'bg-white/10 text-gray-300 border border-white/20'}`}>
                                                                    {item.psychological_angle}
                                                                </span>
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate" title={item.pain_point_focus || ''}>
                                                                {item.pain_point_focus || '—'}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-400 max-w-xs truncate" title={item.key_message_variation || ''}>
                                                                {item.key_message_variation || '—'}
                                                            </td>
                                                            <td className="px-6 py-4 text-sm text-gray-400 max-w-[150px] truncate" title={item.call_to_action_direction || ''}>
                                                                {item.call_to_action_direction || '—'}
                                                            </td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex justify-end gap-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                                    <button title="Edit" className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-md transition-colors" onClick={() => openEdit(item)}>
                                                                        <Edit2 size={16} />
                                                                    </button>
                                                                    <button title="Delete" className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors" onClick={() => setDeleteId(item.id)}>
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
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {modal && (
                <Modal
                    title={modal === 'edit' ? 'Edit Content Brief' : 'New Content Brief'}
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
                            <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Angle Name *</label>
                            <input className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors" value={form.angle_name} onChange={e => setForm({ ...form, angle_name: e.target.value })} placeholder="e.g., Risk Warning Angle" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Funnel Stage *</label>
                                <select className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white transition-colors [&>option]:bg-gray-800" value={form.funnel_stage} onChange={e => setForm({ ...form, funnel_stage: e.target.value })}>
                                    {FUNNEL_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Psychological Angle *</label>
                                <select className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white transition-colors [&>option]:bg-gray-800" value={form.psychological_angle} onChange={e => setForm({ ...form, psychological_angle: e.target.value })}>
                                    {PSYCHOLOGICAL_ANGLES.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Pain Point Focus</label>
                            <input className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors" value={form.pain_point_focus} onChange={e => setForm({ ...form, pain_point_focus: e.target.value })} placeholder="Describe the exact pain point or desire this brief addresses" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Key Message Variation</label>
                            <textarea className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-16 text-white custom-scrollbar transition-colors placeholder-gray-500" value={form.key_message_variation} onChange={e => setForm({ ...form, key_message_variation: e.target.value })} placeholder="Core message adapted for this angle (1-2 sentences)" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Call to Action Direction</label>
                            <input className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-500 transition-colors" value={form.call_to_action_direction} onChange={e => setForm({ ...form, call_to_action_direction: e.target.value })} placeholder="e.g., Download Ebook, Fill Form, Buy Now" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Brief</label>
                            <textarea className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 h-32 text-white custom-scrollbar transition-colors placeholder-gray-500" value={form.brief} onChange={e => setForm({ ...form, brief: e.target.value })} placeholder="Detailed 3-part outline (Opening - Body - Closing) for the writer" />
                        </div>
                    </div>
                </Modal>
            )}

            {/* Auto-Gen Modal */}
            {showAutoGen && (
                <Modal
                    title="Auto-Generate Content Briefs"
                    onClose={() => !isGenerating && setShowAutoGen(false)}
                    footer={
                        !isGenerating ? (
                            <div className="flex justify-end gap-3 pt-5 border-t border-glass-border">
                                <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors" onClick={() => setShowAutoGen(false)}>Cancel</button>
                                <button className="px-4 py-2 text-sm font-medium text-white bg-green-600/80 rounded-lg hover:bg-green-500 flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(34,197,94,0.3)]" onClick={handleAutoGen}>
                                    <Sparkles size={16} /> Generate {autoGenAnglesPerStage * 4} Briefs
                                </button>
                            </div>
                        ) : undefined
                    }
                >
                    <div className="space-y-5">
                        {!isGenerating ? (
                            <>
                                <p className="text-sm text-gray-300 leading-relaxed font-light">
                                    This will generate content briefs for <strong className="text-white font-medium">4 funnel stages</strong> (Awareness, Consideration, Conversion, Retention),
                                    each with <strong className="text-white font-medium">{autoGenAnglesPerStage} angles</strong> using distinct psychological approaches.
                                </p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Language</label>
                                        <select className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white transition-colors [&>option]:bg-gray-800" value={autoGenLanguage} onChange={e => setAutoGenLanguage(e.target.value)}>
                                            <option value="Vietnamese">Vietnamese</option>
                                            <option value="English">English</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Angles per Stage</label>
                                        <input type="number" min={1} max={10} className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-white transition-colors" value={autoGenAnglesPerStage} onChange={e => setAutoGenAnglesPerStage(Number(e.target.value))} />
                                    </div>
                                </div>

                                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                    <p className="text-xs text-blue-300 tracking-wide">
                                        Total briefs: <strong className="text-blue-200">{autoGenAnglesPerStage * 4}</strong> ({autoGenAnglesPerStage} per stage x 4 stages).
                                        Uses parallel LLM processing for speed.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
                                    <span className="text-sm font-medium text-gray-300 tracking-wide">Generating content briefs...</span>
                                </div>

                                <div className="bg-black/40 border border-glass-border rounded-lg p-4 max-h-64 overflow-y-auto font-mono text-xs custom-scrollbar">
                                    {activityLog.map((event, i) => (
                                        <div key={i} className={`py-0.5 ${event.type === 'error' ? 'text-red-400' :
                                                event.type === 'done' ? 'text-green-400' :
                                                    event.type === 'status' ? 'text-blue-400' :
                                                        event.type === 'tool_start' ? 'text-yellow-400' :
                                                            event.type === 'tool_end' ? 'text-yellow-300' :
                                                                'text-gray-400'
                                            }`}>
                                            {event.type === 'status' && `[${event.agent || 'Agent'}] ${event.step || event.status}`}
                                            {event.type === 'tool_start' && `[Tool] Calling ${event.tool}...`}
                                            {event.type === 'tool_end' && `[Tool] ${event.tool} completed`}
                                            {event.type === 'done' && `[Done] Generated ${event.totalCreated || 0} briefs successfully`}
                                            {event.type === 'error' && `[Error] ${event.error}`}
                                            {event.type === 'chunk' && event.content}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </Modal>
            )}

            {deleteId && <ConfirmDialog message="Delete this content brief?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />}
        </>
    );
}
