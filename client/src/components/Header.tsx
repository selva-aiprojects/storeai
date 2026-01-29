import { RefreshCw, Plus, Menu, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = ({ refreshData, setModal, setSidebarOpen, user }: any) => {
    const location = useLocation();
    const navigate = useNavigate();

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'DASHBOARD';
        const name = path.substring(1).toUpperCase();
        return name || 'DASHBOARD';
    };

    const showNewButton = ['/inventory', '/sales', '/purchases', '/hr', '/customers', '/accounts'].includes(location.pathname);

    return (
        <header className="header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button
                    className="mobile-toggle"
                    onClick={() => setSidebarOpen(true)}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'none' // Controlled by CSS media query
                    }}
                >
                    <Menu size={24} />
                </button>
                <div className="header-title" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', lineHeight: 1.2 }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{getPageTitle()}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-600)', fontWeight: 600, letterSpacing: '0.05em' }}>
                        {user?.activeTenant?.name ? user.activeTenant.name.toUpperCase() : 'OPERATIONAL CORE'}
                    </span>
                </div>
            </div>
            <div className="header-actions">
                <button className="btn btn-secondary" onClick={() => {
                    const path = location.pathname;
                    let scope = 'essential';
                    if (path === '/sales' || path === '/customers') scope = 'sales';
                    if (path === '/inventory' || path === '/purchases') scope = 'purchases';
                    if (path === '/hr') scope = 'hr';
                    if (path === '/accounts' || path === '/financials') scope = 'finance';
                    refreshData(scope);
                }}>
                    <RefreshCw size={14} /> <span className="btn-text">SYNC</span>
                </button>
                <button
                    className="btn"
                    style={{
                        background: 'linear-gradient(135deg, #6366f1, #d946ef)',
                        border: 'none',
                        color: 'white',
                        boxShadow: '0 4px 14px 0 rgba(124, 58, 237, 0.4)'
                    }}
                    onClick={() => navigate('/assistant')}
                >
                    <Sparkles size={16} /> <span className="btn-text">AI INTELLIGENCE</span>
                </button>
                {showNewButton && (
                    <button className="btn btn-primary" onClick={() => {
                        const path = location.pathname;
                        let type = path.substring(1);
                        if (path === '/accounts' || path === '/financials') type = 'payment';
                        if (path === '/hr') type = 'employees';
                        if (path === '/purchases') type = 'orders';
                        setModal({ type });
                    }}>
                        <Plus size={16} /> <span className="btn-text">NEW ENTRY</span>
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
