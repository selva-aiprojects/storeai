import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';
import Logo from '../components/Logo';
import api, { login as loginApi } from '../services/api';

const Login = ({ setUser }: any) => {
    const [mode, setMode] = useState<'LOGIN' | 'ONBOARD' | 'SELECT_TENANT'>('LOGIN');
    const [authForm, setAuthForm] = useState({ email: '', password: '', tenantSlug: '' });
    const [availableTenants, setAvailableTenants] = useState<any[]>([]);

    const [onboardForm, setOnboardForm] = useState({
        email: '', password: '', firstName: '', lastName: '', orgName: '', orgSlug: ''
    });

    const [loading, setLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setLoadingMessage('Authorizing Enterprise Access...');
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
        } finally {
            setLoading(false);
        }
    };

    const handleTenantSelect = async (slug: string) => {
        const newState = { ...authForm, tenantSlug: slug };
        setAuthForm(newState);
        setLoading(true);
        setLoadingMessage(`Initializing ${slug.toUpperCase()} workspace...`);
        try {
            const resp = await loginApi(newState);
            localStorage.setItem('store_ai_token', resp.data.token);
            setUser(resp.data.user);
        } catch (e: any) {
            alert(e.response?.data?.error || "Failed to switch tenant. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleOnboardRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setLoadingMessage('Provisioning New Organization Instance...');
        try {
            const resp = await api.post('/auth/onboard', onboardForm);
            alert(resp.data.message);
            setMode('LOGIN');
        } catch (e: any) {
            alert(e.response?.data?.error || "Onboarding request failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" style={{
            background: 'var(--bg-sidebar)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '40px 20px',
            overflowY: 'auto',
            position: 'fixed'
        }}>
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: 'radial-gradient(at 0% 0%, rgba(79, 70, 229, 0.15) 0, transparent 50%), radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.1) 0, transparent 50%)',
                pointerEvents: 'none'
            }} />

            {loading && (
                <div style={{
                    position: 'fixed',
                    top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 23, 42, 0.8)',
                    backdropFilter: 'blur(12px)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '20px'
                }}>
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        style={{
                            width: '48px',
                            height: '48px',
                            border: '3px solid rgba(79, 70, 229, 0.1)',
                            borderTop: '3px solid var(--primary-500)',
                            borderRadius: '50%'
                        }}
                    />
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-400)', letterSpacing: '0.1em' }}>{loadingMessage}</div>
                </div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card"
                style={{
                    maxWidth: '460px',
                    width: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    padding: '48px 40px',
                    background: 'rgba(30, 41, 59, 0.7)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                    borderRadius: 'var(--radius-xl)',
                    color: 'white',
                    zIndex: 10,
                    margin: 'auto'
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px' }}>
                    <Logo size={96} />
                    <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 800, textAlign: 'center', opacity: 0.8, marginTop: '24px' }}>
                        {mode === 'LOGIN' ? 'OPERATOR SECURE TERMINAL' : mode === 'SELECT_TENANT' ? 'WORKSPACE DISCOVERY' : 'INSTANCE PROVISIONING'}
                    </div>
                </div>

                {mode === 'LOGIN' ? (
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                        <div className="form-group">
                            <label style={{ fontWeight: 700, fontSize: '0.725rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.02em', marginBottom: '8px', display: 'block' }}>OPERATOR IDENTIFIER</label>
                            <input
                                type="email"
                                value={authForm.email}
                                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                                required
                                placeholder="E.g. chief@storeai.io"
                                className="login-input"
                                style={{
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(15, 23, 42, 0.5)',
                                    color: 'white',
                                    padding: '12px 16px'
                                }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontWeight: 700, fontSize: '0.725rem', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.02em', marginBottom: '8px', display: 'block' }}>SECURITY PASSKEY</label>
                            <input
                                type="password"
                                value={authForm.password}
                                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                                required
                                placeholder="••••••••••••"
                                className="login-input"
                                style={{
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(15, 23, 42, 0.5)',
                                    color: 'white',
                                    padding: '12px 16px'
                                }}
                            />
                        </div>
                        <div className="form-group">
                            <label style={{ fontWeight: 700, fontSize: '0.725rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.02em', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                                <span>WORKSPACE SLUG (OPTIONAL)</span>
                            </label>
                            <input
                                type="text"
                                value={authForm.tenantSlug}
                                onChange={(e) => setAuthForm({ ...authForm, tenantSlug: e.target.value.toLowerCase() })}
                                placeholder="e.g. quantum-ops"
                                className="login-input"
                                style={{
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(15, 23, 42, 0.5)',
                                    color: 'white',
                                    padding: '12px 16px'
                                }}
                            />
                        </div>
                        <button className="btn btn-primary" style={{
                            padding: '16px',
                            marginTop: '10px',
                            fontSize: '0.9rem',
                            fontWeight: 800,
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--primary-gradient)',
                            color: 'white',
                            letterSpacing: '0.05em',
                            border: 'none',
                            boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)'
                        }}>AUTHENTICATE TERMINAL</button>

                        <div style={{ textAlign: 'center', marginTop: '12px' }}>
                            <button type="button" onClick={() => setMode('ONBOARD')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                                Need a private enclave? <span style={{ color: 'var(--primary-400)', fontWeight: 700 }}>Initiate Onboarding</span>
                            </button>
                        </div>
                    </form>
                ) : mode === 'SELECT_TENANT' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }} className="no-scrollbar">
                        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', marginBottom: '20px', lineHeight: '1.6' }}>
                            Multiple workspace profiles detected.<br /><span style={{ fontWeight: 600, color: 'white' }}>Initialize appropriate environment.</span>
                        </p>
                        {availableTenants.map((t: any) => (
                            <button
                                key={t.id}
                                onClick={() => handleTenantSelect(t.slug)}
                                style={{
                                    padding: '18px 20px',
                                    justifyContent: 'space-between',
                                    background: 'rgba(255,255,255,0.05)',
                                    color: 'white',
                                    fontWeight: 700,
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: 'var(--radius-lg)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary-400)'; e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
                                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{
                                        width: '8px', height: '8px',
                                        borderRadius: '50%',
                                        background: t.slug === 'storeai' ? 'var(--primary-400)' : 'rgba(255,255,255,0.2)',
                                        boxShadow: t.slug === 'storeai' ? '0 0 10px var(--primary-400)' : 'none'
                                    }}></div>
                                    <span style={{ letterSpacing: '-0.01em' }}>{t.name}</span>
                                </div>
                                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, opacity: 0.6 }}>{t.slug.toUpperCase()}</span>
                            </button>
                        ))}
                        <button type="button" onClick={() => setMode('LOGIN')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', marginTop: '20px', alignSelf: 'center' }}>&larr; BACK TO TERMINAL</button>
                    </div>
                ) : (
                    <form onSubmit={handleOnboardRequest} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                            <div className="form-group">
                                <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: '6px', display: 'block', letterSpacing: '0.05em' }}>FIRST NAME</label>
                                <input value={onboardForm.firstName} onChange={(e) => setOnboardForm({ ...onboardForm, firstName: e.target.value })} required style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', width: '100%', borderRadius: '10px', fontSize: '0.9rem' }} />
                            </div>
                            <div className="form-group">
                                <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: '6px', display: 'block', letterSpacing: '0.05em' }}>LAST NAME</label>
                                <input value={onboardForm.lastName} onChange={(e) => setOnboardForm({ ...onboardForm, lastName: e.target.value })} required style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', width: '100%', borderRadius: '10px', fontSize: '0.9rem' }} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: '6px', display: 'block', letterSpacing: '0.05em' }}>BUSINESS IDENTIFIER</label>
                            <input type="email" value={onboardForm.email} onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })} required style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', width: '100%', borderRadius: '10px', fontSize: '0.9rem' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: '6px', display: 'block', letterSpacing: '0.05em' }}>ENCRYPTION KEY</label>
                            <input type="password" value={onboardForm.password} onChange={(e) => setOnboardForm({ ...onboardForm, password: e.target.value })} required style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', width: '100%', borderRadius: '10px', fontSize: '0.9rem' }} />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '10px 0' }}>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                            <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontWeight: 800, letterSpacing: '0.1em' }}>INSTANCE SETUP</span>
                            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                        </div>

                        <div className="form-group">
                            <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: '6px', display: 'block', letterSpacing: '0.05em' }}>ORGANIZATION NAME</label>
                            <input value={onboardForm.orgName} onChange={(e) => setOnboardForm({ ...onboardForm, orgName: e.target.value })} required placeholder="E.g. Nexus Dynamics Group" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', width: '100%', borderRadius: '10px', fontSize: '0.9rem' }} />
                        </div>
                        <div className="form-group">
                            <label style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontWeight: 700, marginBottom: '6px', display: 'block', letterSpacing: '0.05em' }}>ENVIRONMENT ADDRESS (SLUG)</label>
                            <input value={onboardForm.orgSlug} onChange={(e) => setOnboardForm({ ...onboardForm, orgSlug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} required placeholder="e.g. nexus-hq" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '12px', width: '100%', borderRadius: '10px', fontSize: '0.9rem' }} />
                        </div>

                        <button className="btn btn-primary" style={{
                            padding: '16px',
                            marginTop: '10px',
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            borderRadius: 'var(--radius-md)',
                            background: 'var(--primary-gradient)',
                            color: 'white',
                            letterSpacing: '0.05em',
                            border: 'none',
                            boxShadow: '0 4px 15px rgba(79, 70, 229, 0.3)'
                        }}>PROVISION INSTANCE</button>

                        <button type="button" onClick={() => setMode('LOGIN')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', transition: 'color 0.2s', marginTop: '6px' }}>&larr; RETURN TO SECURE TERMINAL</button>
                    </form>
                )}
                <div style={{ marginTop: '40px', textAlign: 'center', fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.03em', lineHeight: '1.8' }}>
                    &copy; {new Date().getFullYear()} COGNIVECTRA - STOREAI INTELLIGENCE PLATFORM. <br />
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700 }}>VERIFIED SECURE ENCLAVE ACTIVE</span>
                </div>
            </motion.div>
        </div>
    );
};

export default Login;
