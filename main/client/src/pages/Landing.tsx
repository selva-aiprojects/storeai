import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Building2, ChevronRight, Zap, TrendingUp, Clock, Star, ArrowRight, Mail, Phone, MessageCircle,
    ShoppingCart, Package, Store, Truck, Users, BarChart3, Award, Repeat, FileText, UserCheck, Bot,
    ShieldCheck, CheckCircle2, Sparkles, ArrowUpRight
} from 'lucide-react';
import Logo from '../components/Logo';

const Landing = () => {
    // Feature Suite Definition
    const featureSuite = [
        {
            icon: <ShoppingCart className="w-6 h-6 text-cyan-400" />,
            title: "Point of Sale (POS) Engine",
            category: "Retail Operations",
            badge: "Live Checkout",
            description: "High-speed barcode scanning, touch POS, split payment methods, offline mode support, and instant thermal receipt printing."
        },
        {
            icon: <Package className="w-6 h-6 text-indigo-400" />,
            title: "Multi-Warehouse & Bin Locations",
            category: "Inventory Core",
            badge: "FIFO Automated",
            description: "Granular warehouse bin tracking, batch number management, expiry date warnings, and automated FIFO stock allocation."
        },
        {
            icon: <Store className="w-6 h-6 text-pink-400" />,
            title: "Omnichannel Storefront",
            category: "Direct Commerce",
            badge: "E-Commerce",
            description: "Built-in direct-to-consumer digital store connected in real-time to your central inventory and live order status."
        },
        {
            icon: <Truck className="w-6 h-6 text-emerald-400" />,
            title: "Supplier & Vendor Portal",
            category: "Procurement",
            badge: "Vendor Hub",
            description: "Self-service vendor dashboard for managing Purchase Orders (PO), issuing Goods Received Notes (GRN), and tracking shipments."
        },
        {
            icon: <UserCheck className="w-6 h-6 text-sky-400" />,
            title: "Customer Self-Service Portal",
            category: "Customer Hub",
            badge: "Self-Service",
            description: "Empower buyers to view order history, download tax invoices, track live dispatches, and manage account balances."
        },
        {
            icon: <Users className="w-6 h-6 text-purple-400" />,
            title: "CRM & Deal Pipeline",
            category: "Sales Intelligence",
            badge: "Pipeline OS",
            description: "Visual deal Kanban boards, customer relationship tracking, interaction logs, and sales performance forecasting."
        },
        {
            icon: <Award className="w-6 h-6 text-yellow-400" />,
            title: "Loyalty & Rewards Program",
            category: "Retention Engine",
            badge: "Rewards OS",
            description: "Tiered reward point allocation, automated coupon codes, customer membership perks, and retention marketing triggers."
        },
        {
            icon: <Repeat className="w-6 h-6 text-teal-400" />,
            title: "Subscription & Recurring Billing",
            category: "Recurring Revenue",
            badge: "Auto Invoicing",
            description: "Manage recurring customer plans, automated cycle invoicing, renewal tracking, and churn analytics."
        },
        {
            icon: <BarChart3 className="w-6 h-6 text-rose-400" />,
            title: "Double-Entry Financial Suite",
            category: "Finance & Accounts",
            badge: "GST Compliant",
            description: "Complete Daybook, General Ledger, Balance Sheet, Profit & Loss reports, liability tracking, and automated GST tax filings."
        },
        {
            icon: <FileText className="w-6 h-6 text-amber-400" />,
            title: "HR & Payroll Engine",
            category: "Workforce",
            badge: "Automated Pay",
            description: "Employee master records, daily attendance tracking, department structures, and 1-click monthly salary slip generation."
        },
        {
            icon: <Bot className="w-6 h-6 text-cyan-300" />,
            title: "AI Copilot & Stock Intelligence",
            category: "Autonomous AI",
            badge: "AI Forecasting",
            description: "Predictive inventory depletion forecasts, automated purchase requisitions, and natural language AI business assistant."
        },
        {
            icon: <ShieldCheck className="w-6 h-6 text-emerald-300" />,
            title: "Multi-Tenant Enterprise Security",
            category: "Architecture",
            badge: "Isolated Data",
            description: "Isolated organization workspace security, custom domain branding, granular RBAC permissions, and audit logging."
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white font-['Outfit'] overflow-x-hidden selection:bg-blue-500/30 flex flex-col justify-between">
            {/* Multi-Color Ambient Glow Background */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-0 w-3/5 h-3/5 bg-gradient-to-br from-blue-600/15 via-indigo-600/10 to-transparent blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-3/5 h-3/5 bg-gradient-to-tl from-cyan-500/15 via-pink-500/10 to-transparent blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[140px]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10"></div>
            </div>

            {/* Slim Header Panel (56px) with Large 150px Overlay Logo */}
            <nav className="relative z-30 border-b border-white/10 bg-slate-950/90 backdrop-blur-xl h-14 flex items-center">
                <div className="container mx-auto px-4 md:px-6 max-w-7xl flex justify-between items-center h-full relative">
                    {/* Left Logo Wrapper - Large 150px logo floating over slim header bar */}
                    <div className="flex items-center gap-3 relative z-30 h-full">
                        <Link to="/" className="flex items-center group relative h-full">
                            <img
                                src="/StoreAI-Logo-new.png"
                                alt="StoreAI Multi-Tenant"
                                className="h-32 sm:h-40 w-auto object-contain filter drop-shadow-[0_8px_25px_rgba(6,182,212,0.45)] group-hover:scale-105 transition-transform duration-300 pointer-events-auto"
                                style={{
                                    position: 'absolute',
                                    left: 0,
                                    top: '50%',
                                    transform: 'translateY(-48%)',
                                    maxHeight: '150px'
                                }}
                                onError={(e) => {
                                    e.currentTarget.src = "/logo-transparent.png";
                                }}
                            />
                            {/* Spacer element to preserve width in flex layout */}
                            <div className="w-48 sm:w-64 h-14" />
                        </Link>
                    </div>

                    {/* Right Nav Links */}
                    <div className="flex items-center gap-4">
                        <Link to="/login" className="text-xs sm:text-sm font-semibold text-slate-300 hover:text-cyan-300 transition-colors">
                            Sign In
                        </Link>
                        <Link to="/login" className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all hover:-translate-y-0.5 active:scale-95">
                            Enter Workspace
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Main Content Area */}
            <main className="relative z-10 container mx-auto px-4 md:px-6 pt-6 pb-12 max-w-7xl flex-grow">
                
                {/* ================= HERO SECTION (WITH 5X ENLARGED LOGO) ================= */}
                <div className="grid lg:grid-cols-12 gap-8 items-center mb-16">
                    {/* Left Column: Hero Text & CTAs & Key Metrics */}
                    <div className="lg:col-span-6 space-y-6">
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-cyan-300 text-xs font-bold uppercase tracking-wider"
                        >
                            <Zap size={14} className="text-cyan-400 animate-pulse" />
                            Unified Commerce OS Platform
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]"
                        >
                            Autonomous <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                                Commerce Intelligence
                            </span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-xl"
                        >
                            Complete multi-tenant business operations suite integrating POS, multi-bin inventory, procurement, CRM, financial ledgers, HR payroll, and predictive AI analytics.
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="flex flex-wrap items-center gap-4"
                        >
                            <Link to="/login" className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-base shadow-[0_0_35px_rgba(79,70,229,0.4)] transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2">
                                Launch Platform
                                <ChevronRight size={18} />
                            </Link>
                            <Link to="/login" className="px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-semibold text-base backdrop-blur-md border border-white/15 transition-all hover:scale-105 active:scale-95">
                                Explore Live Demo
                            </Link>
                        </motion.div>

                        {/* Stats Row */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.8, delay: 0.4 }}
                            className="pt-6 border-t border-white/10 grid grid-cols-3 gap-4"
                        >
                            <div>
                                <div className="text-2xl sm:text-3xl font-extrabold text-white">99.99%</div>
                                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Uptime & Reliability</div>
                            </div>
                            <div>
                                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400">100%</div>
                                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">GST Audit Ready</div>
                            </div>
                            <div>
                                <div className="text-2xl sm:text-3xl font-extrabold text-cyan-400">12+</div>
                                <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Integrated Modules</div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Right Column: 5X ENLARGED LOGO PRESENTATION SHOWCASE */}
                    <div className="lg:col-span-6 flex justify-center items-center relative w-full my-6 lg:my-0">
                        {/* Multi-color ambient background glows */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-gradient-to-tr from-cyan-500/25 via-indigo-600/30 to-pink-500/25 rounded-full blur-[130px] pointer-events-none animate-pulse"></div>
                        
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 15 }}
                            animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
                            transition={{ duration: 0.8, delay: 0.2, y: { duration: 6, repeat: Infinity, ease: 'easeInOut' } }}
                            className="relative z-10 w-full max-w-2xl flex justify-center items-center p-8 sm:p-10 bg-slate-900/80 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.7)] group hover:border-cyan-400/50 transition-all duration-500"
                        >
                            <img 
                                src="/StoreAI-Logo-new.png" 
                                alt="StoreAI Multi-Tenant Enterprise Platform" 
                                className="w-full h-auto object-contain max-h-[550px] filter drop-shadow-[0_20px_60px_rgba(6,182,212,0.45)] group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                    e.currentTarget.src = "/logo-transparent.png";
                                }}
                            />
                        </motion.div>
                    </div>
                </div>

                {/* ================= COMPREHENSIVE FEATURES GRID SECTION ================= */}
                <div className="mt-16 mb-16">
                    <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                            <Sparkles size={14} />
                            Complete Commerce OS Suite
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">
                            Engineered for Total <span className="bg-gradient-to-r from-cyan-400 via-indigo-300 to-pink-400 bg-clip-text text-transparent">Operational Control</span>
                        </h2>
                        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
                            Discover the all-in-one platform built to streamline sales, stock locations, supplier orders, financial ledgers, and workforce management.
                        </p>
                    </div>

                    {/* 12-Feature Grid Cards */}
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {featureSuite.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 25 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: (idx % 3) * 0.1 }}
                                className="p-6 rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-white/10 hover:border-cyan-400/40 hover:bg-slate-900/90 transition-all duration-300 group flex flex-col justify-between"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform duration-300">
                                            {feature.icon}
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full bg-white/5 text-slate-300 text-[10px] font-bold uppercase tracking-wider border border-white/10">
                                            {feature.badge}
                                        </span>
                                    </div>

                                    <div>
                                        <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-1">
                                            {feature.category}
                                        </div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                                            {feature.title}
                                        </h3>
                                        <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                                            {feature.description}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 group-hover:text-white font-semibold transition-colors">
                                    <span>Explore Module</span>
                                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* ================= ARCHITECTURE & ROI DASHBOARD ROW ================= */}
                <div className="grid lg:grid-cols-12 gap-6 mb-16">
                    {/* Left 6 Cols: Multi-Tenant Architecture */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="lg:col-span-6 p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border border-white/15 space-y-6"
                    >
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-3">
                                <Building2 size={14} />
                                Multi-Tenant Architecture
                            </div>
                            <h3 className="text-2xl font-extrabold text-white">
                                Enterprise Isolation & Workspace Scalability
                            </h3>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                                Deploy isolated organization workspaces with custom subdomains, distinct tax configurations, multi-currency support, and strict data privacy safeguards.
                            </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-3 text-xs">
                            {[
                                "Complete Tenant Data Isolation",
                                "Granular RBAC User Roles",
                                "Custom Organization Branding",
                                "Seamless Multi-Branch Sync"
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10">
                                    <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                                    <span className="font-semibold text-slate-200">{item}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right 6 Cols: Real-Time Business Analytics */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="lg:col-span-6 p-8 rounded-3xl bg-slate-900/60 backdrop-blur-xl border border-white/15 flex flex-col justify-between space-y-6"
                    >
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-extrabold text-white flex items-center gap-2">
                                    <TrendingUp size={20} className="text-emerald-400" />
                                    Real-Time Analytics & ROI
                                </h3>
                                <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
                                    +32% Avg Efficiency
                                </span>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { label: "Inventory Holding Cost Reduction", val: 38, color: "bg-cyan-400" },
                                    { label: "Billing & Checkout Speed", val: 85, color: "bg-indigo-400" },
                                    { label: "Tax & Financial Reconciliation", val: 94, color: "bg-pink-400" }
                                ].map((stat, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-xs mb-1.5 font-semibold">
                                            <span className="text-slate-300">{stat.label}</span>
                                            <span className="text-cyan-300 font-bold">{stat.val}% Improvement</span>
                                        </div>
                                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                                            <motion.div 
                                                initial={{ width: 0 }}
                                                whileInView={{ width: `${stat.val}%` }}
                                                viewport={{ once: true }}
                                                transition={{ duration: 0.8, delay: 0.2 + (i * 0.1) }}
                                                className={`${stat.color} h-2 rounded-full`}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                            <span className="text-xs text-slate-400 flex items-center gap-2">
                                <Clock size={14} className="text-cyan-400" />
                                Live metrics refresh automatically
                            </span>
                            <Link to="/login" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all">
                                Try StoreAI Now
                                <ArrowRight size={14} />
                            </Link>
                        </div>
                    </motion.div>
                </div>

                {/* ================= CONTACT & SALES FOOTER BANNER ================= */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 border border-white/15 grid md:grid-cols-3 gap-6 text-center md:text-left items-center"
                >
                    <div>
                        <h4 className="text-lg font-extrabold text-white mb-1">Get Started with StoreAI</h4>
                        <p className="text-xs text-slate-400">Have questions about enterprise deployment or custom pricing?</p>
                    </div>
                    <div className="flex flex-wrap gap-3 md:col-span-2 justify-center md:justify-end">
                        <a href="mailto:contactus@whitekraaft.com" className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs text-slate-200 flex items-center gap-2 transition-all font-semibold">
                            <Mail size={15} className="text-cyan-400" />
                            contactus@whitekraaft.com
                        </a>
                        <a href="tel:+917032295550" className="px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs text-slate-200 flex items-center gap-2 transition-all font-semibold">
                            <Phone size={15} className="text-indigo-400" />
                            +91 70322 95550
                        </a>
                        <a href="https://wa.me/917032295550" target="_blank" rel="noopener noreferrer" className="px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2 transition-all font-bold">
                            <MessageCircle size={15} />
                            WhatsApp Sales
                        </a>
                    </div>
                </motion.div>
            </main>

            {/* Footer */}
            <footer className="relative z-10 border-t border-white/10 py-6 bg-slate-950/90 mt-12">
                <div className="container mx-auto px-6 max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <img src="/StoreAI-Logo-new.png" alt="StoreAI Logo" className="h-16 w-auto opacity-90 drop-shadow-lg" />
                    <div className="text-slate-500 text-xs font-semibold">
                        &copy; {new Date().getFullYear()} StoreAI Intelligence. A product of Whitekraaft.com. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;