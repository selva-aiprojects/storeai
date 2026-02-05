import React from 'react';

interface LogoProps {
    size?: number;
    showText?: boolean;
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 60, showText = false, className = "" }) => {
    return (
        <div className={`flex items-center ${className}`} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
                position: 'relative',
                width: size,
                height: size,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: size > 40 ? '10px' : '6px',
                background: '#f0f9ff', // Celestial Light Blue/White background
                borderRadius: size > 40 ? '16px' : '10px',
                border: '2px solid #bae6fd',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(255,255,255,0.5)',
                overflow: 'hidden'
            }}>
                <img
                    src="/StoreAI-Logo.png"
                    alt="StoreAI"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        position: 'relative',
                        zIndex: 1,
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                    }}
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                    }}
                />
            </div>

            {showText && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    lineHeight: 1,
                    marginLeft: '16px',
                }}>
                    <span style={{
                        fontSize: size > 80 ? '1.8rem' : '1.25rem',
                        fontWeight: 950,
                        letterSpacing: '0.05em',
                        color: 'white',
                        textTransform: 'uppercase',
                        textShadow: '0 2px 10px rgba(0,0,0,0.5)'
                    }}>
                        STORE<span style={{ color: 'var(--primary-400)' }}>AI</span>
                    </span>
                    <span style={{
                        fontSize: size > 80 ? '0.7rem' : '0.6rem',
                        fontWeight: 800,
                        letterSpacing: '0.45em',
                        color: 'rgba(255,255,255,0.5)',
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
