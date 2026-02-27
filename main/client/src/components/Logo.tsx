import React from 'react';

interface LogoProps {
    size?: number;
    showText?: boolean;
    className?: string;
    theme?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ size = 96, showText = false, className = "", theme = 'dark' }) => {
    const effectiveSize = size * 2.5;
    const primaryLogo = theme === 'light' ? '/storeai-primary-light.png' : '/storeai-primary-light.png';
    const fallbackLogo = '/StoreAI-Logo-new.png';
    const iconPath = '/storeai-app-icon.png';
    const styleFilter = theme === 'light'
        ? 'none'
        : 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))';

    return (
        <div className={`flex items-center ${className}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
            <div style={{
                position: 'relative',
                width: showText ? 'auto' : effectiveSize,
                height: effectiveSize,
                display: 'flex',
                alignItems: 'center',
                overflow: 'visible', // allow overflow so large logos don't get clipped
                borderRadius: '8px',
                filter: styleFilter
            }}>
                {showText ? (
                    <img
                        src={primaryLogo}
                        alt="StoreAI"
                        style={{
                            height: effectiveSize,
                            width: 'auto',
                            objectFit: 'contain',
                            display: 'block'
                        }}
                        onError={(e) => {
                            if (e.currentTarget.src.endsWith(primaryLogo)) {
                                e.currentTarget.src = fallbackLogo;
                                return;
                            }
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                ) : (
                    <div className="bg-gradient-to-br from-[#0061A8] to-[#00A3E0] shadow-md rounded-[0.8rem] flex items-center justify-center" style={{
                        width: '42px',
                        height: '42px',
                    }}>
                        <img
                            src={iconPath}
                            alt="StoreAI"
                            className="w-[75%] h-[75%] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Logo;
