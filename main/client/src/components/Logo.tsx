import React from 'react';

interface LogoProps {
    size?: number;
    showText?: boolean;
    className?: string;
    theme?: 'light' | 'dark';
    variant?: 'colored' | 'white';
}

const Logo: React.FC<LogoProps> = ({ size = 96, showText = false, className = "", theme = 'dark', variant }) => {
    const effectiveSize = size * 2.5;

    // Default to 'colored' unless explicitly 'white' or if theme is dark and variant not specified
    const activeVariant = variant || (theme === 'dark' ? 'white' : 'colored');

    const coloredLogo = '/StoreAI-Logo-new.png';
    const whiteLogo = '/StoreAI-Logo-new.png'; // If we had a dedicated white one, we'd use it. For now use colored or apply filter.

    const primaryLogo = activeVariant === 'white' ? whiteLogo : coloredLogo;
    const fallbackLogo = '/StoreAI-Logo-new.png';
    const iconPath = '/storeai-app-icon.png';

    const styleFilter = activeVariant === 'white'
        ? 'brightness(0) invert(1) drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
        : 'none';

    return (
        <div className={`flex items-center ${className}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
            <div style={{
                position: 'relative',
                width: showText ? 'auto' : '42px',
                height: showText ? effectiveSize : '42px',
                display: 'flex',
                alignItems: 'center',
                overflow: 'visible',
                borderRadius: '8px',
            }}>
                {showText ? (
                    <img
                        src={primaryLogo}
                        alt="StoreAI"
                        style={{
                            height: effectiveSize,
                            width: 'auto',
                            objectFit: 'contain',
                            display: 'block',
                            filter: styleFilter
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
