import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { UserPlus, Wallet, Calendar, Star, Building, CheckCircle2 } from 'lucide-react';

const HR = () => {
    const { data, setModal, refreshData } = useOutletContext<any>();
    const { employees, payrolls, departments } = data || {};
    const [activeTab, setActiveTab] = useState('employees');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="section-header">Human Resources & Payroll</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn btn-secondary" onClick={() => setModal({ type: 'employees' })}>
                        <UserPlus size={16} style={{ marginRight: '8px' }} /> ADD EMPLOYEE
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: '0' }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)' }}>
                    <button
                        onClick={() => setActiveTab('employees')}
                        style={{
                            padding: '16px 24px',
                            background: 'none',
                            border: 'none',
                            color: activeTab === 'employees' ? 'var(--accent-primary)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'employees' ? '2px solid var(--accent-primary)' : 'none',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        EMPLOYEE ROSTER
                    </button>
                    <button
                        onClick={() => setActiveTab('payroll')}
                        style={{
                            padding: '16px 24px',
                            background: 'none',
                            border: 'none',
                            color: activeTab === 'payroll' ? 'var(--accent-primary)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'payroll' ? '2px solid var(--accent-primary)' : 'none',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        PAYROLL CLERK
                    </button>
                </div>

                <div style={{ padding: '20px' }}>
                    {activeTab === 'employees' ? (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>EMPLOYEE</th>
                                        <th>DEPARTMENT</th>
                                        <th>DESIGNATION</th>
                                        <th>PERFORMANCE</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {employees?.filter((e: any) => !e.isDeleted).map((e: any) => (
                                        <tr key={e.id}>
                                            <td>
                                                <div style={{ fontWeight: 700 }}>{e.firstName} {e.lastName}</div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{e.employeeId}</div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                    <Building size={14} color="var(--text-muted)" />
                                                    {e.department?.name}
                                                </div>
                                            </td>
                                            <td>{e.designation}</td>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Star size={14} fill={e.performanceRating ? "#fbbf24" : "none"} color={e.performanceRating ? "#fbbf24" : "var(--text-muted)"} />
                                                    <span>{e.performanceRating || 'Not Rated'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.7rem' }} onClick={() => setModal({ type: 'payroll', metadata: e })}>
                                                    <Wallet size={14} style={{ marginRight: '6px' }} /> PROCESS PAY
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="table-container">
                            {/* Summary Card for 'So Far Spent' */}
                            <div style={{ padding: '20px', background: 'var(--bg-hover)', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ background: 'rgba(5, 150, 105, 0.2)', padding: '12px', borderRadius: '50%' }}>
                                    <Wallet size={24} color="var(--accent-success)" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL DISBURSED (YTD)</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                                        ${payrolls?.reduce((acc: number, p: any) => acc + p.totalPayout, 0).toFixed(2)}
                                    </div>
                                </div>
                            </div>
                            <table>
                                <thead>
                                    <tr>
                                        <th>REFERENCE</th>
                                        <th>EMPLOYEE</th>
                                        <th>PERIOD</th>
                                        <th>TOTAL PAYOUT</th>
                                        <th>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payrolls?.map((p: any) => (
                                        <tr key={p.id}>
                                            <td>
                                                <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>PAY-REC-{p.id.slice(0, 6)}</div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(p.paymentDate).toLocaleDateString()}</div>
                                            </td>
                                            <td>{p.employee?.firstName} {p.employee?.lastName}</td>
                                            <td>{p.month}</td>
                                            <td style={{ fontWeight: 700, color: 'var(--accent-success)' }}>${p.totalPayout.toFixed(2)}</td>
                                            <td>
                                                <span className="badge badge-success">
                                                    <CheckCircle2 size={12} style={{ marginRight: '4px' }} /> {p.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HR;
