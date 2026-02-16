import { useState, useRef } from 'react';
// @ts-ignore
import { generateBrandIdentity } from '../lib/brandIdentityApi';
import Modal from './Modal';
import { Sparkles, Loader, AlertCircle, Bot, CheckCircle2 } from 'lucide-react';
import { Worksheet } from '../models/schema';

const STATUS_MESSAGES: Record<string, string> = {
    fetching_worksheet: '📋 Fetching worksheet via MCP...',
    analyzing: '🧠 Analyzing brand essence...',
    thinking: '✨ Generating brand identity...',
};

interface BrandIdentityAIModalProps {
    worksheets: Worksheet[];
    onClose: () => void;
    onComplete: (data: any) => void;
}

export default function BrandIdentityAIModal({ worksheets, onClose, onComplete }: BrandIdentityAIModalProps) {
    const [worksheetId, setWorksheetId] = useState('');
    const [language, setLanguage] = useState('Vietnamese');
    const [streaming, setStreaming] = useState(false);
    const [streamContent, setStreamContent] = useState('');
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [brandData, setBrandData] = useState<any>(null);
    const abortRef = useRef<AbortController | null>(null);

    const handleGenerate = async () => {
        if (!worksheetId) return;

        setStreaming(true);
        setStreamContent('');
        setStatus('fetching_worksheet');
        setError(null);
        setDone(false);
        setBrandData(null);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            await generateBrandIdentity(
                { worksheetId, language },
                (event: any) => {
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
                            if (event.brandIdentity) {
                                setBrandData(event.brandIdentity);
                            }
                            break;
                        case 'error':
                            setError(event.error);
                            setStatus(null);
                            break;
                    }
                },
                controller.signal,
            );
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
        if (brandData) {
            onComplete(brandData);
        }
        onClose();
    };

    const handleCancel = () => {
        abortRef.current?.abort();
        onClose();
    };

    const showResult = streaming || streamContent;

    return (
        <Modal
            title="✨ Generate Brand Identity with AI"
            onClose={handleCancel}
            footer={
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50" onClick={handleCancel}>
                        Cancel
                    </button>
                    {!showResult && (
                        <button
                            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md transition-all ${!worksheetId || streaming ? 'bg-purple-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
                            onClick={handleGenerate}
                            disabled={!worksheetId || streaming}
                        >
                            <Sparkles size={16} />
                            Generate
                        </button>
                    )}
                    {done && brandData && (
                        <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700" onClick={handleAccept}>
                            Use This Data
                        </button>
                    )}
                </div>
            }
        >
            {!showResult ? (
                /* ---- Configuration Form ---- */
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Worksheet *</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                            value={worksheetId}
                            onChange={e => setWorksheetId(e.target.value)}
                        >
                            <option value="">Select a worksheet...</option>
                            {worksheets.map(w => (
                                <option key={w.id} value={w.id}>{w.title}</option>
                            ))}
                        </select>
                        {!worksheetId && (
                            <span className="text-xs text-gray-500 mt-1 block">
                                Choose a worksheet to use as the foundation for your brand identity.
                            </span>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Target Language</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                            value={language}
                            onChange={e => setLanguage(e.target.value)}
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
                        <div className="flex items-center gap-2 text-purple-600 bg-purple-50 px-3 py-2 rounded-md">
                            <Loader size={16} className="animate-spin" />
                            <span className="text-sm font-medium">
                                <Bot size={14} className="inline mr-1" />
                                {STATUS_MESSAGES[status] || 'Processing...'}
                            </span>
                        </div>
                    )}

                    {/* Streamed content */}
                    {streamContent && (
                        <div className="bg-gray-50 rounded-md p-3 border border-gray-200 max-h-[300px] overflow-y-auto">
                            <pre className="text-xs text-gray-600 whitespace-pre-wrap font-mono">{streamContent}</pre>
                        </div>
                    )}

                    {/* Skeleton while no content yet */}
                    {!streamContent && !error && (
                        <div className="space-y-2 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-md">
                            <AlertCircle size={16} />
                            <span className="text-sm">{error}</span>
                        </div>
                    )}

                    {/* Done + Preview */}
                    {done && brandData && !error && (
                        <div className="bg-green-50 border border-green-200 rounded-md p-4">
                            <div className="flex items-center gap-2 text-green-700 font-medium mb-2">
                                <CheckCircle2 size={16} />
                                <span>Brand identity generated! Click "Use This Data" to auto-fill the form.</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                {brandData.colorPalette?.map((c: string, i: number) => (
                                    <div key={i} className="w-6 h-6 rounded border border-gray-200 shadow-sm" style={{ backgroundColor: c }} title={c} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}
