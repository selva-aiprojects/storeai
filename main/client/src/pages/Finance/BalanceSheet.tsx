import { useState, useEffect } from 'react';
import { Shield, TrendingUp, Landmark, Calculator, ArrowRight, Wallet } from 'lucide-react';
import api from '../../services/api';

const BalanceSheet = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBalanceSheet = async () => {
            try {
                const res = await api.get('/finance/balance-sheet');
                setData(res.data);
                setLoading(false);
            } catch (e) {
                console.error(e);
                setLoading(false);
            }
        };
        fetchBalanceSheet();
    }, []);

    if (loading) return <div className="loading-state">Generating Statement of Financial Position...</div>;

    const { assets, liabilities, equity } = data || {};

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(val);
    };

    return (
        <div className="reporting-container space-y-6">
            <header className="flex justify-between items-center bg-gray-900 text-white p-6 rounded-2xl shadow-xl">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Balance Sheet</h1>
                    <p className="text-gray-400 text-sm mt-1">Consolidated Statement of Financial Position</p>
                </div>
                <div className="text-right">
                    <div className="text-[10px] uppercase font-bold tracking-widest text-indigo-400">Total Assets Value</div>
                    <div className="text-2xl font-black">{formatCurrency(assets?.total || 0)}</div>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Assets Column */}
                <div className="card border-l-4 border-l-green-500 bg-white">
                    <div className="card-header flex items-center gap-2 border-b p-4 font-bold text-gray-800 bg-gray-50/50">
                        <TrendingUp size={18} className="text-green-500" /> ASSETS
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-dashed">
                            <span className="text-sm text-gray-600">Cash & Bank</span>
                            <span className="font-mono font-bold">{formatCurrency(assets?.cash || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-dashed">
                            <span className="text-sm text-gray-600">Inventory Value</span>
                            <span className="font-mono font-bold">{formatCurrency(assets?.inventory || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-dashed">
                            <span className="text-sm text-gray-600">Accounts Receivable</span>
                            <span className="font-mono font-bold">{formatCurrency(assets?.receivables || 0)}</span>
                        </div>
                        <div className="pt-4 flex justify-between items-center font-black text-gray-900 border-t-2">
                            <span>TOTAL ASSETS</span>
                            <span>{formatCurrency(assets?.total || 0)}</span>
                        </div>
                    </div>
                </div>

                {/* Liabilities Column */}
                <div className="card border-l-4 border-l-red-500 bg-white">
                    <div className="card-header flex items-center gap-2 border-b p-4 font-bold text-gray-800 bg-gray-50/50">
                        <Wallet size={18} className="text-red-500" /> LIABILITIES
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-dashed">
                            <span className="text-sm text-gray-600">Accounts Payable</span>
                            <span className="font-mono font-bold">{formatCurrency(liabilities?.payables || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-dashed">
                            <span className="text-sm text-gray-600">GST Liability</span>
                            <span className="font-mono font-bold">{formatCurrency(liabilities?.gstPayable || 0)}</span>
                        </div>
                        <div className="pt-4 flex justify-between items-center font-black text-gray-900 border-t-2">
                            <span>TOTAL LIABILITIES</span>
                            <span>{formatCurrency(liabilities?.total || 0)}</span>
                        </div>
                    </div>
                </div>

                {/* Equity Column */}
                <div className="card border-l-4 border-l-indigo-500 bg-white">
                    <div className="card-header flex items-center gap-2 border-b p-4 font-bold text-gray-800 bg-gray-50/50">
                        <Landmark size={18} className="text-indigo-500" /> EQUITY
                    </div>
                    <div className="p-4 space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-dashed">
                            <span className="text-sm text-gray-600">Owner's Capital</span>
                            <span className="font-mono font-bold">{formatCurrency(equity?.capital || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-dashed">
                            <span className="text-sm text-gray-600">Retained Earnings</span>
                            <span className="font-mono font-bold">{formatCurrency(equity?.retainedEarnings || 0)}</span>
                        </div>
                        <div className="pt-4 flex justify-between items-center font-black text-gray-900 border-t-2">
                            <span>TOTAL EQUITY</span>
                            <span>{formatCurrency(equity?.total || 0)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-500 p-3 rounded-xl shadow-lg">
                        <Shield className="text-white" size={24} />
                    </div>
                    <div>
                        <div className="text-indigo-900 font-bold">Accounting Equation Audit</div>
                        <div className="text-indigo-600 text-sm">Assets = Liabilities + Equity Check</div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-gray-400">Variance</div>
                        <div className={`text-xl font-black ${(assets?.total - (liabilities?.total + equity?.total)) === 0 ? 'text-green-600' : 'text-amber-600'}`}>
                            {formatCurrency(assets?.total - (liabilities?.total + equity?.total))}
                        </div>
                    </div>
                    <Calculator className="text-indigo-300" size={32} />
                </div>
            </div>
        </div>
    );
};

export default BalanceSheet;
