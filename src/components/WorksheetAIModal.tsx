import { useState, useRef } from 'react';
// @ts-ignore
import { generateWorksheet } from '../lib/worksheetApi';
import Modal from './Modal';
import { Sparkles, Loader, AlertCircle, Bot } from 'lucide-react';

const FIELDS = [
    { key: 'businessDescription', label: 'Business Description', placeholder: 'Describe your business, products/services, and what you do...' },
    { key: 'targetAudience', label: 'Target Audience', placeholder: 'Who are your ideal customers? Demographics, interests, behaviors...' },
    { key: 'painPoints', label: 'Customer Pain Points', placeholder: 'What problems or frustrations do your customers face?' },
    { key: 'uniqueSellingProposition', label: 'Unique Selling Proposition (USP)', placeholder: 'What makes you different from competitors?' },
];

interface WorksheetAIModalProps {
    onClose: () => void;
    onComplete: (data: any) => void;
}

export default function WorksheetAIModal({ onClose, onComplete }: WorksheetAIModalProps) {
    const [form, setForm] = useState<any>({
        businessDescription: '',
        targetAudience: '',
        painPoints: '',
        uniqueSellingProposition: '',
        language: 'Vietnamese',
    });
    const [errors, setErrors] = useState<any>({});
    const [streaming, setStreaming] = useState(false);
    const [streamContent, setStreamContent] = useState('');
    const [status, setStatus] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const abortRef = useRef<AbortController | null>(null);

    const validate = () => {
        const errs: any = {};
        FIELDS.forEach(f => {
            if (!form[f.key] || form[f.key].length < 20) {
                errs[f.key] = 'Minimum 20 characters required';
            }
        });
        setErrors(errs);
        return Object.keys(errs).length === 0;
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
            await generateWorksheet(form, (event: any) => {
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
            title="✨ Generate Worksheet with AI"
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
                            Use This Content
                        </button>
                    )}
                </div>
            }
        >
            {!showResult ? (
                /* ---- Input Form ---- */
                <div className="space-y-4">
                    {FIELDS.map(f => (
                        <div key={f.key}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{f.label} *</label>
                            <textarea
                                className={`w-full px-3 py-2 border rounded-md focus:ring-orange-500 focus:border-orange-500 min-h-[70px] ${errors[f.key] ? 'border-red-300' : 'border-gray-300'}`}
                                value={form[f.key]}
                                onChange={e => {
                                    setForm({ ...form, [f.key]: e.target.value });
                                    if (errors[f.key]) setErrors({ ...errors, [f.key]: null });
                                }}
                                placeholder={f.placeholder}
                            />
                            {errors[f.key] && <span className="text-xs text-red-500 mt-1">{errors[f.key]}</span>}
                        </div>
                    ))}
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
                                {status === 'thinking' ? 'AI is analyzing your business...' : 'Processing...'}
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
                            ✅ Generation complete! Click "Use This Content" to apply.
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}
