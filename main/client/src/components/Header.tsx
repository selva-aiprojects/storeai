import { RefreshCw, Plus, Menu, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';

const Header = ({ refreshData, setModal, setSidebarOpen, user }: any) => {
    const location = useLocation();
    const navigate = useNavigate();

    const getPageTitle = () => {
        const path = location.pathname;
        const mapping: Record<string, string> = {
            '/': 'Dashboard',
            '/products': 'Product Catalog',
            '/inventory': 'Stock Master',
            '/sales': 'Sales [POS]',
            '/returns': 'Sales Returns',
            '/purchases': 'Procurement Hub',
            '/partners': 'Partners',
            '/customers': 'Customers',
            '/hr-master': 'Employee Master',
            '/attendance': 'Attendance Master',
            '/payroll': 'Payroll Engine',
            '/hr-reports': 'Statutory Reports',
            '/daybook': 'Daybook (Daily)',
            '/ledger': 'General Ledger',
            '/liability': 'Liability Tracker',
            '/gst': 'GST Compliance',
            '/pl': 'Profit & Loss (P&L)',
            '/config-finance': 'Finance Policies',
            '/reports': 'Strategic Reports',
            '/assistant': 'AI Intelligence',
            '/settings': 'System Settings'
        };
        const defaultTitle = path.substring(1)
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        return mapping[path] || (defaultTitle || 'Dashboard');
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

                <div className="header-title flex flex-col items-start gap-1">
                    <span className="title-text text-lg font-black tracking-tight text-[#002244] leading-none">{getPageTitle()}</span>
                    <span className="tenant-text text-[10px] font-bold tracking-widest text-[#0061A8]/80 uppercase leading-none">
                        {user?.activeTenant?.name ? user.activeTenant.name : 'StoreAI Enterprise'}
                    </span>
                </div>
            </div>
            <div className="header-actions flex items-center gap-3">
                <div className="tenant-logo-header mr-2 flex items-center justify-center bg-white/50 backdrop-blur-sm p-1.5 rounded-lg border border-gray-100/50 shadow-sm">
                    <img
                        src={user?.activeTenant?.logo || '/logo-mt.png'}
                        alt={user?.activeTenant?.name || 'StoreAI'}
                        className="h-7 w-auto object-contain"
                    />
                </div>
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
