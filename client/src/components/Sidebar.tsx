import { LayoutDashboard, Package, Truck, Building2, CreditCard, Wallet, Users, Home, TrendingUp, Settings, LogOut, Layers, X, BarChart3 } from 'lucide-react';
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
        <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`} style={{ fontFamily: "'Open Sans', sans-serif" }}>
            <div className="sidebar-header" style={{
                padding: '20px 20px 15px',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: '1rem', letterSpacing: '0.05em', color: '#fff' }}>
                        <Layers size={18} style={{ marginRight: '8px' }} color="#818cf8" /> STORE<span style={{ color: '#818cf8' }}>AI</span>
                    </div>
                    {mobileOpen && (
                        <X size={18} onClick={() => setMobileOpen(false)} style={{ cursor: 'pointer', opacity: 0.6 }} />
                    )}
                </div>

                {/* Tenant Branding Card */}
                <div style={{
                    width: '100%',
                    padding: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '44px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                }}>
                    {user?.activeTenant?.logo ? (
                        <img src={user.activeTenant.logo} style={{ maxHeight: '28px', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} alt="Tenant" />
                    ) : (
                        <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>
                            {user?.activeTenant?.name || 'OPERANT CORE'}
                        </span>
                    )}
                </div>
            </div>

            <div className="sidebar-menu" style={{ padding: '10px' }}>
                {filteredMenuItems.map((item: any, index) => (
                    item.divider ? (
                        <div key={index} className="menu-divider" style={{ padding: '15px 10px 5px', fontSize: '0.65rem' }}>{item.divider}</div>
                    ) : (
                        <button
                            key={index}
                            className={`menu-item ${currentPath === item.path ? 'active' : ''}`}
                            onClick={() => handleNavigate(item.path)}
                            style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                        >
                            <item.icon size={16} /> {item.label}
                        </button>
                    )
                ))}
            </div>

            <div className="sidebar-footer" style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="profile-card" style={{ marginBottom: '15px' }}>
                    <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '0.8rem' }}>{user.firstName[0]}</div>
                    <div className="profile-info">
                        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{user.firstName}</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>{user.role}</span>
                    </div>
                </div>

                <div style={{ marginBottom: '15px', opacity: 0.8 }}>
                    <a href="https://cognivectra.com" target="_blank" rel="noopener noreferrer">
                        <img src="/logo.png" alt="Cognivectra" style={{ maxHeight: '25px', maxWidth: '100%', objectFit: 'contain' }} />
                    </a>
                </div>

                <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', padding: '6px', fontSize: '0.65rem' }}>
                    <LogOut size={12} style={{ marginRight: '6px' }} /> LOGOUT
                </button>
            </div>
        </aside>
    );
};

export default memo(Sidebar);
