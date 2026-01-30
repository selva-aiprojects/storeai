import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Printer } from 'lucide-react';

const ProfitLoss = () => {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPL();
    }, []);

    const fetchPL = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/v1/finance/pl');
            setData(res.data);
        } catch (error) {
            console.error("P&L fetch error", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="page-container">Loading Financial Statements...</div>;

    return (
        <div className="page-container">
            <div className="section-header">
                <div className="section-title">
                    <BarChart3 size={24} className="text-primary" />
                    <div>
                        <h1>Profit & Loss Statement</h1>
                        <p>Comprehensive summary of revenues, costs, and expenses.</p>
                    </div>
                </div>
                <button className="btn btn-secondary" onClick={() => window.print()}>
                    <Printer size={16} /> PRINT REPORT
                </button>
            </div>

            <div className="grid grid-cols-3 gap-6" style={{ marginBottom: '32px' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>TOTAL REVENUE</span>
                        <ArrowUpRight size={20} />
                    </div>
                    <h2 style={{ fontSize: '2rem', margin: '8px 0' }}>₹{data?.totalIncome.toLocaleString()}</h2>
                    <p style={{ margin: 0, opacity: 0.8, fontSize: '0.85rem' }}>Gross sales + Other income</p>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>TOTAL EXPENSES</span>
                        <ArrowDownRight size={20} />
                    </div>
                    <h2 style={{ fontSize: '2rem', margin: '8px 0' }}>₹{data?.totalExpenses.toLocaleString()}</h2>
                    <p style={{ margin: 0, opacity: 0.8, fontSize: '0.85rem' }}>COGS + Operating costs + Tax</p>
                </div>

                <div className="card" style={{ background: data?.netProfit >= 0 ? 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)' : 'linear-gradient(135deg, #92400e 0%, #b45309 100%)', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>NET PROFIT / LOSS</span>
                        {data?.netProfit >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                    </div>
                    <h2 style={{ fontSize: '2rem', margin: '8px 0' }}>₹{data?.netProfit.toLocaleString()}</h2>
                    <p style={{ margin: 0, opacity: 0.8, fontSize: '0.85rem' }}>Margin: {data?.margin.toFixed(2)}%</p>
                </div>
            </div>

            <div className="card">
                <h3 style={{ marginTop: 0 }}>Strategic Health Indicators</h3>
                <div className="grid grid-cols-2 gap-8">
                    <div>
                        <div style={{ padding: '16px', borderLeft: '4px solid #10b981', background: '#f0fdf4', borderRadius: '0 8px 8px 0', marginBottom: '16px' }}>
                            <h4 style={{ margin: '0 0 4px', color: '#166534' }}>Revenue Health</h4>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#166534' }}>Currently generating ₹{data?.totalIncome.toLocaleString()} in gross flow.</p>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: '#666' }}>
                            Your revenue stream is primarily driven by Direct Sales. Consider diversifying into high-margin accessory lines to improve the overall net margin.
                        </p>
                    </div>
                    <div>
                        <div style={{ padding: '16px', borderLeft: '4px solid #ef4444', background: '#fef2f2', borderRadius: '0 8px 8px 0', marginBottom: '16px' }}>
                            <h4 style={{ margin: '0 0 4px', color: '#991b1b' }}>Expense Burn</h4>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#991b1b' }}>Burn rate is at ₹{data?.totalExpenses.toLocaleString()} monthly.</p>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: '#666' }}>
                            Major expenses tracked in Daybook include Rent, Electricity, and Salaries. Automation of recurring costs ensures 100% visibility.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfitLoss;
