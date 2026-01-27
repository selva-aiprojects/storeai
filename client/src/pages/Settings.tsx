import { useOutletContext } from 'react-router-dom';
import { UserCog, Shield, Activity, Save, UserCheck } from 'lucide-react';

const Settings = () => {
    const { data, user, setModal } = useOutletContext<any>();
    const { users } = data || {};

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="section-header">System Configuration</div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
                {/* User Access Management */}
                <div className="card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>USER ACCESS CONTROL</span>
                        <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.7rem' }} onClick={() => setModal({ type: 'users' })}>
                            <UserCog size={14} style={{ marginRight: '6px' }} /> PROVISION USER
                        </button>
                    </div>
                    <div className="table-container" style={{ marginTop: '20px' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>OPERATOR</th>
                                    <th>ROLE</th>
                                    <th>STATUS</th>
                                    <th>SECURITY</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users?.map((u: any) => (
                                    <tr key={u.id}>
                                        <td>
                                            <div style={{ fontWeight: 600 }}>{u.firstName} {u.lastName}</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <Shield size={12} color="var(--accent-primary)" />
                                                <span style={{ fontSize: '0.75rem' }}>{u.role}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.6rem' }}>
                                                {u.isActive ? 'AUTHORIZED' : 'REVOKED'}
                                            </span>
                                        </td>
                                        <td>
                                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.6rem' }}>
                                                RESET PIN
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* System Health / Telemetry */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="card">
                        <div className="card-header">MY PROFILE</div>
                        <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '15px' }}>
                            <div style={{ width: '60px', height: '60px', background: 'var(--accent-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 800 }}>
                                {user?.firstName[0]}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.firstName} {user?.lastName}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{user?.email}</div>
                                <div style={{ display: 'inline-block', marginTop: '8px', padding: '4px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 600 }}>
                                    SEC-LEVEL: {user?.role}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">ENVIRONMENT TELEMETRY</div>
                        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>DATABASE STATUS</span>
                                <span style={{ color: 'var(--accent-success)', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <Activity size={14} /> NOMINAL
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>API LATENCY</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>24ms</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>VERSION</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>v3.0.2-PRODUCTION</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
