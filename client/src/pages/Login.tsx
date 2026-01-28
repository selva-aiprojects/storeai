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

    const handleTenantSelect = (slug: string) => {
        setAuthForm(prev => {
            const newState = { ...prev, tenantSlug: slug };
            // We can't immediately call handleLogin because state async update.
            // But we can call api directly or use a temp var.
            // Let's call API directly with new slug.
            (async () => {
                try {
                    const resp = await loginApi({ ...newState });
                    localStorage.setItem('store_ai_token', resp.data.token);
                    setUser(resp.data.user);
                } catch (e: any) {
                    alert("Failed to switch tenant.");
                }
            })();
            return newState;
        });
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
        <div className="modal-overlay" style={{ background: '#f0f4f9', backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(79, 70, 229, 0.05) 0%, transparent 70%)' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ maxWidth: '440px', width: '90%', padding: '30px', boxShadow: 'var(--shadow-elevated)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '25px' }}>
                    <Layers color="var(--accent-primary)" size={48} />
                    <span style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--bg-sidebar)' }}>STORE<span style={{ color: 'var(--accent-primary)' }}>AI</span></span>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 600 }}>
                        {mode === 'LOGIN' ? 'Enterprise Secure Access' : mode === 'SELECT_TENANT' ? 'Select Organization' : 'Tenant Onboarding Program'}
                    </div>
                </div>

                {mode === 'LOGIN' ? (
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div className="form-group">
                            <label style={{ fontWeight: 700, fontSize: '0.65rem' }}>OPERATOR EMAIL</label>
                            <input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required placeholder="admin@storeai.com" style={{ background: '#f8fafc' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontWeight: 700, fontSize: '0.65rem' }}>ACCESS KEY</label>
                            <input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required placeholder="••••••••" style={{ background: '#f8fafc' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontWeight: 700, fontSize: '0.65rem' }}>TENANT ID (OPTIONAL)</label>
                            <input type="text" value={authForm.tenantSlug} onChange={(e) => setAuthForm({ ...authForm, tenantSlug: e.target.value.toLowerCase() })} placeholder="e.g. quantum, nexus, horizon" style={{ background: '#f8fafc' }} />
                        </div>
                        <button className="btn btn-primary" style={{ padding: '14px', marginTop: '10px', fontSize: '0.8rem' }}>AUTHORIZE ACCESS</button>
                        <div style={{ textAlign: 'center', marginTop: '10px' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Need a dedicated instance? </span>
                            <button type="button" onClick={() => setMode('ONBOARD')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', padding: 0 }}>REQUEST ONBOARDING</button>
                        </div>
                    </form>
                ) : mode === 'SELECT_TENANT' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                            Your account is linked to multiple organizations. Please select the workspace to access.
                        </p>
                        {availableTenants.map((t: any) => (
                            <button
                                key={t.id}
                                onClick={() => handleTenantSelect(t.slug)}
                                className="btn"
                                style={{
                                    padding: '15px',
                                    justifyContent: 'flex-start',
                                    background: 'var(--bg-hover)',
                                    color: 'var(--text-primary)',
                                    fontWeight: 600,
                                    border: '1px solid var(--border-color)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px'
                                }}
                            >
                                <div style={{
                                    width: '8px', height: '8px',
                                    borderRadius: '50%',
                                    background: t.slug === 'storeai' ? 'var(--accent-primary)' : 'var(--text-muted)'
                                }}></div>
                                {t.name}
                            </button>
                        ))}
                        <button type="button" onClick={() => setMode('LOGIN')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', marginTop: '15px', alignSelf: 'center' }}>BACK TO LOGIN</button>
                    </div>
                ) : (
                    <form onSubmit={handleOnboardRequest} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div className="form-group"><label style={{ fontSize: '0.6rem' }}>FIRST NAME</label><input value={onboardForm.firstName} onChange={(e) => setOnboardForm({ ...onboardForm, firstName: e.target.value })} required /></div>
                            <div className="form-group"><label style={{ fontSize: '0.6rem' }}>LAST NAME</label><input value={onboardForm.lastName} onChange={(e) => setOnboardForm({ ...onboardForm, lastName: e.target.value })} required /></div>
                        </div>
                        <div className="form-group"><label style={{ fontSize: '0.6rem' }}>EMAIL</label><input type="email" value={onboardForm.email} onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })} required /></div>
                        <div className="form-group"><label style={{ fontSize: '0.6rem' }}>PASSWORD</label><input type="password" value={onboardForm.password} onChange={(e) => setOnboardForm({ ...onboardForm, password: e.target.value })} required /></div>
                        <div style={{ borderTop: '1px solid #e2e8f0', margin: '5px 0' }}></div>
                        <div className="form-group"><label style={{ fontSize: '0.6rem' }}>TENANT NAME</label><input value={onboardForm.orgName} onChange={(e) => setOnboardForm({ ...onboardForm, orgName: e.target.value })} required placeholder="e.g. Global Retail Inc" /></div>
                        <div className="form-group"><label style={{ fontSize: '0.6rem' }}>TENANT SLUG (URL ID)</label><input value={onboardForm.orgSlug} onChange={(e) => setOnboardForm({ ...onboardForm, orgSlug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required placeholder="e.g. global-retail" /></div>

                        <button className="btn btn-success" style={{ padding: '14px', marginTop: '10px', fontSize: '0.8rem' }}>SUBMIT REQUEST</button>
                        <button type="button" onClick={() => setMode('LOGIN')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer', marginTop: '5px' }}>BACK TO LOGIN</button>
                    </form>
                )}
                <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                    &copy; 2026 STOREAI INTELLIGENCE SYSTEMS. <br />
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>SECURE BUILD: v3.2.1_ONBRD</span>
                </div>
            </motion.div >
        </div >
    );
};

export default Login;
