import React from 'react';

interface LogoProps {
    size?: number;
    showText?: boolean;
    className?: string;
    theme?: 'light' | 'dark';
    variant?: 'colored' | 'white' | 'multicolor';
    scale?: number;
    animated?: boolean;
}

/**
 * StoreAI — Premium Theme-Matched SVG Logo
 *
 * Color palette perfectly aligned with Landing page:
 *   Primary CTA  : #06b6d4 → #3b82f6 → #4f46e5  (cyan-500 → blue-500 → indigo-600)
 *   Hero headline: #22d3ee → #38bdf8 → #818cf8   (cyan-400 → sky-300 → indigo-400)
 *   Glow shadow  : rgba(6,182,212,0.45)
 *
 * Icon concept: "Neural Store" — a stylised S-curve formed by two flowing
 * arcs (representing seamless commerce flow) with a bright AI node at the
 * crossing point and data-pulse dots at each terminus.
 */
const Logo: React.FC<LogoProps> = ({
    size = 36,
    showText = true,
    className = '',
    theme = 'dark',
    animated = true,
}) => {
    const h = size;
    const isDark  = theme === 'dark';
    const nameCol = isDark ? '#f1f5f9' : '#0f172a';   // slate-100 / slate-900
    const subCol  = isDark ? '#64748b' : '#94a3b8';   // slate-500 / slate--400

    // One stable id root per size so multiple instances never collide in the DOM
    const r = `sai${h}`;

    return (
        <div
            className={`inline-flex items-center select-none ${className}`}
        >
            {/* ════════════════════════════
                SVG ICON MARK
            ════════════════════════════ */}
            <svg
                width={h}
                height={h}
                viewBox="0 0 44 44"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
                style={{ flexShrink: 0 }}
                className={animated ? 'transition-all duration-300 hover:drop-shadow-[0_0_16px_rgba(6,182,212,0.9)]' : ''}
            >
                <defs>
                    {/* ── Primary gradient (matches CTA button exactly) ── */}
                    <linearGradient id={`${r}G`} x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                        <stop offset="0%"   stopColor="#06b6d4" /> {/* cyan-500   */}
                        <stop offset="48%"  stopColor="#3b82f6" /> {/* blue-500   */}
                        <stop offset="100%" stopColor="#4f46e5" /> {/* indigo-600 */}
                    </linearGradient>

                    {/* ── Bright accent for AI node (cyan-400) ── */}
                    <linearGradient id={`${r}A`} x1="0" y1="0" x2="10" y2="10" gradientUnits="userSpaceOnUse">
                        <stop offset="0%"   stopColor="#67e8f9" /> {/* cyan-300  */}
                        <stop offset="100%" stopColor="#a5f3fc" /> {/* cyan-200  */}
                    </linearGradient>

                    {/* ── Hero-headline gradient (for wordmark AI letters) ── */}
                    <linearGradient id={`${r}W`} x1="0" y1="0" x2="100%" y2="0" gradientUnits="userSpaceOnUse">
                        <stop offset="0%"   stopColor="#22d3ee" /> {/* cyan-400  */}
                        <stop offset="50%"  stopColor="#38bdf8" /> {/* sky-400   */}
                        <stop offset="100%" stopColor="#818cf8" /> {/* indigo-400*/}
                    </linearGradient>

                    {/* ── Outer glow blur for the AI node ── */}
                    <filter id={`${r}F`} x="-80%" y="-80%" width="260%" height="260%">
                        <feGaussianBlur stdDeviation="2.2" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* ── Subtle tile inner-glow ── */}
                    <filter id={`${r}T`} x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* ── Tile background ── */}
                {/* Outer glow halo */}
                <rect x="0" y="0" width="44" height="44" rx="12"
                    fill={`url(#${r}G)`} opacity="0.12"
                    filter={`url(#${r}T)`}
                />
                {/* Dark card fill */}
                <rect x="1.5" y="1.5" width="41" height="41" rx="11"
                    fill={isDark ? '#050c1f' : '#ffffff'}
                />
                {/* Gradient border */}
                <rect x="1.5" y="1.5" width="41" height="41" rx="11"
                    fill="none"
                    stroke={`url(#${r}G)`}
                    strokeWidth="1.5"
                    opacity="0.9"
                />
                {/* Very subtle inner gradient overlay */}
                <rect x="1.5" y="1.5" width="41" height="41" rx="11"
                    fill={`url(#${r}G)`} opacity="0.07"
                />

                {/* ── The "Neural S" icon mark ──
                    Two flowing bezier arcs forming an S-curve.
                    They share a crossing midpoint where the AI node sits.
                    Top arc: right → left (top half of S)
                    Bottom arc: left → right (bottom half of S)
                ── */}

                {/* Top arc of S */}
                <path
                    d="M 30 13 C 30 9.5 26.5 8 22 8 C 17.5 8 14 10.5 14 14.5 C 14 19 18 21 22 22"
                    stroke={`url(#${r}G)`}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.95"
                />
                {/* Bottom arc of S */}
                <path
                    d="M 14 31 C 14 34.5 17.5 36 22 36 C 26.5 36 30 33.5 30 29.5 C 30 25 26 23 22 22"
                    stroke={`url(#${r}G)`}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.95"
                />

                {/* Terminus dot – top-right of S */}
                <circle cx="30" cy="13" r="2.2" fill={`url(#${r}G)`} opacity="0.7" />
                {/* Terminus dot – bottom-left of S */}
                <circle cx="14" cy="31" r="2.2" fill={`url(#${r}G)`} opacity="0.7" />

                {/* ── AI Node (midpoint crossing) ── */}
                {/* Outer pulse ring */}
                <circle cx="22" cy="22" r="5.5" fill={`url(#${r}G)`} opacity="0.18" />
                {/* Mid ring */}
                <circle cx="22" cy="22" r="3.8" fill={`url(#${r}G)`} opacity="0.35" />
                {/* Core dot with glow */}
                <circle cx="22" cy="22" r="2.4"
                    fill={`url(#${r}A)`}
                    filter={`url(#${r}F)`}
                />

                {/* Tiny 4-point sparkle cross on the AI node */}
                <path d="M 22 19 L 22 17.5" stroke="#a5f3fc" strokeWidth="1" strokeLinecap="round" opacity="0.8"/>
                <path d="M 22 25 L 22 26.5" stroke="#a5f3fc" strokeWidth="1" strokeLinecap="round" opacity="0.8"/>
                <path d="M 19 22 L 17.5 22" stroke="#a5f3fc" strokeWidth="1" strokeLinecap="round" opacity="0.8"/>
                <path d="M 25 22 L 26.5 22" stroke="#a5f3fc" strokeWidth="1" strokeLinecap="round" opacity="0.8"/>
            </svg>

            {/* ════════════════════════════
                WORDMARK
            ════════════════════════════ */}
            {showText && (
                <div
                    className="ml-2.5"
                    style={{ lineHeight: 1, userSelect: 'none' }}
                >
                    {/* Name row */}
                    <div style={{ display: 'flex', alignItems: 'baseline' }}>
                        {/* "Store" — clean white/dark */}
                        <span style={{
                            fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                            fontSize : `${h * 0.52}px`,
                            fontWeight: 700,
                            letterSpacing: '-0.03em',
                            color: nameCol,
                            lineHeight: 1,
                        }}>
                            Store
                        </span>
                        {/* "AI" — hero headline gradient (matches h1) */}
                        <span style={{
                            fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                            fontSize: `${h * 0.52}px`,
                            fontWeight: 900,
                            letterSpacing: '-0.03em',
                            /* Use inline SVG linearGradient via text fill trick */
                            background: 'linear-gradient(90deg, #22d3ee 0%, #38bdf8 45%, #818cf8 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                            lineHeight: 1,
                        }}>
                            AI
                        </span>
                    </div>

                    {/* Sub-label row */}
                    <div style={{
                        fontFamily: "'Outfit', 'Inter', system-ui, sans-serif",
                        fontSize: `${h * 0.2}px`,
                        fontWeight: 700,
                        color: subCol,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        marginTop: '2.5px',
                        lineHeight: 1,
                        /* Subtle gradient on the tagline too */
                        background: 'linear-gradient(90deg, #06b6d4 0%, #6366f1 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}>
                        Commerce OS
                    </div>
                </div>
            )}
        </div>
    );
};

export default Logo;
