import React from 'react';

interface LogoProps {
    size?: number;
    showText?: boolean;
    className?: string;
    theme?: 'light' | 'dark';
    variant?: 'colored' | 'white' | 'multicolor';
}

const Logo: React.FC<LogoProps> = ({ size = 36, className = "" }) => {
    return (
        <div className={`flex items-center ${className}`}>
            <img
                src="/StoreAI-Logo-new.png"
                alt="StoreAI Multi-Tenant"
                style={{ height: `${size}px`, width: 'auto' }}
                className="object-contain hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                    e.currentTarget.src = '/logo-transparent.png';
                }}
            />
        </div>
    );
};

export default Logo;




