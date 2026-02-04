import React from 'react';

interface LogoProps {
    size?: number;
    showText?: boolean;
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 40, showText = false, className = "" }) => {
    return (
        <div className={`flex items-center gap-3 ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ flexShrink: 0 }}
            >
                {/* Cube Base - Grouped for easier styling */}
                <g id="StoreAI_Cube">
                    {/* Left Face - Solid Navy */}
                    <path
                        d="M15 30L50 50V90L15 70V30Z"
                        fill="#0f172a"
                    />
                    {/* Top Face - Indigo Gradient */}
                    <path
                        d="M15 30L50 10L85 30L50 50L15 30Z"
                        fill="#1e293b"
                    />
                    <path
                        d="M50 10L85 30L50 50L15 30L50 10Z"
                        fill="url(#topGradient)"
                        fillOpacity="0.8"
                    />

                    {/* Right Face - Transitioning to Neural Network */}
                    <path
                        d="M85 30V70L50 90V50L85 30Z"
                        fill="#1e1b4b"
                    />

                    {/* Right Face Neural Overlay */}
                    <g id="Neural_Network">
                        {/* Nodes */}
                        <circle cx="50" cy="50" r="3" fill="#6366f1" />
                        <circle cx="85" cy="30" r="3" fill="#6366f1" />
                        <circle cx="85" cy="70" r="3" fill="#6366f1" />
                        <circle cx="50" cy="90" r="3" fill="#6366f1" />
                        <circle cx="67.5" cy="40" r="2.5" fill="#818cf8" />
                        <circle cx="67.5" cy="80" r="2.5" fill="#818cf8" />

                        {/* Connections */}
                        <line x1="50" y1="50" x2="85" y2="30" stroke="#4f46e5" strokeWidth="1.5" opacity="0.6" />
                        <line x1="85" y1="30" x2="85" y2="70" stroke="#4f46e5" strokeWidth="1.5" opacity="0.6" />
                        <line x1="85" y1="70" x2="50" y2="90" stroke="#4f46e5" strokeWidth="1.5" opacity="0.6" />
                        <line x1="50" y1="90" x2="50" y2="50" stroke="#4f46e5" strokeWidth="1.5" opacity="0.6" />
                        <line x1="50" y1="50" x2="85" y2="70" stroke="#4f46e5" strokeWidth="1" opacity="0.4" />
                        <line x1="85" y1="30" x2="50" y2="90" stroke="#4f46e5" strokeWidth="1" opacity="0.4" />
                        <line x1="67.5" y1="40" x2="67.5" y2="80" stroke="#4f46e5" strokeWidth="0.8" opacity="0.3" />
                    </g>
                </g>

                <defs>
                    <linearGradient id="topGradient" x1="15" y1="30" x2="85" y2="30" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#4f46e5" />
                        <stop offset="1" stopColor="#6366f1" />
                    </linearGradient>
                </defs>
            </svg>

            {showText && (
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                    <span style={{
                        fontSize: size > 60 ? '1.5rem' : '1.1rem',
                        fontWeight: 900,
                        letterSpacing: '0.05em',
                        color: 'inherit'
                    }}>
                        STORE<span style={{ color: '#4f46e5' }}>AI</span>
                    </span>
                    <span style={{
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        letterSpacing: '0.2em',
                        opacity: 0.5,
                        marginTop: '2px'
                    }}>
                        INTELLIGENCE
                    </span>
                </div>
            )}
        </div>
    );
};

export default Logo;
