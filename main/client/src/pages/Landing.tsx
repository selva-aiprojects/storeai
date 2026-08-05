import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    Building2, ChevronRight, Zap, TrendingUp, Clock, Star, ArrowRight, Mail, Phone, MessageCircle,
    ShoppingCart, Package, Store, Truck, Users, BarChart3, Award, Repeat, FileText, UserCheck, Bot,
    ShieldCheck, CheckCircle2, Sparkles, ArrowUpRight, Play, Globe, Lock, Database, Layers,
    ChevronDown, Menu, X, CreditCard, PieChart, Cpu, LayoutDashboard, GitBranch
} from 'lucide-react';
import Logo from '../components/Logo';

/* ─────────────────────────────────────────────
   DATA
───────────────────────────────────────────── */

const heroTaglines = ['Retailers', 'Distributors', 'Wholesalers', 'Franchises', 'D2C Brands'];

const trustBadges = [
    { label: 'GST Compliant', color: 'from-emerald-500 to-teal-500' },
    { label: 'Multi-Tenant', color: 'from-blue-500 to-indigo-500' },
    { label: 'Data Isolated', color: 'from-purple-500 to-violet-500' },
    { label: 'Audit Ready', color: 'from-amber-500 to-orange-500' },
    { label: 'RBAC Security', color: 'from-rose-500 to-pink-500' },
    { label: '99.99% Uptime', color: 'from-cyan-500 to-sky-500' },
    { label: 'Cloud Native', color: 'from-indigo-500 to-blue-500' },
    { label: 'API First', color: 'from-violet-500 to-purple-500' },
];

const featureTabs = [
    {
        id: 'operations',
        label: 'Operations',
        icon: <LayoutDashboard size={16} />,
        color: 'cyan',
        features: [
            {
                icon: <ShoppingCart className="w-6 h-6" />,
                title: 'Point of Sale Engine',
                badge: 'Live Checkout',
                description: 'High-speed barcode scanning, touch POS, split payments, offline mode, and instant thermal receipt printing.',
                gradient: 'from-cyan-500/20 to-sky-500/10',
                border: 'border-cyan-500/30',
                glow: 'shadow-cyan-500/20',
                iconColor: 'text-cyan-400',
            },
            {
                icon: <Package className="w-6 h-6" />,
                title: 'Multi-Warehouse & Bin Locations',
                badge: 'FIFO Automated',
                description: 'Granular warehouse bin tracking, batch numbers, expiry warnings, and automated FIFO stock allocation.',
                gradient: 'from-indigo-500/20 to-blue-500/10',
                border: 'border-indigo-500/30',
                glow: 'shadow-indigo-500/20',
                iconColor: 'text-indigo-400',
            },
            {
                icon: <Truck className="w-6 h-6" />,
                title: 'Supplier & Vendor Portal',
                badge: 'Vendor Hub',
                description: 'Self-service vendor dashboard for PO management, GRN issuance, and shipment tracking.',
                gradient: 'from-emerald-500/20 to-teal-500/10',
                border: 'border-emerald-500/30',
                glow: 'shadow-emerald-500/20',
                iconColor: 'text-emerald-400',
            },
        ],
    },
    {
        id: 'commerce',
        label: 'Commerce',
        icon: <Store size={16} />,
        color: 'pink',
        features: [
            {
                icon: <Store className="w-6 h-6" />,
                title: 'Omnichannel Storefront',
                badge: 'E-Commerce',
                description: 'Built-in direct-to-consumer digital store, connected in real-time to central inventory and live order status.',
                gradient: 'from-pink-500/20 to-rose-500/10',
                border: 'border-pink-500/30',
                glow: 'shadow-pink-500/20',
                iconColor: 'text-pink-400',
            },
            {
                icon: <UserCheck className="w-6 h-6" />,
                title: 'Customer Self-Service Portal',
                badge: 'Self-Service',
                description: 'Empower buyers to view orders, download invoices, track dispatches, and manage account balances.',
                gradient: 'from-sky-500/20 to-blue-500/10',
                border: 'border-sky-500/30',
                glow: 'shadow-sky-500/20',
                iconColor: 'text-sky-400',
            },
            {
                icon: <Award className="w-6 h-6" />,
                title: 'Loyalty & Rewards Program',
                badge: 'Rewards OS',
                description: 'Tiered reward points, automated coupons, membership perks, and retention marketing triggers.',
                gradient: 'from-yellow-500/20 to-amber-500/10',
                border: 'border-yellow-500/30',
                glow: 'shadow-yellow-500/20',
                iconColor: 'text-yellow-400',
            },
        ],
    },
    {
        id: 'finance',
        label: 'Finance & HR',
        icon: <BarChart3 size={16} />,
        color: 'rose',
        features: [
            {
                icon: <BarChart3 className="w-6 h-6" />,
                title: 'Double-Entry Financial Suite',
                badge: 'GST Compliant',
                description: 'Complete Daybook, General Ledger, Balance Sheet, P&L reports, and automated GST filings.',
                gradient: 'from-rose-500/20 to-red-500/10',
                border: 'border-rose-500/30',
                glow: 'shadow-rose-500/20',
                iconColor: 'text-rose-400',
            },
            {
                icon: <FileText className="w-6 h-6" />,
                title: 'HR & Payroll Engine',
                badge: 'Automated Pay',
                description: 'Employee records, attendance tracking, department structures, and 1-click monthly salary slip generation.',
                gradient: 'from-amber-500/20 to-orange-500/10',
                border: 'border-amber-500/30',
                glow: 'shadow-amber-500/20',
                iconColor: 'text-amber-400',
            },
            {
                icon: <Repeat className="w-6 h-6" />,
                title: 'Subscription & Recurring Billing',
                badge: 'Auto Invoicing',
                description: 'Manage recurring plans, automated cycle invoicing, renewal tracking, and churn analytics.',
                gradient: 'from-teal-500/20 to-cyan-500/10',
                border: 'border-teal-500/30',
                glow: 'shadow-teal-500/20',
                iconColor: 'text-teal-400',
            },
        ],
    },
    {
        id: 'ai',
        label: 'AI & Security',
        icon: <Cpu size={16} />,
        color: 'violet',
        features: [
            {
                icon: <Bot className="w-6 h-6" />,
                title: 'AI Copilot & Stock Intelligence',
                badge: 'AI Forecasting',
                description: 'Predictive inventory forecasts, automated purchase requisitions, and natural-language AI business assistant.',
                gradient: 'from-violet-500/30 to-purple-500/20',
                border: 'border-violet-500/40',
                glow: 'shadow-violet-500/30',
                iconColor: 'text-violet-400',
                spotlight: true,
            },
            {
                icon: <ShieldCheck className="w-6 h-6" />,
                title: 'Multi-Tenant Enterprise Security',
                badge: 'Isolated Data',
                description: 'Isolated organization workspaces, custom domain branding, granular RBAC, and audit logging.',
                gradient: 'from-emerald-500/20 to-green-500/10',
                border: 'border-emerald-500/30',
                glow: 'shadow-emerald-500/20',
                iconColor: 'text-emerald-400',
            },
            {
                icon: <Users className="w-6 h-6" />,
                title: 'CRM & Deal Pipeline',
                badge: 'Pipeline OS',
                description: 'Visual Kanban deal boards, relationship tracking, interaction logs, and sales performance forecasting.',
                gradient: 'from-purple-500/20 to-violet-500/10',
                border: 'border-purple-500/30',
                glow: 'shadow-purple-500/20',
                iconColor: 'text-purple-400',
            },
        ],
    },
];

const testimonials = [
    {
        quote: "StoreAI replaced 4 different tools — our POS, inventory, billing, and payroll — in a single platform. ROI was visible in the first month.",
        name: "Rajan Mehta",
        role: "Operations Director",
        company: "Mehta Electronics Chain",
        stars: 5,
        avatar: "RM",
        color: "from-cyan-500 to-blue-500",
    },
    {
        quote: "The AI stock forecasting alone saved us ₹14 lakhs in dead stock last quarter. The GST compliance automation is a huge bonus.",
        name: "Priya Chandran",
        role: "CFO",
        company: "FreshMart Distributors",
        stars: 5,
        avatar: "PC",
        color: "from-indigo-500 to-purple-500",
    },
    {
        quote: "We run 8 branches with completely isolated data and custom branding per outlet. Multi-tenant architecture works flawlessly.",
        name: "Suresh Nair",
        role: "Founder & CEO",
        company: "NairStores Franchise Group",
        stars: 5,
        avatar: "SN",
        color: "from-pink-500 to-rose-500",
    },
];

const steps = [
    {
        step: '01',
        title: 'Onboard in Minutes',
        description: 'Set up your organization workspace, invite your team, and configure your business profile — no IT team needed.',
        icon: <Building2 size={28} />,
        color: 'text-cyan-400',
        glow: 'from-cyan-500/20 to-blue-500/10',
        border: 'border-cyan-500/30',
    },
    {
        step: '02',
        title: 'Operate Everything',
        description: 'Run your POS, manage inventory across warehouses, process supplier orders, and handle payroll — all from one place.',
        icon: <Layers size={28} />,
        color: 'text-indigo-400',
        glow: 'from-indigo-500/20 to-purple-500/10',
        border: 'border-indigo-500/30',
    },
    {
        step: '03',
        title: 'Scale with AI',
        description: 'Let the AI Copilot forecast demand, trigger reorders, and surface actionable insights as your business grows.',
        icon: <GitBranch size={28} />,
        color: 'text-violet-400',
        glow: 'from-violet-500/20 to-pink-500/10',
        border: 'border-violet-500/30',
    },
];

const roiStats = [
    { label: 'Average Revenue Growth', value: 32, suffix: '%', color: 'from-cyan-400 to-blue-400', track: 'bg-cyan-400/20', bar: 'bg-gradient-to-r from-cyan-400 to-blue-400' },
    { label: 'Inventory Cost Reduction', value: 38, suffix: '%', color: 'from-indigo-400 to-purple-400', track: 'bg-indigo-400/20', bar: 'bg-gradient-to-r from-indigo-400 to-purple-400' },
    { label: 'Billing Speed Improvement', value: 85, suffix: '%', color: 'from-pink-400 to-rose-400', track: 'bg-pink-400/20', bar: 'bg-gradient-to-r from-pink-400 to-rose-400' },
    { label: 'Financial Reconciliation Accuracy', value: 94, suffix: '%', color: 'from-emerald-400 to-teal-400', track: 'bg-emerald-400/20', bar: 'bg-gradient-to-r from-emerald-400 to-teal-400' },
];

/* ─────────────────────────────────────────────
   MOCK DASHBOARD VISUAL (no images needed)
───────────────────────────────────────────── */
const DashboardMockup = () => (
    <div className="w-full rounded-2xl border border-white/20 bg-slate-900/90 backdrop-blur-2xl overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
        {/* Window chrome */}
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 border-b border-white/10">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
            <div className="w-3 h-3 rounded-full bg-green-500/80" />
            <div className="flex-1 mx-4 h-5 bg-slate-700/60 rounded-lg flex items-center px-3">
                <span className="text-[9px] text-slate-400 font-mono">app.storeai.in/dashboard</span>
            </div>
        </div>

        <div className="flex">
            {/* Sidebar */}
            <div className="w-12 bg-slate-950/80 flex flex-col items-center py-3 gap-3 border-r border-white/5">
                {[<LayoutDashboard size={14}/>, <ShoppingCart size={14}/>, <Package size={14}/>, <BarChart3 size={14}/>, <Users size={14}/>].map((icon, i) => (
                    <div key={i} className={`p-2 rounded-lg ${i === 0 ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-600 hover:text-slate-400'}`}>
                        {icon}
                    </div>
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 p-3 space-y-2.5">
                {/* Stats row */}
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { label: 'Revenue', val: '₹4.2L', delta: '+18%', c: 'text-cyan-400' },
                        { label: 'Orders', val: '284', delta: '+12%', c: 'text-indigo-400' },
                        { label: 'Stock', val: '2,410', delta: '-3%', c: 'text-emerald-400' },
                        { label: 'Pending', val: '₹82K', delta: '5 due', c: 'text-amber-400' },
                    ].map((s, i) => (
                        <div key={i} className="p-2 rounded-xl bg-white/5 border border-white/10">
                            <div className="text-[8px] text-slate-400 font-medium mb-0.5">{s.label}</div>
                            <div className={`text-xs font-bold ${s.c}`}>{s.val}</div>
                            <div className="text-[7px] text-slate-500">{s.delta}</div>
                        </div>
                    ))}
                </div>

                {/* Chart */}
                <div className="rounded-xl bg-white/5 border border-white/10 p-2">
                    <div className="text-[8px] text-slate-400 mb-1.5 font-semibold">Sales Trend (7 Days)</div>
                    <div className="flex items-end gap-1 h-14">
                        {[45, 62, 48, 78, 55, 88, 72].map((h, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                                <div
                                    className="w-full rounded-sm"
                                    style={{ height: `${h}%`, background: i === 5 ? 'linear-gradient(to top, #06b6d4, #6366f1)' : 'rgba(99,102,241,0.25)' }}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent orders */}
                <div className="rounded-xl bg-white/5 border border-white/10 p-2">
                    <div className="text-[8px] text-slate-400 mb-1.5 font-semibold">Recent Orders</div>
                    <div className="space-y-1">
                        {[
                            { id: '#ORD-5821', cust: 'Krishna Stores', amt: '₹24,800', status: 'Delivered', c: 'text-emerald-400 bg-emerald-400/10' },
                            { id: '#ORD-5820', cust: 'Balaji Traders', amt: '₹8,250', status: 'Packed', c: 'text-cyan-400 bg-cyan-400/10' },
                            { id: '#ORD-5819', cust: 'Raj Wholesale', amt: '₹41,000', status: 'Invoice', c: 'text-amber-400 bg-amber-400/10' },
                        ].map((o, i) => (
                            <div key={i} className="flex items-center gap-2 text-[7px]">
                                <span className="text-slate-500 font-mono w-14 shrink-0">{o.id}</span>
                                <span className="text-slate-300 flex-1 truncate">{o.cust}</span>
                                <span className="text-white font-bold">{o.amt}</span>
                                <span className={`px-1.5 py-0.5 rounded-md text-[6px] font-bold ${o.c}`}>{o.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </div>
);

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const Landing = () => {
    const [taglineIdx, setTaglineIdx] = useState(0);
    const [activeTab, setActiveTab] = useState('operations');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            setTaglineIdx(i => (i + 1) % heroTaglines.length);
        }, 2200);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 30);
        window.addEventListener('scroll', handler, { passive: true });
        return () => window.removeEventListener('scroll', handler);
    }, []);

    const activeTabData = featureTabs.find(t => t.id === activeTab)!;

    return (
        <div className="min-h-screen bg-[#04071A] text-white font-['Outfit'] overflow-x-hidden selection:bg-cyan-500/30">

            {/* ── AMBIENT BACKGROUND ── */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-15%] left-[-10%] w-[70vw] h-[70vh] bg-gradient-to-br from-blue-600/18 via-indigo-700/12 to-transparent rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vh] bg-gradient-to-tl from-cyan-500/12 via-purple-600/10 to-transparent rounded-full blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vh] bg-violet-600/6 rounded-full blur-[160px]" />
                {/* Grid */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{ backgroundImage: 'linear-gradient(rgba(148,163,184,1) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
                />
            </div>

            {/* ═══════════════════════════════════════
                NAVBAR
            ═══════════════════════════════════════ */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-slate-950/95 backdrop-blur-2xl border-b border-white/10 shadow-[0_1px_40px_rgba(0,0,0,0.6)]' : 'bg-transparent'}`}>
                <div className="container mx-auto px-4 md:px-6 max-w-7xl h-16 flex items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <Logo size={38} showText={true} theme="dark" animated={true} />
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-400">
                        <a href="#features" className="hover:text-white transition-colors">Features</a>
                        <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
                        <a href="#testimonials" className="hover:text-white transition-colors">Customers</a>
                        <a href="#contact" className="hover:text-white transition-colors">Contact</a>
                    </div>

                    {/* Desktop CTAs */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors">
                            Sign In
                        </Link>
                        <Link
                            to="/login"
                            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-sm font-bold shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
                        >
                            Book Free Demo
                            <ChevronRight size={15} />
                        </Link>
                    </div>

                    {/* Mobile hamburger */}
                    <button
                        className="md:hidden p-2 rounded-xl bg-white/10 border border-white/15 text-white"
                        onClick={() => setMobileMenuOpen(v => !v)}
                        aria-label="Toggle menu"
                    >
                        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Mobile menu */}
                <AnimatePresence>
                    {mobileMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="md:hidden bg-slate-950/98 backdrop-blur-2xl border-b border-white/10 px-4 pb-5 pt-2 space-y-3"
                        >
                            {['Features', 'How It Works', 'Customers', 'Contact'].map(l => (
                                <a
                                    key={l}
                                    href={`#${l.toLowerCase().replace(/ /g, '-')}`}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block text-sm font-semibold text-slate-300 hover:text-white py-2 border-b border-white/5"
                                >
                                    {l}
                                </a>
                            ))}
                            <div className="flex flex-col gap-2 pt-2">
                                <Link to="/login" className="text-center py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm font-semibold text-slate-300">Sign In</Link>
                                <Link to="/login" className="text-center py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white text-sm font-bold">Book Free Demo</Link>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* ═══════════════════════════════════════
                HERO SECTION
            ═══════════════════════════════════════ */}
            <section className="relative z-10 pt-28 pb-20 px-4 md:px-6 container mx-auto max-w-7xl">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Copy */}
                    <div className="space-y-8">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-bold uppercase tracking-widest"
                        >
                            <Zap size={13} className="animate-pulse" />
                            Unified Commerce OS · v2.0 Now Live
                        </motion.div>

                        {/* Headline */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="space-y-2"
                        >
                            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05]">
                                The OS Built
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                                    for Indian
                                </span>
                                <br />
                                <AnimatePresence mode="wait">
                                    <motion.span
                                        key={taglineIdx}
                                        initial={{ opacity: 0, y: 15 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -15 }}
                                        transition={{ duration: 0.35 }}
                                        className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-orange-400"
                                    >
                                        {heroTaglines[taglineIdx]}
                                    </motion.span>
                                </AnimatePresence>
                            </h1>
                        </motion.div>

                        {/* Subheadline */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-slate-300 text-lg leading-relaxed max-w-lg"
                        >
                            StoreAI integrates POS, multi-warehouse inventory, GST accounting, HR payroll, CRM, and predictive AI — all in one isolated multi-tenant workspace.
                        </motion.p>

                        {/* CTAs */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="flex flex-wrap gap-4"
                        >
                            <Link
                                to="/login"
                                id="hero-primary-cta"
                                className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-base shadow-[0_0_50px_rgba(6,182,212,0.45)] hover:shadow-[0_0_70px_rgba(6,182,212,0.65)] transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-2.5"
                            >
                                Book Free Demo
                                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                to="/login"
                                id="hero-secondary-cta"
                                className="group px-8 py-4 rounded-2xl bg-white/8 hover:bg-white/14 backdrop-blur-md border border-white/20 text-white font-semibold text-base transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-2.5"
                            >
                                <div className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center">
                                    <Play size={11} className="ml-0.5" />
                                </div>
                                Watch 2-min Demo
                            </Link>
                        </motion.div>

                        {/* Trust mini-strip */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.7, delay: 0.5 }}
                            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400 font-semibold"
                        >
                            {['No credit card required', 'Setup in 15 minutes', 'GST ready out of the box'].map((t, i) => (
                                <span key={i} className="flex items-center gap-1.5">
                                    <CheckCircle2 size={13} className="text-emerald-400" />
                                    {t}
                                </span>
                            ))}
                        </motion.div>
                    </div>

                    {/* Right: Dashboard Mockup */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.93, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: [0, -10, 0] }}
                        transition={{ duration: 0.8, delay: 0.2, y: { duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 } }}
                        className="relative"
                    >
                        {/* Glow behind mockup */}
                        <div className="absolute inset-0 -m-6 bg-gradient-to-tr from-cyan-500/25 via-indigo-600/20 to-pink-500/20 rounded-3xl blur-[60px] pointer-events-none" />
                        <DashboardMockup />

                        {/* Floating badges */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1 }}
                            className="absolute -left-6 top-12 px-3 py-2 rounded-xl bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-bold shadow-lg flex items-center gap-1.5"
                        >
                            <TrendingUp size={13} />
                            +32% Revenue
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 1.2 }}
                            className="absolute -right-4 bottom-16 px-3 py-2 rounded-xl bg-violet-600/90 backdrop-blur-sm text-white text-xs font-bold shadow-lg flex items-center gap-1.5"
                        >
                            <Bot size={13} />
                            AI Reorder Alert
                        </motion.div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                TRUST BADGE STRIP
            ═══════════════════════════════════════ */}
            <section className="relative z-10 py-8 border-y border-white/8 bg-white/[0.02] overflow-hidden">
                <div className="flex items-center gap-2 mb-4 container mx-auto px-4 md:px-6 max-w-7xl">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-widest whitespace-nowrap px-4">Platform Certifications & Standards</span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                </div>
                <div className="flex gap-3 flex-wrap justify-center px-4">
                    {trustBadges.map((b, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.06 }}
                            className={`px-4 py-2 rounded-full text-xs font-bold text-white bg-gradient-to-r ${b.color} bg-opacity-90 shadow-lg`}
                        >
                            {b.label}
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* ═══════════════════════════════════════
                PROBLEM / SOLUTION
            ═══════════════════════════════════════ */}
            <section className="relative z-10 py-24 px-4 md:px-6 container mx-auto max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16 space-y-3"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-widest">
                        <Sparkles size={13} />
                        Why Businesses Switch to StoreAI
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
                        Stop Juggling <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-orange-400">Broken Tools</span>
                    </h2>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">Most businesses use 5–8 disconnected apps. StoreAI replaces all of them with one unified, AI-powered platform.</p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Before */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="p-8 rounded-3xl bg-rose-950/30 border border-rose-500/20 space-y-5"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400">✗</div>
                            <h3 className="text-xl font-bold text-rose-300">Before StoreAI</h3>
                        </div>
                        <div className="space-y-3">
                            {[
                                'Separate POS, billing, and inventory apps that don\'t sync',
                                'Manual Excel sheets for GST and payroll',
                                'No real-time stock visibility across warehouses',
                                'Multiple logins, duplicate data entry, costly subscriptions',
                                'Zero demand forecasting — always overstocked or stockout',
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                    <div className="mt-0.5 w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 text-xs shrink-0">✗</div>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* After */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="p-8 rounded-3xl bg-emerald-950/30 border border-emerald-500/20 space-y-5"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">✓</div>
                            <h3 className="text-xl font-bold text-emerald-300">After StoreAI</h3>
                        </div>
                        <div className="space-y-3">
                            {[
                                'One unified platform — POS, inventory, billing all in sync',
                                'Automated GST filing and 1-click payroll generation',
                                'Live multi-warehouse stock visibility with bin locations',
                                'Single workspace, role-based access, zero data duplication',
                                'AI copilot predicts demand and auto-triggers reorders',
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm text-slate-200">
                                    <CheckCircle2 size={18} className="mt-0.5 text-emerald-400 shrink-0" />
                                    {item}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                FEATURES SECTION (TABBED)
            ═══════════════════════════════════════ */}
            <section id="features" className="relative z-10 py-24 px-4 md:px-6 container mx-auto max-w-7xl">
                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-12 space-y-3"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest">
                        <Sparkles size={13} />
                        12+ Integrated Modules
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
                        Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-cyan-300 to-pink-400">Total Control</span>
                    </h2>
                    <p className="text-slate-400 text-base max-w-2xl mx-auto">Every module talks to every other — no integrations, no data silos, no extra subscriptions.</p>
                </motion.div>

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 justify-center mb-10">
                    {featureTabs.map(tab => (
                        <button
                            key={tab.id}
                            id={`tab-${tab.id}`}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                activeTab === tab.id
                                    ? 'bg-white/12 text-white border border-white/20 shadow-lg'
                                    : 'text-slate-400 hover:text-white border border-transparent hover:border-white/10'
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Feature cards */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        transition={{ duration: 0.3 }}
                        className="grid md:grid-cols-3 gap-6"
                    >
                        {activeTabData.features.map((feature, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.08 }}
                                className={`group relative p-6 rounded-2xl bg-gradient-to-br ${feature.gradient} border ${feature.border} hover:shadow-xl ${feature.glow} hover:shadow-lg transition-all duration-300 flex flex-col justify-between ${feature.spotlight ? 'md:col-span-1 ring-1 ring-violet-500/40' : ''}`}
                            >
                                {/* Spotlight badge */}
                                {feature.spotlight && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg">
                                        ★ AI Powered
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className={`p-3 rounded-xl bg-white/8 border border-white/12 ${feature.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                                            {feature.icon}
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full bg-white/8 text-slate-300 text-[10px] font-bold uppercase tracking-wider border border-white/12">
                                            {feature.badge}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-cyan-200 transition-colors mb-2">{feature.title}</h3>
                                        <p className="text-xs text-slate-400 leading-relaxed">{feature.description}</p>
                                    </div>
                                </div>

                                <div className="pt-4 mt-4 border-t border-white/8 flex items-center justify-between text-xs text-slate-500 group-hover:text-white font-semibold transition-colors">
                                    <span>Explore Module</span>
                                    <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </AnimatePresence>
            </section>

            {/* ═══════════════════════════════════════
                HOW IT WORKS
            ═══════════════════════════════════════ */}
            <section id="how-it-works" className="relative z-10 py-24 px-4 md:px-6 border-y border-white/8 bg-white/[0.015]">
                <div className="container mx-auto max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-16 space-y-3"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                            <Zap size={13} />
                            Up in Minutes, Not Months
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
                            How It <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Works</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6 relative">
                        {/* Connector line */}
                        <div className="hidden md:block absolute top-16 left-1/4 right-1/4 h-px bg-gradient-to-r from-cyan-500/40 via-indigo-500/40 to-violet-500/40" style={{ top: '4rem' }} />

                        {steps.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.15 }}
                                className={`relative p-7 rounded-2xl bg-gradient-to-br ${step.glow} border ${step.border} text-center space-y-4`}
                            >
                                {/* Step number */}
                                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{step.step}</div>
                                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/8 border border-white/15 ${step.color}`}>
                                    {step.icon}
                                </div>
                                <h3 className="text-xl font-bold text-white">{step.title}</h3>
                                <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                ROI / ANALYTICS SECTION
            ═══════════════════════════════════════ */}
            <section className="relative z-10 py-24 px-4 md:px-6 container mx-auto max-w-7xl">
                <div className="grid lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Copy */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="space-y-6"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                            <TrendingUp size={13} />
                            Proven Business Impact
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
                            Real ROI, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Real Fast</span>
                        </h2>
                        <p className="text-slate-400 text-lg leading-relaxed">Our customers see measurable improvements in the first 30 days — not after months of configuration.</p>

                        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                            {[
                                { val: '99.99%', label: 'Platform Uptime', c: 'text-white' },
                                { val: '30 Days', label: 'Avg. ROI Timeline', c: 'text-emerald-400' },
                                { val: '12+', label: 'Integrated Modules', c: 'text-cyan-400' },
                            ].map((s, i) => (
                                <div key={i}>
                                    <div className={`text-2xl sm:text-3xl font-black ${s.c}`}>{s.val}</div>
                                    <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mt-0.5">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold text-sm shadow-[0_0_30px_rgba(16,185,129,0.4)] hover:shadow-[0_0_40px_rgba(16,185,129,0.6)] transition-all hover:-translate-y-0.5 active:scale-95"
                        >
                            See It in Action
                            <ArrowRight size={16} />
                        </Link>
                    </motion.div>

                    {/* Right: Progress bars */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="p-8 rounded-3xl bg-slate-900/60 border border-white/12 backdrop-blur-xl space-y-6"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-lg font-bold text-white">Efficiency Metrics</h3>
                            <span className="px-3 py-1 bg-emerald-500/12 text-emerald-400 rounded-full text-xs font-bold border border-emerald-500/20">
                                Avg. +32% Overall
                            </span>
                        </div>

                        {roiStats.map((stat, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between text-sm font-semibold">
                                    <span className="text-slate-300">{stat.label}</span>
                                    <span className={`font-black text-transparent bg-clip-text bg-gradient-to-r ${stat.color}`}>{stat.value}{stat.suffix}</span>
                                </div>
                                <div className={`w-full rounded-full h-2.5 ${stat.track}`}>
                                    <motion.div
                                        initial={{ width: 0 }}
                                        whileInView={{ width: `${stat.value}%` }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 1, delay: 0.2 + i * 0.1, ease: 'easeOut' }}
                                        className={`h-2.5 rounded-full ${stat.bar}`}
                                    />
                                </div>
                            </div>
                        ))}

                        <div className="pt-4 border-t border-white/8 flex items-center gap-2 text-xs text-slate-500">
                            <Clock size={13} className="text-cyan-400" />
                            Based on aggregated data from active StoreAI deployments.
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                TESTIMONIALS
            ═══════════════════════════════════════ */}
            <section id="testimonials" className="relative z-10 py-24 px-4 md:px-6 border-t border-white/8 bg-white/[0.015]">
                <div className="container mx-auto max-w-7xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-center mb-14 space-y-3"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-widest">
                            <Star size={13} />
                            Customer Stories
                        </div>
                        <h2 className="text-4xl sm:text-5xl font-black tracking-tight">
                            Loved by <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-400">Businesses Across India</span>
                        </h2>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {testimonials.map((t, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.12 }}
                                className="group p-7 rounded-2xl bg-slate-900/70 border border-white/10 hover:border-white/20 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between space-y-5"
                            >
                                {/* Stars */}
                                <div className="flex gap-0.5">
                                    {Array.from({ length: t.stars }).map((_, j) => (
                                        <Star key={j} size={14} className="text-yellow-400 fill-yellow-400" />
                                    ))}
                                </div>

                                {/* Quote */}
                                <p className="text-slate-300 text-sm leading-relaxed italic">"{t.quote}"</p>

                                {/* Author */}
                                <div className="flex items-center gap-3 pt-4 border-t border-white/8">
                                    <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center text-white text-xs font-black shrink-0`}>
                                        {t.avatar}
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-white">{t.name}</div>
                                        <div className="text-xs text-slate-500">{t.role}, {t.company}</div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                TRUST / SECURITY SECTION
            ═══════════════════════════════════════ */}
            <section className="relative z-10 py-20 px-4 md:px-6 container mx-auto max-w-7xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="p-10 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20"
                >
                    <div className="grid md:grid-cols-2 gap-10 items-center">
                        <div className="space-y-5">
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-widest">
                                <Lock size={13} />
                                Enterprise-Grade Architecture
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                                Built for <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Security at Scale</span>
                            </h2>
                            <p className="text-slate-400 leading-relaxed">Every organization gets a completely isolated workspace. Your data never touches another tenant's environment.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { icon: <Database size={18} />, title: 'Isolated Data Stores', desc: 'Per-tenant database isolation', c: 'text-cyan-400' },
                                { icon: <ShieldCheck size={18} />, title: 'Granular RBAC', desc: 'Role-based access control', c: 'text-indigo-400' },
                                { icon: <Globe size={18} />, title: 'Custom Subdomains', desc: 'Branded workspace URLs', c: 'text-violet-400' },
                                { icon: <Lock size={18} />, title: 'Audit Logging', desc: 'Full activity trail', c: 'text-emerald-400' },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.08 }}
                                    className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-1.5"
                                >
                                    <div className={item.c}>{item.icon}</div>
                                    <div className="text-sm font-bold text-white">{item.title}</div>
                                    <div className="text-xs text-slate-500">{item.desc}</div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* ═══════════════════════════════════════
                FINAL CTA BANNER
            ═══════════════════════════════════════ */}
            <section id="contact" className="relative z-10 py-24 px-4 md:px-6">
                <div className="container mx-auto max-w-5xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="relative overflow-hidden p-12 rounded-3xl text-center space-y-8"
                        style={{ background: 'linear-gradient(135deg, #0d1b4a 0%, #1a0533 50%, #0d2840 100%)' }}
                    >
                        {/* Background glows */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[70%] bg-gradient-to-b from-indigo-500/20 via-cyan-500/15 to-transparent blur-[80px] pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-[40%] h-[50%] bg-pink-500/15 blur-[60px] pointer-events-none" />
                        
                        <div className="relative space-y-4">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-cyan-300 text-xs font-bold uppercase tracking-widest">
                                <Sparkles size={13} />
                                Ready to transform your business?
                            </div>
                            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight">
                                Start Your Free
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-indigo-400">
                                    Demo Today
                                </span>
                            </h2>
                            <p className="text-slate-300 text-lg max-w-xl mx-auto">
                                See StoreAI live with your own data. No commitment, no credit card — just a walkthrough of your future platform.
                            </p>
                        </div>

                        <div className="relative flex flex-wrap gap-4 justify-center">
                            <Link
                                to="/login"
                                id="final-cta-primary"
                                className="px-10 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-base shadow-[0_0_60px_rgba(6,182,212,0.5)] hover:shadow-[0_0_80px_rgba(6,182,212,0.7)] transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                            >
                                Book Free Demo
                                <ArrowRight size={18} />
                            </Link>
                            <a
                                href="https://wa.me/918825492600"
                                target="_blank"
                                rel="noopener noreferrer"
                                id="cta-whatsapp"
                                className="px-8 py-4 rounded-2xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 font-bold text-base transition-all hover:-translate-y-1 flex items-center gap-2.5"
                            >
                                <MessageCircle size={18} />
                                Chat on WhatsApp
                            </a>
                        </div>

                        {/* Contact row */}
                        <div className="relative flex flex-wrap gap-4 justify-center pt-4 border-t border-white/10">
                            <a href="mailto:contactus@cognivectra.com" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors font-semibold">
                                <Mail size={15} className="text-cyan-400" />
                                contactus@cognivectra.com
                            </a>
                            <a href="tel:+918825492600" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors font-semibold">
                                <Phone size={15} className="text-indigo-400" />
                                +91 88254 92600
                            </a>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ═══════════════════════════════════════
                FOOTER
            ═══════════════════════════════════════ */}
            <footer className="relative z-10 border-t border-white/8 bg-slate-950/80 pt-14 pb-8 px-4 md:px-6">
                <div className="container mx-auto max-w-7xl">
                    <div className="grid md:grid-cols-4 gap-10 mb-12">
                        {/* Brand */}
                        <div className="md:col-span-2 space-y-4">
                            <Logo size={42} showText={true} theme="dark" animated={false} />
                            <p className="text-slate-400 text-sm leading-relaxed max-w-xs">
                                The unified commerce operating system for Indian retailers, distributors, and wholesalers. Built by Cognivectra.
                            </p>
                            <div className="flex gap-3">
                                <a href="https://wa.me/918825492600" target="_blank" rel="noopener noreferrer"
                                    className="p-2.5 rounded-xl bg-emerald-500/12 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 transition-all">
                                    <MessageCircle size={16} />
                                </a>
                                <a href="mailto:contactus@cognivectra.com"
                                    className="p-2.5 rounded-xl bg-cyan-500/12 border border-cyan-500/25 text-cyan-400 hover:bg-cyan-500/20 transition-all">
                                    <Mail size={16} />
                                </a>
                                <a href="tel:+918825492600"
                                    className="p-2.5 rounded-xl bg-indigo-500/12 border border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/20 transition-all">
                                    <Phone size={16} />
                                </a>
                            </div>
                        </div>

                        {/* Platform */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Platform</h4>
                            <ul className="space-y-2.5 text-sm text-slate-400">
                                {['Point of Sale', 'Inventory Management', 'GST Accounting', 'HR & Payroll', 'AI Copilot'].map(l => (
                                    <li key={l}><Link to="/login" className="hover:text-white transition-colors">{l}</Link></li>
                                ))}
                            </ul>
                        </div>

                        {/* Company */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">Company</h4>
                            <ul className="space-y-2.5 text-sm text-slate-400">
                                {['About Cognivectra', 'Customer Stories', 'Privacy Policy', 'Terms of Service', 'Contact Sales'].map(l => (
                                    <li key={l}><a href="mailto:contactus@cognivectra.com" className="hover:text-white transition-colors">{l}</a></li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="pt-6 border-t border-white/8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 font-semibold">
                        <span>© {new Date().getFullYear()} StoreAI Intelligence. A product of Cognivectra.com. All rights reserved.</span>
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-emerald-500">All systems operational</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;