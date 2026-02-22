import { useState, useRef } from 'react';
import Modal from './Modal';
// @ts-ignore
import { generateCustomerProfile } from '../lib/customerProfileApi';
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { BrandIdentity } from '../models/schema';

const STATUS_MESSAGES: Record<string, string> = {
    fetching_brand: '🔍 Fetching brand identity data via MCP...',
    analyzing: '🧠 Analyzing brand — synthesizing persona...',
};

interface CustomerProfileAIModalProps {
    brandIdentities: BrandIdentity[]; // Note: schema says BrandIdentity, but old code used 'brandIdentities' prop name.
    onComplete: (data: any) => void;
    onClose: () => void;
}

export default function CustomerProfileAIModal({ brandIdentities, onComplete, onClose }: CustomerProfileAIModalProps) {
    const [step, setStep] = useState<'config' | 'streaming' | 'done' | 'error'>('config');
    const [selectedBrandId, setSelectedBrandId] = useState('');
    const [language, setLanguage] = useState('Vietnamese');
    const [status, setStatus] = useState('');
    const [streamedText, setStreamedText] = useState('');
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState('');
    const abortRef = useRef<AbortController | null>(null);

    const handleGenerate = async () => {
        if (!selectedBrandId) return;
        setStep('streaming');
        setStreamedText('');
        setError('');
        setResult(null);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            await generateCustomerProfile(selectedBrandId, language, (event: any) => {
                if (event.type === 'status') {
                    setStatus(STATUS_MESSAGES[event.status] || event.status);
                } else if (event.type === 'chunk') {
                    setStreamedText(prev => prev + (event.content || ''));
                } else if (event.type === 'done') {
                    setResult(event.customerProfile);
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
            onComplete(result);
            onClose();
        }
    };

    return (
        <Modal
            title="Generate Customer Profile with AI"
            onClose={handleCancel}
            footer={
                <div className="flex justify-end gap-3 pt-4 border-t border-glass-border">
                    {step === 'config' ? (
                        <>
                            <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors" onClick={handleCancel}>Cancel</button>
                            <button
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-lg ${!selectedBrandId ? 'bg-teal-500/50 cursor-not-allowed text-teal-200' : 'bg-teal-600/80 hover:bg-teal-500'}`}
                                onClick={handleGenerate}
                                disabled={!selectedBrandId}
                            >
                                <Sparkles size={14} /> Generate
                            </button>
                        </>
                    ) : step === 'done' ? (
                        <>
                            <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors" onClick={handleCancel}>Cancel</button>
                            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600/80 rounded-lg hover:bg-blue-500 transition-colors shadow-lg" onClick={handleUseData}>
                                <CheckCircle2 size={14} /> Use This Data
                            </button>
                        </>
                    ) : step === 'error' ? (
                        <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors" onClick={handleCancel}>Close</button>
                    ) : (
                        <button className="px-4 py-2 text-sm font-medium text-gray-300 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors" onClick={handleCancel}>Cancel</button>
                    )}
                </div>
            }
        >
            {step === 'config' && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Brand Identity *</label>
                        <select className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-white transition-colors" value={selectedBrandId} onChange={e => setSelectedBrandId(e.target.value)}>
                            <option value="" className="bg-gray-900">Select a brand identity...</option>
                            {brandIdentities.map(b => (
                                <option key={b.id} value={b.id} className="bg-gray-900">{b.brand_name || b.id}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1 tracking-wide">Language</label>
                        <select className="w-full px-3 py-2 border border-glass-border rounded-lg bg-black/20 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 text-white transition-colors" value={language} onChange={e => setLanguage(e.target.value)}>
                            <option value="Vietnamese" className="bg-gray-900">Vietnamese</option>
                            <option value="English" className="bg-gray-900">English</option>
                            <option value="Japanese" className="bg-gray-900">Japanese</option>
                            <option value="Korean" className="bg-gray-900">Korean</option>
                        </select>
                    </div>
                </div>
            )}

            {step === 'streaming' && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-teal-400 font-medium">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-sm">{status}</span>
                    </div>
                    {streamedText && (
                        <div className="bg-black/40 rounded-lg p-3 border border-glass-border max-h-[300px] overflow-y-auto custom-scrollbar">
                            <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">{streamedText}</pre>
                        </div>
                    )}
                </div>
            )}

            {step === 'done' && result && (
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-400 font-medium tracking-wide">
                        <CheckCircle2 size={16} /> <strong>Profile generated!</strong>
                    </div>
                    <div className="bg-black/20 border border-glass-border rounded-xl p-5 shadow-inner backdrop-blur-sm">
                        <h4 className="font-bold text-white mb-2 text-lg tracking-wide">{result.personaName}</h4>
                        <p className="text-sm text-gray-400 mb-4 leading-relaxed">{result.summary}</p>
                        <div className="flex flex-wrap gap-2">
                            {result.demographics && <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-lg border border-blue-500/30 font-medium tracking-wide">Demographics ✓</span>}
                            {result.psychographics && <span className="px-2.5 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-lg border border-purple-500/30 font-medium tracking-wide">Psychographics ✓</span>}
                            {result.goalsAndMotivations && <span className="px-2.5 py-1 bg-green-500/20 text-green-300 text-xs rounded-lg border border-green-500/30 font-medium tracking-wide">Goals ✓</span>}
                            {result.painPointsAndChallenges && <span className="px-2.5 py-1 bg-red-500/20 text-red-300 text-xs rounded-lg border border-red-500/30 font-medium tracking-wide">Pain Points ✓</span>}
                        </div>
                    </div>
                </div>
            )}

            {step === 'error' && (
                <div className="flex items-start gap-3 text-red-400 bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                    <AlertCircle size={18} className="mt-0.5 shrink-0" /> <span className="text-sm leading-relaxed">{error}</span>
                </div>
            )}
        </Modal>
    );
}
