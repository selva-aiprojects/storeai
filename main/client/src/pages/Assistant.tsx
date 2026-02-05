import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Sparkles, Loader2, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { chatWithAI } from '../services/ai';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    context?: string;
    source?: string;
}

const ContextRenderer = ({ data }: { data: string }) => {
    try {
        let parsed = typeof data === 'string' ? JSON.parse(data) : data;

        // Handle double-stringified JSON from some backend responses
        if (typeof parsed === 'string' && (parsed.startsWith('[') || parsed.startsWith('{'))) {
            parsed = JSON.parse(parsed);
        }

        if (Array.isArray(parsed)) {
            if (parsed.length === 0) return <div className="p-3 italic text-gray-400">No data records found for this request.</div>;

            const headers = Object.keys(parsed[0]);
            return (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                {headers.map(h => (
                                    <th key={h} className="px-3 py-2 text-left text-[9px] font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-r-0">
                                        {h.replace(/_/g, ' ')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {parsed.map((row, i) => (
                                <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                                    {headers.map(h => (
                                        <td key={h} className="px-3 py-2 whitespace-nowrap text-[10px] text-gray-600 border-r border-gray-100 last:border-r-0">
                                            {String(row[h])}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            );
        }

        if (typeof parsed === 'object' && parsed !== null) {
            return (
                <div className="p-3 space-y-1">
                    {Object.entries(parsed).map(([k, v]) => (
                        <div key={k} className="flex gap-2 border-b border-gray-50 last:border-0 pb-1">
                            <span className="font-bold text-purple-600 uppercase text-[9px] min-w-[80px]">{k.replace(/_/g, ' ')}:</span>
                            <span className="text-[10px] text-gray-700">{String(v)}</span>
                        </div>
                    ))}
                </div>
            );
        }

        return <div className="p-3 whitespace-pre-wrap">{String(data)}</div>;
    } catch {
        const lines = data.split('\n').filter(l => l.trim());
        if (lines.length > 0 && lines[0].startsWith('- ')) {
            return (
                <ul className="p-3 space-y-1.5">
                    {lines.map((l, i) => <li key={i} className="text-[10px] list-disc list-inside">{l.replace('- ', '')}</li>)}
                </ul>
            );
        }
        return <div className="p-3 whitespace-pre-wrap">{data}</div>;
    }
};

const Assistant = () => {

    /* ---------------- FONT LOADER (LOCAL ONLY) ---------------- */
    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;600;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);

        return () => {
            document.head.removeChild(link);
        };
    }, []);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: "Hello! I am your StoreAI Intelligence Platform Assistant from Cognivectra's product. I have live access to your inventory, sales, and resource records. What aspects of your store shall we analyze together today?",
            sender: 'ai',
            timestamp: new Date()
        }
    ]);

    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            id: Date.now(),
            text: input,
            sender: 'user',
            timestamp: new Date()
        };

        const currentHistory = messages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.text
        }));

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await chatWithAI(userMsg.text, currentHistory);

            const aiMsg: Message = {
                id: Date.now() + 1,
                text: response.response || "I'm checking the data but couldn't find a clear answer. Could you rephrase?",
                sender: 'ai',
                timestamp: new Date(),
                context: response.context,
                source: response.source
            };

            setMessages(prev => [...prev, aiMsg]);

        } catch (error) {
            let errorMessage = (error as any)?.message || 'Unknown error';
            let details = (error as any)?.response?.data?.detail || 'No backend details';

            if ((error as any)?.response?.status === 401) {
                errorMessage = 'AUTHENTICATION EXPIRED';
                details = 'Please re-login to restore secure AI access.';
            } else if (errorMessage === 'Network Error') {
                details = `Connection failed to URL: ${import.meta.env.VITE_AI_API_URL || 'localhost:8000/api'}. Ensure VITE_AI_API_URL is set in Render for site: ${window.location.origin}`;
                console.error("AI Network Failure Context:", {
                    origin: window.location.origin,
                    api: import.meta.env.VITE_AI_API_URL
                });
            }

            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: `CRITICAL: Intelligence Engine Link Failure. [Error: ${errorMessage}] [Details: ${details}]`,
                sender: 'ai',
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    const clearHistory = () => {
        setMessages([{
            id: 1,
            text: "Context cleared. Assistant ready for new analysis. What shall we look into?",
            sender: 'ai',
            timestamp: new Date()
        }]);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div
            className="flex flex-col h-full w-full max-w-6xl mx-auto p-4 md:p-6 gap-5 overflow-hidden"
            style={{ fontFamily: "'Open Sans', sans-serif" }}
        >

            {/* HEADER */}
            <header className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                            StoreAI <span className="text-purple-600">Intelligence Platform</span>
                        </h1>
                        <p className="text-xs text-gray-500 font-medium">
                            Intelligent Store Oversight • Operational Insights
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={clearHistory}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Clear Conversation History"
                    >
                        <RotateCcw size={18} />
                    </button>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-[10px] font-bold text-green-700 uppercase">Live Pipeline</span>
                    </div>
                </div>
            </header>

            {/* CHAT FRAME */}
            <main className="flex-1 flex flex-col bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">

                    {messages.map(msg => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                        >

                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                                ${msg.sender === 'user' ? 'bg-indigo-600' : 'bg-purple-100'}`}>
                                {msg.sender === 'user'
                                    ? <User size={20} className="text-white" />
                                    : <Bot size={20} className="text-purple-600" />}
                            </div>

                            <div className="max-w-[85%] space-y-2">
                                {msg.source && (
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${msg.source === 'SQL'
                                            ? 'bg-blue-100 text-blue-700'
                                            : msg.source === 'CONVERSATION' || msg.source === 'HEURISTIC'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-purple-100 text-purple-700'
                                            }`}>
                                            {msg.source === 'SQL'
                                                ? '✓ Structured Data'
                                                : msg.source === 'CONVERSATION' || msg.source === 'HEURISTIC'
                                                    ? '✓ General Intelligence'
                                                    : '✓ Knowledge Base'}
                                        </span>
                                    </div>
                                )}
                                <div className={`p-4 rounded-2xl text-sm md:text-base leading-relaxed assistant-markdown
                                    ${msg.sender === 'user'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-50 text-gray-800 border'}`}>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {msg.text}
                                    </ReactMarkdown>
                                </div>

                                {/* Hide technical telemetry block as per user request */}
                                {false && msg.context && (
                                    <div className="bg-gray-50 rounded-lg border overflow-hidden mt-3">
                                        <div className="bg-gray-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 border-bottom">
                                            Telemetry Data Signal
                                        </div>
                                        <div className="p-0 text-[11px] text-gray-700">
                                            <ContextRenderer data={msg.context} />
                                        </div>
                                    </div>
                                )}

                                <span className="text-[10px] text-gray-400">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>

                            <style dangerouslySetInnerHTML={{
                                __html: `
                                .assistant-markdown table {
                                    width: 100%;
                                    border-collapse: separate;
                                    border-spacing: 0;
                                    margin: 12px 0;
                                    border: 1px solid #e2e8f0;
                                    border-radius: 8px;
                                    overflow: hidden;
                                }
                                .assistant-markdown th {
                                    background: #f8fafc;
                                    padding: 10px 12px;
                                    text-align: left;
                                    font-size: 0.75rem;
                                    font-weight: 700;
                                    text-transform: uppercase;
                                    letter-spacing: 0.05em;
                                    color: #475569;
                                    border-bottom: 1px solid #e2e8f0;
                                }
                                .assistant-markdown td {
                                    padding: 10px 12px;
                                    font-size: 0.85rem;
                                    color: #1e293b;
                                    border-bottom: 1px solid #f1f5f9;
                                }
                                .assistant-markdown tr:last-child td {
                                    border-bottom: none;
                                }
                                .assistant-markdown p {
                                    margin-bottom: 8px;
                                }
                                .assistant-markdown p:last-child {
                                    margin-bottom: 0;
                                }
                                .assistant-markdown ul, .assistant-markdown ol {
                                    padding-left: 20px;
                                    margin: 8px 0;
                                }
                                .assistant-markdown li {
                                    margin-bottom: 4px;
                                }
                                .assistant-markdown strong {
                                    color: #4338ca;
                                    font-weight: 700;
                                }
                            `}} />
                        </motion.div>
                    ))}

                    {loading && (
                        <div className="flex gap-3">
                            <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                            <span className="text-xs text-gray-400">Analyzing...</span>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* SUGGESTED */}
                <div className="px-6 py-2 flex gap-2 overflow-x-auto no-scrollbar">
                    {['Stock Health', 'Yesterday Sales', 'Resource Allocation', 'Top Customer'].map(label => (
                        <button
                            key={label}
                            onClick={() => setInput(label)}
                            className="whitespace-nowrap px-3 py-1.5 rounded-full border border-purple-200 bg-purple-50 text-purple-700 text-[11px] font-semibold hover:bg-purple-100 transition"
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {/* INPUT */}
                <footer className="p-4 bg-gray-50 border-t">
                    <div className="flex gap-3 bg-white rounded-2xl border p-2">
                        <input
                            type="text"
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Interrogate data engine..."
                            className="flex-1 px-4 py-3 outline-none text-sm"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className="p-3 bg-purple-600 rounded-xl text-white hover:bg-purple-700 transition"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default Assistant;
