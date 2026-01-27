import { LayoutDashboard, Package, Truck, Building2, CreditCard, Wallet, Users, Home, TrendingUp, Settings, LogOut, Layers } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const Sidebar = ({ user, logout }: any) => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;

    const menuItems = [
        { path: '/', label: 'Dashboard', icon: LayoutDashboard },
        { divider: 'Inventory' },
        { path: '/inventory', label: 'Inventory', icon: Package },
        { path: '/sales', label: 'Sales', icon: CreditCard },
        { path: '/purchases', label: 'Purchases', icon: Truck },
        { divider: 'Organization' },
        { path: '/partners', label: 'Partners', icon: Building2 },
        { path: '/customers', label: 'Customers', icon: Home },
        { path: '/hr', label: 'HR & Payroll', icon: Users },
        { divider: 'Finance & Intel' },
        { path: '/accounts', label: 'Accounts', icon: Wallet },
        { path: '/reports', label: 'Reports', icon: TrendingUp },
    ];

    if (user?.role === 'SUPER_ADMIN') {
        menuItems.push({ path: '/settings', label: 'Settings', icon: Settings });
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <Layers size={20} style={{ marginRight: '10px' }} color="#818cf8" /> STORE<span style={{ color: '#818cf8' }}>AI</span>
            </div>
            <div className="sidebar-menu">
                {menuItems.map((item: any, index) => (
                    item.divider ? (
                        <div key={index} className="menu-divider">{item.divider}</div>
                    ) : (
                        <button
                            key={index}
                            className={`menu-item ${currentPath === item.path ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
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

                <div style={{ marginTop: '24px', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.05em', marginBottom: '4px' }}>PRODUCT OF</div>
                    <div className="cognivectra-logo" style={{ fontSize: '0.75rem' }}>
                        COGNIVE<span className="cognivectra-accent">CTRA</span>
                    </div>
                </div>

                <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', marginTop: '16px', fontSize: '0.7rem' }}>
                    <LogOut size={14} style={{ marginRight: '8px' }} /> Logout
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
