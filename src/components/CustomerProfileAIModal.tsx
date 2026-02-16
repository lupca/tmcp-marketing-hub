import { useState, useRef } from 'react';
import Modal from './Modal';
// @ts-ignore
import { generateCustomerProfile } from '../lib/customerProfileApi';
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { BrandIdentity } from '../models/schema';

const STATUS_MESSAGES: Record<string, string> = {
    fetching_brand: '🔍 Fetching brand identity data via MCP...',
    fetching_worksheet: '📋 Fetching linked worksheet via MCP...',
    analyzing: '🧠 Analyzing brand & worksheet — synthesizing persona...',
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
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    {step === 'config' ? (
                        <>
                            <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onClick={handleCancel}>Cancel</button>
                            <button
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md transition-all ${!selectedBrandId ? 'bg-teal-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}
                                onClick={handleGenerate}
                                disabled={!selectedBrandId}
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Brand Identity *</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500" value={selectedBrandId} onChange={e => setSelectedBrandId(e.target.value)}>
                            <option value="">Select a brand identity...</option>
                            {brandIdentities.map(b => (
                                <option key={b.id} value={b.id}>{b.brand_name || b.name || b.id}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-teal-500 focus:border-teal-500" value={language} onChange={e => setLanguage(e.target.value)}>
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
                    <div className="flex items-center gap-2 text-teal-600 font-medium">
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
                        <CheckCircle2 size={16} /> <strong>Profile generated!</strong>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-md p-4 shadow-sm">
                        <h4 className="font-bold text-gray-900 mb-2">{result.personaName}</h4>
                        <p className="text-sm text-gray-600 mb-3">{result.summary}</p>
                        <div className="flex flex-wrap gap-2">
                            {result.demographics && <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-100">Demographics ✓</span>}
                            {result.psychographics && <span className="px-2 py-1 bg-purple-50 text-purple-700 text-xs rounded-md border border-purple-100">Psychographics ✓</span>}
                            {result.goalsAndMotivations && <span className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md border border-green-100">Goals ✓</span>}
                            {result.painPointsAndChallenges && <span className="px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded-md border border-orange-100">Pain Points ✓</span>}
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
