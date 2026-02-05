import React from 'react';

interface LogoProps {
    size?: number;
    showText?: boolean;
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 40, showText = false, className = "" }) => {
    return (
        <div className={`flex items-center gap-3 ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Visual Glow behind logo for visibility on dark backgrounds */}
                <div style={{
                    position: 'absolute',
                    width: '120%',
                    height: '120%',
                    background: 'var(--primary-500)',
                    filter: 'blur(15px)',
                    opacity: 0.15,
                    borderRadius: '50%',
                    zIndex: 0
                }} />

                <img
                    src="/StoreAI-Logo.png"
                    alt="StoreAI Logo"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        position: 'relative',
                        zIndex: 1
                    }}
                    onError={(e) => {
                        // Fallback if the logo fails to load
                        e.currentTarget.style.display = 'none';
                    }}
                />
            </div>

            {showText && (
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                    <span style={{
                        fontSize: size > 60 ? '1.5rem' : size > 35 ? '1.15rem' : '0.9rem',
                        fontWeight: 900,
                        letterSpacing: '0.08em',
                        color: 'white',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                    }}>
                        STORE<span style={{ color: 'var(--primary-400)' }}>AI</span>
                    </span>
                    <span style={{
                        fontSize: size > 60 ? '0.65rem' : '0.55rem',
                        fontWeight: 800,
                        letterSpacing: '0.3em',
                        color: 'rgba(255,255,255,0.4)',
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
