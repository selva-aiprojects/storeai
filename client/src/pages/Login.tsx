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
        <div className="modal-overlay" style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #312e81 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)',
                pointerEvents: 'none'
            }} />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card"
                style={{
                    maxWidth: '420px',
                    width: '90%',
                    padding: '40px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    color: '#fff',
                    zIndex: 10
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                    <div style={{ padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                        <Layers color="#818cf8" size={40} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '0.05em', color: '#fff' }}>STORE<span style={{ color: '#818cf8' }}>AI</span></span>
                        <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 600, marginTop: '5px' }}>
                            {mode === 'LOGIN' ? 'Enterprise Secure Access' : mode === 'SELECT_TENANT' ? 'Select Organization' : 'Tenant Onboarding'}
                        </div>
                    </div>
                </div>

                {mode === 'LOGIN' ? (
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="form-group">
                            <label style={{ fontWeight: 600, fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>OPERATOR EMAIL</label>
                            <input
                                type="email"
                                value={authForm.email}
                                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                                required
                                placeholder="admin@storeai.com"
                                style={{
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    fontSize: '0.95rem',
                                    padding: '12px 16px'
                                }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontWeight: 600, fontSize: '0.7rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em', marginBottom: '8px', display: 'block' }}>ACCESS KEY</label>
                            <input
                                type="password"
                                value={authForm.password}
                                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                                required
                                placeholder="••••••••"
                                style={{
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    fontSize: '0.95rem',
                                    padding: '12px 16px'
                                }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontWeight: 600, fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>TENANT ID (OPTIONAL)</span>
                                <span style={{ opacity: 0.5 }}>For Multi-Tenant Access</span>
                            </label>
                            <input
                                type="text"
                                value={authForm.tenantSlug}
                                onChange={(e) => setAuthForm({ ...authForm, tenantSlug: e.target.value.toLowerCase() })}
                                placeholder="e.g. quantum"
                                style={{
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    fontSize: '0.95rem',
                                    padding: '12px 16px'
                                }}
                            />
                        </div>
                        <button className="btn btn-primary" style={{
                            padding: '14px',
                            marginTop: '10px',
                            fontSize: '0.9rem',
                            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                            border: 'none',
                            fontWeight: 700
                        }}>AUTHORIZE ACCESS</button>

                        <div style={{ textAlign: 'center', marginTop: '10px' }}>
                            <button type="button" onClick={() => setMode('ONBOARD')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', cursor: 'pointer', transition: 'color 0.2s' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
                                Need a dedicated instance? <span style={{ color: '#818cf8', fontWeight: 600 }}>Request Onboarding</span>
                            </button>
                        </div>
                    </form>
                ) : mode === 'SELECT_TENANT' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }}>
                        <p style={{ textAlign: 'center', fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginBottom: '16px', lineHeight: '1.5' }}>
                            Your identity is securely linked to multiple workspaces.<br />Select one to continue.
                        </p>
                        {availableTenants.map((t: any) => (
                            <button
                                key={t.id}
                                onClick={() => handleTenantSelect(t.slug)}
                                style={{
                                    padding: '16px',
                                    justifyContent: 'flex-start',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: '#fff',
                                    fontWeight: 600,
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = '#818cf8'; }}
                                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                            >
                                <div style={{
                                    width: '10px', height: '10px',
                                    borderRadius: '50%',
                                    background: t.slug === 'storeai' ? '#818cf8' : 'rgba(255,255,255,0.3)',
                                    boxShadow: t.slug === 'storeai' ? '0 0 10px rgba(129, 140, 248, 0.5)' : 'none'
                                }}></div>
                                {t.name}
                            </button>
                        ))}
                        <button type="button" onClick={() => setMode('LOGIN')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', marginTop: '15px', alignSelf: 'center' }}>&larr; BACK TO LOGIN</button>
                    </div>
                ) : (
                    <form onSubmit={handleOnboardRequest} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>FIRST NAME</label>
                                <input value={onboardForm.firstName} onChange={(e) => setOnboardForm({ ...onboardForm, firstName: e.target.value })} required style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', width: '100%', borderRadius: '8px' }} />
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>LAST NAME</label>
                                <input value={onboardForm.lastName} onChange={(e) => setOnboardForm({ ...onboardForm, lastName: e.target.value })} required style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', width: '100%', borderRadius: '8px' }} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>EMAIL</label>
                            <input type="email" value={onboardForm.email} onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })} required style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', width: '100%', borderRadius: '8px' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>PASSWORD</label>
                            <input type="password" value={onboardForm.password} onChange={(e) => setOnboardForm({ ...onboardForm, password: e.target.value })} required style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', width: '100%', borderRadius: '8px' }} />
                        </div>
                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', margin: '5px 0' }}></div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>TENANT NAME</label>
                            <input value={onboardForm.orgName} onChange={(e) => setOnboardForm({ ...onboardForm, orgName: e.target.value })} required placeholder="e.g. Global Retail Inc" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', width: '100%', borderRadius: '8px' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, marginBottom: '6px', display: 'block' }}>TENANT SLUG (URL ID)</label>
                            <input value={onboardForm.orgSlug} onChange={(e) => setOnboardForm({ ...onboardForm, orgSlug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required placeholder="e.g. global-retail" style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', width: '100%', borderRadius: '8px' }} />
                        </div>

                        <button className="btn" style={{ padding: '14px', marginTop: '10px', fontSize: '0.9rem', background: '#10b981', color: '#0f172a', border: 'none', fontWeight: 700, borderRadius: '8px', cursor: 'pointer' }}>INITIATE ONBOARDING</button>
                        <button type="button" onClick={() => setMode('LOGIN')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', marginTop: '5px' }}>CANCEL</button>
                    </form>
                )}
                <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', lineHeight: '1.6' }}>
                    &copy; 2026 STOREAI INTELLIGENCE SYSTEMS. <br />
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>SECURE ENCLAVE ACTIVE</span>
                </div>
            </motion.div >
        </div >
    );
};

export default Login;
