import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, CartesianGrid, XAxis, YAxis, Bar } from 'recharts';
import api from '../services/api';

const Reports = () => {
    const { data } = useOutletContext<any>() as any;
    const { reports, sales } = data || {};
    const [predictions, setPredictions] = useState<any[]>([]);

    useEffect(() => {
        api.get('/reports/prediction').then(res => setPredictions(res.data)).catch(console.error);
    }, []);

    const COLORS = ['#818cf8', '#22d3ee', '#fbbf24', '#f43f5e', '#8b5cf6'];
    const pieData = reports?.sales?.map((s: any) => ({ name: s.team, value: s._sum?.totalAmount || 0 })) || [];

    if (!reports && !sales) return <div className="card" style={{ textAlign: 'center', padding: '100px 0' }}>Initializing Predictive Intelligence Matrix...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card" style={{ borderLeft: '4px solid var(--accent-primary)', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ padding: '8px', background: 'rgba(129, 140, 248, 0.1)', borderRadius: '8px' }}><TrendingUp size={20} color="#818cf8" /></div>
                    <div className="card-header" style={{ marginBottom: 0 }}>AI PREDICTIVE STOCK INTELLIGENCE</div>
                </div>
                <div className="table-container">
                    <table>
                        <thead><tr><th>ARTIFACT</th><th>BURN RATE</th><th>DAYS LEFT</th><th>STOCK-OUT DATE</th><th>STATUS</th><th>AI SUGGESTION</th></tr></thead>
                        <tbody>{predictions.map((p: any) => (
                            <tr key={p.id}>
                                <td><b>{p.name}</b></td>
                                <td>{p.burnRate.toFixed(1)} / day</td>
                                <td>{p.daysLeft} Days</td>
                                <td style={{ color: 'var(--text-muted)' }}>{p.stockOutDate}</td>
                                <td><span className={`badge ${p.status === 'CRITICAL' ? 'badge-danger' : (p.status === 'WARNING' ? 'badge-warning' : 'badge-success')}`}>{p.status}</span></td>
                                <td>{p.suggestedReorder > 0 ? <b style={{ color: 'var(--accent-primary)' }}>REORDER +{p.suggestedReorder}</b> : <span style={{ color: 'var(--text-muted)' }}>Optimum</span>}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
                <div className="card" style={{ minHeight: '380px' }}>
                    <div className="card-header">DEPARTMENTAL REVENUE DISTRIBUTION</div>
                    <div style={{ height: '300px', marginTop: '20px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                                    {pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#0a0f1d', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">FINANCIAL LIQUIDITY (LEDGER RECAP)</div>
                    <div style={{ height: '300px', marginTop: '20px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reports?.finance}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="type" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                                <Tooltip contentStyle={{ background: '#0a0f1d', border: '1px solid var(--border-color)', borderRadius: '8px' }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                                <Bar dataKey="_sum.amount" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
