import { useState, useEffect } from 'react';
import { Shield, TrendingUp, Landmark, Calculator, Wallet } from 'lucide-react';
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
            {/* Unified Finance Module Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-6 rounded-2xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Landmark size={120} />
                </div>
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight">Balance Sheet</h1>
                        <p className="text-violet-100 text-sm mt-1 font-medium">Consolidated Statement of Financial Position</p>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] uppercase font-bold tracking-widest text-violet-200">Total Assets Value</div>
                        <div className="text-3xl font-black">{formatCurrency(assets?.total || 0)}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Assets Column (Green/Success Theme within Finance Context) */}
                <div className="card border-t-4 border-t-emerald-500 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-emerald-50/30">
                        <div className="flex items-center gap-2 font-bold text-gray-800">
                            <TrendingUp size={18} className="text-emerald-500" />
                            <span>ASSETS</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">Current & Fixed</span>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                            <span className="text-sm font-medium text-gray-500">Cash & Bank</span>
                            <span className="font-mono font-bold text-gray-900">{formatCurrency(assets?.cash || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                            <span className="text-sm font-medium text-gray-500">Inventory Value</span>
                            <span className="font-mono font-bold text-gray-900">{formatCurrency(assets?.inventory || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                            <span className="text-sm font-medium text-gray-500">Accounts Receivable</span>
                            <span className="font-mono font-bold text-gray-900">{formatCurrency(assets?.receivables || 0)}</span>
                        </div>
                        <div className="pt-4 flex justify-between items-center text-gray-900 border-t border-gray-100 mt-2">
                            <span className="text-sm font-bold uppercase text-gray-600">Total Assets</span>
                            <span className="font-black text-lg text-emerald-600">{formatCurrency(assets?.total || 0)}</span>
                        </div>
                    </div>
                </div>

                {/* Liabilities Column (Red/Danger Theme within Finance Context) */}
                <div className="card border-t-4 border-t-rose-500 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-rose-50/30">
                        <div className="flex items-center gap-2 font-bold text-gray-800">
                            <Wallet size={18} className="text-rose-500" />
                            <span>LIABILITIES</span>
                        </div>
                        <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-1 rounded-full">Obligations</span>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                            <span className="text-sm font-medium text-gray-500">Accounts Payable</span>
                            <span className="font-mono font-bold text-gray-900">{formatCurrency(liabilities?.payables || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                            <span className="text-sm font-medium text-gray-500">GST Liability</span>
                            <span className="font-mono font-bold text-gray-900">{formatCurrency(liabilities?.gstPayable || 0)}</span>
                        </div>
                        <div className="pt-4 flex justify-between items-center text-gray-900 border-t border-gray-100 mt-2">
                            <span className="text-sm font-bold uppercase text-gray-600">Total Liabilities</span>
                            <span className="font-black text-lg text-rose-600">{formatCurrency(liabilities?.total || 0)}</span>
                        </div>
                    </div>
                </div>

                {/* Equity Column (Finance/Violet Theme) */}
                <div className="card border-t-4 border-t-violet-500 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-violet-50/30">
                        <div className="flex items-center gap-2 font-bold text-gray-800">
                            <Landmark size={18} className="text-violet-500" />
                            <span>EQUITY</span>
                        </div>
                        <span className="text-xs font-bold text-violet-600 bg-violet-100 px-2 py-1 rounded-full">Ownership</span>
                    </div>
                    <div className="p-5 space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                            <span className="text-sm font-medium text-gray-500">Owner's Capital</span>
                            <span className="font-mono font-bold text-gray-900">{formatCurrency(equity?.capital || 0)}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                            <span className="text-sm font-medium text-gray-500">Retained Earnings</span>
                            <span className="font-mono font-bold text-gray-900">{formatCurrency(equity?.retainedEarnings || 0)}</span>
                        </div>
                        <div className="pt-4 flex justify-between items-center text-gray-900 border-t border-gray-100 mt-2">
                            <span className="text-sm font-bold uppercase text-gray-600">Total Equity</span>
                            <span className="font-black text-lg text-violet-600">{formatCurrency(equity?.total || 0)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Audit Section - Finance Theme */}
            <div className="bg-white border border-violet-100 p-6 rounded-2xl flex items-center justify-between shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-violet-50/50 opacity-50 z-0"></div>
                <div className="relative z-10 flex items-center gap-4">
                    <div className="bg-violet-600 p-3 rounded-xl shadow-lg shadow-violet-200">
                        <Shield className="text-white" size={24} />
                    </div>
                    <div>
                        <div className="text-violet-900 font-bold text-lg">Accounting Equation Audit</div>
                        <div className="text-violet-600 text-sm font-medium">Assets = Liabilities + Equity Check</div>
                    </div>
                </div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="text-right">
                        <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">Variance Status</div>
                        <div className={`text-2xl font-black ${(assets?.total - (liabilities?.total + equity?.total)) === 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatCurrency(assets?.total - (liabilities?.total + equity?.total))}
                        </div>
                    </div>
                    <div className="bg-white p-2 rounded-lg shadow-sm border border-violet-100">
                        <Calculator className="text-violet-400" size={32} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BalanceSheet;
