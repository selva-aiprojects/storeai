import { useOutletContext } from 'react-router-dom';
import { UserCog, Shield, Activity, Save, UserCheck, Building2, Zap, Palette } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../services/api';

const Settings = () => {
    const { data, user, setModal, refreshData } = useOutletContext<any>();
    const { users } = data || {};

    const [orgName, setOrgName] = useState(user?.activeTenant?.name || '');
    const [orgLogo, setOrgLogo] = useState(user?.activeTenant?.logo || '');
    const [saving, setSaving] = useState(false);
    const [allTenants, setAllTenants] = useState<any[]>([]);
    const [availablePlans, setAvailablePlans] = useState<any[]>([]);

    useEffect(() => {
        if (user?.activeTenant) {
            setOrgName(user.activeTenant.name || '');
            setOrgLogo(user.activeTenant.logo || '');
        }
        fetchAllTenants();
        if (user?.activeTenant?.slug === 'storeai') fetchAllPlans();
    }, [user]);

    const fetchAllTenants = async () => {
        try {
            const resp = await api.get('/tenants/all');
            setAllTenants(resp.data);
        } catch (error) {
            console.error("Failed to fetch tenants directory");
        }
    };

    const fetchAllPlans = async () => {
        try {
            const resp = await api.get('/tenants/plans');
            setAvailablePlans(resp.data);
        } catch (error) {
            console.error("Failed to fetch plans");
        }
    };

    const handleUpdateTenant = async (id: string, updates: any) => {
        try {
            await api.put(`/tenants/manage/${id}`, updates);
            alert('Tenant record updated');
            fetchAllTenants();
        } catch (error) {
            alert('Management action failed');
        }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setOrgLogo(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveBranding = async () => {
        setSaving(true);
        console.log('📤 Submitting branding update:', { name: orgName, logo: orgLogo?.substring(0, 50) + '...' });
        try {
            await api.put('/tenants/branding', { name: orgName, logo: orgLogo });
            alert('Branding updated successfully!');
            await refreshData();
        } catch (error: any) {
            console.error("Branding Update Error:", error.response?.data || error.message);
            alert('Failed to update branding: ' + (error.response?.data?.error || error.message));
        } finally {
            setSaving(false);
        }
    };

    const toggleFeature = async (featureKey: string, featureLabel: string, price: number, currentValue: boolean) => {
        if (!currentValue) {
            // If enabling, trigger payment protocol
            setModal({
                type: 'payment_feature',
                metadata: { featureKey, featureLabel, price }
            });
            return;
        }

        // If disabling, allow direct execution (or confirm)
        if (!confirm(`Are you sure you want to disable ${featureLabel}? This will hide all related tools and data.`)) return;

        try {
            const currentFeatures = (typeof user?.features === 'object' && user?.features !== null) ? user.features : {};
            const newFeatures = { ...currentFeatures, [featureKey]: false };
            await api.put('/tenants/features', { features: newFeatures });
            await refreshData();
        } catch (error: any) {
            console.error("Feature Disable Error:", error.response?.data || error.message);
            alert('Failed to disable feature');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="section-header">Enhanced Platform Command Center</div>

            {user?.activeTenant?.slug === 'storeai' && (
                <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
                    {/* Platform Admin View - Provisioned Tenants Directory (PROMOTED TO TOP) */}
                    <div className="card" style={{ border: '1px solid rgba(129, 140, 248, 0.3)', background: 'linear-gradient(to bottom right, var(--bg-card), rgba(79, 70, 229, 0.02))' }}>
                        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Building2 size={16} color="var(--accent-primary)" />
                                <span>PROVISIONED TENANTS DIRECTORY</span>
                            </div>
                            <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>PLATFORM REVENUE (MRR)</div>
                                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-success)' }}>
                                        ${(allTenants || []).reduce((acc, t) => acc + (t.plan?.price || 0), 0).toLocaleString()}/mo
                                    </div>
                                </div>
                                <span className="badge badge-success">{allTenants?.length || 0} ACTIVE TENANTS</span>
                            </div>
                        </div>
                        <div className="table-container" style={{ marginTop: '20px' }}>
                            <table>
                                <thead>
                                    <tr>
                                        <th>TENANT IDENTITY</th>
                                        <th>SUBSCRIPTION PLAN</th>
                                        <th>ACTIVE ENTITLEMENTS</th>
                                        <th>METRICS</th>
                                        <th>GOVERNANCE</th>
                                        <th>ACTIONS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(allTenants || []).map((tenant: any) => (
                                        <tr key={tenant.id}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '30px', height: '30px', background: 'var(--bg-hover)', borderRadius: '4px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        {tenant.logo ? <img src={tenant.logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Building2 size={14} opacity={0.3} />}
                                                    </div>
                                                    <div>
                                                        <div style={{ fontWeight: 600 }}>{tenant.name}</div>
                                                        <code style={{ fontSize: '0.6rem', opacity: 0.5 }}>{tenant.slug}</code>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <select
                                                        value={tenant.planId}
                                                        onChange={(e) => handleUpdateTenant(tenant.id, { planId: e.target.value })}
                                                        style={{ background: 'transparent', border: 'none', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                                                    >
                                                        {availablePlans.map(p => <option key={p.id} value={p.id} style={{ background: 'var(--bg-card)' }}>{p.name}</option>)}
                                                    </select>
                                                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                                                        ${tenant.plan?.price || 0}/{tenant.plan?.billingCycle === 'MONTHLY' ? 'mo' : 'yr'}
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '250px' }}>
                                                    {Object.entries(tenant.features || {}).map(([key, val]) => (
                                                        val === true && (
                                                            <span key={key} style={{ fontSize: '0.55rem', padding: '2px 6px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', borderRadius: '4px', fontWeight: 700 }}>
                                                                {key.replace('_MODULE', '')}
                                                            </span>
                                                        )
                                                    ))}
                                                    {(!tenant.features || Object.values(tenant.features).filter(v => v === true).length === 0) && (
                                                        <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Core Platform Only</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '0.7rem' }}>
                                                    <strong>{tenant._count?.users || 0}</strong> <span style={{ color: 'var(--text-muted)' }}>Operators</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`badge ${tenant.status === 'ACTIVE' ? 'badge-success' :
                                                    tenant.status === 'PENDING' ? 'badge-info' : 'badge-danger'
                                                    }`} style={{
                                                        fontSize: '0.6rem',
                                                        background: tenant.status === 'PENDING' ? '#f59e0b' : ''
                                                    }}>
                                                    {tenant.status}
                                                </span>
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                    {tenant.status === 'PENDING' ? (
                                                        <button
                                                            className="btn btn-primary"
                                                            style={{ padding: '4px 8px', fontSize: '0.6rem' }}
                                                            onClick={() => handleUpdateTenant(tenant.id, { status: 'ACTIVE' })}
                                                        >
                                                            APPROVE
                                                        </button>
                                                    ) : (
                                                        <button
                                                            className={`btn ${tenant.status === 'ACTIVE' ? 'btn-danger' : 'btn-success'}`}
                                                            style={{ padding: '4px 8px', fontSize: '0.6rem' }}
                                                            onClick={() => handleUpdateTenant(tenant.id, { status: tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' })}
                                                        >
                                                            {tenant.status === 'ACTIVE' ? 'SUSPEND' : 'ACTIVATE'}
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            <div className="dashboard-grid" style={{ gridTemplateColumns: user?.activeTenant?.slug === 'storeai' ? '1fr 1fr 1fr' : '1fr 1fr' }}>
                {/* Branding - HUB ADMIN ONLY */}
                {user?.activeTenant?.slug === 'storeai' && (
                    <div className="card">
                        <div className="card-header">
                            <Palette size={16} style={{ marginRight: '8px' }} /> TENANT BRANDING
                        </div>
                        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="form-group">
                                <label>TENANT NAME</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                />
                            </div>
                            <div className="form-group">
                                <label>TENANT LOGO</label>
                                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', background: 'var(--bg-hover)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {orgLogo ? <img src={orgLogo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <Building2 size={20} opacity={0.3} />}
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleLogoUpload}
                                        style={{ fontSize: '0.7rem' }}
                                    />
                                </div>
                            </div>
                            <button className="btn btn-primary" onClick={handleSaveBranding} disabled={saving}>
                                <Save size={14} style={{ marginRight: '8px' }} /> {saving ? 'SAVING...' : 'UPDATE BRAND'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Marketplace - HUB ADMIN ONLY */}
                {user?.activeTenant?.slug === 'storeai' && (
                    <div className="card">
                        <div className="card-header">
                            <Zap size={16} style={{ marginRight: '8px' }} /> COMPONENT CONTROL (MARKETPLACE)
                        </div>
                        <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {[
                                { key: 'RETAIL_MODULE', label: 'Retail & POS', price: 49 },
                                { key: 'CRM_MODULE', label: 'Customer Relations', price: 29 },
                                { key: 'HR_MODULE', label: 'HR & Payroll', price: 39 },
                                { key: 'FINANCE_MODULE', label: 'Advanced Accounting', price: 59 },
                                { key: 'PROCUREMENT_MODULE', label: 'Supplier Procurement', price: 34 }
                            ].map(feature => (
                                <div key={feature.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: (user?.features?.[feature.key] !== false) ? '3px solid var(--accent-success)' : '3px solid transparent' }}>
                                    <div>
                                        <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>{feature.label}</div>
                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>${feature.price}/MO PERIMETER</div>
                                    </div>
                                    <button
                                        className={`btn ${(user?.features?.[feature.key] !== false) ? 'btn-danger' : 'btn-success'}`}
                                        style={{ padding: '4px 10px', fontSize: '0.6rem' }}
                                        onClick={() => toggleFeature(feature.key, feature.label, feature.price, (user?.features?.[feature.key] !== false))}
                                    >
                                        {(user?.features?.[feature.key] !== false) ? 'DISABLE' : 'ENABLE'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* My Profile Quick View */}
                <div className="card">
                    <div className="card-header">MY PROFILE</div>
                    <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ width: '50px', height: '50px', background: 'var(--accent-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: 800 }}>
                            {user?.firstName ? user.firstName[0] : 'U'}
                        </div>
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user?.firstName} {user?.lastName}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{user?.email}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>USER ACCESS CONTROL</span>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {user?.activeTenant?.slug === 'storeai' && (
                                <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.7rem' }} onClick={() => setModal({ type: 'tenant' })}>
                                    <Building2 size={14} style={{ marginRight: '6px' }} /> PROVISION TENANT
                                </button>
                            )}
                            <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.7rem' }} onClick={() => setModal({ type: 'users' })}>
                                <UserCog size={14} style={{ marginRight: '6px' }} /> PROVISION USER
                            </button>
                        </div>
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
                                {(users || []).map((u: any) => (
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
            </div>
        </div>
    );
};

export default Settings;
