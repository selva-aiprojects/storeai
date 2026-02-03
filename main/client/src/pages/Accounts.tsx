import { useOutletContext, useNavigate } from 'react-router-dom';
import { DollarSign, ArrowUpRight, ArrowDownRight, Printer, Plus, TrendingUp } from 'lucide-react';

const Accounts = () => {
    const { data, setModal } = useOutletContext<any>();
    const navigate = useNavigate();
    const { ledger, financialSummary } = data || {};

    const summaryData = [
        { label: 'Total Receivables', value: financialSummary?.receivables || 0, icon: ArrowUpRight, color: 'var(--accent-success)' },
        { label: 'Total Payables', value: financialSummary?.payables || 0, icon: ArrowDownRight, color: 'var(--accent-danger)' },
        { label: 'Cash On Hand', value: (financialSummary?.receivables || 0) - (financialSummary?.payables || 0), icon: DollarSign, color: 'var(--accent-primary)' },
        { label: 'Net GST Liability', value: data?.taxSummary?.netPayable || 0, icon: DollarSign, color: (data?.taxSummary?.netPayable || 0) > 0 ? 'var(--accent-danger)' : 'var(--accent-success)' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="section-header">Financial Operations</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-secondary" onClick={() => navigate('/balance-sheet')}>
                        <TrendingUp size={16} style={{ marginRight: '8px' }} /> BALANCE SHEET
                    </button>
                    <button className="btn btn-secondary" onClick={() => window.print()}>
                        <Printer size={16} style={{ marginRight: '8px' }} /> PRINT
                    </button>
                    <button className="btn btn-primary" onClick={() => setModal({ type: 'payment' })}>
                        <Plus size={16} style={{ marginRight: '8px' }} /> NEW TRANSACTION
                    </button>
                </div>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                {summaryData.map((item, idx) => (
                    <div key={idx} className="card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px' }}>
                        <div style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                            <item.icon size={24} color={item.color} />
                        </div>
                        <div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{item.label}</div>
                            <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>₹{item.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="card">
                <div className="card-header">GENERAL LEDGER</div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>TIMESTAMP</th>
                                <th>TITLE / DESCRIPTION</th>
                                <th>CATEGORY</th>
                                <th>TYPE</th>
                                <th>AMOUNT</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ledger?.map((l: any) => (
                                <tr key={l.id} className="clickable-row" onClick={() => navigate(`/ledger/${l.referenceId || l.id}`)} style={{ cursor: 'pointer' }}>
                                    <td>
                                        <div style={{ fontSize: '0.8rem' }}>{new Date(l.createdAt).toLocaleDateString()}</div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{new Date(l.createdAt).toLocaleTimeString()}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{l.title}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{l.description || 'No notes available'}</div>
                                    </td>
                                    <td><span className="badge" style={{ background: 'var(--bg-hover)' }}>{l.category}</span></td>
                                    <td>
                                        <span style={{ color: l.type === 'CREDIT' ? 'var(--accent-success)' : 'var(--accent-danger)', fontWeight: 700, fontSize: '0.75rem' }}>
                                            {l.type === 'CREDIT' ? 'DEPOSIT' : 'WITHDRAWAL'}
                                        </span>
                                    </td>
                                    <td style={{ fontWeight: 800, color: l.type === 'CREDIT' ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                                        {l.type === 'CREDIT' ? '+' : '-'}₹{l.amount.toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Accounts;
