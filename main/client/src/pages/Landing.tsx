import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BarChart3, Building2, PackageCheck, ShieldCheck, ChevronRight, Zap, TrendingUp, Clock, Target, CheckCircle2, Star, ArrowRight } from 'lucide-react';

const Landing = () => {
    return (
        <div className="min-h-screen bg-slate-900 text-white font-['Outfit'] overflow-hidden selection:bg-blue-500/30">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(0,108,153,0.15)_0%,transparent_50%),radial-gradient(circle_at_100%_100%,rgba(0,64,110,0.2)_0%,transparent_50%)]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[120px] opacity-50"></div>
            </div>

            {/* Navbar */}
            <nav className="relative z-10 container mx-auto px-6 py-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <img src="/logo-mt.png" alt="StoreAI Logo" className="h-32 md:h-40 w-auto drop-shadow-xl sidebar-logo-contrast" />
                </div>
                <div className="flex items-center gap-4">
                    <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                        Sign In
                    </Link>
                    <Link to="/login" className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold shadow-lg shadow-blue-900/50 transition-all hover:-translate-y-0.5 active:scale-95">
                        Get Started
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 container mx-auto px-6 pt-20 pb-32">
                <div className="max-w-4xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider mb-8"
                    >
                        <Zap size={14} className="animate-pulse" />
                        Next-Gen Commerce Engine
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
                    >
                        Intelligence for <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">Modern Business</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed"
                    >
                        A unified platform delivering multi-tenant architecture, inventory optimization, and profound financial insights for the data-driven enterprise.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Link to="/login" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-lg shadow-[0_0_40px_rgba(37,99,235,0.3)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                            Enter Workspace
                            <ChevronRight size={20} />
                        </Link>
                        <a href="#features" className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold text-lg backdrop-blur-sm border border-white/10 transition-all hover:scale-105 active:scale-95">
                            Explore Features
                        </a>
                    </motion.div>
                </div>

                {/* Dashboard Preview / Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    className="mt-20 relative mx-auto max-w-5xl rounded-2xl md:rounded-[2rem] border border-white/10 bg-slate-800/50 backdrop-blur-xl p-2 md:p-4 shadow-2xl overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent z-10 pointer-events-none"></div>
                    <img 
                        src="/demo_dashboard.html" 
                        alt="Dashboard Preview" 
                        className="rounded-xl md:rounded-2xl w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
                        onError={(e) => {
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                    {/* Fallback mockup if image is missing */}
                    <div className="absolute inset-0 flex items-center justify-center -z-10 bg-slate-800/80">
                        <div className="text-slate-500 font-medium flex flex-col items-center gap-4">
                            <BarChart3 size={48} className="opacity-50" />
                            <span>Interactive Dashboard Preview</span>
                        </div>
                    </div>
                </motion.div>

                {/* Stats / Trust Section */}
                <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                    className="mt-32 pt-10 border-t border-white/10"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center max-w-4xl mx-auto">
                        <div>
                            <div className="text-4xl font-bold text-white mb-2">99.9%</div>
                            <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Uptime</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-white mb-2">30%</div>
                            <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Avg. Cost Reduction</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-white mb-2">10k+</div>
                            <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Stores Managed</div>
                        </div>
                        <div>
                            <div className="text-4xl font-bold text-white mb-2">24/7</div>
                            <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">Expert Support</div>
                        </div>
                    </div>
                </motion.div>
            </main>

            {/* Features Section */}
            <section id="features" className="relative z-10 bg-slate-900/50 backdrop-blur-lg border-t border-white/5 py-32">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-20">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Engineered for Scale</h2>
                        <p className="text-slate-400 max-w-xl mx-auto">Everything you need to manage multiple organizations, track real-time inventory, and analyze financial health.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            {
                                icon: <Building2 size={32} className="text-blue-400" />,
                                title: "Multi-Tenant Architecture",
                                desc: "Isolate data across multiple organizations while managing them from a single pane of glass."
                            },
                            {
                                icon: <PackageCheck size={32} className="text-cyan-400" />,
                                title: "Inventory Optimization",
                                desc: "AI-driven stock alerts, predictive purchasing, and real-time global inventory tracking."
                            },
                            {
                                icon: <BarChart3 size={32} className="text-indigo-400" />,
                                title: "Financial Intelligence",
                                desc: "Automated general ledgers, profit & loss statements, and granular taxation compliance."
                            },
                            {
                                icon: <ShieldCheck size={32} className="text-emerald-400" />,
                                title: "Enterprise Governance",
                                desc: "Strict RBAC controls, audit logs, and secure authentication to keep your data safe."
                            }
                        ].map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className={`p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors ${idx === 3 ? 'md:col-span-3 lg:col-span-1 lg:col-start-2' : ''}`}
                            >
                                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
                                    {feature.icon}
                                </div>
                                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Value Proposition Section */}
            <section className="relative z-10 py-32 bg-slate-900">
                <div className="container mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center gap-16 max-w-6xl mx-auto">
                        <div className="flex-1">
                            <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">Stop reacting. <br/>Start predicting with AI.</h2>
                            <p className="text-xl text-slate-400 mb-8 leading-relaxed">
                                Traditional retail software tells you what happened yesterday. StoreAI tells you what will happen tomorrow. Maximize margins and minimize stockouts with predictive intelligence.
                            </p>
                            
                            <div className="space-y-6">
                                {[
                                    { icon: <TrendingUp className="text-emerald-400" size={24} />, title: "Boost Revenue", desc: "Identify cross-sell opportunities and optimize pricing dynamically." },
                                    { icon: <Clock className="text-blue-400" size={24} />, title: "Save Hundreds of Hours", desc: "Automate purchase orders, scheduling, and accounting reconciliation." },
                                    { icon: <Target className="text-indigo-400" size={24} />, title: "Zero Guesswork", desc: "Data-driven insights tell you exactly what to stock and when." }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-start">
                                        <div className="mt-1 p-2 bg-white/5 rounded-lg border border-white/10">
                                            {item.icon}
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-white mb-1">{item.title}</h4>
                                            <p className="text-slate-400">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 w-full relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 blur-3xl rounded-full pointer-events-none"></div>
                            <div className="relative bg-slate-800/80 border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-sm">
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center pb-6 border-b border-white/10">
                                        <div>
                                            <div className="text-sm text-slate-400 mb-1">Projected ROI</div>
                                            <div className="text-3xl font-bold text-white">284%</div>
                                        </div>
                                        <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-full text-sm font-bold">
                                            +12.5% vs Last Year
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-slate-400 mb-4">Top Performing Categories</div>
                                        <div className="space-y-4">
                                            {[
                                                { label: "Electronics", val: 85, color: "bg-blue-500" },
                                                { label: "Apparel", val: 62, color: "bg-cyan-500" },
                                                { label: "Home Goods", val: 45, color: "bg-indigo-500" }
                                            ].map((stat, i) => (
                                                <div key={i}>
                                                    <div className="flex justify-between text-sm font-medium mb-2">
                                                        <span className="text-white">{stat.label}</span>
                                                        <span className="text-slate-400">{stat.val}% margin</span>
                                                    </div>
                                                    <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            whileInView={{ width: `${stat.val}%` }}
                                                            viewport={{ once: true }}
                                                            transition={{ duration: 1, delay: 0.2 + (i * 0.1) }}
                                                            className={`${stat.color} h-2 rounded-full`}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="relative z-10 py-24 bg-slate-900/50 backdrop-blur-lg border-t border-white/5">
                <div className="container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-4">Loved by Growing Businesses</h2>
                        <p className="text-slate-400 max-w-xl mx-auto">Hear how retailers and store owners are simplifying their operations with StoreAI.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                        {[
                            {
                                quote: "StoreAI completely eliminated our stockouts. The predictive ordering is like having a crystal ball for our inventory.",
                                author: "Sarah Jenkins",
                                role: "VP Operations, TechRetail"
                            },
                            {
                                quote: "We cut our accounting reconciliation time by 70%. The multi-tenant architecture perfectly handles our 50+ locations.",
                                author: "Michael Chen",
                                role: "CFO, GlobalMart"
                            },
                            {
                                quote: "The best ROI of any software we've deployed. We saw a 15% increase in margins within the first quarter of implementation.",
                                author: "Elena Rodriguez",
                                role: "Director of Retail, StyleCorp"
                            }
                        ].map((testimonial, idx) => (
                            <motion.div 
                                key={idx} 
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: idx * 0.1 }}
                                className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex gap-1 mb-6 text-yellow-500">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="currentColor" />)}
                                </div>
                                <p className="text-lg text-slate-300 mb-6 italic">"{testimonial.quote}"</p>
                                <div>
                                    <div className="font-bold text-white">{testimonial.author}</div>
                                    <div className="text-sm text-slate-400">{testimonial.role}</div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative z-10 py-32 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-slate-900 to-slate-900 border-t border-white/10">
                <div className="container mx-auto px-6">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="max-w-4xl mx-auto text-center bg-gradient-to-b from-white/10 to-transparent border border-white/10 p-12 md:p-20 rounded-[3rem] relative overflow-hidden"
                    >
                        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                        <div className="relative z-10">
                            <h2 className="text-4xl md:text-6xl font-extrabold mb-6">Ready to scale your business?</h2>
                            <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                                Join hundreds of businesses using StoreAI to optimize operations, reduce costs, and accelerate growth.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link to="/login" className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-lg shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                                    Start Free Trial
                                    <ArrowRight size={20} />
                                </Link>
                                <a href="mailto:sales@whitekraaft.com" className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg border border-white/10 transition-all hover:scale-105 active:scale-95">
                                    Contact Sales
                                </a>
                            </div>
                            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-slate-400 font-medium">
                                <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400"/> No credit card required</div>
                                <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400"/> 14-day free trial</div>
                                <div className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-400"/> Cancel anytime</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/10 py-12 bg-slate-950">
                <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <img src="/logo-mt.png" alt="StoreAI Logo" className="h-20 md:h-24 w-auto opacity-80 drop-shadow-md sidebar-logo-contrast" />
                    </div>
                    <div className="text-slate-500 text-sm font-medium">
                        © {new Date().getFullYear()} StoreAI Intelligence. A product of Whitekraaft.com.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;