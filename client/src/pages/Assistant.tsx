import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { chatWithAI } from '../services/ai';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    context?: string; // For SQL results or extra data
}

const Assistant = () => {
    const [messages, setMessages] = useState<Message[]>([
        { id: 1, text: "Welcome to StoreAI Intel Engine. I handle multi-modal analysis across inventory, sales, and supply chain telemetry. How can I assist your operations today?", sender: 'ai', timestamp: new Date() }
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

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const response = await chatWithAI(userMsg.text);

            const aiMsg: Message = {
                id: Date.now() + 1,
                text: response.response || "I couldn't process that query at this time.",
                sender: 'ai',
                timestamp: new Date(),
                context: response.context
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg: Message = {
                id: Date.now() + 1,
                text: "CRITICAL: Intelligence Engine Link Failure. Please verify API configuration and service status.",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col h-full w-full max-w-6xl mx-auto p-4 md:p-6 gap-6 overflow-hidden">
            {/* Glassmorphism Header */}
            <header className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-purple-900 to-indigo-950 rounded-3xl p-6 shadow-2xl border border-white/10">
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-3xl -mr-32 -mt-32"></div>
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="absolute inset-0 bg-purple-500 blur-lg opacity-40 animate-pulse"></div>
                            <div className="relative p-4 bg-purple-600 rounded-2xl shadow-xl">
                                <Sparkles className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-2">
                                StoreAI <span className="text-purple-400">Intelligence</span>
                            </h1>
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-purple-300/60 mt-1">
                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                                RAG Pipeline Active
                            </div>
                        </div>
                    </div>
                    <div className="hidden md:block text-right">
                        <p className="text-sm font-medium text-white/40">Model Instance</p>
                        <p className="text-lg font-bold text-white px-3 py-1 bg-white/5 rounded-lg border border-white/10">Gemini 1.5 Ultra</p>
                    </div>
                </div>
            </header>

            {/* Chat Container */}
            <main className="flex-1 flex flex-col bg-[#0b0e14]/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/5 relative">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scroll-smooth scrollbar-thin scrollbar-thumb-purple-500/20">
                    {messages.map((msg) => (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            key={msg.id}
                            className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-lg 
                                ${msg.sender === 'user' ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-purple-600 to-fuchsia-700'}`}>
                                {msg.sender === 'user' ? <User size={24} className="text-white" /> : <Bot size={24} className="text-white" />}
                            </div>

                            <div className={`max-w-[85%] md:max-w-[75%] space-y-3`}>
                                <div className={`relative p-5 rounded-3xl shadow-xl text-sm md:text-base border transition-all
                                    ${msg.sender === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none border-blue-500/50'
                                        : 'bg-[#1a1f2e] text-gray-100 rounded-tl-none border-white/5'}`}>
                                    <p className="whitespace-pre-wrap leading-relaxed font-medium">{msg.text}</p>
                                </div>

                                {msg.context && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
                                        <div className="px-4 py-2 border-b border-white/5 bg-white/5 flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Deep Metadata Context</span>
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-red-500/50"></div>
                                                <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50"></div>
                                                <div className="w-1.5 h-1.5 rounded-full bg-green-500/50"></div>
                                            </div>
                                        </div>
                                        <div className="p-4 overflow-x-auto">
                                            <pre className="text-xs font-mono text-gray-400 whitespace-pre-wrap">{msg.context}</pre>
                                        </div>
                                    </motion.div>
                                )}
                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tighter px-2">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                    {loading && (
                        <div className="flex gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-purple-600/50 flex items-center justify-center shrink-0">
                                <Loader2 className="w-6 h-6 text-white animate-spin" />
                            </div>
                            <div className="bg-[#1a1f2e] border border-white/5 rounded-3xl rounded-tl-none p-5 flex items-center gap-3">
                                <div className="flex gap-1.5">
                                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                                <span className="text-xs font-bold text-purple-400/80 uppercase tracking-widest">Synthesizing...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Glass Input Area */}
                <footer className="p-6 md:p-8 bg-gradient-to-t from-[#1a1f2e] to-transparent">
                    <div className="relative flex items-center gap-4 max-w-4xl mx-auto bg-[#0b0e14] rounded-3xl border border-white/10 p-2 shadow-2xl focus-within:border-purple-500/50 transition-all group">
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-3xl opacity-0 group-focus-within:opacity-20 blur transition-all duration-500"></div>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Interrogate the store data engine..."
                            className="flex-1 bg-transparent text-white px-6 py-4 outline-none placeholder:text-gray-600 text-sm md:text-base font-medium"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className="shrink-0 p-4 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl text-white hover:shadow-[0_0_20px_rgba(126,34,206,0.4)] active:scale-95 disabled:opacity-20 disabled:scale-100 transition-all flex items-center justify-center"
                        >
                            <Send size={24} />
                        </button>
                    </div>
                    <p className="text-center mt-4 text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">Secure Zero-Knowledge Analysis Engine</p>
                </footer>
            </main>
        </div>
    );
};

export default Assistant;
