import React from 'react';

interface LogoProps {
    size?: number;
    showText?: boolean;
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 40, showText = false, className = "" }) => {
    return (
        <div className={`flex items-center gap-3 ${className}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', ...className ? {} : {} }}>
            <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img
                    src="/StoreAI-Logo.png"
                    alt="StoreAI Logo"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain'
                    }}
                />
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
