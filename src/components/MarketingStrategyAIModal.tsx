import { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
// @ts-ignore
import { generateMarketingStrategy } from '../lib/marketingStrategyApi';
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Worksheet, BrandIdentity, CustomerPersona } from '../models/schema';

const STATUS_MESSAGES: Record<string, string> = {
    fetching_worksheet: '📋 Fetching Worksheet via MCP...',
    fetching_brand: '🎨 Fetching Brand Identity via MCP...',
    fetching_icp: '👥 Fetching Ideal Customer Profile via MCP...',
    analyzing: '🧠 Synthesizing Strategy (Acquisition, Positioning, Value Prop, Tone)...',
};

interface MarketingStrategyAIModalProps {
    worksheets: Worksheet[];
    brandIdentities: BrandIdentity[];
    customerProfiles: CustomerPersona[];
    onComplete: (data: any) => void;
    onClose: () => void;
}

export default function MarketingStrategyAIModal({ worksheets, brandIdentities, customerProfiles, onComplete, onClose }: MarketingStrategyAIModalProps) {
    const [step, setStep] = useState<'config' | 'streaming' | 'done' | 'error'>('config');

    // Selection State
    const [worksheetId, setWorksheetId] = useState('');
    const [brandId, setBrandId] = useState('');
    const [icpId, setIcpId] = useState('');
    const [goal, setGoal] = useState('');
    const [language, setLanguage] = useState('Vietnamese');

    // Streaming State
    const [status, setStatus] = useState('');
    const [streamedText, setStreamedText] = useState('');
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');

    const abortRef = useRef<AbortController | null>(null);

    // TODO: Verify if the schema relations exist as expected.
    // Assuming brandIdentities and customerProfiles might have a way to link to worksheet, 
    // but the schema says they point to workspace_id directly.
    // If there's no direct link in DB, we rely on user selection.
    // The old code assumed `worksheetId` property on them.
    // Since we are migrating, we might not have that property on `BrandIdentity` anymore if we removed it.
    // For now, I will remove the auto-filtering based on worksheetId to avoid confusion if the relation is gone.
    // Or I will inspect the `brandIdentities` prop at runtime.
    // If I want to keep it simple, I'll just list all brands/ICPs for the workspace.

    // I will simplify the logic to just list all available items passed in props.
    // If we want filtering, we can add it back if we ensure the relation exists.

    // Auto-select first worksheet if none selected
    useEffect(() => {
        if (!worksheetId && worksheets.length > 0) {
            setWorksheetId(worksheets[0].id);
        }
    }, [worksheets, worksheetId]);

    const handleGenerate = async () => {
        if (!worksheetId || !brandId || !icpId) {
            setError('Please select a Worksheet, Brand Identity, and Customer Profile.');
            setStep('error');
            return;
        }

        setStep('streaming');
        setStreamedText('');
        setError('');
        setResult(null);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            await generateMarketingStrategy({
                worksheetId,
                brandIdentityId: brandId,
                customerProfileId: icpId,
                goal,
                language
            }, (event: any) => {
                if (event.type === 'status') {
                    setStatus(STATUS_MESSAGES[event.status] || event.status);
                } else if (event.type === 'chunk') {
                    setStreamedText(prev => prev + (event.content || ''));
                } else if (event.type === 'done') {
                    setResult(event.marketingStrategy);
                    setStep('done');
                } else if (event.type === 'error') {
                    setError(event.error || 'Unknown error');
                    setStep('error');
                }
            }, controller.signal);
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                setError(e.message);
                setStep('error');
            }
        }
    };

    const handleCancel = () => {
        abortRef.current?.abort();
        onClose();
    };

    const handleUseData = () => {
        if (result) {
            // Pass both specific result and the custom goal
            onComplete({ ...result, goal });
            onClose();
        }
    };

    const isFormValid = worksheetId && brandId && icpId;

    return (
        <Modal
            title="Generate Marketing Strategy with AI"
            onClose={handleCancel}
            footer={
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    {step === 'config' ? (
                        <>
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onClick={handleCancel}>Cancel</button>
                            <button
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md transition-all ${!isFormValid ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                onClick={handleGenerate}
                                disabled={!isFormValid}
                            >
                                <Sparkles size={14} /> Generate
                            </button>
                        </>
                    ) : step === 'done' ? (
                        <>
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onClick={handleCancel}>Cancel</button>
                            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700" onClick={handleUseData}>
                                <CheckCircle2 size={14} /> Use This Data
                            </button>
                        </>
                    ) : step === 'error' ? (
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onClick={handleCancel}>Close</button>
                    ) : (
                        <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onClick={handleCancel}>Cancel</button>
                    )}
                </div>
            }
        >
            {step === 'config' && (
                <div className="space-y-4">
                    <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-sm">
                        Select the source documents to inform your strategy.
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Worksheet *</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" value={worksheetId} onChange={e => setWorksheetId(e.target.value)}>
                            <option value="">Select a worksheet...</option>
                            {worksheets.map(w => (
                                <option key={w.id} value={w.id}>{w.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Brand Identity *</label>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" value={brandId} onChange={e => setBrandId(e.target.value)}>
                                <option value="">Select brand...</option>
                                {brandIdentities.map(b => (
                                    <option key={b.id} value={b.id}>{b.brand_name || b.name || b.id}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Profile (ICP) *</label>
                            <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" value={icpId} onChange={e => setIcpId(e.target.value)}>
                                <option value="">Select ICP...</option>
                                {customerProfiles.map(p => (
                                    <option key={p.id} value={p.id}>{p.persona_name || p.name || p.id}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Specific Goal (Optional)</label>
                        <input
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            value={goal}
                            onChange={e => setGoal(e.target.value)}
                            placeholder="e.g., 'Focus on brand awareness', 'Target young professionals'"
                        />
                        <p className="text-xs text-gray-500 mt-1">This will guide the AI and be saved as the Campaign Goal.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500" value={language} onChange={e => setLanguage(e.target.value)}>
                            <option value="Vietnamese">Vietnamese</option>
                            <option value="English">English</option>
                            <option value="Japanese">Japanese</option>
                            <option value="Korean">Korean</option>
                        </select>
                    </div>
                </div>
            )}

            {step === 'streaming' && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-indigo-600 font-medium">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">{status}</span>
                    </div>
                    {streamedText && (
                        <div className="bg-gray-50 rounded-md p-3 border border-gray-200 max-h-[300px] overflow-y-auto">
                            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">{streamedText}</pre>
                        </div>
                    )}
                </div>
            )}

            {step === 'done' && result && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-green-700 font-medium">
                        <CheckCircle2 size={16} /> <strong>Strategy generated!</strong>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
                        <div className="mb-3">
                            <strong>Positioning:</strong>
                            <p className="text-sm text-gray-600 mt-1">{result.positioning}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {result.acquisitionStrategy && <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-100">Acquisition ✓</span>}
                            {result.valueProposition && <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md border border-purple-100">Value Prop ✓</span>}
                            {result.toneOfVoice && <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md border border-green-100">Tone ✓</span>}
                        </div>
                    </div>
                </div>
            )}

            {step === 'error' && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
                    <AlertCircle size={16} /> <span>{error}</span>
                </div>
            )}
        </Modal>
    );
}
