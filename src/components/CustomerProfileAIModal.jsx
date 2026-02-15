import { useState, useRef } from 'react';
import Modal from './Modal';
import { generateCustomerProfile } from '../lib/customerProfileApi';
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const STATUS_MESSAGES = {
    fetching_brand: '🔍 Fetching brand identity data via MCP...',
    fetching_worksheet: '📋 Fetching linked worksheet via MCP...',
    analyzing: '🧠 Analyzing brand & worksheet — synthesizing persona...',
};

export default function CustomerProfileAIModal({ brandIdentities, onComplete, onClose }) {
    const [step, setStep] = useState('config'); // config | streaming | done | error
    const [selectedBrandId, setSelectedBrandId] = useState('');
    const [language, setLanguage] = useState('Vietnamese');
    const [status, setStatus] = useState('');
    const [streamedText, setStreamedText] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const abortRef = useRef(null);

    const handleGenerate = async () => {
        if (!selectedBrandId) return;
        setStep('streaming');
        setStreamedText('');
        setError('');
        setResult(null);

        const controller = new AbortController();
        abortRef.current = controller;

        try {
            await generateCustomerProfile(selectedBrandId, language, (event) => {
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
        } catch (e) {
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
                step === 'config' ? (
                    <>
                        <button className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleGenerate} disabled={!selectedBrandId}>
                            <Sparkles size={14} /> Generate
                        </button>
                    </>
                ) : step === 'done' ? (
                    <>
                        <button className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleUseData}>
                            <CheckCircle2 size={14} /> Use This Data
                        </button>
                    </>
                ) : step === 'error' ? (
                    <button className="btn btn-secondary" onClick={handleCancel}>Close</button>
                ) : (
                    <button className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
                )
            }
        >
            {step === 'config' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div className="form-group">
                        <label className="form-label">Brand Identity *</label>
                        <select className="form-select" value={selectedBrandId} onChange={e => setSelectedBrandId(e.target.value)}>
                            <option value="">Select a brand identity...</option>
                            {brandIdentities.map(b => (
                                <option key={b.id} value={b.id}>{b.brandName || b.id}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Language</label>
                        <select className="form-select" value={language} onChange={e => setLanguage(e.target.value)}>
                            <option value="Vietnamese">Vietnamese</option>
                            <option value="English">English</option>
                            <option value="Japanese">Japanese</option>
                            <option value="Korean">Korean</option>
                        </select>
                    </div>
                </div>
            )}

            {step === 'streaming' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--primary)' }}>
                        <Loader2 size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{status}</span>
                    </div>
                    {streamedText && (
                        <pre style={{
                            background: 'var(--bg-secondary)',
                            borderRadius: 8,
                            padding: 12,
                            fontSize: '0.8rem',
                            maxHeight: 300,
                            overflow: 'auto',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            color: 'var(--text-muted)',
                        }}>
                            {streamedText}
                        </pre>
                    )}
                </div>
            )}

            {step === 'done' && result && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)' }}>
                        <CheckCircle2 size={16} /> <strong>Profile generated!</strong>
                    </div>
                    <div className="card" style={{ padding: 16 }}>
                        <h4 style={{ marginBottom: 8 }}>{result.personaName}</h4>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>{result.summary}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {result.demographics && <span className="badge badge-info">Demographics ✓</span>}
                            {result.psychographics && <span className="badge badge-primary">Psychographics ✓</span>}
                            {result.goalsAndMotivations && <span className="badge badge-success">Goals ✓</span>}
                            {result.painPointsAndChallenges && <span className="badge badge-warning">Pain Points ✓</span>}
                        </div>
                    </div>
                </div>
            )}

            {step === 'error' && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)' }}>
                    <AlertCircle size={16} /> <span>{error}</span>
                </div>
            )}

            <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
        </Modal>
    );
}
