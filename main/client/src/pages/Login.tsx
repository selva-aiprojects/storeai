import { useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Building2, Users, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { login as loginApi } from "../services/api";

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
            const status = e?.response?.status;
            const apiError = e?.response?.data?.error;

            if (!e?.response) {
                setErrorMessage("Cannot reach server. Please ensure backend is running on port 5000.");
            } else if (status === 401) {
                setErrorMessage("Invalid credentials. Please try again.");
            } else {
                setErrorMessage(apiError || "Login failed. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex items-center justify-center px-4 py-4 lg:py-6 font-['Outfit'] relative overflow-hidden bg-slate-50">
            {/* Ambient Background matching the wavy gradients */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(0,64,110,0.1)_0%,transparent_40%),radial-gradient(circle_at_100%_100%,rgba(0,108,153,0.1)_0%,transparent_40%)]"></div>

            {/* MAIN CARD */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-6xl bg-white rounded-3xl shadow-[0_30px_80px_-20px_rgba(0,61,122,0.25)] overflow-hidden grid lg:grid-cols-2 relative z-10 mx-auto"
            >

                {/* ================= LEFT SIDE ================= */}
                <div className="relative hidden lg:flex flex-col justify-center gap-10 bg-gradient-to-br from-[#003254] to-[#00547A] p-12 text-white overflow-hidden">

                    {/* Wavy Background Decor */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                        <svg viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#ffffff" d="M0 200c150 100 250 -50 400 0s250 100 400 0v600H0V200z" opacity="0.3"></path>
                            <path fill="#ffffff" d="M0 400c150 150 250 -100 400 0s250 150 400 0v400H0V400z" opacity="0.2"></path>
                        </svg>
                    </div>

                    {/* Top Branding */}
                    <div className="relative z-10">
                        <h2 className="text-4xl xl:text-5xl font-extrabold leading-[1.05] tracking-[-0.03em] drop-shadow-md">
                            Multi-Tenant <br />
                            <span className="text-[#ffffff]">Intelligence</span>
                        </h2>

                        <p className="mt-2 text-base xl:text-lg text-blue-50 font-medium max-w-md leading-relaxed drop-shadow-sm">
                            Strategic operations engine powering inventory optimization,
                            finance intelligence, and AI-driven growth.
                        </p>
                    </div>

                    {/* Center Logo */}
                    <div className="flex justify-center relative z-10">
                        <img
                            src="/logo-mt.png"
                            alt="StoreAI"
                            className="w-3/4 max-h-[260px] object-contain drop-shadow-2xl transition-all duration-700 hover:scale-105"
                        />
                    </div>

                    {/* Bottom Trust Badges */}
                    <div className="space-y-2 relative z-10">
                        {[
                            {
                                icon: <ShieldCheck size={16} />,
                                text: "Enterprise-Grade Authentication",
                            },
                            {
                                icon: <Building2 size={16} />,
                                text: "Isolated Tenant Infrastructure",
                            },
                            {
                                icon: <Users size={16} />,
                                text: "Dynamic RBAC Governance",
                            },
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl text-xs xl:text-sm font-semibold border border-white/10"
                            >
                                <span className="text-[#1FB6FF]">{item.icon}</span>
                                {item.text}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ================= RIGHT SIDE ================= */}
                <div className="p-8 lg:p-12 flex flex-col justify-center">

                    {/* Mobile Logo Branding Header */}
                    <div className="lg:hidden flex justify-center mb-6 px-8 py-4 bg-gradient-to-r from-[#003254] to-[#00547A] rounded-2xl shadow-lg transition-all duration-500">
                        <img src="/logo-mt.png" alt="StoreAI" className="h-32 w-auto drop-shadow-xl" />
                    </div>

                    {/* Back to Home Link */}
                    <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-semibold text-sm transition-colors mb-6 self-start w-fit">
                        <ArrowLeft size={16} />
                        Back to Home
                    </Link>

                    <h1 className="text-3xl xl:text-4xl font-extrabold text-slate-800 tracking-tight">
                        Welcome Back
                    </h1>
                    <p className="mt-2 text-slate-500 font-medium text-sm xl:text-base">
                        Enter your credentials to access your workspace.
                    </p>

                    {errorMessage && (
                        <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-600 text-[13px] font-semibold p-3 rounded-xl">
                            {errorMessage}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="mt-6 space-y-4">

                        {/* Email */}
                        <div>
                            <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500">
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
                                className="mt-1.5 w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition text-[13px] font-semibold"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500">
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
                                className="mt-1.5 w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition text-[13px] font-semibold"
                            />
                        </div>

                        {/* Tenant */}
                        <div>
                            <label className="text-[10px] font-bold tracking-widest uppercase text-slate-500">
                                Tenant workspace
                            </label>
                            <input
                                type="text"
                                value={authForm.tenantSlug}
                                onChange={(e) =>
                                    setAuthForm({
                                        ...authForm,
                                        tenantSlug: e.target.value.toLowerCase().trim().replace(/\s+/g, "-"),
                                    })
                                }
                                placeholder="e.g. acme-retail"
                                autoComplete="organization"
                                className="mt-1.5 w-full px-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition text-[13px] font-semibold"
                            />
                            <p className="mt-2 text-[11px] text-slate-400">
                                Enter your organization’s tenant slug, or leave it blank to use your default workspace.
                            </p>
                        </div>

                        {/* Button */}
                        <button
                            disabled={loading}
                            className="w-full mt-4 bg-gradient-to-r from-[#003254] to-[#00547A] hover:from-[#00243D] hover:to-[#003E5A] text-white py-4 rounded-xl font-bold tracking-widest shadow-xl shadow-blue-900/20 transition-all hover:-translate-y-0.5 active:scale-[0.98] text-xs"
                        >
                            {loading ? "AUTHORIZING..." : "SIGN IN TO STOREAI"}
                        </button>

                    </form>

                    {/* Footer */}
                    <div className="mt-5 text-center text-[10px] text-slate-400 font-semibold tracking-wider">
                        © {new Date().getFullYear()} StoreAI Intelligence. A product of Whitekraaft.com
                    </div>

                </div>
            </motion.div>
        </div>
    );
};

export default Login;
