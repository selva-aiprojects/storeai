import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { UserPlus, Wallet, Calendar, Star, Building, CheckCircle2 } from 'lucide-react';
import { getDailyAttendance, markDailyAttendance } from '../services/api';

const HR = () => {
    const { data, setModal, refreshData } = useOutletContext<any>();
    const { employees, payrolls, departments } = data || {};
    const [activeTab, setActiveTab] = useState('employees');

    // Attendance State
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [dailyAttendance, setDailyAttendance] = useState<any[]>([]);
    const [loadingAttendance, setLoadingAttendance] = useState(false);

    const fetchAttendance = async () => {
        setLoadingAttendance(true);
        try {
            const res = await getDailyAttendance(attendanceDate);
            // Merge roster with fetched attendance
            // If no record, default to ABSENT or just empty
            const roster = employees?.filter((e: any) => !e.isDeleted).map((e: any) => {
                const existing = res.data.find((a: any) => a.employeeId === e.id);
                return {
                    employeeId: e.id,
                    firstName: e.firstName,
                    lastName: e.lastName,
                    department: e.department?.name,
                    status: existing?.status || 'ABSENT', // Default to Absent if not marked
                    checkIn: existing?.checkIn || null,
                    checkOut: existing?.checkOut || null
                };
            });
            setDailyAttendance(roster || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingAttendance(false);
        }
    };

    const handleBulkAttendanceSave = async () => {
        try {
            await markDailyAttendance({
                date: attendanceDate,
                records: dailyAttendance.map(d => ({
                    employeeId: d.employeeId,
                    status: d.status,
                    checkIn: d.checkIn,
                    checkOut: d.checkOut
                }))
            });
            alert('Attendance Registry Updated!');
            refreshData(); // Refresh global data if needed
        } catch (err) {
            alert('Failed to save attendance.');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="section-header">Human Resources & Payroll</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {activeTab === 'payroll' && (
                        <button className="btn btn-primary" onClick={() => setModal({ type: 'generate_all_payroll' })}>
                            <Wallet size={16} style={{ marginRight: '8px' }} /> GENERATE ALL PAYROLL
                        </button>
                    )}
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
                    <button
                        onClick={() => { setActiveTab('attendance'); fetchAttendance(); }}
                        style={{
                            padding: '16px 24px',
                            background: 'none',
                            border: 'none',
                            color: activeTab === 'attendance' ? 'var(--accent-primary)' : 'var(--text-muted)',
                            borderBottom: activeTab === 'attendance' ? '2px solid var(--accent-primary)' : 'none',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}
                    >
                        DAILY ATTENDANCE
                    </button>
                    {activeTab === 'attendance' && (
                        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px' }}>
                            <input type="date" value={attendanceDate} onChange={e => { setAttendanceDate(e.target.value); setTimeout(fetchAttendance, 100); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)' }} />
                            <button className="btn btn-primary" onClick={handleBulkAttendanceSave} style={{ fontSize: '0.8rem' }}>
                                <CheckCircle2 size={16} style={{ marginRight: '6px' }} /> SAVE REGISTER
                            </button>
                        </div>
                    )}
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
                    ) : activeTab === 'payroll' ? (
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
                    ) : (
                        <div className="table-container">
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                                <thead>
                                    <tr>
                                        <th>STAFF MEMBER</th>
                                        <th>DEPARTMENT</th>
                                        <th>STATUS</th>
                                        <th>CHECK-IN / OUT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dailyAttendance.map((record, idx) => (
                                        <tr key={record.employeeId} style={{ background: 'var(--bg-card)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                            <td style={{ padding: '12px 15px', borderRadius: '8px 0 0 8px' }}>
                                                <div style={{ fontWeight: 700 }}>{record.firstName} {record.lastName}</div>
                                            </td>
                                            <td style={{ padding: '12px 15px' }}>{record.department}</td>
                                            <td style={{ padding: '12px 15px' }}>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    {['PRESENT', 'ABSENT', 'LEAVE', 'HALF_DAY'].map(status => (
                                                        <button
                                                            key={status}
                                                            onClick={() => {
                                                                const n = [...dailyAttendance];
                                                                n[idx].status = status;
                                                                if (status === 'PRESENT' && !n[idx].checkIn) n[idx].checkIn = new Date().toISOString();
                                                                setDailyAttendance(n);
                                                            }}
                                                            style={{
                                                                padding: '6px 10px',
                                                                borderRadius: '6px',
                                                                border: '1px solid',
                                                                fontSize: '0.65rem',
                                                                fontWeight: 700,
                                                                cursor: 'pointer',
                                                                borderColor: record.status === status ? 'transparent' : 'var(--border-color)',
                                                                background: record.status === status
                                                                    ? (status === 'PRESENT' ? 'var(--accent-success)' : status === 'ABSENT' ? 'var(--text-danger)' : 'var(--accent-secondary)')
                                                                    : 'transparent',
                                                                color: record.status === status ? '#fff' : 'var(--text-muted)'
                                                            }}
                                                        >
                                                            {status}
                                                        </button>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 15px', borderRadius: '0 8px 8px 0' }}>
                                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                                    <input
                                                        type="time"
                                                        value={record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                        onChange={(e) => {
                                                            const n = [...dailyAttendance];
                                                            const [h, m] = e.target.value.split(':');
                                                            const d = new Date(attendanceDate);
                                                            d.setHours(parseInt(h), parseInt(m));
                                                            n[idx].checkIn = d.toISOString();
                                                            setDailyAttendance(n);
                                                        }}
                                                        disabled={record.status === 'ABSENT' || record.status === 'LEAVE'}
                                                        style={{ padding: '4px', fontSize: '0.8rem', width: '80px' }}
                                                    />
                                                    <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>to</span>
                                                    <input
                                                        type="time"
                                                        value={record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
                                                        onChange={(e) => {
                                                            const n = [...dailyAttendance];
                                                            const [h, m] = e.target.value.split(':');
                                                            const d = new Date(attendanceDate);
                                                            d.setHours(parseInt(h), parseInt(m));
                                                            n[idx].checkOut = d.toISOString();
                                                            setDailyAttendance(n);
                                                        }}
                                                        disabled={record.status === 'ABSENT' || record.status === 'LEAVE'}
                                                        style={{ padding: '4px', fontSize: '0.8rem', width: '80px' }}
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {dailyAttendance.length === 0 && <div style={{ textAlign: 'center', padding: '40px', opacity: 0.5 }}>No employees found for roster.</div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HR;
