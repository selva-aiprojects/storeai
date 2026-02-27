import React from 'react';
import Logo from './Logo';

const Footer = () => {
    return (
        <footer className="w-full mt-auto relative overflow-hidden bg-white border-t border-slate-200 pt-8 pb-6 px-6 sm:px-12 flex flex-col items-center">
            {/* Wavy Background Decor for Footer */}
            <div className="absolute bottom-0 left-0 w-full opacity-10 pointer-events-none transform translate-y-1/2">
                <svg viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#0061A8" fillOpacity="1" d="M0,224L48,197.3C96,171,192,117,288,112C384,107,480,149,576,165.3C672,181,768,171,864,138.7C960,107,1056,53,1152,48C1248,43,1344,85,1392,106.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
            </div>

            <div className="relative z-10 flex flex-col items-center gap-3">
                <Logo size={24} showText={true} theme="light" />
                <p className="text-slate-500 font-medium text-sm tracking-wide">
                    Multi-Tenant Intelligence Platform
                </p>
                <div className="text-slate-400 text-xs font-semibold tracking-wider mt-2">
                    © {new Date().getFullYear()} StoreAI. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
