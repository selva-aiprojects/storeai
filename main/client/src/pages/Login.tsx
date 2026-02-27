import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Building2, Users } from "lucide-react";
import api, { login as loginApi } from "../services/api";

const Login = ({ setUser }: any) => {
    const [authForm, setAuthForm] = useState({
        email: "",
        password: "",
        tenantSlug: "",
    });

    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setLoading(true);
        setErrorMessage("");

        try {
            const resp = await loginApi(authForm);
            localStorage.setItem("store_ai_token", resp.data.token);
            setUser(resp.data.user);
        } catch (e: any) {
            setErrorMessage("Invalid credentials. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-6 py-12 font-['Outfit'] relative overflow-hidden">
            {/* Ambient Background matching the wavy gradients */}
            <div className="absolute inset-0 bg-slate-50"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(0,97,168,0.1)_0%,transparent_50%),radial-gradient(circle_at_100%_100%,rgba(0,163,224,0.1)_0%,transparent_50%)]"></div>

            {/* MAIN CARD */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-6xl bg-white rounded-3xl shadow-[0_30px_80px_-20px_rgba(0,61,122,0.25)] overflow-hidden grid lg:grid-cols-2 relative z-10"
            >

                {/* ================= LEFT SIDE ================= */}
                <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#0061A8] to-[#00A3E0] p-14 text-white overflow-hidden">

                    {/* Wavy Background Decor */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#ffffff" d="M0 200c150 100 250 -50 400 0s250 100 400 0v600H0V200z" opacity="0.3"></path>
                            <path fill="#ffffff" d="M0 400c150 150 250 -100 400 0s250 150 400 0v400H0V400z" opacity="0.2"></path>
                        </svg>
                    </div>

                    {/* Top Branding */}
                    <div className="relative z-10">
                        <h2 className="text-5xl font-extrabold leading-[1.05] tracking-[-0.03em] drop-shadow-md">
                            Multi-Tenant <br />
                            <span className="text-[#ffffff]">Intelligence</span>
                        </h2>

                        <p className="mt-6 text-lg text-blue-50 font-medium max-w-md leading-relaxed drop-shadow-sm">
                            Strategic operations engine powering inventory optimization,
                            finance intelligence, and AI-driven growth.
                        </p>
                    </div>

                    {/* Center Logo */}
                    <div className="flex justify-center relative z-10 py-8">
                        <img
                            src="/logo-mt.png"
                            alt="StoreAI"
                            className="w-[70%] drop-shadow-2xl"
                        />
                    </div>

                    {/* Bottom Trust Badges */}
                    <div className="space-y-4 relative z-10">
                        {[
                            {
                                icon: <ShieldCheck size={18} />,
                                text: "Enterprise-Grade Secure Authentication",
                            },
                            {
                                icon: <Building2 size={18} />,
                                text: "Isolated Multi-Tenant Infrastructure",
                            },
                            {
                                icon: <Users size={18} />,
                                text: "Dynamic RBAC Governance",
                            },
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl text-sm font-semibold border border-white/10"
                            >
                                <span className="text-[#1FB6FF]">{item.icon}</span>
                                {item.text}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ================= RIGHT SIDE ================= */}
                <div className="p-12 lg:p-16 flex flex-col justify-center">

                    {/* Mobile Logo */}
                    <div className="lg:hidden flex justify-center mb-10">
                        <img src="/logo-storeai.png" alt="StoreAI" className="h-20" />
                    </div>

                    <h1 className="text-4xl font-extrabold text-slate-800">
                        Welcome Back
                    </h1>
                    <p className="mt-2 text-slate-500 font-medium">
                        Enter your credentials to access your workspace.
                    </p>

                    {errorMessage && (
                        <div className="mt-6 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-semibold p-4 rounded-xl">
                            {errorMessage}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="mt-10 space-y-6">

                        {/* Email */}
                        <div>
                            <label className="text-xs font-bold tracking-widest uppercase text-slate-500">
                                Identity URL / Email
                            </label>
                            <input
                                type="email"
                                required
                                value={authForm.email}
                                onChange={(e) =>
                                    setAuthForm({ ...authForm, email: e.target.value })
                                }
                                placeholder="admin@storeai.com"
                                className="mt-2 w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition text-sm font-semibold"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-xs font-bold tracking-widest uppercase text-slate-500">
                                Access Token / Password
                            </label>
                            <input
                                type="password"
                                required
                                value={authForm.password}
                                onChange={(e) =>
                                    setAuthForm({ ...authForm, password: e.target.value })
                                }
                                placeholder="••••••••"
                                className="mt-2 w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition text-sm font-semibold"
                            />
                        </div>

                        {/* Tenant */}
                        <div>
                            <label className="text-xs font-bold tracking-widest uppercase text-slate-500">
                                Tenant Descriptor (Optional)
                            </label>
                            <input
                                type="text"
                                value={authForm.tenantSlug}
                                onChange={(e) =>
                                    setAuthForm({
                                        ...authForm,
                                        tenantSlug: e.target.value.toLowerCase(),
                                    })
                                }
                                placeholder="e.g. quantum-corp"
                                className="mt-2 w-full px-5 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition text-sm font-semibold"
                            />
                        </div>

                        {/* Button */}
                        <button
                            disabled={loading}
                            className="w-full mt-6 bg-gradient-to-r from-[#0061A8] to-[#00A3E0] hover:from-[#004d85] hover:to-[#008fcc] text-white py-4 rounded-2xl font-black tracking-widest shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                        >
                            {loading ? "AUTHORIZING..." : "SIGN IN TO STOREAI"}
                        </button>

                    </form>

                    {/* Footer */}
                    <div className="mt-12 text-center text-xs text-slate-400 font-semibold tracking-wider">
                        © {new Date().getFullYear()} StoreAI Intelligence
                    </div>

                </div>
            </motion.div>
        </div>
    );
};

export default Login;