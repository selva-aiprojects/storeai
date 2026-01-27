import { useState } from 'react';
import { motion } from 'framer-motion';
import { Layers } from 'lucide-react';
import { login as loginApi } from '../services/api';

const Login = ({ setUser }: any) => {
    const [authForm, setAuthForm] = useState({ email: '', password: '' });

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const resp = await loginApi(authForm);
            localStorage.setItem('store_ai_token', resp.data.token);
            setUser(resp.data.user);
        } catch (e) { alert("Login failed. Check credentials."); }
    };

    return (
        <div className="modal-overlay" style={{ background: '#f0f4f9', backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(79, 70, 229, 0.05) 0%, transparent 70%)' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ maxWidth: '440px', width: '90%', padding: '48px', boxShadow: 'var(--shadow-elevated)' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '40px' }}>
                    <Layers color="var(--accent-primary)" size={56} />
                    <span style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '0.1em', color: 'var(--bg-sidebar)' }}>STORE<span style={{ color: 'var(--accent-primary)' }}>AI</span></span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 600 }}>Enterprise Secure Access</div>
                </div>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="form-group">
                        <label style={{ fontWeight: 700, fontSize: '0.7rem' }}>OPERATOR EMAIL</label>
                        <input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required placeholder="admin@storeai.com" style={{ background: '#f8fafc' }} />
                    </div>
                    <div className="form-group">
                        <label style={{ fontWeight: 700, fontSize: '0.7rem' }}>ACCESS KEY</label>
                        <input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required placeholder="••••••••" style={{ background: '#f8fafc' }} />
                    </div>
                    <button className="btn btn-primary" style={{ padding: '16px', marginTop: '10px', fontSize: '0.85rem' }}>AUTHORIZE ACCESS</button>
                </form>
                <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                    &copy; 2026 STOREAI INTELLIGENCE SYSTEMS. <br />
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>SECURE BUILD: v3.1.0_PROD</span>
                </div>
            </motion.div >
        </div >
    );
};

export default Login;
