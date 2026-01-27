import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import { AnimatePresence, motion } from 'framer-motion';

const DashboardLayout = ({ user, logout, refreshData, setModal, data }: any) => {
    return (
        <div className="app-container">
            <Sidebar user={user} logout={logout} />
            <div className="main-content">
                <Header refreshData={refreshData} setModal={setModal} />
                <div className="page-container">
                    <AnimatePresence mode="wait">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            style={{ width: '100%' }}
                        >
                            <Outlet context={{ user, refreshData, setModal, data }} />
                        </motion.div>
                    </AnimatePresence>
                </div>
                <footer className="footer">
                    <div className="footer-branding">
                        <span style={{ fontSize: '0.65rem', letterSpacing: '0.1em' }}>A PREMIUM PRODUCT FROM</span>
                        <div className="cognivectra-logo" style={{ fontSize: '1rem' }}>
                            COGNIVE<span className="cognivectra-accent">CTRA</span>
                        </div>
                    </div>
                    <div className="footer-copyright">
                        <div style={{ color: 'var(--accent-primary)', fontWeight: 600, marginBottom: '4px' }}>VERSION 3.0.2 // TACTICAL ELEVATION BUILD</div>
                        &copy; {new Date().getFullYear()} StoreAI Enterprise Solutions. All operational telemetry strictly logged.
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default DashboardLayout;
