import { useState, useRef, useEffect } from 'react';
import Modal from './Modal';
import { generateMarketingStrategy } from '../lib/marketingStrategyApi';
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const STATUS_MESSAGES = {
    fetching_worksheet: '📋 Fetching Worksheet via MCP...',
    fetching_brand: '🎨 Fetching Brand Identity via MCP...',
    fetching_icp: '👥 Fetching Ideal Customer Profile via MCP...',
    analyzing: '🧠 Synthesizing Strategy (Acquisition, Positioning, Value Prop, Tone)...',
};

export default function MarketingStrategyAIModal({ worksheets, brandIdentities, customerProfiles, onComplete, onClose }) {
    const [step, setStep] = useState('config'); // config | streaming | done | error

    // Selection State
    const [worksheetId, setWorksheetId] = useState('');
    const [brandId, setBrandId] = useState('');
    const [icpId, setIcpId] = useState('');
    const [goal, setGoal] = useState('');
    const [language, setLanguage] = useState('Vietnamese');

    // Streaming State
    const [status, setStatus] = useState('');
    const [streamedText, setStreamedText] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const abortRef = useRef(null);

    // Auto-select related Brand/ICP when Worksheet changes?
    // Or filter options based on Worksheet.
    // Assuming brandIdentities and customerProfiles have worksheetId property.
    const filteredBrands = worksheetId
        ? brandIdentities.filter(b => b.worksheetId === worksheetId || b.expand?.worksheetId?.id === worksheetId)
        : brandIdentities;

    const filteredICPs = worksheetId
        ? customerProfiles.filter(p => p.worksheetId === worksheetId || p.expand?.worksheetId?.id === worksheetId)
        : customerProfiles;

    // Auto-select first option if only one exists after filtering
    useEffect(() => {
        if (filteredBrands.length === 1 && !brandId) {
            setBrandId(filteredBrands[0].id);
        }
        // If current selection is invalid for new worksheet, clear it
        if (brandId && !filteredBrands.find(b => b.id === brandId)) {
            setBrandId('');
        }
    }, [worksheetId, filteredBrands, brandId]);

    useEffect(() => {
        if (filteredICPs.length === 1 && !icpId) {
            setIcpId(filteredICPs[0].id);
        }
        if (icpId && !filteredICPs.find(p => p.id === icpId)) {
            setIcpId('');
        }
    }, [worksheetId, filteredICPs, icpId]);

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
        if (!worksheetId || !brandId || !icpId) return;

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
            }, (event) => {
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
                step === 'config' ? (
                    <>
                        <button className="btn btn-secondary" onClick={handleCancel}>Cancel</button>
                        <button className="btn btn-primary" onClick={handleGenerate} disabled={!isFormValid}>
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
                    <div className="alert alert-info" style={{ fontSize: '0.85rem' }}>
                        Select the source documents to inform your strategy.
                    </div>

                    <div className="form-group">
                        <label className="form-label">Worksheet *</label>
                        <select className="form-select" value={worksheetId} onChange={e => setWorksheetId(e.target.value)}>
                            <option value="">Select a worksheet...</option>
                            {worksheets.map(w => (
                                <option key={w.id} value={w.id}>{w.title}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div className="form-group">
                            <label className="form-label">Brand Identity *</label>
                            <select className="form-select" value={brandId} onChange={e => setBrandId(e.target.value)} disabled={!worksheetId}>
                                <option value="">Select brand...</option>
                                {filteredBrands.map(b => (
                                    <option key={b.id} value={b.id}>{b.brandName}</option>
                                ))}
                            </select>
                            {worksheetId && filteredBrands.length === 0 && <small className="text-muted">No brands found for this worksheet.</small>}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Customer Profile (ICP) *</label>
                            <select className="form-select" value={icpId} onChange={e => setIcpId(e.target.value)} disabled={!worksheetId}>
                                <option value="">Select ICP...</option>
                                {filteredICPs.map(p => (
                                    <option key={p.id} value={p.id}>{p.personaName}</option>
                                ))}
                            </select>
                            {worksheetId && filteredICPs.length === 0 && <small className="text-muted">No profiles found for this worksheet.</small>}
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Specific Goal (Optional)</label>
                        <input
                            className="form-input"
                            value={goal}
                            onChange={e => setGoal(e.target.value)}
                            placeholder="e.g., 'Focus on brand awareness', 'Target young professionals'"
                        />
                        <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>This will guide the AI and be saved as the Campaign Goal.</small>
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
                        <CheckCircle2 size={16} /> <strong>Strategy generated!</strong>
                    </div>
                    <div className="card" style={{ padding: 16 }}>
                        <div style={{ marginBottom: 12 }}>
                            <strong>Positioning:</strong>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 4 }}>{result.positioning}</p>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {result.acquisitionStrategy && <span className="badge badge-info">Acquisition ✓</span>}
                            {result.valueProposition && <span className="badge badge-primary">Value Prop ✓</span>}
                            {result.toneOfVoice && <span className="badge badge-success">Tone ✓</span>}
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
