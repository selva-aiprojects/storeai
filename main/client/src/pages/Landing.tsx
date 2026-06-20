import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart3, Building2, ChevronRight, Zap, TrendingUp, Clock, Star, ArrowRight } from 'lucide-react';

const Landing = () => {
    return (
        <div className="min-h-screen bg-slate-900 text-white font-['Outfit'] overflow-hidden selection:bg-blue-500/30 flex flex-col justify-between">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(0,108,153,0.15)_0%,transparent_50%),radial-gradient(circle_at_100%_100%,rgba(0,64,110,0.2)_0%,transparent_50%)]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] opacity-50"></div>
            </div>

            {/* Navbar */}
            <nav className="relative z-10 container mx-auto px-6 py-4 flex justify-between items-center border-b border-white/5 max-w-7xl">
                <div className="flex items-center gap-2">
                    <img src="/logo-mt.png" alt="StoreAI Logo" className="h-16 md:h-20 w-auto drop-shadow-xl sidebar-logo-contrast" />
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                        Sign In
                    </Link>
                    <Link to="/login" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-900/50 transition-all hover:-translate-y-0.5 active:scale-95">
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="relative z-10 container mx-auto px-6 py-6 max-w-7xl flex-grow">
                {/* Upper Split Screen: Hero & Preview */}
                <div className="grid lg:grid-cols-12 gap-8 items-center mb-8">
                    {/* Left Column: Hero Text & CTAs & Stats */}
                    <div className="lg:col-span-5 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider"
                        >
                            <Zap size={12} className="animate-pulse" />
                            Next-Gen Commerce Engine
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight"
                        >
                            Intelligence for <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Modern Business</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-base text-slate-400 leading-relaxed"
                        >
                            A unified multi-tenant engine delivering predictive inventory optimization and profound financial insights for the data-driven enterprise.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="flex flex-wrap items-center gap-3"
                        >
                            <Link to="/login" className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-base shadow-[0_0_30px_rgba(37,99,235,0.25)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                                Enter Workspace
                                <ChevronRight size={18} />
                            </Link>
                            <Link to="/login" className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold text-base backdrop-blur-sm border border-white/10 transition-all hover:scale-105 active:scale-95">
                                Start Free Trial
                            </Link>
                        </motion.div>

                        {/* Tighter Stats row directly in hero */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="pt-6 border-t border-white/5 grid grid-cols-3 gap-4"
                        >
                            <div>
                                <div className="text-2xl font-bold text-white">99.9%</div>
                                <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Uptime</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-emerald-400">30%</div>
                                <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Cost Cut</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-cyan-400">10k+</div>
                                <div className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Stores</div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: High-Impact Glowing Logo Presentation */}
                    <div className="lg:col-span-7 flex justify-center items-center relative min-h-[350px] w-full">
                        {/* Glow backdrops */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] bg-gradient-to-tr from-blue-500/25 to-cyan-400/25 rounded-full blur-[80px] pointer-events-none animate-pulse"></div>
                        
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative z-10 flex justify-center items-center w-full max-w-sm p-8 rounded-[2.5rem] border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-[0_0_50px_rgba(37,99,235,0.15)] group overflow-hidden"
                            style={{
                                animation: 'float-animation 6s ease-in-out infinite'
                            }}
                        >
                            {/* Embedded CSS animation for floating effect */}
                            <style>{`
                                @keyframes float-animation {
                                    0% { transform: translateY(0px); }
                                    50% { transform: translateY(-12px); }
                                    100% { transform: translateY(0px); }
                                }
                            `}</style>
                            
                            <img 
                                src="/logo-transparent.png" 
                                alt="StoreAI Logo Banner" 
                                className="w-full h-auto object-contain max-h-[220px] drop-shadow-[0_15px_30px_rgba(37,99,235,0.3)] group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                    // Fallback to logo-final.png if logo-transparent.png is not found
                                    e.currentTarget.src = "/logo-final.png";
                                }}
                            />
                        </motion.div>
                    </div>
                </div>

                {/* Lower Grid: Compact 3-Column Features & Insights Dashboard */}
                <div className="grid lg:grid-cols-12 gap-6 mt-8">
                    {/* Left 4 Cols: Engineered Features */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="lg:col-span-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all space-y-4"
                    >
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Building2 size={18} className="text-blue-400" />
                            Engineered for Scale
                        </h3>
                        <div className="space-y-3 text-sm">
                            {[
                                { title: "Multi-Tenant Architecture", desc: "Isolate data securely across organization units." },
                                { title: "Inventory Optimization", desc: "Real-time global tracking & predictive purchasing." },
                                { title: "Financial Intelligence", desc: "Automated ledgers, profit & loss, & taxation." },
                                { title: "Enterprise Governance", desc: "Granular RBAC controls & full compliance audit logs." }
                            ].map((f, idx) => (
                                <div key={idx} className="p-2.5 rounded-lg bg-slate-900/40 border border-white/5">
                                    <div className="font-bold text-slate-200 mb-0.5 text-xs">{f.title}</div>
                                    <div className="text-slate-400 text-[11px]">{f.desc}</div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Middle 4 Cols: Predictive ROI Widgets */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="lg:col-span-4 p-6 rounded-2xl bg-slate-800/60 border border-white/10 hover:bg-slate-800/80 transition-all flex flex-col justify-between"
                    >
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                                <TrendingUp size={18} className="text-emerald-400" />
                                Predictive Analytics
                            </h3>
                            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-900/40 border border-white/5 mb-4">
                                <div>
                                    <div className="text-xs text-slate-400">Projected ROI</div>
                                    <div className="text-xl font-bold text-white">284%</div>
                                </div>
                                <div className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md text-[10px] font-bold">
                                    +12.5% vs Last Year
                                </div>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { label: "Electronics Margins", val: 85, color: "bg-blue-500" },
                                    { label: "Apparel Margins", val: 62, color: "bg-cyan-500" },
                                    { label: "Home Goods Margins", val: 45, color: "bg-indigo-500" }
                                ].map((stat, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-xs mb-1">
                                            <span className="text-slate-300">{stat.label}</span>
                                            <span className="text-slate-400 font-bold">{stat.val}%</span>
                                        </div>
                                        <div className="w-full bg-slate-700/30 rounded-full h-1.5 overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${stat.val}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.8, delay: 0.2 + (i * 0.1) }}
                                                className={`${stat.color} h-1.5 rounded-full`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="pt-4 mt-4 border-t border-white/5 flex gap-2 items-center">
                            <Clock size={14} className="text-blue-400" />
                            <span className="text-[11px] text-slate-400">Inventory alerts update in real-time</span>
                        </div>
                    </motion.div>

                    {/* Right 4 Cols: Compact Testimonials & CTA */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="lg:col-span-4 p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex flex-col justify-between gap-4"
                    >
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                                <Star size={18} className="text-yellow-500 fill-yellow-500" />
                                Retailer Feedback
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { quote: "StoreAI completely eliminated our stockouts. Predictive ordering is like a crystal ball.", author: "Sarah J., VP Operations" },
                                    { quote: "Cut accounting reconciliation by 70%. Multi-tenant handles 50+ locations perfectly.", author: "Michael C., CFO" }
                                ].map((t, idx) => (
                                    <div key={idx} className="p-3 rounded-xl bg-slate-900/30 border border-white/5">
                                        <p className="text-xs text-slate-300 italic mb-2">"{t.quote}"</p>
                                        <div className="text-[10px] text-slate-400 font-bold">{t.author}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Unified Micro-CTA */}
                        <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                            <span className="text-[11px] text-slate-400">14-day free trial • Cancel anytime</span>
                            <Link to="/login" className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1 transition-all active:scale-95">
                                Start Now
                                <ArrowRight size={12} />
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* Contact Row */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10 grid md:grid-cols-3 gap-6 text-center md:text-left items-center"
                >
                    <div>
                        <h4 className="text-sm font-bold text-slate-300 mb-1">Get in Touch with Sales</h4>
                        <p className="text-xs text-slate-500">Have questions about deployment or custom pricing?</p>
                    </div>
                    <div className="flex flex-wrap gap-4 md:col-span-2 justify-center md:justify-end">
                        <a href="mailto:contactus@whitekraaft.com" className="px-4 py-2 bg-slate-900/40 border border-white/5 hover:bg-slate-900/60 rounded-xl text-xs text-slate-300 flex items-center gap-2 transition-all">
                            📧 contactus@whitekraaft.com
                        </a>
                        <a href="tel:+917032295550" className="px-4 py-2 bg-slate-900/40 border border-white/5 hover:bg-slate-900/60 rounded-xl text-xs text-slate-300 flex items-center gap-2 transition-all">
                            📞 +91 70322 95550
                        </a>
                        <a href="https://wa.me/917032295550" target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2 transition-all font-semibold">
                            💬 WhatsApp Sales
                        </a>
                    </div>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/5 py-4 bg-slate-950/80 mt-8">
                <div className="container mx-auto px-6 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <img src="/logo-mt.png" alt="StoreAI Logo" className="h-10 w-auto opacity-80 drop-shadow-md sidebar-logo-contrast" />
                    <div className="text-slate-500 text-xs">
                        © {new Date().getFullYear()} StoreAI Intelligence. A product of Whitekraaft.com.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;