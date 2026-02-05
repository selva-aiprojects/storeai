import React from 'react';

interface LogoProps {
    size?: number;
    showText?: boolean;
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 48, showText = false, className = "" }) => {
    return (
        <div className={`flex items-center gap-3 ${className}`} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Custom Designer SVG Logo for StoreAI */}
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 100 100"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    style={{ filter: 'drop-shadow(0 0 12px rgba(99, 102, 241, 0.4))' }}
                >
                    <defs>
                        <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#0ea5e9" />
                            <stop offset="100%" stopColor="#6366f1" />
                        </linearGradient>
                        <filter id="glow">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Outer Hexagon Frame */}
                    <path
                        d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z"
                        stroke="url(#logo-gradient)"
                        strokeWidth="2"
                        fill="rgba(99, 102, 241, 0.05)"
                    />

                    {/* Central AI Node */}
                    <circle cx="50" cy="50" r="15" fill="url(#logo-gradient)" />
                    <circle cx="50" cy="50" r="22" stroke="url(#logo-gradient)" strokeWidth="1" strokeDasharray="4 4" />

                    {/* Tactical Connection Lines */}
                    <line x1="15" y1="30" x2="50" y2="50" stroke="url(#logo-gradient)" strokeWidth="0.5" opacity="0.4" />
                    <line x1="85" y1="30" x2="50" y2="50" stroke="url(#logo-gradient)" strokeWidth="0.5" opacity="0.4" />
                    <line x1="50" y1="90" x2="50" y2="50" stroke="url(#logo-gradient)" strokeWidth="0.5" opacity="0.4" />

                    {/* Glowing Accent Dots */}
                    <circle cx="15" cy="30" r="3" fill="#0ea5e9" filter="url(#glow)" />
                    <circle cx="85" cy="30" r="3" fill="#6366f1" filter="url(#glow)" />
                    <circle cx="50" cy="90" r="3" fill="#818cf8" filter="url(#glow)" />
                </svg>
            </div>

            {showText && (
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, marginLeft: '4px' }}>
                    <span style={{
                        fontSize: size > 80 ? '1.8rem' : '1.2rem',
                        fontWeight: 900,
                        letterSpacing: '0.05em',
                        color: '#fff',
                        textTransform: 'uppercase'
                    }}>
                        STORE<span style={{ background: 'linear-gradient(to right, #0ea5e9, #6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>AI</span>
                    </span>
                    <span style={{
                        fontSize: size > 80 ? '0.65rem' : '0.55rem',
                        fontWeight: 800,
                        letterSpacing: '0.35em',
                        color: 'rgba(255,255,255,0.4)',
                        textTransform: 'uppercase',
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
