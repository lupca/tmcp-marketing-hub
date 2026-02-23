import { useState, useRef } from 'react';
// @ts-ignore
import { generateWorksheet } from '../lib/worksheetApi';
import Modal from './Modal';
import { Sparkles, Loader, AlertCircle, Bot, AlertTriangle } from 'lucide-react';

interface WorksheetAIModalProps {
    brandRefs: string[];
    customerRefs: string[];
    onClose: () => void;
    onComplete: (data: any) => void;
}

export default function WorksheetAIModal({ brandRefs, customerRefs, onClose, onComplete }: WorksheetAIModalProps) {
    const [form, setForm] = useState<any>({
        language: 'Vietnamese',
    });
    const [streaming, setStreaming] = useState(false);
    const [streamContent, setStreamContent] = useState('');
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const validate = () => {
        if (!brandRefs || brandRefs.length === 0) {
            setError('Please link at least one Brand to generate a strategic worksheet.');
            return false;
        }
        if (!customerRefs || customerRefs.length === 0) {
            setError('Please link at least one Customer Persona to generate a strategic worksheet.');
            return false;
        }
        setError(null);
        return true;
    };

    const handleGenerate = async () => {
        if (!validate()) return;

        setStreaming(true);
        setStreamContent('');
        setStatus('thinking');
        setError(null);
        setDone(false);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            const payload = {
                brandIds: brandRefs,
                customerIds: customerRefs,
                language: form.language
            };
            await generateWorksheet(payload, (event: any) => {
                switch (event.type) {
                    case 'status':
                        setStatus(event.status);
                        break;
                    case 'chunk':
                        setStreamContent(prev => prev + event.content);
                        setStatus(null);
                        break;
                    case 'done':
                        setDone(true);
                        setStatus(null);
                        break;
                    case 'error':
                        setError(event.error);
                        break;
                }
            }, controller.signal);
        } catch (e: any) {
            if (e.name !== 'AbortError') {
                setError(e.message);
            }
        } finally {
            setStreaming(false);
            abortRef.current = null;
        }
    };

    const handleAccept = () => {
        onComplete(streamContent);
        onClose();
    };

    const handleCancel = () => {
        abortRef.current?.abort();
        onClose();
    };

    // When streaming or done, show result view
    const showResult = streaming || streamContent;

    return (
        <Modal
            title="✨ Strategic Laboratory Generation"
            onClose={handleCancel}
            footer={
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onClick={handleCancel}>
                        Cancel
                    </button>
                    {!showResult && (
                        <button
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md transition-all ${streaming ? 'bg-orange-400 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}
                            onClick={handleGenerate}
                            disabled={streaming}
                        >
                            <Sparkles size={16} />
                            Generate
                        </button>
                    )}
                    {done && streamContent && (
                        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700" onClick={handleAccept}>
                            Use This Strategy
                        </button>
                    )}
                </div>
            }
        >
            {!showResult ? (
                /* ---- Input Form ---- */
                <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-md p-4 text-sm text-blue-800">
                        <p className="font-medium mb-1">How it works</p>
                        <p>The AI will act as a Strategic Laboratory, pulling the data from the Brands and Personas you selected and performing a strategic SWOT analysis to cross-reference their fit.</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>Selected Brands: <strong>{brandRefs?.length || 0}</strong></li>
                            <li>Selected Personas: <strong>{customerRefs?.length || 0}</strong></li>
                        </ul>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md text-sm">
                            <AlertTriangle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500"
                            value={form.language}
                            onChange={e => setForm({ ...form, language: e.target.value })}
                        >
                            <option value="Vietnamese">Vietnamese</option>
                            <option value="English">English</option>
                        </select>
                    </div>
                </div>
            ) : (
                /* ---- Streaming Result ---- */
                <div className="space-y-4">
                    {/* Status */}
                    {status && (
                        <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-md">
                            <Loader size={16} className="animate-spin" />
                            <span className="text-sm font-medium">
                                <Bot size={14} className="inline mr-1" />
                                {status.startsWith('fetching') ? 'Fetching related records...' : 'AI is analyzing strategic fit...'}
                            </span>
                        </div>
                    )}

                    {/* Streamed content */}
                    {streamContent && (
                        <div className="bg-gray-50 rounded-md p-3 border border-gray-200 max-h-[400px] overflow-y-auto">
                            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{streamContent}</pre>
                        </div>
                    )}

                    {/* Skeleton while no content yet */}
                    {!streamContent && !error && (
                        <div className="space-y-2 animate-pulse mt-4">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Done indicator */}
                    {done && !error && (
                        <div className="text-green-700 font-medium text-sm">
                            ✅ Generation complete! Click "Use This Strategy" to apply.
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}
