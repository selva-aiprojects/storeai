import React from 'react';

interface LogoProps {
    size?: number;
    showText?: boolean;
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 40, showText = false, className = "" }) => {
    return (
        <div className={`flex items-center gap-3 ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', width: size, height: size }}>
                {/* Visual Glow Effect */}
                <div style={{
                    position: 'absolute',
                    top: '15%',
                    left: '15%',
                    width: '70%',
                    height: '70%',
                    background: 'var(--primary-500)',
                    filter: 'blur(12px)',
                    opacity: 0.4,
                    borderRadius: '50%'
                }} />

                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ position: 'relative', zIndex: 1 }}
                >
                    <defs>
                        <linearGradient id="logoTopGradient" x1="15" y1="30" x2="85" y2="30" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#6366f1" />
                            <stop offset="1" stopColor="#a5b4fc" />
                        </linearGradient>
                        <linearGradient id="logoLeftGradient" x1="15" y1="30" x2="50" y2="90" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#4f46e5" />
                            <stop offset="1" stopColor="#3b82f6" />
                        </linearGradient>
                        <linearGradient id="logoRightGradient" x1="50" y1="50" x2="85" y2="70" gradientUnits="userSpaceOnUse">
                            <stop stopColor="#1e293b" />
                            <stop offset="1" stopColor="#475569" />
                        </linearGradient>
                    </defs>

                    <g id="StoreAI_Icon_Group">
                        {/* Left Face */}
                        <path
                            d="M15 30L50 50V90L15 70V30Z"
                            fill="url(#logoLeftGradient)"
                        />
                        {/* Top Face */}
                        <path
                            d="M15 30L50 10L85 30L50 50L15 30Z"
                            fill="url(#logoTopGradient)"
                        />
                        {/* Right Face */}
                        <path
                            d="M85 30V70L50 90V50L85 30Z"
                            fill="url(#logoRightGradient)"
                        />

                        {/* Intelligence Overlay */}
                        <g id="Neural_Overlay">
                            <line x1="50" y1="50" x2="85" y2="30" stroke="white" strokeWidth="0.5" opacity="0.3" />
                            <line x1="85" y1="30" x2="85" y2="70" stroke="white" strokeWidth="0.5" opacity="0.3" />
                            <line x1="85" y1="70" x2="50" y2="90" stroke="white" strokeWidth="0.5" opacity="0.3" />

                            {/* Nodes */}
                            <circle cx="50" cy="50" r="3.5" fill="white" />
                            <circle cx="85" cy="30" r="3.5" fill="white" />
                            <circle cx="85" cy="70" r="3.5" fill="white" />
                            <circle cx="50" cy="90" r="3.5" fill="white" />
                            <circle cx="67.5" cy="40" r="2" fill="#818cf8" />
                            <circle cx="67.5" cy="80" r="2" fill="#818cf8" />
                        </g>
                    </g>
                </svg>
            </div>

            {showText && (
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                    <span style={{
                        fontSize: size > 60 ? '1.5rem' : '1.15rem',
                        fontWeight: 900,
                        letterSpacing: '0.05em',
                        color: 'white'
                    }}>
                        STORE<span style={{ color: 'var(--primary-400)' }}>AI</span>
                    </span>
                    <span style={{
                        fontSize: '0.55rem',
                        fontWeight: 800,
                        letterSpacing: '0.25em',
                        color: 'rgba(255,255,255,0.5)',
                        marginTop: '4px'
                    }}>
                        INTELLIGENCE
                    </span>
                </div>
            )}
        </div>
    );
};

export default Logo;
