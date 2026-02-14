import { useState, useRef, useEffect, useCallback } from 'react';
import { sendMessage, checkHealth } from '../lib/chatApi';
import { MessageSquare, X, Send, Bot, User, ChevronDown, ChevronRight, Wrench, AlertCircle, Loader, Wifi, WifiOff, Trash2 } from 'lucide-react';

const AGENT_COLORS = {
    Supervisor: '#6c5ce7',
    Strategist: '#00cec9',
    Researcher: '#74b9ff',
    CampaignManager: '#fdcb6e',
    ContentCreator: '#e17055',
};

function agentColor(name) {
    return AGENT_COLORS[name] || '#a29bfe';
}

export default function AgentChat() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [streaming, setStreaming] = useState(false);
    const [threadId] = useState(() => crypto.randomUUID());
    const [healthy, setHealthy] = useState(null);
    const messagesEndRef = useRef(null);
    const abortRef = useRef(null);
    const inputRef = useRef(null);

    // Health check on mount
    useEffect(() => {
        checkHealth().then(setHealthy);
    }, []);

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input when opened
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 200);
    }, [open]);

    const handleSend = useCallback(async () => {
        const text = input.trim();
        if (!text || streaming) return;

        setInput('');
        // Add user message
        setMessages(prev => [...prev, { role: 'user', content: text }]);

        // Prepare agent message slot
        const agentMsgId = Date.now();
        setMessages(prev => [...prev, {
            id: agentMsgId,
            role: 'agent',
            content: '',
            status: null,
            activeAgent: null,
            tools: [],
            error: null,
            done: false,
        }]);

        setStreaming(true);
        const controller = new AbortController();
        abortRef.current = controller;

        const updateAgent = (updater) => {
            setMessages(prev => prev.map(m => m.id === agentMsgId ? updater(m) : m));
        };

        try {
            await sendMessage(text, threadId, (event) => {
                switch (event.type) {
                    case 'status':
                        updateAgent(m => ({ ...m, status: event.status, activeAgent: event.agent }));
                        break;
                    case 'chunk':
                        updateAgent(m => ({ ...m, content: m.content + event.content }));
                        break;
                    case 'tool_start':
                        updateAgent(m => ({
                            ...m,
                            tools: [...m.tools, { name: event.tool, input: event.input, output: null, loading: true }],
                        }));
                        break;
                    case 'tool_end':
                        updateAgent(m => ({
                            ...m,
                            tools: m.tools.map((t, i) =>
                                i === m.tools.length - 1 && t.name === event.tool
                                    ? { ...t, output: event.output, loading: false }
                                    : t
                            ),
                        }));
                        break;
                    case 'error':
                        updateAgent(m => ({ ...m, error: event.error }));
                        break;
                    case 'done':
                        updateAgent(m => ({ ...m, done: true, status: null }));
                        break;
                }
            }, controller.signal);
        } catch (e) {
            if (e.name !== 'AbortError') {
                updateAgent(m => ({ ...m, error: e.message, done: true }));
            }
        } finally {
            setStreaming(false);
            abortRef.current = null;
        }
    }, [input, streaming, threadId]);

    const handleStop = () => {
        abortRef.current?.abort();
    };

    const handleClear = () => {
        setMessages([]);
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* FAB */}
            {!open && (
                <button className="chat-fab" onClick={() => setOpen(true)} title="Chat with Agents">
                    <MessageSquare size={22} />
                    <span className="chat-fab-pulse" />
                </button>
            )}

            {/* Chat Panel */}
            {open && (
                <div className="chat-panel">
                    {/* Header */}
                    <div className="chat-panel-header">
                        <div className="chat-panel-title">
                            <Bot size={18} />
                            <span>Marketing Agents</span>
                            <span className={`chat-health-dot ${healthy === true ? 'online' : healthy === false ? 'offline' : ''}`}
                                title={healthy ? 'API Online' : healthy === false ? 'API Offline' : 'Checking...'} />
                        </div>
                        <div className="chat-panel-actions">
                            <button className="chat-header-btn" onClick={handleClear} title="Xóa lịch sử"><Trash2 size={14} /></button>
                            <button className="chat-header-btn" onClick={() => setOpen(false)} title="Đóng"><X size={16} /></button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="chat-messages">
                        {messages.length === 0 && (
                            <div className="chat-welcome">
                                <Bot size={40} style={{ opacity: 0.3 }} />
                                <h4>Xin chào! 👋</h4>
                                <p>Tôi là đội ngũ Marketing AI. Hãy gửi tin nhắn để bắt đầu.</p>
                                <div className="chat-agent-tags">
                                    {Object.entries(AGENT_COLORS).map(([name, color]) => (
                                        <span key={name} className="chat-agent-tag" style={{ borderColor: color, color }}>
                                            {name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            msg.role === 'user' ? (
                                <div key={i} className="chat-bubble chat-bubble-user">
                                    <div className="chat-bubble-avatar user-avatar"><User size={14} /></div>
                                    <div className="chat-bubble-content">{msg.content}</div>
                                </div>
                            ) : (
                                <AgentMessage key={msg.id || i} msg={msg} />
                            )
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="chat-input-area">
                        <textarea
                            ref={inputRef}
                            className="chat-input"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKey}
                            placeholder="Nhập tin nhắn..."
                            rows={1}
                            disabled={streaming}
                        />
                        {streaming ? (
                            <button className="chat-send-btn stop" onClick={handleStop} title="Dừng">
                                <Loader size={16} className="chat-spin" />
                            </button>
                        ) : (
                            <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim()} title="Gửi">
                                <Send size={16} />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

/* ---- Agent Message Bubble ---- */
function AgentMessage({ msg }) {
    const [toolsExpanded, setToolsExpanded] = useState(false);

    return (
        <div className="chat-bubble chat-bubble-agent">
            <div className="chat-bubble-avatar agent-avatar"><Bot size={14} /></div>
            <div className="chat-bubble-body">
                {/* Status indicator */}
                {msg.status && (
                    <div className="chat-status" style={{ borderLeftColor: agentColor(msg.activeAgent) }}>
                        <span className="chat-status-dot" style={{ background: agentColor(msg.activeAgent) }} />
                        <span className="chat-status-agent" style={{ color: agentColor(msg.activeAgent) }}>{msg.activeAgent}</span>
                        <span className="chat-status-text">
                            {msg.status === 'thinking' ? 'đang suy nghĩ...' : 'đang xử lý...'}
                        </span>
                    </div>
                )}

                {/* Skeleton while waiting for content */}
                {!msg.content && !msg.error && !msg.done && (
                    <div className="chat-skeleton">
                        <div className="skeleton-line w80" />
                        <div className="skeleton-line w60" />
                        <div className="skeleton-line w40" />
                    </div>
                )}

                {/* Content */}
                {msg.content && (
                    <div className="chat-bubble-content">{msg.content}</div>
                )}

                {/* Tool logs */}
                {msg.tools.length > 0 && (
                    <div className="chat-tools-section">
                        <button className="chat-tools-toggle" onClick={() => setToolsExpanded(!toolsExpanded)}>
                            {toolsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <Wrench size={12} />
                            <span>{msg.tools.length} tool{msg.tools.length > 1 ? 's' : ''} used</span>
                        </button>
                        {toolsExpanded && (
                            <div className="chat-tools-list">
                                {msg.tools.map((t, j) => (
                                    <div key={j} className="chat-tool-item">
                                        <div className="chat-tool-name">
                                            {t.loading ? <Loader size={12} className="chat-spin" /> : <Wrench size={12} />}
                                            <span>{t.name}</span>
                                        </div>
                                        {t.output && (
                                            <pre className="chat-tool-output">{typeof t.output === 'string' ? t.output.slice(0, 300) : JSON.stringify(t.output, null, 2).slice(0, 300)}</pre>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Error */}
                {msg.error && (
                    <div className="chat-error">
                        <AlertCircle size={14} />
                        <span>{msg.error}</span>
                    </div>
                )}
            </div>
        </div>
    );
}
