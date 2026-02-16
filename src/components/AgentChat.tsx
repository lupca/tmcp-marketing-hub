import React, { useState, useRef, useEffect, useCallback } from 'react';
// @ts-ignore
import { sendMessage, checkHealth } from '../lib/chatApi';
import { MessageSquare, X, Send, Bot, User, ChevronDown, ChevronRight, Wrench, AlertCircle, Loader, Trash2 } from 'lucide-react';

const AGENT_COLORS: Record<string, string> = {
    Supervisor: '#6c5ce7',
    Strategist: '#00cec9',
    Researcher: '#74b9ff',
    CampaignManager: '#fdcb6e',
    ContentCreator: '#e17055',
};

function agentColor(name: string | null) {
    return (name && AGENT_COLORS[name]) || '#a29bfe';
}

interface ToolLog {
    name: string;
    input: any;
    output: any;
    loading: boolean;
}

interface ChatMessage {
    id?: number;
    role: 'user' | 'agent';
    content: string;
    status?: string | null;
    activeAgent?: string | null;
    tools?: ToolLog[];
    error?: string | null;
    done?: boolean;
}

export default function AgentChat() {
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [streaming, setStreaming] = useState(false);
    const [threadId] = useState(() => crypto.randomUUID());
    const [healthy, setHealthy] = useState<boolean | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

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

        const updateAgent = (updater: (m: ChatMessage) => ChatMessage) => {
            setMessages(prev => prev.map(m => m.id === agentMsgId ? updater(m) : m));
        };

        try {
            await sendMessage(text, threadId, (event: any) => {
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
                            tools: [...(m.tools || []), { name: event.tool, input: event.input, output: null, loading: true }],
                        }));
                        break;
                    case 'tool_end':
                        updateAgent(m => ({
                            ...m,
                            tools: (m.tools || []).map((t, i) =>
                                i === (m.tools || []).length - 1 && t.name === event.tool
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
        } catch (e: any) {
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

    const handleKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* FAB */}
            {!open && (
                <button
                    className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 transition-transform z-50 group"
                    onClick={() => setOpen(true)}
                    title="Chat with Agents"
                >
                    <MessageSquare size={24} />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
                </button>
            )}

            {/* Chat Panel */}
            {open && (
                <div className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-200 animate-slide-in-up">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center text-white shrink-0">
                        <div className="flex items-center gap-2">
                            <Bot size={20} />
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm">Marketing Agents</span>
                                <div className="flex items-center gap-1.5">
                                    <span className={`w-2 h-2 rounded-full ${healthy ? 'bg-green-400' : healthy === false ? 'bg-red-400' : 'bg-gray-300'}`} />
                                    <span className="text-[10px] opacity-90">{healthy ? 'System Online' : healthy === false ? 'System Offline' : 'Checking...'}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors" onClick={handleClear} title="Clear History"><Trash2 size={16} /></button>
                            <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors" onClick={() => setOpen(false)} title="Close"><X size={18} /></button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-6 space-y-4 opacity-70">
                                <Bot size={48} className="text-gray-300" />
                                <div>
                                    <h4 className="font-semibold text-gray-700">Hello! 👋</h4>
                                    <p className="text-sm mt-1">I am your AI Marketing Team. Assign tasks or ask questions to get started.</p>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {Object.entries(AGENT_COLORS).map(([name, color]) => (
                                        <span key={name} className="px-2 py-0.5 text-[10px] rounded-full border bg-white" style={{ borderColor: color, color }}>
                                            {name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {messages.map((msg, i) => (
                            msg.role === 'user' ? (
                                <div key={i} className="flex justify-end">
                                    <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] shadow-sm text-sm">
                                        {msg.content}
                                    </div>
                                </div>
                            ) : (
                                <AgentMessage key={msg.id || i} msg={msg} />
                            )
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t border-gray-200 shrink-0">
                        <div className="relative flex items-center bg-gray-100 rounded-full px-4 py-2 hover:ring-1 hover:ring-blue-200 transition-shadow">
                            <textarea
                                ref={inputRef}
                                className="w-full bg-transparent border-0 focus:ring-0 p-0 text-sm resize-none max-h-24 outline-none"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onKeyDown={handleKey}
                                placeholder="Type a message..."
                                rows={1}
                                disabled={streaming}
                            />
                            {streaming ? (
                                <button className="ml-2 p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors" onClick={handleStop} title="Stop">
                                    <Loader size={16} className="animate-spin" />
                                </button>
                            ) : (
                                <button
                                    className={`ml-2 p-1.5 rounded-full transition-all ${input.trim() ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                    onClick={handleSend}
                                    disabled={!input.trim()}
                                    title="Send"
                                >
                                    <Send size={16} />
                                </button>
                            )}
                        </div>
                        <div className="text-[10px] text-center text-gray-400 mt-2">
                            AI can make mistakes. Please verify important information.
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

/* ---- Agent Message Bubble ---- */
function AgentMessage({ msg }: { msg: ChatMessage }) {
    const [toolsExpanded, setToolsExpanded] = useState(false);

    return (
        <div className="flex gap-3 max-w-[90%]">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0 shadow-sm mt-1">
                <Bot size={16} />
            </div>
            <div className="flex flex-col gap-2 min-w-0">
                <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm border border-gray-100 text-sm text-gray-800">
                    {/* Status indicator */}
                    {msg.status && (
                        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 text-xs">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ background: agentColor(msg.activeAgent || '') }} />
                            <span className="font-semibold" style={{ color: agentColor(msg.activeAgent || '') }}>{msg.activeAgent}</span>
                            <span className="text-gray-400">
                                {msg.status === 'thinking' ? 'is thinking...' : 'is working...'}
                            </span>
                        </div>
                    )}

                    {/* Skeleton while waiting for content */}
                    {!msg.content && !msg.error && !msg.done && (
                        <div className="space-y-2 animate-pulse opacity-50">
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    )}

                    {/* Content */}
                    {msg.content && (
                        <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    )}

                    {/* Tool logs */}
                    {msg.tools && msg.tools.length > 0 && (
                        <div className="mt-3 pt-2 border-t border-gray-100">
                            <button
                                className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 transition-colors w-full"
                                onClick={() => setToolsExpanded(!toolsExpanded)}
                            >
                                {toolsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                <Wrench size={12} />
                                <span>{msg.tools.length} tool{msg.tools.length > 1 ? 's' : ''} used</span>
                            </button>
                            {toolsExpanded && (
                                <div className="mt-2 space-y-2 pl-2 border-l-2 border-gray-100">
                                    {msg.tools.map((t, j) => (
                                        <div key={j} className="text-xs">
                                            <div className="flex items-center gap-1.5 font-medium text-gray-700">
                                                {t.loading ? <Loader size={12} className="animate-spin text-blue-500" /> : <div className="text-green-500"><Wrench size={12} /></div>}
                                                <span>{t.name}</span>
                                            </div>
                                            {t.output && (
                                                <div className="mt-1 bg-gray-50 rounded p-2 font-mono text-[10px] text-gray-600 overflow-x-auto border border-gray-200">
                                                    {typeof t.output === 'string' ? t.output.slice(0, 300) : JSON.stringify(t.output, null, 2).slice(0, 300)}
                                                    {((typeof t.output === 'string' ? t.output.length : JSON.stringify(t.output).length) > 300) && '...'}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Error */}
                    {msg.error && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded flex items-start gap-2">
                            <AlertCircle size={14} className="shrink-0 mt-0.5" />
                            <span>{msg.error}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
