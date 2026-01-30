import { useState, useEffect } from 'react';
import api from '../services/api';
import { Download, Shield, Database, Clock } from 'lucide-react';

const Administration = () => {
    const [auditLogs, setAuditLogs] = useState<any[]>([]);
    const [filters, setFilters] = useState({
        module: '',
        action: '',
        startDate: '',
        endDate: '',
    });
    const [loading, setLoading] = useState(false);
    const [archivalStatus, setArchivalStatus] = useState<any>(null);

    const fetchAuditLogs = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.module) params.append('module', filters.module);
            if (filters.action) params.append('action', filters.action);
            if (filters.startDate) params.append('startDate', filters.startDate);
            if (filters.endDate) params.append('endDate', filters.endDate);

            const response = await api.get(`/audit-logs?${params.toString()}`);
            setAuditLogs(response.data.logs || []);
        } catch (error) {
            console.error('Failed to fetch audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const triggerArchival = async () => {
        try {
            const response = await api.post('/audit-logs/archive');
            setArchivalStatus(response.data);
            alert(`Archived ${response.data.archived} logs successfully!`);
            fetchAuditLogs(); // Refresh logs
        } catch (error) {
            console.error('Archival failed:', error);
            alert('Failed to archive logs');
        }
    };

    useEffect(() => {
        fetchAuditLogs();
    }, []);

    return (
        <div className="page-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        <Shield size={28} />
                        Administration
                    </h1>
                    <p className="page-subtitle">System settings and compliance monitoring</p>
                </div>
            </div>

            {/* Audit Trail Section */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Clock size={20} />
                        Audit Trail
                    </h2>
                    <button className="btn btn-secondary" onClick={triggerArchival} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Download size={16} />
                        Archive to S3
                    </button>
                </div>

                {/* Filters */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                    <select
                        value={filters.module}
                        onChange={(e) => setFilters({ ...filters, module: e.target.value })}
                        className="form-control"
                    >
                        <option value="">All Modules</option>
                        <option value="INVENTORY">Inventory</option>
                        <option value="SALES">Sales</option>
                        <option value="FINANCE">Finance</option>
                        <option value="HR">HR</option>
                        <option value="CRM">CRM</option>
                        <option value="PROCUREMENT">Procurement</option>
                    </select>

                    <select
                        value={filters.action}
                        onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                        className="form-control"
                    >
                        <option value="">All Actions</option>
                        <option value="CREATE">Create</option>
                        <option value="UPDATE">Update</option>
                        <option value="DELETE">Delete</option>
                        <option value="LOGIN">Login</option>
                    </select>

                    <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        className="form-control"
                    />

                    <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        className="form-control"
                    />

                    <button className="btn btn-primary" onClick={fetchAuditLogs} disabled={loading}>
                        {loading ? 'Loading...' : 'Apply Filters'}
                    </button>
                </div>

                {/* Audit Logs Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Timestamp</th>
                                <th>User</th>
                                <th>Module</th>
                                <th>Action</th>
                                <th>Entity</th>
                                <th>IP Address</th>
                            </tr>
                        </thead>
                        <tbody>
                            {auditLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                                        {loading ? 'Loading audit logs...' : 'No audit logs found'}
                                    </td>
                                </tr>
                            ) : (
                                auditLogs.map((log) => (
                                    <tr key={log.id}>
                                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                                        <td>{log.user?.email || 'System'}</td>
                                        <td><span className="badge">{log.module}</span></td>
                                        <td><span className="badge badge-secondary">{log.action}</span></td>
                                        <td>{log.entityType || '-'}</td>
                                        <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{log.ipAddress || '-'}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Retention Info */}
                <div style={{
                    marginTop: '20px',
                    padding: '16px',
                    background: 'var(--bg-secondary)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <Database size={16} />
                    <span>
                        <strong>Retention Policy:</strong> Audit logs are kept in the database for 7 days, then automatically archived to LocalStack S3 every Sunday at 2 AM UTC
                    </span>
                </div>
            </div>

            {/* System Settings Section (Placeholder for future expansion) */}
            <div className="card">
                <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '16px' }}>System Settings</h2>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Additional system configuration options will be available here.
                </p>
            </div>
        </div>
    );
};

export default Administration;
