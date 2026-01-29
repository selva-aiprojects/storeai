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
        { id: 1, text: "Hello! I am your StoreAI Assistant. I can help you analyze inventory, sales, and more. Ask me anything!", sender: 'ai', timestamp: new Date() }
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
                text: response.response || "I couldn't process that.",
                sender: 'ai',
                timestamp: new Date(),
                context: response.context
            };
            setMessages(prev => [...prev, aiMsg]);
        } catch (error) {
            const errorMsg: Message = {
                id: Date.now() + 1,
                text: "Sorry, I encountered an error connecting to the intelligence engine.",
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
        <div className="h-full w-full max-w-7xl mx-auto p-4 flex flex-col gap-4" style={{ height: 'calc(100vh - 120px)' }}>
            {/* Adjusted height to account for header/footer offset in layout */}

            {/* Header */}
            <div className="bg-[#1e1b4b] rounded-2xl p-6 shadow-xl flex items-center gap-4 text-white">
                <div className="p-3 bg-purple-600 rounded-xl shadow-lg shadow-purple-500/30">
                    <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 mb-1">
                        StoreAI Intelligence
                    </h1>
                    <p className="text-gray-300 text-sm">Powered by Gemini 2.5 RAG Engine</p>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 bg-[#0f172a] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative border border-gray-800">
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                    {messages.map((msg) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={msg.id}
                            className={`flex gap-4 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 
                                ${msg.sender === 'user' ? 'bg-blue-600' : 'bg-purple-600'}`}>
                                {msg.sender === 'user' ? <User size={20} className="text-white" /> : <Bot size={20} className="text-white" />}
                            </div>

                            <div className={`max-w-[85%] sm:max-w-[70%] space-y-2`}>
                                {/* Improved responsive max-width */}
                                <div className={`p-4 rounded-2xl shadow-lg text-sm sm:text-base
                                    ${msg.sender === 'user'
                                        ? 'bg-blue-600 text-white rounded-tr-none'
                                        : 'bg-[#1e293b] text-gray-100 rounded-tl-none border border-gray-700'}`}>
                                    <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                                </div>
                                {msg.context && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        className="text-xs font-mono bg-black/50 p-3 rounded-lg border border-gray-700 text-gray-400 overflow-hidden">
                                        <div className="flex items-center gap-2 mb-1 text-purple-400 font-semibold uppercase tracking-wider">
                                            <span>Source Data</span>
                                            <div className="h-px bg-purple-400/30 flex-1"></div>
                                        </div>
                                        <div className="overflow-x-auto pb-1">
                                            <pre className="whitespace-pre-wrap break-words">{msg.context}</pre>
                                            {/* Changed to break-words to avoid horizontal overflow issues on mobile */}
                                        </div>
                                    </motion.div>
                                )}
                                <span className="text-xs text-gray-500 block px-1">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                    {loading && (
                        <div className="flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center shrink-0">
                                <Loader2 className="w-5 h-5 text-white animate-spin" />
                            </div>
                            <div className="bg-[#1e293b] border border-gray-700 rounded-2xl rounded-tl-none p-4 flex items-center gap-2">
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-[#1e293b] border-t border-gray-800">
                    <div className="relative flex items-center gap-2 max-w-4xl mx-auto">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask about inventory..."
                            className="w-full bg-[#0f172a] text-white border border-gray-700 focus:border-purple-500 rounded-xl px-4 py-3 pr-12 outline-none transition-all placeholder:text-gray-500"
                        />
                        <button
                            onClick={handleSend}
                            disabled={!input.trim() || loading}
                            className="absolute right-2 p-2 bg-purple-600 rounded-lg text-white hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Assistant;
