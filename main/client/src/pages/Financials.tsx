import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { TrendingUp, Wallet, ShieldCheck, BarChart3, PieChart, Activity } from 'lucide-react';
import api from '../services/api';

const Financials = () => {
    const { user } = useOutletContext<any>() as any;
    const [finData, setFinData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFinData = async () => {
            try {
                const res = await api.get('/reports/financial-performance');
                setFinData(res.data);
                setLoading(false);
            } catch (e) {
                console.error(e);
                setLoading(false);
            }
        };
        fetchFinData();
    }, []);

    if (loading) return <div className="loading-state">Initializing Financial Core...</div>;

    const { summary, monthlyData } = finData || {};

    return (
        <div className="reporting-container">
            <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(5, 150, 105, 0.1)' }}><TrendingUp color="var(--accent-success)" /></div>
                    <div className="stat-value">${summary?.totalRevenue?.toLocaleString()}</div>
                    <div className="stat-label">GROSS REVENUE</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(129, 140, 248, 0.1)' }}><ShieldCheck color="var(--accent-primary)" /></div>
                    <div className="stat-value">${summary?.totalGst?.toLocaleString()}</div>
                    <div className="stat-label">GST COLLECTED</div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.1)' }}><Wallet color="var(--accent-danger)" /></div>
                    <div className="stat-value">${summary?.incomeTax?.toLocaleString()}</div>
                    <div className="stat-label">INCOME TAX (EST.)</div>
                </div>
                <div className="stat-card" style={{ background: 'var(--bg-hover)', border: '1px solid var(--accent-secondary)' }}>
                    <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.1)' }}><Activity color="var(--warning-color)" /></div>
                    <div className="stat-value">${summary?.expenditureForecast?.toLocaleString()}</div>
                    <div className="stat-label">EXP. FORECAST (NEXT MO)</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
                {/* Monthly Performance Table */}
                <div className="card">
                    <div className="card-header"><BarChart3 size={16} /> MONTHLY FISCAL PERFORMANCE</div>
                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>MONTH</th>
                                    <th>SALES</th>
                                    <th>PROCUREMENT</th>
                                    <th>OPEX (PAYROLL)</th>
                                    <th>TAX</th>
                                    <th>NET PROFIT</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthlyData?.map((m: any) => (
                                    <tr key={m.month}>
                                        <td>{new Date(0, m.month - 1).toLocaleString('default', { month: 'short' })}</td>
                                        <td>${m.sales?.toLocaleString()}</td>
                                        <td>${m.procurement?.toLocaleString()}</td>
                                        <td>${m.expenses?.toLocaleString()}</td>
                                        <td>${m.gstCollected?.toLocaleString()}</td>
                                        <td style={{ color: (m.sales - m.procurement - m.expenses) > 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                                            <b>${(m.sales - m.procurement - m.expenses).toLocaleString()}</b>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary & Insights */}
                <div className="card" style={{ background: 'linear-gradient(145deg, var(--bg-card), rgba(129, 140, 248, 0.05))' }}>
                    <div className="card-header"><PieChart size={16} /> FINANCIAL BREAKDOWN</div>
                    <div style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                                <span style={{ opacity: 0.6 }}>Total Procurement Cost</span>
                                <b>${summary?.totalExpenses?.toLocaleString()}</b>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                                <span style={{ opacity: 0.6 }}>Operating Profit</span>
                                <b style={{ color: 'var(--accent-success)' }}>${summary?.profit?.toLocaleString()}</b>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                                <span style={{ opacity: 0.6 }}>Corporate Tax Rate</span>
                                <b>25% (Standard)</b>
                            </div>

                            <div style={{
                                marginTop: '10px',
                                padding: '15px',
                                background: 'rgba(245, 158, 11, 0.05)',
                                borderRadius: '12px',
                                border: '1px dashed var(--warning-color)'
                            }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--warning-color)', fontWeight: 800, marginBottom: '5px' }}>AI FISCAL INSIGHT</div>
                                <div style={{ fontSize: '0.8rem', opacity: 0.8, lineHeight: 1.5 }}>
                                    Based on current trends, your expenditure is forecast to increase by 10% next month.
                                    We recommend ordering more of your high-demand items to keep your business running smoothly.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Financials;
