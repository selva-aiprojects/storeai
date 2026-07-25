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
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 font-['Outfit'] relative overflow-hidden bg-slate-950">
            {/* Multi-Color Ambient Glow Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 -right-40 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-pink-500/15 rounded-full blur-3xl"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(15,23,42,0.6)_0%,rgba(2,6,23,0.95)_100%)]"></div>
            </div>

            {/* FLOATING ROUNDED PANEL CARD */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-5xl bg-white rounded-3xl shadow-[0_30px_90px_-15px_rgba(0,0,0,0.6)] overflow-hidden grid lg:grid-cols-12 relative z-10 mx-auto border border-slate-100/20"
            >

                {/* ================= LEFT SIDE (BRAND PANEL - 5 COLS) ================= */}
                <div className="lg:col-span-5 relative hidden lg:flex flex-col justify-between p-8 xl:p-10 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white overflow-hidden border-r border-white/10">

                    {/* Multi-color ambient gradient accents */}
                    <div className="absolute -top-24 -left-24 w-64 h-64 bg-cyan-500/25 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 -right-20 w-64 h-64 bg-pink-500/20 rounded-full blur-2xl"></div>
                    <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>

                    {/* Top Tagline */}
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-cyan-300 tracking-wider uppercase mb-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            Unified Commerce OS
                        </div>
                        <h2 className="text-2xl xl:text-3xl font-extrabold leading-tight tracking-tight drop-shadow-md">
                            Smart Store <br />
                            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                                Multi-Tenant Intelligence
                            </span>
                        </h2>
                    </div>

                    {/* Center 5x Large Multi-Color Logo Display */}
                    <div className="relative z-10 my-4 flex flex-col items-center justify-center">
                        <div className="p-8 bg-slate-900/70 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-[0_20px_60px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center w-full group hover:border-cyan-400/50 transition-all duration-300">
                            <img
                                src="/StoreAI-Logo-new.png"
                                alt="StoreAI Enterprise Multi-Tenant"
                                className="w-full h-auto max-h-[380px] object-contain filter drop-shadow-[0_12px_35px_rgba(6,182,212,0.45)] group-hover:scale-105 transition-transform duration-500"
                                onError={(e) => {
                                    e.currentTarget.src = "/logo-transparent.png";
                                }}
                            />
                        </div>
                    </div>

                    {/* Bottom Features */}
                    <div className="space-y-2 relative z-10">
                        {[
                            {
                                icon: <ShieldCheck size={16} className="text-cyan-400" />,
                                text: "Enterprise Multi-Tenant Security",
                            },
                            {
                                icon: <Building2 size={16} className="text-indigo-400" />,
                                text: "Real-Time Stock & Finance Engine",
                            },
                            {
                                icon: <Users size={16} className="text-pink-400" />,
                                text: "AI-Powered Operations Copilot",
                            },
                        ].map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-2.5 bg-white/5 backdrop-blur-md px-3.5 py-2 rounded-xl text-xs font-medium text-slate-200 border border-white/10"
                            >
                                {item.icon}
                                {item.text}
                            </div>
                        ))}
                    </div>
                </div>

                {/* ================= RIGHT SIDE (LOGIN FORM PANEL - 7 COLS) ================= */}
                <div className="lg:col-span-7 p-6 sm:p-8 xl:p-10 flex flex-col justify-center bg-white">

                    {/* Mobile 5x Large Logo Branding Header */}
                    <div className="lg:hidden flex flex-col items-center justify-center mb-6 p-6 bg-slate-900 rounded-2xl shadow-xl border border-slate-800">
                        <img 
                            src="/StoreAI-Logo-new.png" 
                            alt="StoreAI Enterprise Multi-Tenant" 
                            className="h-28 w-auto object-contain drop-shadow-2xl" 
                            onError={(e) => { e.currentTarget.src = "/logo-transparent.png"; }} 
                        />
                    </div>

                    {/* Back to Home Link */}
                    <Link to="/" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 font-semibold text-xs transition-colors mb-4 self-start w-fit">
                        <ArrowLeft size={14} />
                        Back to Home
                    </Link>

                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Sign In to <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">StoreAI</span>
                        </h1>
                        <p className="mt-1 text-slate-500 font-medium text-xs sm:text-sm">
                            Enter your credentials to access your tenant workspace.
                        </p>
                    </div>

                    {errorMessage && (
                        <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold p-3 rounded-xl">
                            {errorMessage}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="mt-5 space-y-3.5">

                        {/* Email */}
                        <div>
                            <label className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
                                Email / Username
                            </label>
                            <input
                                type="email"
                                required
                                value={authForm.email}
                                onChange={(e) =>
                                    setAuthForm({ ...authForm, email: e.target.value })
                                }
                                placeholder="admin@storeai.com"
                                className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-xs font-medium text-slate-800"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
                                Password
                            </label>
                            <input
                                type="password"
                                required
                                value={authForm.password}
                                onChange={(e) =>
                                    setAuthForm({ ...authForm, password: e.target.value })
                                }
                                placeholder="••••••••"
                                className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-xs font-medium text-slate-800"
                            />
                        </div>

                        {/* Tenant */}
                        <div>
                            <label className="text-[10px] font-bold tracking-wider uppercase text-slate-500">
                                Tenant Workspace (Optional)
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
                                placeholder="e.g. storeai"
                                autoComplete="organization"
                                className="mt-1 w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition text-xs font-medium text-slate-800"
                            />
                            <p className="mt-1 text-[10px] text-slate-400">
                                Leave blank to automatically sign in to your default tenant.
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            disabled={loading}
                            className="w-full mt-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white py-3 rounded-xl font-bold tracking-wider shadow-lg shadow-indigo-500/25 transition-all hover:-translate-y-0.5 active:scale-[0.99] text-xs"
                        >
                            {loading ? "AUTHORIZING..." : "SIGN IN TO WORKSPACE"}
                        </button>
                    </form>

                    {/* Quick Demo Login Presets */}
                    <div className="mt-5 border-t border-slate-100 pt-4">
                        <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block mb-2">
                            ⚡ Quick Demo Login Shortcuts
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setAuthForm({
                                    email: "admin.1785002808043@apexretail.com",
                                    password: "ApexAdmin@2026",
                                    tenantSlug: "apex-retail-1785002802666"
                                })}
                                className="p-2.5 bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/80 rounded-xl text-left transition-all"
                            >
                                <span className="block text-[11px] font-extrabold text-emerald-900">🏢 Apex Global Retail</span>
                                <span className="block text-[9px] text-emerald-700 font-mono mt-0.5">3 Months Seeded Data</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setAuthForm({
                                    email: "admin@storeai.com",
                                    password: "Admin@123",
                                    tenantSlug: "storeai"
                                })}
                                className="p-2.5 bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 border border-indigo-200/80 rounded-xl text-left transition-all"
                            >
                                <span className="block text-[11px] font-extrabold text-indigo-900">👑 SuperAdmin Hub</span>
                                <span className="block text-[9px] text-indigo-700 font-mono mt-0.5">All Tenants Admin</span>
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-4 text-center text-[10px] text-slate-400 font-semibold">
                        © {new Date().getFullYear()} StoreAI Intelligence. Multi-Tenant Enterprise Platform.
                    </div>

                </div>
            </motion.div>
        </div>
    );
};

export default Login;
