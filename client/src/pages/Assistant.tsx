import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { chatWithAI } from '../services/ai';

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'ai';
    timestamp: Date;
    context?: string;
}

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
            text: "Welcome to StoreAI Intel Engine. I handle multi-modal analysis across inventory, sales, and supply chain telemetry. How can I assist your operations today?",
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

        } catch {
            setMessages(prev => [...prev, {
                id: Date.now() + 1,
                text: "CRITICAL: Intelligence Engine Link Failure. Please verify API configuration.",
                sender: 'ai',
                timestamp: new Date()
            }]);
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
                            StoreAI <span className="text-purple-600">Intelligence</span>
                        </h1>
                        <p className="text-xs text-gray-500 font-medium">
                            Enterprise Data Analysis Engine • Gemini 1.5
                        </p>
                    </div>
                </div>
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-100">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-[10px] font-bold text-green-700 uppercase">Live Pipeline</span>
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
                                <div className={`p-4 rounded-2xl text-sm md:text-base leading-relaxed
                                    ${msg.sender === 'user'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-50 text-gray-800 border'}`}>
                                    {msg.text}
                                </div>

                                {msg.context && (
                                    <div className="bg-gray-50 rounded-lg border">
                                        <div className="bg-gray-100 px-3 py-1 text-[10px] font-bold uppercase">
                                            Analyst Context
                                        </div>
                                        <div className="p-3 text-[11px] text-gray-600 whitespace-pre-wrap">
                                            {msg.context}
                                        </div>
                                    </div>
                                )}

                                <span className="text-[10px] text-gray-400">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
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
