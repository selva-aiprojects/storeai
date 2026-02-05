import React from 'react';

interface LogoProps {
    size?: number;
    showText?: boolean;
    className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 96, showText = false, className = "" }) => {
    // We'll use the new logo image saved in public/logo-mt.png
    // The image contains both the icon and the text "StoreAI MULTI-TENANT"

    return (
        <div className={`flex items-center ${className}`} style={{ display: 'inline-flex', alignItems: 'center' }}>
            <div style={{
                position: 'relative',
                width: showText ? 'auto' : size,
                height: size,
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden',
                borderRadius: '8px'
            }}>
                {showText ? (
                    // Full Brand Identity (Horizontal)
                    <img
                        src="/logo-mt.png"
                        alt="StoreAI MULTI-TENANT"
                        style={{
                            height: size,
                            width: 'auto',
                            objectFit: 'contain',
                            display: 'block'
                        }}
                        onError={(e) => {
                            // Fallback if image fails
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                ) : (
                    // Icon Only Mode (Square-ish crop of the brain/store icon)
                    <div style={{
                        width: size,
                        height: size,
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'transparent'
                    }}>
                        <img
                            src="/logo-mt.png"
                            alt="StoreAI"
                            style={{
                                height: size * 1.8, // Zoom more to make icon visible
                                width: 'auto',
                                maxWidth: 'none',
                                objectFit: 'cover',
                                objectPosition: '0% center', // Focus on the icon at the very left
                            }}
                        />
                    </div>
                )}
            </div>

            {/* 
                Since the new logo image already has the text "StoreAI MULTI-TENANT",
                visible when showText is true (because we show the full horizontal image),
                we don't render additional separate text here to avoid duplication.
            */}
        </div>
    );
};

export default Logo;
