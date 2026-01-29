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
        <div className="flex flex-col h-full w-full max-w-6xl mx-auto p-4 md:p-6 gap-5 overflow-hidden font-sans">
            {/* Professional Header */}
            <header className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                            StoreAI <span className="text-purple-600">Intelligence</span>
                        </h1>
                        <p className="text-xs text-gray-500 font-medium">Enterprise Data Analysis Engine • Gemini 1.5</p>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-green-700 uppercase">Live Pipeline</span>
                </div>
            </header>

            {/* Main Chat Frame */}
            <main className="flex-1 flex flex-col bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden relative">
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 scrollbar-thin">
                    {messages.map((msg) => (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={msg.id}
                            className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 
                                ${msg.sender === 'user' ? 'bg-indigo-600' : 'bg-purple-100'}`}>
                                {msg.sender === 'user' ? <User size={20} className="text-white" /> : <Bot size={20} className="text-purple-600" />}
                            </div>

                            <div className={`max-w-[85%] md:max-w-[80%] space-y-2`}>
                                <div className={`p-4 rounded-2xl text-sm md:text-base leading-relaxed
                                    ${msg.sender === 'user'
                                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-200'
                                        : 'bg-gray-50 text-gray-800 rounded-tl-none border border-gray-100'}`}>
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                </div>

                                {msg.context && (
                                    <div className="mt-3 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                                        <div className="bg-gray-100 px-3 py-1.5 border-b border-gray-200 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500"></div>
                                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Analyst Context</span>
                                        </div>
                                        <div className="p-3 bg-white">
                                            <pre className="text-[11px] font-mono text-gray-600 whitespace-pre-wrap leading-relaxed">{msg.context}</pre>
                                        </div>
                                    </div>
                                )}
                                <span className="text-[10px] text-gray-400 font-semibold px-1 italic">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                    {loading && (
                        <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                                <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                            </div>
                            <div className="bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-none p-4 flex items-center gap-3">
                                <div className="flex gap-1">
                                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" />
                                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                    <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">Analyzing...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <footer className="p-4 md:p-6 bg-gray-50 border-t border-gray-100">
                    <div className="flex items-center gap-3 max-w-4xl mx-auto bg-white rounded-2xl border border-gray-200 p-2 focus-within:ring-2 focus-within:ring-purple-100 focus-within:border-purple-300 transition-all">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Interrogate data engine (e.g., Show me low stock items)..."
                            className="flex-1 bg-transparent text-gray-800 px-4 py-3 outline-none placeholder:text-gray-400 text-sm md:text-base font-normal"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className="shrink-0 p-3 bg-purple-600 rounded-xl text-white hover:bg-purple-700 active:scale-95 disabled:opacity-30 disabled:hover:bg-purple-600 transition-all shadow-md shadow-purple-100"
                        >
                            <Send size={22} />
                        </button>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default Assistant;
