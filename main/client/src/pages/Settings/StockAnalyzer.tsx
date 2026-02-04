// StockAnalyzer.tsx
import React, { useState, useEffect } from 'react';
import {
    Search, TrendingUp, TrendingDown, RefreshCw, AlertTriangle,
    Activity, BarChart2, Brain, Clock, History, Target
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import aiApi from '../../services/ai';

type AiRating = 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Avoid';

interface AiAnalysis {
    meta: {
        ticker: string;
        company_name: string;
        sector?: string;
        last_price?: number;
        currency?: string;
        time_range?: string; // e.g. "6M"
    };
    core_signals: {
        ai_overall_rating: AiRating;
        technical_score: number;
        fundamental_score: number;
        news_score: number;
        risk_score: number;
        confidence: number; // 0-100
    };
    ai_rationale: {
        thesis: string;
        time_horizon: 'short_term' | 'medium_term' | 'long_term';
        bull_case: string;
        bear_case: string;
        base_case: string;
    };
    explanations: {
        technical_explain: string;
        fundamental_explain: string;
        news_explain: string;
        risk_explain: string;
    };
    history_context?: {
        previous_calls: {
            date: string;
            rating: AiRating;
            confidence: number;
            outcome?: 'outperformed' | 'underperformed' | 'neutral';
        }[];
        model_confidence_trend: { date: string; confidence: number }[];
    };
    charts?: {
        price_series: { date: string; close: number }[];
    };
    actions?: {
        entry_zone?: string;
        take_profit_zone?: string;
        stop_loss_zone?: string;
        position_size_hint?: string;
    };
    recent_news?: {
        headline: string;
        source: string;
        published_at: string;
        sentiment: 'Positive' | 'Negative' | 'Neutral';
        impact: 'High' | 'Medium' | 'Low';
        why_it_matters: string; // LLM field
    }[];
}

const StockAnalyzer: React.FC = () => {
    const [ticker, setTicker] = useState('');
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
    const [error, setError] = useState('');
    const [animate, setAnimate] = useState(false);

    useEffect(() => setAnimate(true), []);

    const analyzeStock = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!ticker) return;

        setLoading(true);
        setError('');
        setAnalysis(null);

        try {
            const response = await aiApi.post('/ai/stock-analyze', { ticker });
            if (response.data?.error) throw new Error(response.data.error);
            setAnalysis(response.data as AiAnalysis);
        } catch (err: any) {
            console.error(err);
            setError(err.message === 'Network Error'
                ? 'Connection failed. Please verify AI Service URL configuration.'
                : (err.message || 'Failed to analyze stock. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    const ratingColor = (rating?: AiRating) => {
        switch (rating) {
            case 'Strong Buy': return 'bg-emerald-600 text-white';
            case 'Buy': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40';
            case 'Sell': return 'bg-red-500/20 text-red-300 border border-red-500/40';
            case 'Avoid': return 'bg-red-700 text-white';
            default: return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/40';
        }
    };

    return (
        <div className="stock-analyzer-container"
            style={{
                minHeight: '100vh',
                background: 'var(--bg-body)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-family)',
                position: 'relative',
                overflowX: 'hidden'
            }}
        >
            <div style={{
                position: 'fixed',
                inset: 0,
                backgroundImage: 'radial-gradient(at 0% 0%, rgba(79, 70, 229, 0.05) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.05) 0, transparent 50%)',
                pointerEvents: 'none',
                zIndex: 0
            }} />

            <div className={`relative z-10 max-w-7xl mx-auto p-4 md:p-8 space-y-8 transition-all duration-1000 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                {/* Header */}
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 py-8 border-b border-slate-200/60">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-white shadow-sm rounded-2xl border border-slate-100">
                            <Brain className="w-10 h-10 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
                                QUANTUM <span style={{ color: 'var(--primary-500)' }}>AI</span> MARKET BRAIN
                            </h1>
                            <p className="text-slate-500 text-xs tracking-widest uppercase mt-2 font-bold opacity-70">
                                Predictive Intelligence • Multi-Signal Analysis
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full">
                        <Activity size={14} className="text-indigo-600" />
                        <span className="text-[10px] font-extrabold text-indigo-600 uppercase tracking-wider">
                            Real-time GPU Reasoning
                        </span>
                    </div>
                </header>

                {/* Search Terminal */}
                <div className="card" style={{ padding: '40px', background: 'var(--bg-sidebar)', color: 'white', borderRadius: '24px', overflow: 'hidden', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '100%', background: 'radial-gradient(circle at top right, rgba(79, 70, 229, 0.2), transparent)', pointerEvents: 'none' }} />

                    <form onSubmit={analyzeStock} className="relative z-10 flex flex-col md:flex-row gap-4 max-w-4xl mx-auto">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                            <input
                                type="text"
                                value={ticker}
                                onChange={e => setTicker(e.target.value.toUpperCase())}
                                placeholder="ENTER EQUITY TICKER (E.G. NVDA, AAPL)"
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    paddingLeft: '50px',
                                    paddingRight: '16px',
                                    paddingTop: '16px',
                                    paddingBottom: '16px',
                                    borderRadius: '14px',
                                    fontSize: '1.1rem',
                                    fontWeight: 700,
                                    letterSpacing: '0.05em'
                                }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !ticker}
                            className="btn btn-primary"
                            style={{
                                background: 'var(--primary-500)',
                                color: 'white',
                                padding: '0 40px',
                                height: '60px',
                                borderRadius: '14px',
                                fontWeight: 800,
                                fontSize: '0.9rem',
                                boxShadow: '0 8px 24px rgba(79, 70, 229, 0.3)'
                            }}
                        >
                            {loading ? <RefreshCw className="animate-spin" /> : <BarChart2 size={20} />}
                            <span className="ml-2">EXECUTE AI ANALYSIS</span>
                        </button>
                    </form>

                    <div className="mt-8 flex flex-wrap justify-center gap-3 relative z-10">
                        {['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'NFLX'].map(t => (
                            <button
                                key={t}
                                onClick={() => setTicker(t)}
                                style={{
                                    padding: '6px 14px',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '8px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    color: 'rgba(255,255,255,0.6)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = 'white'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error Pulse */}
                {error && (
                    <div className="bg-red-50 border border-red-100 p-5 rounded-2xl flex items-center gap-4 text-red-700 shadow-sm">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                        <span className="font-bold text-sm tracking-tight">{error}</span>
                    </div>
                )}

                {/* Analysis Result Enclave */}
                {analysis && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
                        {/* High-Level Intelligence Matrix */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* AI Signal */}
                            <div className="card" style={{ borderLeft: '4px solid var(--primary-500)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">AI Verdict</span>
                                    <Brain size={16} className="text-indigo-500 opacity-40" />
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <span className={`text-xs font-extrabold px-3 py-1 rounded-lg uppercase tracking-wider ${ratingColor(analysis.core_signals.ai_overall_rating)}`} style={{ borderRadius: '6px' }}>
                                        {analysis.core_signals.ai_overall_rating}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded">
                                        <Clock size={10} />
                                        {analysis.ai_rationale.time_horizon.replace('_', ' ').toUpperCase()}
                                    </div>
                                </div>
                                <div className="text-sm font-bold text-slate-800">
                                    {analysis.meta.company_name}
                                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">{analysis.meta.sector}</div>
                                </div>
                            </div>

                            {/* Scoring Engine */}
                            <div className="card" style={{ borderLeft: '4px solid var(--secondary-500)' }}>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">Model Confidence</span>
                                    <Target size={16} className="text-sky-500 opacity-40" />
                                </div>
                                <div className="text-4xl font-black text-slate-900">
                                    {analysis.core_signals.confidence}<span className="text-lg opacity-40">%</span>
                                </div>
                                <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full"
                                        style={{ width: `${analysis.core_signals.confidence}%` }}
                                    />
                                </div>
                            </div>

                            {/* Signal Decomposition */}
                            <div className="card col-span-1 md:col-span-1">
                                <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest block mb-4">Decomposition</span>
                                <div className="space-y-3">
                                    {[
                                        { label: 'Technical', val: analysis.core_signals.technical_score, color: 'var(--primary-500)' },
                                        { label: 'Fundamental', val: analysis.core_signals.fundamental_score, color: '#10b981' },
                                        { label: 'Sentiment', val: analysis.core_signals.news_score, color: 'var(--secondary-500)' }
                                    ].map((s, i) => (
                                        <div key={i} className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-bold">
                                                <span className="text-slate-500">{s.label}</span>
                                                <span className="text-slate-900">{s.val}%</span>
                                            </div>
                                            <div className="h-1 bg-slate-100 rounded">
                                                <div className="h-full rounded" style={{ width: `${s.val}%`, background: s.color }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Risk Assessment */}
                            <div className="card" style={{ borderLeft: '4px solid var(--danger)' }}>
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-slate-400 text-[10px] font-extrabold uppercase tracking-widest">Risk Radar</span>
                                    <AlertTriangle size={16} className="text-rose-500 opacity-40" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-slate-900">
                                        {analysis.core_signals.risk_score}
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">/ 100</span>
                                </div>
                                <p className="mt-2 text-[11px] text-slate-500 font-medium leading-relaxed">
                                    {analysis.explanations.risk_explain}
                                </p>
                            </div>
                        </div>

                        {/* Mid-Level Intelligence: Charts & Memory */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Performance Visualizer */}
                            <div className="lg:col-span-8 card" style={{ padding: '32px' }}>
                                <div className="flex justify-between items-center mb-8">
                                    <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                                        <BarChart2 className="w-5 h-5 text-indigo-500" /> Historical Performance & Inference
                                    </h3>
                                    <div className="flex gap-4 text-[10px] font-bold text-slate-400">
                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> PRICE</div>
                                        <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-sky-500"></div> AI CALLS</div>
                                    </div>
                                </div>

                                <div className="h-80 w-full">
                                    {analysis.charts?.price_series ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={analysis.charts.price_series}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                <XAxis
                                                    dataKey="date"
                                                    stroke="#94a3b8"
                                                    fontSize={10}
                                                    fontWeight={600}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    dy={10}
                                                />
                                                <YAxis
                                                    stroke="#94a3b8"
                                                    fontSize={10}
                                                    fontWeight={600}
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tickFormatter={(v) => `₹${v}`}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        borderRadius: '12px',
                                                        border: 'none',
                                                        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                                                        fontSize: '12px',
                                                        fontWeight: 700
                                                    }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="close"
                                                    stroke="var(--primary-500)"
                                                    strokeWidth={3}
                                                    dot={false}
                                                    activeDot={{ r: 6, stroke: 'white', strokeWidth: 2 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-slate-400 text-sm italic">
                                            Streaming historical data series...
                                        </div>
                                    )}
                                </div>

                                {/* AI Memory Track */}
                                {analysis.history_context && (
                                    <div className="mt-8 pt-8 border-t border-slate-100">
                                        <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                                            <History size={14} /> Neural Memory Log
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {analysis.history_context.previous_calls.slice(0, 3).map((c, i) => (
                                                <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-200 transition-all">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-[10px] font-black text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm">{c.date}</span>
                                                        <span className={`text-[9px] font-extrabold uppercase ${c.outcome === 'outperformed' ? 'text-emerald-600' : 'text-slate-400'}`}>{c.outcome || 'tracking'}</span>
                                                    </div>
                                                    <div className="text-xs font-bold text-slate-700">{c.rating}</div>
                                                    <div className="text-[10px] text-slate-400 font-medium mt-1">Accuracy: {c.confidence}%</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Reasoning Engine Details */}
                            <div className="lg:col-span-4 space-y-6">
                                {/* Investment Thesis */}
                                <div className="card" style={{ background: 'var(--primary-gradient)', color: 'white', border: 'none', padding: '32px' }}>
                                    <h3 className="text-lg font-extrabold mb-4 flex items-center gap-2">
                                        <Target className="w-5 h-5" /> Executive Thesis
                                    </h3>
                                    <p className="text-white/90 text-sm leading-relaxed font-medium">
                                        "{analysis.ai_rationale.thesis}"
                                    </p>

                                    <div className="mt-6 space-y-3">
                                        {[
                                            { label: 'Bull Strategy', text: analysis.ai_rationale.bull_case, color: 'rgba(121, 255, 183, 0.2)', iconColor: '#79ffb7' },
                                            { label: 'Bear Radar', text: analysis.ai_rationale.bear_case, color: 'rgba(255, 145, 145, 0.2)', iconColor: '#ff9191' }
                                        ].map((scenario, i) => (
                                            <div key={i} className="p-3 rounded-xl" style={{ background: scenario.color }}>
                                                <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: scenario.iconColor }}>{scenario.label}</div>
                                                <p className="text-[11px] leading-snug font-medium opacity-90">{scenario.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Analytical Deep Dive */}
                                <div className="card space-y-5">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-3">Evidence Log</h3>
                                    {[
                                        { label: 'Technicals', text: analysis.explanations.technical_explain },
                                        { label: 'Fundamentals', text: analysis.explanations.fundamental_explain },
                                        { label: 'Sentiment Flow', text: analysis.explanations.news_explain }
                                    ].map((why, i) => (
                                        <div key={i} className="space-y-1">
                                            <div className="text-[10px] font-extrabold text-slate-900">{why.label}</div>
                                            <p className="text-[11px] text-slate-500 leading-normal font-medium">{why.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Social/News Intelligence Enclave */}
                        <div className="card">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-orange-500" /> Neural Sentiment & News Ingestion
                                </h3>
                                <div className="px-3 py-1 bg-orange-50 rounded-lg text-[10px] font-black text-orange-600 uppercase tracking-wider">
                                    High Impact Only
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {analysis.recent_news && analysis.recent_news.length > 0 ? (
                                    analysis.recent_news.map((news, i) => (
                                        <div
                                            key={i}
                                            className="p-5 bg-white border border-slate-100 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all group"
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${news.sentiment === 'Positive' ? 'bg-emerald-50 text-emerald-600' :
                                                                news.sentiment === 'Negative' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'
                                                            }`}>
                                                            {news.sentiment}
                                                        </span>
                                                        <span className="text-[9px] font-extrabold text-slate-400">{news.source.toUpperCase()} • {news.published_at}</span>
                                                    </div>
                                                    <h4 className="text-slate-900 font-extrabold text-sm leading-snug group-hover:text-indigo-600 transition-colors">
                                                        {news.headline}
                                                    </h4>
                                                    <p className="mt-3 text-[11px] text-slate-500 leading-normal font-medium italic">
                                                        "Why it matters: {news.why_it_matters}"
                                                    </p>
                                                </div>
                                                <div className={`shrink-0 w-2 h-2 rounded-full mt-2 ${news.impact === 'High' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' :
                                                        news.impact === 'Medium' ? 'bg-amber-500' : 'bg-slate-300'
                                                    }`} title={`Impact Level: ${news.impact}`}></div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-2 py-12 text-center">
                                        <RefreshCw size={32} className="mx-auto text-slate-200 animate-spin mb-4" />
                                        <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">Scanning market signal relay for {analysis.meta.ticker}...</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <footer className="relative z-10 py-12 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">Cognivectra Quantum Neural Architecture // v4.2.0</p>
                <div className="flex justify-center gap-6 text-[9px] font-bold text-slate-400">
                    <span>LLM-AUGMENTED REASONING</span>
                    <span>MULTI-TENANT ISOLATED</span>
                    <span>SECURE DATA ENCLAVE</span>
                </div>
            </footer>
        </div>
    );

};

export default StockAnalyzer;
