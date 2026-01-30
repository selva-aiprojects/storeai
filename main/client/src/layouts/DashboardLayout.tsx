import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { AnimatePresence, motion } from 'framer-motion';

const DashboardLayout = ({ user, logout, refreshData, setModal, data, loading }: any) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const location = useLocation();
    const pageContainerRef = useRef<HTMLDivElement>(null);

    const handleSetSidebarOpen = useCallback((open: boolean) => setSidebarOpen(open), []);

    useEffect(() => {
        if (pageContainerRef.current) {
            pageContainerRef.current.scrollTo(0, 0);
        }
    }, [location.pathname]);

    useEffect(() => {
        const handleGlobalDown = (e: KeyboardEvent) => {
            if (e.key === 'F2') {
                e.preventDefault();
                setModal({ type: 'sales' });
            }
        };
        window.addEventListener('keydown', handleGlobalDown);
        return () => window.removeEventListener('keydown', handleGlobalDown);
    }, [setModal]);

    const outletContext = useMemo(() => ({ user, refreshData, setModal, data }), [user, refreshData, setModal, data]);

    return (
        <div className="app-container">
            {loading && (
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        height: '2px',
                        background: 'linear-gradient(to right, var(--accent-primary), var(--accent-secondary))',
                        zIndex: 9999,
                        boxShadow: '0 0 10px var(--accent-primary)'
                    }}
                />
            )}
            <div
                className={`sidebar-overlay ${sidebarOpen ? 'mobile-open' : ''}`}
                onClick={() => handleSetSidebarOpen(false)}
            ></div>
            <Sidebar
                user={user}
                logout={logout}
                mobileOpen={sidebarOpen}
                setMobileOpen={handleSetSidebarOpen}
                isCollapsed={sidebarCollapsed}
                setIsCollapsed={setSidebarCollapsed}
            />
            <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                <Header refreshData={refreshData} setModal={setModal} setSidebarOpen={handleSetSidebarOpen} user={user} />
                <div className="page-container" ref={pageContainerRef} style={{ position: 'relative' }}>
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={window.location.pathname}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                            style={{ width: '100%' }}
                        >
                            <Outlet context={outletContext} />
                        </motion.div>
                    </AnimatePresence>
                </div>
                <footer className="footer" style={{ padding: '20px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="footer-copyright">
                        <div style={{ color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '4px' }}>VERSION 3.0.4 // HYPERION ARCHITECTURE</div>
                        &copy; {new Date().getFullYear()} StoreAI Tactical Core. All systems operational.
                    </div>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '0.65rem', opacity: 0.6, fontWeight: 700 }}>
                        <span style={{ color: 'var(--accent-secondary)' }}>F2: NEW SALE</span>
                        <span>F9: EXECUTE</span>
                        <span>ESC: CLOSE</span>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default DashboardLayout;
