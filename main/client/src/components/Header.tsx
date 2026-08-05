import { RefreshCw, Plus, Menu, Sparkles, HelpCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import Logo from './Logo';

const Header = ({ refreshData, setModal, setSidebarOpen, user }: any) => {
    const location = useLocation();
    const navigate = useNavigate();

    const getPageTitle = () => {
        const path = location.pathname;
        const mapping: Record<string, string> = {
            '/': 'Executive Dashboard',
            '/pos': 'In-Store POS Billing',
            '/storefront': 'Online Web E-Store',
            '/customer-portal': 'Customer Self-Service Portal',
            '/vendor-portal': 'Supplier & Vendor Portal',
            '/products': 'Product & SKU Catalog',
            '/inventory': 'Stock Master & Inventory',
            '/warehouse-bins': 'Warehouse & Bin Storage',
            '/sales': 'Order Desk & Invoices',
            '/returns': 'Sales & Customer Returns',
            '/crm': 'CRM & Customer Relationships',
            '/loyalty': 'Loyalty & Rewards Program',
            '/subscriptions': 'Subscription & Recurring Billing',
            '/purchases': 'Procurement & Vendor POs',
            '/partners': 'Suppliers & Business Partners',
            '/logistics': 'Logistics & Outbound Fulfillment',
            '/customers': 'Customer Directory',
            '/hr-master': 'Employee Directory & HR',
            '/attendance': 'Employee Presence & Shift Logs',
            '/payroll': 'Payroll Engine & Compensation',
            '/hr-reports': 'Statutory & HR Compliance',
            '/daybook': 'Daily Financial Daybook',
            '/ledger': 'General Ledger & Accounts',
            '/liability': 'Vendor Liability Tracker',
            '/balance-sheet': 'Enterprise Balance Sheet',
            '/gst': 'GST Compliance & Filing',
            '/pl': 'Profit & Loss (P&L) Statement',
            '/config-finance': 'Finance Policy Settings',
            '/reports': 'Strategic Intelligence Reports',
            '/assistant': 'StoreAI Copilot Assistant',
            '/settings': 'System Settings & Controls',
            '/administration': 'Tenant Access & User Management',
            '/global-inventory': 'Multi-Store Global Inventory'
        };

        if (mapping[path]) return mapping[path];

        if (path.startsWith('/ledger/')) return 'Individual Account Ledger';

        const defaultTitle = path.substring(1)
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

        return defaultTitle || 'Executive Dashboard';
    };

    const pageAction = {
        '/sales': { label: 'New Manual Invoice', type: 'sales' },
        '/purchases': { label: 'New Purchase Order', type: 'orders' },
        '/inventory': { label: 'Add Product', type: 'products' },
        '/customers': { label: 'Add Customer', type: 'customers' },
        '/accounts': { label: 'New Payment', type: 'payment' },
    }[location.pathname];

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
                    onClick={() => navigate('/assistant')}
                >
                    <HelpCircle size={18} />
                </button>

                <button
                    className="p-2 text-gray-400 hover:text-sky-700 hover:bg-sky-50 rounded-full transition-all"
                    title="Sync Data"
                    onClick={() => {
                        let scope = 'essential';
                        const path = location.pathname;
                        if (path.includes('sales') || path.includes('customer') || path.includes('pos')) scope = 'sales';
                        if (path.includes('purchase') || path.includes('inventory') || path.includes('warehouse')) scope = 'purchases';
                        if (path.includes('hr') || path.includes('employee') || path.includes('payroll')) scope = 'hr';
                        if (path.includes('ledger') || path.includes('daybook') || path.includes('pl') || path.includes('gst')) scope = 'finance';
                        refreshData(scope);
                    }}
                >
                    <RefreshCw size={18} />
                </button>

                {pageAction && (
                    <button
                        className="btn btn-primary text-xs font-bold"
                        onClick={() => setModal({ type: pageAction.type })}
                    >
                        <Plus size={16} />
                        {pageAction.label}
                    </button>
                )}

                <button
                    className="btn btn-secondary flex items-center gap-2 text-xs font-bold bg-gradient-to-r from-sky-500 to-indigo-600 text-white border-0 hover:from-sky-600 hover:to-indigo-700 shadow-md shadow-indigo-500/20"
                    onClick={() => navigate('/assistant')}
                >
                    <Sparkles size={14} className="animate-pulse" />
                    <span>AI INTEL</span>
                </button>
            </div>
        </header>
    );
};

export default Header;
