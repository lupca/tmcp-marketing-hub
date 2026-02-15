import { useState, useRef } from 'react';
import { generateBrandIdentity } from '../lib/brandIdentityApi';
import Modal from './Modal';
import { Sparkles, Loader, AlertCircle, Bot, CheckCircle2 } from 'lucide-react';

const STATUS_MESSAGES = {
    fetching_worksheet: '📋 Fetching worksheet via MCP...',
    analyzing: '🧠 Analyzing brand essence...',
    thinking: '✨ Generating brand identity...',
};

export default function BrandIdentityAIModal({ worksheets, onClose, onComplete }) {
    const [worksheetId, setWorksheetId] = useState('');
    const [language, setLanguage] = useState('Vietnamese');
    const [streaming, setStreaming] = useState(false);
    const [streamContent, setStreamContent] = useState('');
    const [status, setStatus] = useState(null);
    const [error, setError] = useState(null);
    const [done, setDone] = useState(false);
    const [brandData, setBrandData] = useState(null);
    const abortRef = useRef(null);

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
                (event) => {
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
    const selectedWorksheet = worksheets.find(w => w.id === worksheetId);

    return (
        <Modal
            title="✨ Generate Brand Identity with AI"
            onClose={handleCancel}
            footer={
                <>
                    <button className="btn btn-secondary" onClick={handleCancel}>
                        Cancel
                    </button>
                    {!showResult && (
                        <button
                            className="btn btn-ai"
                            onClick={handleGenerate}
                            disabled={!worksheetId || streaming}
                        >
                            <Sparkles size={16} />
                            Generate
                        </button>
                    )}
                    {done && brandData && (
                        <button className="btn btn-primary" onClick={handleAccept}>
                            Use This Data
                        </button>
                    )}
                </>
            }
        >
            {!showResult ? (
                /* ---- Configuration Form ---- */
                <div className="ai-modal-form">
                    <div className="form-group">
                        <label className="form-label">Worksheet *</label>
                        <select
                            className="form-select"
                            value={worksheetId}
                            onChange={e => setWorksheetId(e.target.value)}
                        >
                            <option value="">Select a worksheet...</option>
                            {worksheets.map(w => (
                                <option key={w.id} value={w.id}>{w.title}</option>
                            ))}
                        </select>
                        {!worksheetId && (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                                Choose a worksheet to use as the foundation for your brand identity.
                            </span>
                        )}
                    </div>
                    <div className="form-group">
                        <label className="form-label">Target Language</label>
                        <select
                            className="form-select"
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
                <div className="ai-modal-result">
                    {/* Status */}
                    {status && (
                        <div className="ai-status">
                            <Loader size={16} className="ai-spin" />
                            <span>
                                <Bot size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                                {STATUS_MESSAGES[status] || 'Processing...'}
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

                    {/* Done + Preview */}
                    {done && brandData && !error && (
                        <div className="ai-done-msg">
                            <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                            <span>Brand identity generated! Click "Use This Data" to auto-fill the form.</span>
                            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {brandData.colorPalette?.map((c, i) => (
                                    <div key={i} style={{
                                        width: 28, height: 28, borderRadius: 8,
                                        background: c, border: '1px solid var(--border)',
                                    }} title={c} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Modal>
    );
}
