import { LayoutDashboard, Package, Truck, Building2, CreditCard, Wallet, Users, Home, TrendingUp, Settings, LogOut, Layers, X } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ user, logout, mobileOpen, setMobileOpen }: any) => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const handleNavigate = (path: string) => {
        navigate(path);
        if (setMobileOpen) setMobileOpen(false);
    };

    const menuItems: any[] = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { divider: 'Inventory' },
        { path: '/inventory', label: 'Inventory', icon: Package, feature: 'INVENTORY_MODULE' },
        { path: '/sales', label: 'Sales', icon: CreditCard, feature: 'RETAIL_MODULE' },
        { path: '/purchases', label: 'Purchases', icon: Truck, feature: 'PROCUREMENT_MODULE' },
        { divider: 'Organization' },
        { path: '/partners', label: 'Partners', icon: Building2, feature: 'PARTNER_MODULE' },
        { path: '/customers', label: 'Customers', icon: Home, feature: 'CRM_MODULE' },
        { path: '/hr', label: 'HR & Payroll', icon: Users, feature: 'HR_MODULE' },
        { divider: 'Finance & Intel' },
        { path: '/accounts', label: 'Accounts', icon: Wallet, feature: 'FINANCE_MODULE' },
        { path: '/reports', label: 'Reports', icon: TrendingUp, feature: 'REPORT_MODULE' },
    ];

    if (user?.role === 'SUPER_ADMIN') {
        menuItems.push({ path: '/settings', label: 'Settings', icon: Settings });
    }

    // Filter menu items based on features
    const filteredMenuItems = menuItems.filter(item => {
        if (item.divider) return true;
        if (!item.feature) return true;
        return user?.features?.[item.feature] !== false; // Enable by default if not explicitly false
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
                    padding: '8px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '40px'
                }}>
                    {user?.activeTenant?.logo ? (
                        <img src={user.activeTenant.logo} style={{ maxHeight: '24px', maxWidth: '100%', objectFit: 'contain' }} alt="Tenant" />
                    ) : (
                        <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
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

export default Sidebar;
