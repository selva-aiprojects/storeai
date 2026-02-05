import React from 'react';

interface LogoProps {
    size?: number;
    showText?: boolean;
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 48, showText = false, className = "" }) => {
    return (
        <div className={`flex items-center justify-center ${className}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
                position: 'relative',
                width: size,
                height: size,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
            }}>
                {/* Dynamic Glow Effect */}
                <div style={{
                    position: 'absolute',
                    width: '60%',
                    height: '60%',
                    background: 'var(--primary-400)',
                    filter: 'blur(20px)',
                    opacity: 0.3,
                    borderRadius: '50%',
                    zIndex: 0
                }} />

                <img
                    src="/StoreAI-Logo.png"
                    alt="StoreAI"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        position: 'relative',
                        zIndex: 1,
                        filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.1))'
                    }}
                    onError={(e) => {
                        // Simple SVG fallback if image not found
                        e.currentTarget.style.display = 'none';
                    }}
                />
            </div>

            {/* If the user really wants text, we provide it but make it very clean and elegant */}
            {showText && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    lineHeight: 1,
                    marginLeft: '14px',
                }}>
                    <span style={{
                        fontSize: size > 60 ? '1.4rem' : '1.1rem',
                        fontWeight: 900,
                        letterSpacing: '0.05em',
                        color: 'white',
                        textTransform: 'uppercase'
                    }}>
                        STORE<span style={{ color: 'var(--primary-400)' }}>AI</span>
                    </span>
                    <span style={{
                        fontSize: '0.5rem',
                        fontWeight: 800,
                        letterSpacing: '0.4em',
                        color: 'rgba(255,255,255,0.4)',
                        marginTop: '4px',
                        textTransform: 'uppercase'
                    }}>
                        INTELLIGENCE
                    </span>
                </div>
            )}
        </div>
    );
};

export default Logo;
