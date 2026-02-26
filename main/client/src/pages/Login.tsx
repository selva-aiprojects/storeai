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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-6 py-12 font-['Outfit']">

            {/* MAIN CARD */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="w-full max-w-6xl bg-white rounded-3xl shadow-[0_30px_80px_-20px_rgba(0,61,122,0.25)] overflow-hidden grid lg:grid-cols-2"
            >

                {/* ================= LEFT SIDE ================= */}
                <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-[#0B4F8A] via-[#083B6B] to-[#041F3D] p-14 text-white">

                    {/* Top Branding */}
                    <div>
                        <h2 className="text-5xl font-extrabold leading-[1.05] tracking-[-0.03em]">
                            Multi-Tenant <br />
                            <span className="text-[#1FB6FF]">Intelligence</span>
                        </h2>

                        <p className="mt-6 text-lg text-blue-100/80 max-w-md leading-relaxed">
                            Strategic operations engine powering inventory optimization,
                            finance intelligence, and AI-driven growth.
                        </p>
                    </div>

                    {/* Center Logo */}
                    <div className="flex justify-center">
                        <img
                            src="/StoreAI-Logo-new.png"
                            alt="StoreAI"
                            className="w-[65%] drop-shadow-2xl"
                        />
                    </div>

                    {/* Bottom Trust Badges */}
                    <div className="space-y-4">
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
                        <img src="/StoreAI-Logo-new.png" alt="StoreAI" className="h-20" />
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
                            className="w-full mt-6 bg-gradient-to-r from-[#0B4F8A] to-[#1FB6FF] hover:from-[#083B6B] hover:to-[#1398d8] text-white py-4 rounded-2xl font-black tracking-widest shadow-xl shadow-blue-500/20 transition-all hover:-translate-y-0.5 active:scale-[0.98]"
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