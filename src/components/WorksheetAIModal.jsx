import { useState, useRef } from 'react';
import { generateWorksheet } from '../lib/worksheetApi';
import Modal from './Modal';
import { Sparkles, Loader, AlertCircle, Bot } from 'lucide-react';

const FIELDS = [
    { key: 'businessDescription', label: 'Business Description', placeholder: 'Describe your business, products/services, and what you do...' },
    { key: 'targetAudience', label: 'Target Audience', placeholder: 'Who are your ideal customers? Demographics, interests, behaviors...' },
    { key: 'painPoints', label: 'Customer Pain Points', placeholder: 'What problems or frustrations do your customers face?' },
    { key: 'uniqueSellingProposition', label: 'Unique Selling Proposition (USP)', placeholder: 'What makes you different from competitors?' },
];

export default function WorksheetAIModal({ onClose, onComplete }) {
    const [form, setForm] = useState({
        businessDescription: '',
        targetAudience: '',
        painPoints: '',
        uniqueSellingProposition: '',
        language: 'Vietnamese',
    });
    const [errors, setErrors] = useState({});
    const [streaming, setStreaming] = useState(false);
    const [streamContent, setStreamContent] = useState('');
    const [status, setStatus] = useState(null);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(false);
    const abortRef = useRef(null);

    const validate = () => {
        const errs = {};
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
            await generateWorksheet(form, (event) => {
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
        } catch (e) {
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
                <>
                    <button className="btn btn-secondary" onClick={handleCancel}>
                        Cancel
                    </button>
                    {!showResult && (
                        <button className="btn btn-ai" onClick={handleGenerate} disabled={streaming}>
                            <Sparkles size={16} />
                            Generate
                        </button>
                    )}
                    {done && streamContent && (
                        <button className="btn btn-primary" onClick={handleAccept}>
                            Use This Content
                        </button>
                    )}
                </>
            }
        >
            {!showResult ? (
                /* ---- Input Form ---- */
                <div className="ai-modal-form">
                    {FIELDS.map(f => (
                        <div key={f.key} className="form-group">
                            <label className="form-label">{f.label} *</label>
                            <textarea
                                className={`form-textarea ${errors[f.key] ? 'form-error' : ''}`}
                                style={{ minHeight: 70 }}
                                value={form[f.key]}
                                onChange={e => {
                                    setForm({ ...form, [f.key]: e.target.value });
                                    if (errors[f.key]) setErrors({ ...errors, [f.key]: null });
                                }}
                                placeholder={f.placeholder}
                            />
                            {errors[f.key] && <span className="ai-field-error">{errors[f.key]}</span>}
                        </div>
                    ))}
                    <div className="form-group">
                        <label className="form-label">Language</label>
                        <select
                            className="form-select"
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
                <div className="ai-modal-result">
                    {/* Status */}
                    {status && (
                        <div className="ai-status">
                            <Loader size={16} className="ai-spin" />
                            <span>
                                <Bot size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                {status === 'thinking' ? 'AI is analyzing your business...' : 'Processing...'}
                            </span>
                        </div>
                    )}

                    {/* Streamed content */}
                    {streamContent && (
                        <div className="ai-stream-content">
                            <pre className="ai-stream-pre">{streamContent}</pre>
                        </div>
                    )}

                    {/* Skeleton while no content yet */}
                    {!streamContent && !error && (
                        <div className="ai-skeleton">
                            <div className="skeleton-line w80" />
                            <div className="skeleton-line w60" />
                            <div className="skeleton-line w90" />
                            <div className="skeleton-line w40" />
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="ai-error">
                            <AlertCircle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Done indicator */}
                    {done && !error && (
                        <div className="ai-done-msg">
                            ✅ Generation complete! Click "Use This Content" to apply.
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}
