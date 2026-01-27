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
        <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <Layers size={20} style={{ marginRight: '10px' }} color="#818cf8" /> STORE<span style={{ color: '#818cf8' }}>AI</span>
                    </div>
                    {mobileOpen && (
                        <X size={20} onClick={() => setMobileOpen(false)} style={{ cursor: 'pointer', opacity: 0.6 }} />
                    )}
                </div>
                <div style={{
                    marginTop: '12px',
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    {user?.activeTenant?.logo ? (
                        <img src={user.activeTenant.logo} style={{ height: '36px', maxWidth: '100%', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} alt="Tenant Brand" />
                    ) : (
                        <div style={{
                            height: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            color: 'rgba(255, 255, 255, 0.3)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.2em',
                            fontWeight: 600
                        }}>
                            Operant Core
                        </div>
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
                            <item.icon size={18} /> {item.label}
                        </button>
                    )
                ))}
            </div>
            <div className="sidebar-footer">
                <div className="profile-card">
                    <div className="avatar">{user.firstName[0]}</div>
                    <div className="profile-info">
                        <span>{user.firstName}</span>
                        <span className="profile-role">{user.role}</span>
                    </div>
                </div>

                <div style={{ marginTop: '15px', textAlign: 'left', opacity: 0.9, paddingLeft: '5px' }}>
                    <a href="https://cognivectra.com" target="_blank" rel="noopener noreferrer">
                        <img src="/logo.png" alt="Cognivectra" style={{ maxHeight: '30px', maxWidth: '140px', objectFit: 'contain' }} />
                    </a>
                </div>

                <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', marginTop: '16px', fontSize: '0.7rem' }}>
                    <LogOut size={14} style={{ marginRight: '8px' }} /> Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
