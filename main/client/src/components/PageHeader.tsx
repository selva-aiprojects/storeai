import React from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    subtitle: string;
    icon: LucideIcon;
    badge?: string;
    badgeColor?: 'emerald' | 'cyan' | 'purple' | 'amber' | 'rose' | 'indigo' | 'sky';
    actions?: React.ReactNode;
    iconGradient?: string;
}

export default function PageHeader({
    title,
    subtitle,
    icon: Icon,
    badge,
    badgeColor = 'cyan',
    actions,
    iconGradient = 'from-cyan-500 to-blue-600'
}: PageHeaderProps) {

    const badgeStyles = {
        emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        cyan: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
        purple: 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800',
        amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800',
        indigo: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
        sky: 'bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    };

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 shadow-sm mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-all font-['Outfit']">
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${iconGradient} text-white flex items-center justify-center font-bold shadow-lg shadow-cyan-500/10 shrink-0`}>
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            {title}
                        </h1>
                        {badge && (
                            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${badgeStyles[badgeColor]}`}>
                                {badge}
                            </span>
                        )}
                    </div>
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        {subtitle}
                    </p>
                </div>
            </div>

            {actions && (
                <div className="flex items-center gap-3 flex-wrap w-full sm:w-auto justify-start sm:justify-end">
                    {actions}
                </div>
            )}
        </div>
    );
}
