import { RefreshCw, Plus, Menu, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';

const Header = ({ refreshData, setModal, setSidebarOpen, user }: any) => {
    const location = useLocation();
    const navigate = useNavigate();

    const getPageTitle = () => {
        // ... mapping omitted for brevity if using replace_file_content rules ...
        // wait, I must match exactly.
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
            <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '40px' }}>
                <button
                    className="mobile-toggle"
                    onClick={() => setSidebarOpen(true)}
                >
                    <Menu size={24} />
                </button>

                <div className="header-brand hidden sm:flex">
                    <Logo size={14} />
                </div>

                <div className="header-title flex flex-col items-start gap-1">
                    <span className="title-text text-lg font-black tracking-tight text-[#002244] uppercase leading-none">{getPageTitle()}</span>
                    <span className="tenant-text text-[10px] font-bold tracking-widest text-[#0061A8]/80 uppercase leading-none">
                        {user?.activeTenant?.name ? user.activeTenant.name : 'STOREAI ENTERPRISE'}
                    </span>
                </div>
            </div>
            <div className="header-actions flex items-center gap-3">
                <button
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                    title="Help Guide"
                    onClick={() => setModal({ type: 'help' })}
                >
                    <HelpCircle size={18} />
                </button>

                <button
                    className="p-2 text-gray-400 hover:text-sky-700 hover:bg-sky-50 rounded-full transition-all"
                    title="Sync Data"
                    onClick={() => {
                        const path = location.pathname;
                        let scope = 'essential';
                        if (path === '/sales' || path === '/customers') scope = 'sales';
                        if (path === '/inventory' || path === '/purchases') scope = 'purchases';
                        if (path === '/hr') scope = 'hr';
                        if (path === '/accounts' || path === '/financials') scope = 'finance';
                        refreshData(scope);
                    }}
                >
                    <RefreshCw size={18} />
                </button>

                <div className="h-6 w-px bg-gray-200 mx-1"></div>

                <button
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-[#0061A8] bg-[#0061A8]/5 hover:bg-[#0061A8]/10 border border-[#0061A8]/20 transition-all uppercase tracking-wider"
                    onClick={() => navigate('/stock-analyzer')}
                >
                    <TrendingUp size={16} />
                    <span>Market Intel</span>
                </button>

                <button
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-white bg-gradient-to-r from-[#0061A8] to-[#00A3E0] hover:shadow-lg hover:shadow-blue-900/10 transition-all uppercase tracking-wider"
                    onClick={() => navigate('/assistant')}
                >
                    <Sparkles size={16} />
                    <span>AI Intel</span>
                </button>

                {showNewButton && (
                    <button
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black text-white bg-[#001a33] hover:bg-[#002244] transition-all ml-2 uppercase tracking-wider shadow-lg shadow-slate-900/10"
                        onClick={() => {
                            const path = location.pathname;
                            let type = path.substring(1);
                            if (path === '/accounts' || path === '/financials') type = 'payment';
                            if (path === '/hr') type = 'employees';
                            if (path === '/purchases') type = 'orders';
                            setModal({ type });
                        }}
                    >
                        <Plus size={16} />
                        <span>New Entry</span>
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
