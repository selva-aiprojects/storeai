import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { History, Search, Download, Calendar, Filter, CheckCircle, Clock } from 'lucide-react';

const Daybook = () => {
    const [entries, setEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        fetchDaybook();
    }, []);

    const fetchDaybook = async () => {
        try {
            setLoading(true);
            const res = await api.get('/finance/daybook', {
                params: {
                    startDate: dateRange.start,
                    endDate: dateRange.end
                }
            });
            setEntries(res.data);
        } catch (error) {
            console.error("Daybook fetch error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleProcessRecurring = async () => {
        try {
            await api.post('/finance/recurring-auto');
            fetchDaybook();
            alert('Recurring expenses processed for current month.');
        } catch (error) {
            alert('Failed to process recurring expenses');
        }
    };

    return (
        <div className="page-container">
            <div className="section-header">
                <div className="section-title">
                    <History size={24} className="text-primary" />
                    <div>
                        <h1>Daybook [Daily Transactions]</h1>
                        <p>Real-time log of all financial inflows and outflows.</p>
                    </div>
                </div>
                <div className="section-actions">
                    <button className="btn btn-secondary" onClick={handleProcessRecurring}>
                        <Clock size={16} /> AUTO-POST MONTHLY COSTS
                    </button>
                    <button className="btn btn-primary">
                        <Download size={16} /> EXPORT PDF
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                        <label className="form-label">Date Range</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="date"
                                className="form-input"
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            />
                            <input
                                type="date"
                                className="form-input"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            />
                        </div>
                    </div>
                    <button className="btn btn-secondary" onClick={fetchDaybook}>
                        <Search size={16} /> FILTER
                    </button>
                </div>
            </div>

            <div className="card no-padding">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Date & Time</th>
                            <th>Description</th>
                            <th>Type</th>
                            <th className="text-right">Debit [In]</th>
                            <th className="text-right">Credit [Out]</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="text-center">Loading registry...</td></tr>
                        ) : entries.length === 0 ? (
                            <tr><td colSpan={6} className="text-center">No transactions recorded for this period.</td></tr>
                        ) : (
                            entries.map((entry) => (
                                <tr key={entry.id}>
                                    <td>{new Date(entry.date).toLocaleString()}</td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{entry.description}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>ID: {entry.id.substring(0, 8)}</div>
                                    </td>
                                    <td>
                                        <span className={`badge ${entry.type === 'INCOME' ? 'badge-success' : 'badge-danger'}`}>
                                            {entry.type}
                                        </span>
                                    </td>
                                    <td className="text-right text-success" style={{ fontWeight: 700 }}>
                                        {entry.debit > 0 ? `₹${entry.debit.toFixed(2)}` : '-'}
                                    </td>
                                    <td className="text-right text-danger" style={{ fontWeight: 700 }}>
                                        {entry.credit > 0 ? `₹${entry.credit.toFixed(2)}` : '-'}
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
                                            {entry.status === 'APPROVED' ? (
                                                <><CheckCircle size={14} className="text-success" /> POSTED</>
                                            ) : (
                                                <><Clock size={14} className="text-warning" /> PENDING</>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {!loading && entries.length > 0 && (
                        <tfoot>
                            <tr style={{ background: 'var(--bg-body)', fontWeight: 800 }}>
                                <td colSpan={3} className="text-right">PERIOD TOTALS</td>
                                <td className="text-right text-success">
                                    ₹{entries.reduce((sum, e) => sum + (e.debit || 0), 0).toFixed(2)}
                                </td>
                                <td className="text-right text-danger">
                                    ₹{entries.reduce((sum, e) => sum + (e.credit || 0), 0).toFixed(2)}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>
        </div>
    );
};

export default Daybook;
