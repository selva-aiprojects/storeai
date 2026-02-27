import React from 'react';
import Logo from './Logo';

const Footer = () => {
    return (
        <footer className="w-full mt-auto py-4 px-6 sm:px-12 flex items-center justify-between border-t border-slate-100 bg-white/50">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                © {new Date().getFullYear()} StoreAI Intelligence Platform
            </div>
            <div className="flex items-center gap-4 text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                <span>Enterprise v2.0</span>
                <span className="h-1 w-1 rounded-full bg-slate-200"></span>
                <span>System Secure</span>
            </div>
        </footer>
    );
};

export default Footer;
