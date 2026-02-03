import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';
import api, { login as loginApi } from '../services/api';

const Login = ({ setUser }: any) => {
    const [mode, setMode] = useState<'LOGIN' | 'ONBOARD' | 'SELECT_TENANT'>('LOGIN');
    const [authForm, setAuthForm] = useState({ email: '', password: '', tenantSlug: '' });
    const [availableTenants, setAvailableTenants] = useState<any[]>([]);

    const [onboardForm, setOnboardForm] = useState({
        email: '', password: '', firstName: '', lastName: '', orgName: '', orgSlug: ''
    });

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        try {
            const resp = await loginApi(authForm);

            // Check for multi-tenant availability
            if (resp.data.availableTenants && resp.data.availableTenants.length > 1 && !authForm.tenantSlug) {
                setAvailableTenants(resp.data.availableTenants);
                setMode('SELECT_TENANT');
                return;
            }

            localStorage.setItem('store_ai_token', resp.data.token);
            setUser(resp.data.user);
        } catch (e: any) {
            alert(e.response?.data?.error || "Login failed. Check credentials or Tenant ID.");
        }
    };

    const handleTenantSelect = async (slug: string) => {
        const newState = { ...authForm, tenantSlug: slug };
        setAuthForm(newState);
        try {
            const resp = await loginApi(newState);
            localStorage.setItem('store_ai_token', resp.data.token);
            setUser(resp.data.user);
        } catch (e: any) {
            alert(e.response?.data?.error || "Failed to switch tenant. Please try again.");
        }
    };

    const handleOnboardRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const resp = await api.post('/auth/onboard', onboardForm);
            alert(resp.data.message);
            setMode('LOGIN');
        } catch (e: any) {
            alert(e.response?.data?.error || "Onboarding request failed.");
        }
    };

    return (
        <div className="modal-overlay" style={{
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bfdbfe 100%)', // Light Sky Blue Palette
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '60px 20px',
            overflowY: 'auto'
        }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.05) 0%, transparent 40%), radial-gradient(circle at 80% 80%, rgba(37, 99, 235, 0.05) 0%, transparent 40%)',
                pointerEvents: 'none'
            }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
                style={{
                    maxWidth: '440px',
                    width: '90%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '40px',
                    background: 'rgba(255, 255, 255, 0.85)', // Premium White Glass
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                    borderRadius: '24px',
                    color: '#1e293b', // Slate 800 for readability
                    zIndex: 10,
                    margin: 'auto'
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
                    <img
                        src="/logo-storeai.png"
                        alt="StoreAI Logo"
                        style={{
                            width: '140px',
                            height: 'auto',
                            objectFit: 'contain',
                            marginBottom: '16px',
                            filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.1))'
                        }}
                    />
                    <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, textAlign: 'center' }}>
                        {mode === 'LOGIN' ? 'Enterprise Secure Access' : mode === 'SELECT_TENANT' ? 'Identify Organization' : 'Provision Instance'}
                    </div>
                </div>

                {mode === 'LOGIN' ? (
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="form-group">
                            <label style={{ fontWeight: 600, fontSize: '0.7rem', color: '#475569', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>OPERATOR EMAIL</label>
                            <input
                                type="email"
                                value={authForm.email}
                                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                                required
                                placeholder="admin@storeai.com"
                                style={{
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    color: '#1e293b',
                                    fontSize: '0.9rem',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    width: '100%',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }}
                                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontWeight: 600, fontSize: '0.65rem', color: '#475569', letterSpacing: '0.1em', marginBottom: '8px', display: 'block' }}>ACCESS KEY</label>
                            <input
                                type="password"
                                value={authForm.password}
                                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                                required
                                placeholder="••••••••"
                                style={{
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    color: '#1e293b',
                                    fontSize: '0.9rem',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    width: '100%',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }}
                                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontWeight: 600, fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>TENANT ID (OPTIONAL)</span>
                            </label>
                            <input
                                type="text"
                                value={authForm.tenantSlug}
                                onChange={(e) => setAuthForm({ ...authForm, tenantSlug: e.target.value.toLowerCase() })}
                                placeholder="e.g. technova"
                                style={{
                                    background: '#fff',
                                    border: '1px solid #e2e8f0',
                                    color: '#1e293b',
                                    fontSize: '0.9rem',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    width: '100%',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)'; }}
                                onBlur={(e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                        <button className="btn btn-primary" style={{
                            padding: '14px',
                            marginTop: '8px',
                            fontSize: '0.9rem',
                            fontWeight: 700,
                            borderRadius: '12px',
                            background: '#3b82f6',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                        }}>AUTHORIZE ACCESS</button>

                        <div style={{ textAlign: 'center', marginTop: '10px' }}>
                            <button type="button" onClick={() => setMode('ONBOARD')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.75rem', cursor: 'pointer', transition: 'color 0.2s' }}>
                                Need a dedicated instance? <span style={{ color: '#3b82f6', fontWeight: 600 }}>Request Onboarding</span>
                            </button>
                        </div>
                    </form>
                ) : mode === 'SELECT_TENANT' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#475569', marginBottom: '16px', lineHeight: '1.5' }}>
                            Your identity is securely linked to multiple workspaces.<br />Select one to continue.
                        </p>
                        {availableTenants.map((t: any) => (
                            <button
                                key={t.id}
                                onClick={() => handleTenantSelect(t.slug)}
                                style={{
                                    padding: '16px',
                                    justifyContent: 'flex-start',
                                    background: '#f8fafc',
                                    color: '#1e293b',
                                    fontWeight: 600,
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                            >
                                <div style={{
                                    width: '10px', height: '10px',
                                    borderRadius: '50%',
                                    background: t.slug === 'storeai' ? '#3b82f6' : '#cbd5e1',
                                    boxShadow: t.slug === 'storeai' ? '0 0 10px rgba(59, 130, 246, 0.3)' : 'none'
                                }}></div>
                                {t.name}
                            </button>
                        ))}
                        <button type="button" onClick={() => setMode('LOGIN')} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', marginTop: '15px', alignSelf: 'center' }}>&larr; BACK TO LOGIN</button>
                    </div>
                ) : (
                    <form onSubmit={handleOnboardRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, marginBottom: '6px', display: 'block', letterSpacing: '0.05em' }}>FIRST NAME</label>
                                <input value={onboardForm.firstName} onChange={(e) => setOnboardForm({ ...onboardForm, firstName: e.target.value })} required style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', padding: '12px', width: '100%', borderRadius: '10px', fontSize: '0.9rem' }} />
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, marginBottom: '6px', display: 'block', letterSpacing: '0.05em' }}>LAST NAME</label>
                                <input value={onboardForm.lastName} onChange={(e) => setOnboardForm({ ...onboardForm, lastName: e.target.value })} required style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', padding: '12px', width: '100%', borderRadius: '10px', fontSize: '0.9rem' }} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, marginBottom: '6px', display: 'block', letterSpacing: '0.05em' }}>BUSINESS EMAIL</label>
                            <input type="email" value={onboardForm.email} onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })} required style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', padding: '12px', width: '100%', borderRadius: '10px', fontSize: '0.9rem' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, marginBottom: '6px', display: 'block', letterSpacing: '0.05em' }}>SECURITY KEY</label>
                            <input type="password" value={onboardForm.password} onChange={(e) => setOnboardForm({ ...onboardForm, password: e.target.value })} required style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', padding: '12px', width: '100%', borderRadius: '10px', fontSize: '0.9rem' }} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
                            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                            <span style={{ fontSize: '0.6rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.1em' }}>ORGANIZATION SETUP</span>
                            <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                        </div>

                        <div className="form-group">
                            <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, marginBottom: '6px', display: 'block', letterSpacing: '0.05em' }}>TENANT NAME</label>
                            <input value={onboardForm.orgName} onChange={(e) => setOnboardForm({ ...onboardForm, orgName: e.target.value })} required placeholder="e.g. Quantum Dynamics Corp" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', padding: '12px', width: '100%', borderRadius: '10px', fontSize: '0.9rem' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, marginBottom: '6px', display: 'block', letterSpacing: '0.05em' }}>WORKSPACE URL SLUG</label>
                            <input value={onboardForm.orgSlug} onChange={(e) => setOnboardForm({ ...onboardForm, orgSlug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required placeholder="e.g. quantum-hq" style={{ background: '#fff', border: '1px solid #e2e8f0', color: '#1e293b', padding: '12px', width: '100%', borderRadius: '10px', fontSize: '0.9rem' }} />
                        </div>

                        <button className="btn btn-primary" style={{
                            padding: '16px',
                            marginTop: '8px',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            borderRadius: '12px',
                            background: '#3b82f6',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                            letterSpacing: '0.05em'
                        }}>PROVISION WORKSPACE</button>

                        <button type="button" onClick={() => setMode('LOGIN')} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'color 0.2s', marginTop: '4px' }}>&larr; BACK TO ACCESS TERMINAL</button>
                    </form>
                )}
                <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '0.65rem', color: '#94a3b8', letterSpacing: '0.05em', lineHeight: '1.6' }}>
                    &copy; 2026 COGNIVECTRA - STOREAI INTELLIGENCE PLATFORM. <br />
                    <span style={{ color: '#64748b', fontWeight: 600 }}>SECURE ENCLAVE ACTIVE</span>
                </div>
            </motion.div >
        </div >
    );
};

export default Login;
