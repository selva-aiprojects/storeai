import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

/** Displays only when one or more API requests have remained active for two seconds. */
const GlobalSlowLoader = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handleSlowLoading = (event: Event) => {
            setVisible(Boolean((event as CustomEvent<{ visible: boolean }>).detail?.visible));
        };
        document.addEventListener('storeai:slow-loading', handleSlowLoading);
        return () => document.removeEventListener('storeai:slow-loading', handleSlowLoading);
    }, []);

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="fixed inset-0 z-[100000] flex items-center justify-center bg-slate-950/25 backdrop-blur-[2px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    aria-live="polite"
                    aria-label="Loading"
                >
                    <motion.div
                        className="flex min-w-[220px] flex-col items-center gap-3 rounded-2xl bg-white px-7 py-6 text-center shadow-2xl ring-1 ring-slate-200"
                        initial={{ scale: 0.96, y: 8 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.96, y: 8 }}
                    >
                        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
                        <div>
                            <p className="text-sm font-bold text-slate-800">Still working…</p>
                            <p className="mt-1 text-xs text-slate-500">Fetching the latest workspace data.</p>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default GlobalSlowLoader;
