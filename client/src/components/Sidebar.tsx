import { LayoutDashboard, Package, Truck, Building2, CreditCard, Wallet, Users, Home, TrendingUp, Settings, LogOut, Layers, X, BarChart3, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { memo } from 'react';

const Sidebar = ({ user, logout, mobileOpen, setMobileOpen }: any) => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const handleNavigate = (path: string) => {
        navigate(path);
        if (setMobileOpen) setMobileOpen(false);
    };

    const menuItems: any[] = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard:view' },
        { divider: 'Inventory & Catalog' },
        { path: '/products', label: 'Product Catalog', icon: Layers, feature: 'RETAIL_MODULE', permission: 'inventory:read' },
        { path: '/inventory', label: 'Stock Master', icon: Package, feature: 'INVENTORY_MODULE', permission: 'inventory:read' },
        { divider: 'Trade & Logistics' },
        { path: '/sales', label: 'Sales [POS]', icon: CreditCard, feature: 'RETAIL_MODULE', permission: 'sales:read' },
        { path: '/purchases', label: 'Procurement Hub', icon: Truck, feature: 'PROCUREMENT_MODULE', permission: 'orders:read' },
        { divider: 'Organization' },
        { path: '/partners', label: 'Partners', icon: Building2, feature: 'PARTNER_MODULE', permission: 'crm:read' },
        { path: '/customers', label: 'Customers', icon: Home, feature: 'CRM_MODULE', permission: 'crm:read' },
        { path: '/hr', label: 'HR & Payroll', icon: Users, feature: 'HR_MODULE', permission: 'hr:read' },
        { divider: 'Finance & Intel' },
        { path: '/accounts', label: 'Billing & Accounts', icon: Wallet, feature: 'FINANCE_MODULE', permission: 'accounts:read' },
        { path: '/financials', label: 'Financial Performance', icon: BarChart3, feature: 'FINANCE_MODULE', permission: 'accounts:read' },
        { path: '/reports', label: 'Reports', icon: TrendingUp, feature: 'REPORT_MODULE', permission: 'reports:view' },
    ];

    if (user?.role === 'SUPER_ADMIN') {
        menuItems.push({ path: '/settings', label: 'Settings', icon: Settings, permission: 'tenants:manage' });
    }

    // Filter menu items based on features and permissions
    const filteredMenuItems = menuItems.filter(item => {
        if (item.divider) return true;

        // 1. Check Feature Flag
        if (item.feature && user?.features?.[item.feature] === false) return false;

        // 2. Check Permission
        if (item.permission && !user?.permissions?.includes(item.permission)) return false;

        return true;
    });

    return (
        <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-header">
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%', marginBottom: '4px' }}>
                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <Layers color="#818cf8" size={32} />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '0.05em', color: '#fff' }}>
                            STORE<span className="sidebar-brand-accent">AI</span>
                        </span>
                    </div>
                    {mobileOpen && (
                        <div style={{ position: 'absolute', top: '20px', right: '20px' }}>
                            <X size={20} onClick={() => setMobileOpen(false)} style={{ cursor: 'pointer', opacity: 0.7 }} />
                        </div>
                    )}
                </div>

                {/* Tenant Context Pill */}
                <div style={{
                    marginTop: '16px',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '44px'
                }}>
                    {user?.activeTenant?.logo ? (
                        <img src={user.activeTenant.logo} style={{ maxHeight: '24px', objectFit: 'contain' }} alt="Tenant" />
                    ) : (
                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.05em' }}>
                            {user?.activeTenant?.name || 'OPERANT CORE'}
                        </span>
                    )}
                </div>
            </div>

            <div className="sidebar-menu">
                {filteredMenuItems.map((item: any, index) => (
                    item.divider ? (
                        <div key={index} className="menu-divider">{item.divider}</div>
                    ) : (
                        <button
                            key={index}
                            className={`menu-item ${currentPath === item.path ? 'active' : ''}`}
                            onClick={() => handleNavigate(item.path)}
                        >
                            <item.icon size={18} style={{ marginRight: '12px', opacity: currentPath === item.path ? 1 : 0.7 }} />
                            {item.label}
                        </button>
                    )
                ))}
            </div>

            <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div className="profile-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div className="avatar" style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 700, fontSize: '0.9rem', color: '#fff'
                    }}>
                        {user.firstName[0]}
                    </div>
                    <div className="profile-info" style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{user.firstName}</span>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{user.role}</span>
                    </div>
                </div>

                <button onClick={logout} className="btn" style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '0.8rem', padding: '8px'
                }}>
                    <LogOut size={14} style={{ marginRight: '8px' }} /> LOGOUT SYSTEM
                </button>
            </div>
        </aside>
    );
};

export default memo(Sidebar);
