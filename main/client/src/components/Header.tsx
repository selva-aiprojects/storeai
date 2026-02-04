import { RefreshCw, Plus, Menu, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Header = ({ refreshData, setModal, setSidebarOpen, user }: any) => {
    const location = useLocation();
    const navigate = useNavigate();

    const getPageTitle = () => {
        const path = location.pathname;
        const mapping: Record<string, string> = {
            '/': 'DASHBOARD',
            '/products': 'PRODUCT CATALOG',
            '/inventory': 'STOCK MASTER',
            '/sales': 'SALES [POS]',
            '/returns': 'SALES RETURNS',
            '/purchases': 'PROCUREMENT HUB',
            '/partners': 'PARTNERS',
            '/customers': 'CUSTOMERS',
            '/hr-master': 'EMPLOYEE MASTER',
            '/attendance': 'ATTENDANCE MASTER',
            '/payroll': 'PAYROLL ENGINE',
            '/hr-reports': 'STATUTORY REPORTS',
            '/daybook': 'DAYBOOK (DAILY)',
            '/ledger': 'GENERAL LEDGER',
            '/liability': 'LIABILITY TRACKER',
            '/gst': 'GST COMPLIANCE',
            '/pl': 'PROFIT & LOSS (P&L)',
            '/config-finance': 'FINANCE POLICIES',
            '/reports': 'STRATEGIC REPORTS',
            '/assistant': 'AI INTELLIGENCE',
            '/settings': 'SYSTEM SETTINGS'
        };
        return mapping[path] || (path.substring(1).replace('-', ' ').toUpperCase() || 'DASHBOARD');
    };

    const showNewButton = ['/inventory', '/sales', '/purchases', '/hr', '/customers', '/accounts'].includes(location.pathname);

    return (
        <header className="header">
            <div className="header-left">
                <button
                    className="mobile-toggle"
                    onClick={() => setSidebarOpen(true)}
                >
                    <Menu size={22} />
                </button>
                <div className="header-title">
                    <span className="title-text">{getPageTitle()}</span>
                    <span className="tenant-text">
                        {user?.activeTenant?.name ? user.activeTenant.name.toUpperCase() : 'STOREAI ENTERPRISE'}
                    </span>
                </div>
            </div>
            <div className="header-actions">
                <button
                    className="btn btn-secondary"
                    title="Help Guide"
                    onClick={() => setModal({ type: 'help' })}
                    style={{ background: 'rgba(14, 165, 233, 0.08)', color: 'var(--secondary-500)', border: '1px solid rgba(14, 165, 233, 0.2)' }}
                >
                    <HelpCircle size={16} /> <span className="btn-text">HELP</span>
                </button>
                <button className="btn btn-secondary" onClick={() => {
                    const path = location.pathname;
                    let scope = 'essential';
                    if (path === '/sales' || path === '/customers') scope = 'sales';
                    if (path === '/inventory' || path === '/purchases') scope = 'purchases';
                    if (path === '/hr') scope = 'hr';
                    if (path === '/accounts' || path === '/financials') scope = 'finance';
                    refreshData(scope);
                }}>
                    <RefreshCw size={16} /> <span className="btn-text">SYNC</span>
                </button>
                <button
                    className="btn"
                    style={{
                        background: 'linear-gradient(135deg, #0ea5e9, #2563eb)',
                        border: 'none',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)'
                    }}
                    onClick={() => navigate('/stock-analyzer')}
                >
                    <TrendingUp size={16} /> <span className="btn-text">MARKET</span>
                </button>
                <button
                    className="btn"
                    style={{
                        background: 'var(--primary-gradient)',
                        border: 'none',
                        color: 'white',
                        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
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
                        <Plus size={18} /> <span className="btn-text">NEW ENTRY</span>
                    </button>
                )}

            </div>
        </header>
    );
};

export default Header;
