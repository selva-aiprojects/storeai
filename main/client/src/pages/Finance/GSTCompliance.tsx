import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FileText, Calculator, Landmark, ShieldCheck, ArrowRight } from 'lucide-react';

const GSTCompliance = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTax();
    }, []);

    const fetchTax = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/v1/accounts/tax-summary');
            setStats(res.data);
        } catch (error) {
            console.error("Tax fetch error", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="page-container">Calculating tax liabilities...</div>;

    return (
        <div className="page-container">
            <div className="section-header">
                <div className="section-title">
                    <FileText size={24} className="text-primary" />
                    <div>
                        <h1>GST Compliance Dashboard</h1>
                        <p>Track Input Tax Credit (ITC) vs Output Tax Liability.</p>
                    </div>
                </div>
                <div className="section-actions">
                    <button className="btn btn-primary" onClick={() => alert('Redirecting to GST Portal Simulation...')}>
                        <Landmark size={16} /> PAY TO GST PORTAL
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-8" style={{ marginBottom: '32px' }}>
                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <Calculator size={16} /> OUTPUT GST (SALES)
                    </div>
                    <h2 style={{ fontSize: '2.5rem', margin: '12px 0', color: '#dc2626' }}>₹{stats.gstOutput.toLocaleString()}</h2>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>Tax collected from customers (Liability)</p>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        <ShieldCheck size={16} /> INPUT GST (PURCHASES)
                    </div>
                    <h2 style={{ fontSize: '2.5rem', margin: '12px 0', color: '#059669' }}>₹{stats.gstInput.toLocaleString()}</h2>
                    <p style={{ margin: 0, fontSize: '0.85rem' }}>Input Tax Credit (ITC) receivable</p>
                </div>
            </div>

            <div className="card" style={{ border: '2px solid var(--primary-500)', background: 'linear-gradient(to right, #f5f3ff, #ffffff)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: '0 0 8px' }}>Net GST Payable</h3>
                        <p style={{ margin: 0, color: '#666' }}>After netting off Input Tax Credit</p>
                    </div>
                    <div className="text-right">
                        <div style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--primary-600)' }}>₹{stats.netPayable.toLocaleString()}</div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', fontWeight: 600, color: stats.status === 'PAYABLE' ? '#dc2626' : '#059669' }}>
                            {stats.status} <ArrowRight size={16} />
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ marginTop: '24px', padding: '20px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px' }}>
                <h4 style={{ margin: '0 0 8px', color: '#92400e' }}>GST Compliance Note</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#92400e', lineHeight: 1.5 }}>
                    The system automatically calculates SGST/CGST/IGST breakdown at the product level.
                    Ensure all GSTR-1 and GSTR-3B filings are reconciled with the <strong>Daybook</strong> entries before final payment.
                </p>
            </div>
        </div>
    );
};

export default GSTCompliance;
