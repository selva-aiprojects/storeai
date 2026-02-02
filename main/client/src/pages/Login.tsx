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
            background: 'linear-gradient(180deg, #2a265f 0%, #3e1b7e 100%)', // Lighter gradient
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
                backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 50%), radial-gradient(circle at 100% 100%, rgba(236, 72, 153, 0.1) 0%, transparent 50%)',
                pointerEvents: 'none'
            }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
                style={{
                    maxWidth: '440px',
                    width: '90%',
                    aspectRatio: '1/1',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '40px',
                    background: 'linear-gradient(145deg, rgba(42, 38, 95, 0.95) 0%, rgba(55, 20, 115, 0.95) 100%)', // Brighter background
                    backdropFilter: 'blur(30px)',
                    WebkitBackdropFilter: 'blur(30px)',
                    border: '1px solid rgba(139, 92, 246, 0.4)', // Lighter border
                    boxShadow: '0 40px 100px -20px rgba(0, 0, 0, 0.6), 0 0 50px rgba(139, 92, 246, 0.2)', // Softer shadow
                    borderRadius: '32px',
                    color: '#fff',
                    zIndex: 10,
                    margin: 'auto',
                    borderTop: '1px solid rgba(255, 255, 255, 0.25)'
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px', marginTop: '10px' }}>
                    <img
                        src="/logo-storeai.png"
                        alt="StoreAI Logo"
                        style={{
                            width: '90px',
                            height: 'auto',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.5))'
                        }}
                    />
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.25em', fontWeight: 700, marginTop: '16px', textAlign: 'center' }}>
                        {mode === 'LOGIN' ? 'Enterprise Secure Access' : mode === 'SELECT_TENANT' ? 'Identify Organization' : 'Provision Instance'}
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
                                    background: 'rgba(30, 41, 59, 0.6)', // Lighter input bg
                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                    color: '#fff',
                                    fontSize: '0.9rem',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => { e.target.style.borderColor = '#818cf8'; e.target.style.boxShadow = '0 0 15px rgba(129, 140, 248, 0.2)'; }}
                                onBlur={(e) => { e.target.style.borderColor = 'rgba(124, 58, 237, 0.2)'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontWeight: 600, fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', letterSpacing: '0.1em', marginBottom: '8px', display: 'block' }}>ACCESS KEY</label>
                            <input
                                type="password"
                                value={authForm.password}
                                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                                required
                                placeholder="••••••••"
                                style={{
                                    background: 'rgba(30, 41, 59, 0.6)', // Lighter input bg
                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                    color: '#fff',
                                    fontSize: '0.9rem',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => { e.target.style.borderColor = '#818cf8'; e.target.style.boxShadow = '0 0 15px rgba(129, 140, 248, 0.2)'; }}
                                onBlur={(e) => { e.target.style.borderColor = 'rgba(124, 58, 237, 0.2)'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontWeight: 600, fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>TENANT ID (OPTIONAL)</span>
                            </label>
                            <input
                                type="text"
                                value={authForm.tenantSlug}
                                onChange={(e) => setAuthForm({ ...authForm, tenantSlug: e.target.value.toLowerCase() })}
                                placeholder="e.g. technova"
                                style={{
                                    background: 'rgba(30, 41, 59, 0.6)', // Lighter input bg
                                    border: '1px solid rgba(139, 92, 246, 0.3)',
                                    color: '#fff',
                                    fontSize: '0.9rem',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    transition: 'all 0.2s'
                                }}
                                onFocus={(e) => { e.target.style.borderColor = '#818cf8'; e.target.style.boxShadow = '0 0 15px rgba(129, 140, 248, 0.2)'; }}
                                onBlur={(e) => { e.target.style.borderColor = 'rgba(124, 58, 237, 0.2)'; e.target.style.boxShadow = 'none'; }}
                            />
                        </div>
                        <button className="btn btn-primary" style={{
                            padding: '12px',
                            marginTop: '8px',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            borderRadius: '12px'
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
                    <form onSubmit={handleOnboardRequest} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginBottom: '6px', display: 'block', letterSpacing: '0.05em' }}>FIRST NAME</label>
                                <input className="hover-lift" value={onboardForm.firstName} onChange={(e) => setOnboardForm({ ...onboardForm, firstName: e.target.value })} required style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', width: '100%', borderRadius: '10px', fontSize: '0.9rem' }} />
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginBottom: '6px', display: 'block', letterSpacing: '0.05em' }}>LAST NAME</label>
                                <input className="hover-lift" value={onboardForm.lastName} onChange={(e) => setOnboardForm({ ...onboardForm, lastName: e.target.value })} required style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', width: '100%', borderRadius: '10px', fontSize: '0.9rem' }} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginBottom: '6px', display: 'block', letterSpacing: '0.05em' }}>BUSINESS EMAIL</label>
                            <input className="hover-lift" type="email" value={onboardForm.email} onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })} required style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', width: '100%', borderRadius: '10px', fontSize: '0.9rem' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginBottom: '6px', display: 'block', letterSpacing: '0.05em' }}>SECURITY KEY</label>
                            <input className="hover-lift" type="password" value={onboardForm.password} onChange={(e) => setOnboardForm({ ...onboardForm, password: e.target.value })} required style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', width: '100%', borderRadius: '10px', fontSize: '0.9rem' }} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.1em' }}>ORGANIZATION SETUP</span>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                        </div>

                        <div className="form-group">
                            <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginBottom: '6px', display: 'block', letterSpacing: '0.05em' }}>TENANT NAME</label>
                            <input className="hover-lift" value={onboardForm.orgName} onChange={(e) => setOnboardForm({ ...onboardForm, orgName: e.target.value })} required placeholder="e.g. Quantum Dynamics Corp" style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', width: '100%', borderRadius: '10px', fontSize: '0.9rem' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, marginBottom: '6px', display: 'block', letterSpacing: '0.05em' }}>WORKSPACE URL SLUG</label>
                            <input className="hover-lift" value={onboardForm.orgSlug} onChange={(e) => setOnboardForm({ ...onboardForm, orgSlug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required placeholder="e.g. quantum-hq" style={{ background: 'rgba(15, 23, 42, 0.4)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '12px', width: '100%', borderRadius: '10px', fontSize: '0.9rem' }} />
                        </div>

                        <button className="btn btn-primary" style={{
                            padding: '16px',
                            marginTop: '8px',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            borderRadius: '12px',
                            letterSpacing: '0.05em'
                        }}>PROVISION WORKSPACE</button>

                        <button type="button" onClick={() => setMode('LOGIN')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'color 0.2s', marginTop: '4px' }} onMouseOver={(e) => e.currentTarget.style.color = '#fff'} onMouseOut={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>&larr; BACK TO ACCESS TERMINAL</button>
                    </form>
                )}
                <div style={{ marginTop: '30px', textAlign: 'center', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.05em', lineHeight: '1.6' }}>
                    &copy; 2026 COGNIVECTRA - STOREAI INTELLIGENCE PLATFORM. <br />
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>SECURE ENCLAVE ACTIVE</span>
                </div>
            </motion.div >
        </div >
    );
};

export default Login;
