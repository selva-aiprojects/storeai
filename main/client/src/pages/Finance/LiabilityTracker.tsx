import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Receipt, AlertCircle, Clock, CheckCircle2, TrendingDown } from 'lucide-react';

const LiabilityTracker = () => {
    const [aging, setAging] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAging();
    }, []);

    const fetchAging = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/v1/finance/aging');
            setAging(res.data);
        } catch (error) {
            console.error("Aging fetch error", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="page-container">Analyzing payment aging...</div>;
    if (!aging) return <div className="page-container text-red-500">Failed to load aging data.</div>;

    const totalLiability = Object.values(aging || {}).reduce((a: any, b: any) => a + b, 0) as number;

    return (
        <div className="page-container">
            <div className="section-header">
                <div className="section-title">
                    <Receipt size={24} className="text-primary" />
                    <div>
                        <h1>Liability Tracker [A/R Aging]</h1>
                        <p>Monitor unpaid sales and credit risk (Max 50-day window).</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-6" style={{ marginBottom: '32px' }}>
                <div className="card">
                    <div style={{ color: '#666', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>1-10 DAYS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, margin: '8px 0', color: '#059669' }}>₹{aging['1-10 days']?.toLocaleString()}</div>
                    <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#10b981', width: `${(aging['1-10 days'] / totalLiability) * 100}%` }}></div>
                    </div>
                </div>
                <div className="card">
                    <div style={{ color: '#666', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>11-30 DAYS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, margin: '8px 0', color: '#d97706' }}>₹{aging['11-30 days']?.toLocaleString()}</div>
                    <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#f59e0b', width: `${(aging['11-30 days'] / totalLiability) * 100}%` }}></div>
                    </div>
                </div>
                <div className="card">
                    <div style={{ color: '#666', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>31-50 DAYS</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, margin: '8px 0', color: '#dc2626' }}>₹{aging['31-50 days']?.toLocaleString()}</div>
                    <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#ef4444', width: `${(aging['31-50 days'] / totalLiability) * 100}%` }}></div>
                    </div>
                </div>
                <div className="card" style={{ background: '#fef2f2', border: '1px solid #fee2e2' }}>
                    <div style={{ color: '#991b1b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>CRITICAL OVERDUE</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, margin: '8px 0', color: '#991b1b' }}>₹{aging['overdue']?.toLocaleString()}</div>
                    <p style={{ fontSize: '0.7rem', color: '#991b1b', margin: 0 }}>Action Required: Immediate Collection</p>
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <AlertCircle className="text-danger" />
                    <h3 style={{ margin: 0 }}>Strategic Liability Policy</h3>
                </div>
                <div style={{ lineHeight: 1.6 }}>
                    <p>Current Credit Policy: <strong>MAX 50 DAYS</strong></p>
                    <p>
                        Total Outstanding Receivables: <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--primary-500)' }}>₹{totalLiability.toLocaleString()}</span>
                    </p>
                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569' }}>
                            <TrendingDown size={14} style={{ marginRight: '4px' }} />
                            Your aging bucket for 31-50 days has reached <span style={{ fontWeight: 700 }}>₹{aging['31-50 days']?.toLocaleString()}</span>.
                            Automated reminders will be sent to these customers via AI Intelligence.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LiabilityTracker;
