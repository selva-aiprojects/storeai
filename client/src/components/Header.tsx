import { RefreshCw, Plus, Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Header = ({ refreshData, setModal, setSidebarOpen, user }: any) => {
    const location = useLocation();

    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'DASHBOARD';
        const name = path.substring(1).toUpperCase();
        return name || 'DASHBOARD';
    };

    const showNewButton = ['/inventory', '/sales', '/purchases', '/hr', '/customers', '/accounts'].includes(location.pathname);

    return (
        <header className="header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
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
                    <Menu size={20} />
                </button>
                <div className="header-title" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>
                    {user?.activeTenant?.name ? `${user.activeTenant.name.toUpperCase()} // ` : 'OPERATIONAL CORE // '}
                    <span style={{ color: 'var(--text-primary)' }}>{getPageTitle()}</span>
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
                }} style={{ fontSize: '0.7rem', padding: '8px 16px' }}>
                    <RefreshCw size={12} /> <span className="btn-text">Synchronize Matrix</span>
                </button>
                {showNewButton && (
                    <button className="btn btn-primary" onClick={() => {
                        const path = location.pathname;
                        let type = path.substring(1);
                        if (path === '/accounts' || path === '/financials') type = 'payment';
                        if (path === '/hr') type = 'employees';
                        if (path === '/purchases') type = 'orders';
                        setModal({ type });
                    }} style={{ fontSize: '0.7rem', padding: '8px 16px' }}>
                        <Plus size={14} /> <span className="btn-text">New Artifact</span>
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
