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
            setError(err.message || 'Failed to analyze stock. Please try again.');
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
                background: 'linear-gradient(135deg, #020617 0%, #020617 40%, #111827 100%)',
                color: '#f8fafc',
                fontFamily: 'var(--font-family)'
            }}
        >
            <div className="grid-bg fixed inset-0 z-0 pointer-events-none" />

            <div className={`relative z-10 max-w-7xl mx-auto p-6 space-y-8 transition-all duration-1000 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                }`}>
                {/* Header */}
                <header className="flex justify-between items-center py-6 border-b border-gray-800/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-900/30 rounded-xl border border-indigo-500/30">
                            <Brain className="w-8 h-8 text-indigo-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                                QUANTUM AI MARKET BRAIN
                            </h1>
                            <p className="text-gray-500 text-xs tracking-widest uppercase mt-1">
                                Multi‑Signal AI Stock Intelligence
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-4 py-2 bg-sky-900/20 border border-sky-700/30 rounded-full">
                        <Activity size={14} className="text-sky-400" />
                        <span className="text-xs font-semibold text-sky-300 uppercase">
                            Live AI Reasoning
                        </span>
                    </div>
                </header>

                {/* Search */}
                <div className="glass-panel p-8 rounded-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    <form onSubmit={analyzeStock} className="relative z-10 flex gap-4 max-w-3xl mx-auto">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={ticker}
                                onChange={e => setTicker(e.target.value.toUpperCase())}
                                placeholder="ENTER TICKER (AAPL, TSLA, NVDA...)"
                                className="w-full bg-white border border-indigo-200 text-blue-900 pl-12 pr-4 py-4 rounded-xl focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/50 text-lg tracking-wider transition-all placeholder:text-blue-300 font-bold shadow-inner"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading || !ticker}
                            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-bold tracking-wide hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                        >
                            {loading ? <RefreshCw className="animate-spin" /> : <BarChart2 />}
                            ANALYZE WITH AI
                        </button>
                    </form>

                    <div className="mt-6 flex justify-center gap-3">
                        {['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA'].map(t => (
                            <button
                                key={t}
                                onClick={() => setTicker(t)}
                                className="px-3 py-1 bg-gray-800/50 hover:bg-indigo-900/30 border border-gray-700 hover:border-indigo-500/50 rounded text-xs text-gray-400 hover:text-indigo-300 transition-all"
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl flex items-center gap-3 text-red-200">
                        <AlertTriangle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Main AI result */}
                {analysis && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-700">
                        {/* AI Decision Console */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* AI Rating */}
                            <div className={`glass-panel p-6 rounded-xl border-l-4 border-indigo-500 relative overflow-hidden`}>
                                <span className="text-indigo-300 text-xs uppercase block mb-2 font-bold">
                                    AI Decision
                                </span>
                                <div className="flex items-center gap-3">
                                    <span className={`text-sm font-semibold px-3 py-1 rounded-full ${ratingColor(analysis.core_signals.ai_overall_rating)}`}>
                                        {analysis.core_signals.ai_overall_rating}
                                    </span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock size={12} />
                                        {analysis.ai_rationale.time_horizon.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="mt-3 text-xs text-gray-400">
                                    {analysis.meta.company_name} • {analysis.meta.sector}
                                </div>
                                <div className="absolute right-2 top-2 opacity-10">
                                    <Brain size={40} />
                                </div>
                            </div>

                            {/* Confidence */}
                            <div className="glass-panel p-6 rounded-xl border-l-4 border-purple-500">
                                <span className="text-purple-300 text-xs uppercase block mb-2 font-bold">
                                    Model Confidence
                                </span>
                                <div className="text-4xl font-bold text-white">
                                    {analysis.core_signals.confidence}%
                                </div>
                                <div className="mt-2 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full"
                                        style={{ width: `${analysis.core_signals.confidence}%` }}
                                    />
                                </div>
                                <p className="mt-2 text-xs text-gray-400">
                                    Combines technicals, fundamentals, and news.
                                </p>
                            </div>

                            {/* Multi-signal */}
                            <div className="glass-panel p-6 rounded-xl border-l-4 border-sky-500">
                                <span className="text-sky-300 text-xs uppercase block mb-2 font-bold">
                                    Signal Mix
                                </span>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Technical</span>
                                        <span className="text-white font-semibold">
                                            {analysis.core_signals.technical_score}/100
                                        </span>
                                    </div>
                                    <div className="h-1 bg-gray-800 rounded">
                                        <div
                                            className="h-full bg-sky-500 rounded"
                                            style={{ width: `${analysis.core_signals.technical_score}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between mt-1">
                                        <span className="text-gray-400">Fundamental</span>
                                        <span className="text-white font-semibold">
                                            {analysis.core_signals.fundamental_score}/100
                                        </span>
                                    </div>
                                    <div className="h-1 bg-gray-800 rounded">
                                        <div
                                            className="h-full bg-emerald-500 rounded"
                                            style={{ width: `${analysis.core_signals.fundamental_score}%` }}
                                        />
                                    </div>

                                    <div className="flex justify-between mt-1">
                                        <span className="text-gray-400">News / Flow</span>
                                        <span className="text-white font-semibold">
                                            {analysis.core_signals.news_score}/100
                                        </span>
                                    </div>
                                    <div className="h-1 bg-gray-800 rounded">
                                        <div
                                            className="h-full bg-amber-500 rounded"
                                            style={{ width: `${analysis.core_signals.news_score}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Risk */}
                            <div className="glass-panel p-6 rounded-xl border-l-4 border-red-500">
                                <span className="text-red-300 text-xs uppercase block mb-2 font-bold">
                                    Risk Radar
                                </span>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-bold text-white">
                                        {analysis.core_signals.risk_score}/100
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        Higher = more risk
                                    </span>
                                </div>
                                <p className="mt-2 text-xs text-gray-400">
                                    {analysis.explanations.risk_explain}
                                </p>
                            </div>
                        </div>

                        {/* Price & AI memory */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            {/* Left: chart + history */}
                            <div className="lg:col-span-7 space-y-4">
                                {/* Price chart */}
                                {analysis.charts?.price_series && (
                                    <div className="glass-panel p-6 rounded-xl">
                                        <h3 className="text-lg font-bold mb-4 text-cyan-300 flex items-center gap-2">
                                            <BarChart2 className="w-5 h-5" /> Price & AI Calls
                                        </h3>
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={analysis.charts.price_series}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                                    <XAxis dataKey="date" stroke="#6b7280" />
                                                    <YAxis stroke="#6b7280" />
                                                    <Tooltip />
                                                    <Line type="monotone" dataKey="close" stroke="#6366f1" dot={false} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                )}

                                {/* AI Memory */}
                                {analysis.history_context && (
                                    <div className="glass-panel p-6 rounded-xl">
                                        <h3 className="text-lg font-bold mb-4 text-purple-300 flex items-center gap-2">
                                            <History className="w-5 h-5" /> AI Memory for {analysis.meta.ticker}
                                        </h3>
                                        <div className="space-y-3 text-xs">
                                            {analysis.history_context.previous_calls.slice(0, 3).map((c, i) => (
                                                <div key={i} className="flex justify-between items-center bg-white/5 p-3 rounded-lg">
                                                    <div>
                                                        <div className="text-gray-300 font-semibold">
                                                            {c.date} • {c.rating}
                                                        </div>
                                                        <div className="text-gray-500">
                                                            Confidence: {c.confidence}% • Outcome: {c.outcome || 'pending'}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right: AI rationale + scenarios */}
                            <div className="lg:col-span-5 space-y-4">
                                {/* Executive thesis */}
                                <div className="glass-panel p-6 rounded-xl border border-indigo-500/30">
                                    <h3 className="text-lg font-bold mb-2 text-white flex items-center gap-2">
                                        <Target className="w-5 h-5 text-emerald-400" /> AI Investment Thesis
                                    </h3>
                                    <p className="text-gray-300 text-sm mb-3">
                                        {analysis.ai_rationale.thesis}
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                        <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-lg p-3">
                                            <div className="font-bold text-emerald-300 mb-1">Bull Case</div>
                                            <p className="text-gray-300 leading-snug">{analysis.ai_rationale.bull_case}</p>
                                        </div>
                                        <div className="bg-sky-500/5 border border-sky-500/30 rounded-lg p-3">
                                            <div className="font-bold text-sky-300 mb-1">Base Case</div>
                                            <p className="text-gray-300 leading-snug">{analysis.ai_rationale.base_case}</p>
                                        </div>
                                        <div className="bg-red-500/5 border border-red-500/30 rounded-lg p-3">
                                            <div className="font-bold text-red-300 mb-1">Bear Case</div>
                                            <p className="text-gray-300 leading-snug">{analysis.ai_rationale.bear_case}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Technical / News explanations */}
                                <div className="glass-panel p-6 rounded-xl">
                                    <h3 className="text-lg font-bold mb-4 text-blue-300">
                                        Why the AI thinks this way
                                    </h3>
                                    <div className="space-y-3 text-xs text-gray-300">
                                        <div>
                                            <div className="font-semibold text-gray-200 mb-1">Technicals</div>
                                            <p>{analysis.explanations.technical_explain}</p>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-200 mb-1">Fundamentals</div>
                                            <p>{analysis.explanations.fundamental_explain}</p>
                                        </div>
                                        <div>
                                            <div className="font-semibold text-gray-200 mb-1">News & Flow</div>
                                            <p>{analysis.explanations.news_explain}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* News Intelligence */}
                        <div className="glass-panel p-6 rounded-xl">
                            <h3 className="text-lg font-bold mb-4 text-orange-300 flex items-center gap-2">
                                <Activity className="w-5 h-5" /> AI‑Filtered Market News
                            </h3>
                            <div className="space-y-3">
                                {analysis.recent_news && analysis.recent_news.length > 0 ? (
                                    analysis.recent_news.map((news, i) => (
                                        <div
                                            key={i}
                                            className="bg-white/5 p-4 rounded-lg border-l-2 border-white/10 hover:bg-white/10 transition-colors"
                                        >
                                            <div className="flex justify-between items-start gap-3">
                                                <div>
                                                    <h4 className="text-white font-medium text-sm">
                                                        {news.headline}
                                                    </h4>
                                                    <p className="mt-1 text-xs text-gray-300">
                                                        Why it matters: {news.why_it_matters}
                                                    </p>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 text-[10px]">
                                                    <span className={`uppercase px-2 py-0.5 rounded font-bold ${news.sentiment === 'Positive'
                                                        ? 'bg-green-900/50 text-green-400'
                                                        : news.sentiment === 'Negative'
                                                            ? 'bg-red-900/50 text-red-400'
                                                            : 'bg-gray-700 text-gray-400'
                                                        }`}>
                                                        {news.sentiment}
                                                    </span>
                                                    <span className="px-2 py-0.5 rounded bg-sky-900/40 text-sky-300 font-semibold">
                                                        Impact: {news.impact}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center mt-2 text-[10px] text-gray-500">
                                                <span>Source: {news.source}</span>
                                                <span>{news.published_at}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-gray-500 text-center py-4 text-sm font-medium">
                                        Scanning news and flows for {analysis.meta.ticker}...
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StockAnalyzer;
