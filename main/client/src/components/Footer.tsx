import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="footer relative mt-auto py-12 px-6 bg-white overflow-hidden">
            {/* Wave Decoration */}
            <div
                className="absolute top-0 left-0 right-0 h-16 bg-[#f8fafc]"
                style={{
                    borderBottomLeftRadius: '50% 40px',
                    borderBottomRightRadius: '50% 40px'
                }}
            />

            <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center gap-6">
                <div className="flex flex-col items-center gap-4">
                    <img
                        src="/StoreAI-Logo-new.png"
                        alt="StoreAI Footer"
                        className="h-24 object-contain"
                        style={{ filter: 'grayscale(100%) opacity(0.5)' }}
                    />
                    <div className="h-px w-12 bg-slate-200" />
                    <p className="text-[10px] font-black tracking-[0.3em] text-slate-400 uppercase">
                        Multi-Tenant Intelligence
                    </p>
                </div>

                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    © {new Date().getFullYear()} StoreAI Global Platform. All rights reserved.
                </div>
            </div>
        </footer>
    );
};

export default Footer;
