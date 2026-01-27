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
        <div className="modal-overlay" style={{ background: '#050810', backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(129, 140, 248, 0.1) 0%, transparent 70%)' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ maxWidth: '400px', width: '90%', padding: '40px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
                    <Layers color="#818cf8" size={48} />
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.1em' }}>STORE<span style={{ color: '#818cf8' }}>AI</span></span>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Security Gateway v2.0</div>
                </div>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div className="form-group">
                        <label>ENCRYPTED EMAIL</label>
                        <input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required placeholder="admin@storeai.com" />
                    </div>
                    <div className="form-group">
                        <label>ACCESS PHRASE</label>
                        <input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required placeholder="••••••••" />
                    </div>
                    <button className="btn btn-primary" style={{ padding: '14px', marginTop: '10px', fontSize: '0.8rem' }}>AUTHENTICATE</button>
                </form>
                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                    &copy; 2026 STOREAI QUANTUM CORE. <br />
                    <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>BUILD: v3.0.2_LIVE_2026_01_27</span>
                </div>
            </motion.div >
        </div >
    );
};

export default Login;
