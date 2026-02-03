import { LayoutDashboard, Package, Truck, Building2, CreditCard, Wallet, Users, Home, TrendingUp, Settings, LogOut, Layers, X, BarChart3, ChevronDown, ChevronRight, Receipt, RotateCcw, History, FileText, BookOpen, Landmark, ShieldCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { memo, useState } from 'react';

const Sidebar = ({ user, logout, mobileOpen, setMobileOpen, isCollapsed, setIsCollapsed }: any) => {
    const navigate = useNavigate();
    const location = useLocation();
    const currentPath = location.pathname;
    const [collapsedSections, setCollapsedSections] = useState<string[]>([]);

    const toggleSection = (section: string) => {
        setCollapsedSections(prev =>
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    };

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
        { path: '/returns', label: 'Sales Returns', icon: RotateCcw, feature: 'RETAIL_MODULE', permission: 'sales:read' },
        { path: '/purchases', label: 'Procurement Hub', icon: Truck, feature: 'PROCUREMENT_MODULE', permission: 'orders:read' },
        { divider: 'Organization' },
        { path: '/partners', label: 'Partners', icon: Building2, feature: 'PARTNER_MODULE', permission: 'crm:read' },
        { path: '/customers', label: 'Customers', icon: Home, feature: 'CRM_MODULE', permission: 'crm:read' },
        { divider: 'Workforce & HR' },
        { path: '/hr-master', label: 'Employee Master', icon: Landmark, feature: 'HR_MODULE', permission: 'hr:read' },
        { path: '/attendance', label: 'Attendance Master', icon: Users, feature: 'HR_MODULE', permission: 'hr:read' },
        { path: '/payroll', label: 'Payroll Engine', icon: Wallet, feature: 'HR_MODULE', permission: 'hr:read' },
        { path: '/hr-reports', label: 'Statutory Reports', icon: ShieldCheck, feature: 'HR_MODULE', permission: 'hr:read' },
        { divider: 'Finance & Intel' },
        { path: '/daybook', label: 'Daybook (Daily)', icon: History, feature: 'FINANCE_MODULE', permission: 'accounts:read' },
        { path: '/balance-sheet', label: 'Balance Sheet', icon: Landmark, feature: 'FINANCE_MODULE', permission: 'accounts:read' },
        { path: '/ledger', label: 'General Ledger', icon: BookOpen, feature: 'FINANCE_MODULE', permission: 'accounts:read' },
        { path: '/liability', label: 'Liability Tracker', icon: Receipt, feature: 'FINANCE_MODULE', permission: 'accounts:read' },
        { path: '/gst', label: 'GST Compliance', icon: FileText, feature: 'FINANCE_MODULE', permission: 'accounts:read' },
        { path: '/pl', label: 'Profit & Loss (P&L)', icon: BarChart3, feature: 'FINANCE_MODULE', permission: 'accounts:read' },
        { path: '/config-finance', label: 'Finance Policies', icon: Settings, feature: 'FINANCE_MODULE', permission: 'accounts:read' },
        { path: '/reports', label: 'Strategic Reports', icon: TrendingUp, feature: 'REPORT_MODULE', permission: 'reports:view' },
        { divider: 'AI Intelligence' },
        { path: '/assistant', label: 'AI Intelligence', icon: Layers, feature: 'AI_MODULE', permission: 'dashboard:view' },
    ];

    if (user?.role === 'SUPER_ADMIN') {
        menuItems.push({ divider: 'Platform Control' });
        menuItems.push({ path: '/global-inventory', label: 'Global Stock Master', icon: Layers, permission: 'tenants:manage' });
        menuItems.push({ path: '/administration', label: 'Audit Trail', icon: ShieldCheck, permission: 'tenants:manage' });
        menuItems.push({ path: '/settings', label: 'Tenant Settings', icon: Settings, permission: 'tenants:manage' });
    }

    // 1. First pass: Filter items by permission/feature (keep dividers for now)
    const accessibleItems = menuItems.filter(item => {
        if (user?.role === 'SUPER_ADMIN') return true; // Power User Override
        if (item.divider) return true;
        // Check Feature Flag
        if (item.feature && user?.features?.[item.feature] === false) return false;
        // Check Permission
        if (item.permission && !user?.permissions?.includes(item.permission)) return false;
        return true;
    });

    // 2. Second pass: Remove dividers that have no visible children
    const filteredMenuItems = accessibleItems.reduce((acc: any[], item: any) => {
        if (item.divider) {
            // It's a divider, verify if there are any actual items in this section
            // We look ahead in the ORIGINAL 'accessibleItems' array from the current index
            // But 'reduce' doesn't give us easy lookahead. 
            // EASIER STRATEGY: 
            // We buffer the divider. We only push the buffer if we encounter a non-divider item.
            // If we encounter another divider before an item, we drop the previous buffer.

            // However, since we are iterating the *already filtered* list, we can just use a helper.
            return [...acc, item]; // Placeholder, we'll fix logic below
        }
        return [...acc, item];
    }, []);

    // Correct Logic: 
    // We recreate the array. We hold the 'current divider' in a variable. 
    // When we see an item, we push the 'current divider' (if pending) then the item.
    // If we see a divider, we set 'current divider'.
    const smartFilteredItems: any[] = [];
    let pendingDivider: any = null;

    accessibleItems.forEach(item => {
        if (item.divider) {
            pendingDivider = item;
        } else {
            // It's a real item
            if (pendingDivider) {
                smartFilteredItems.push(pendingDivider);
                pendingDivider = null; // Consumed
            }
            smartFilteredItems.push(item);
        }
    });

    // Override the variable used in render
    const finalMenuItems = smartFilteredItems;

    return (
        <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header" style={{ height: 'auto', padding: '16px 10px 10px', background: 'transparent', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'center', width: '100%', marginBottom: isCollapsed ? '0' : '8px' }}>
                    <img
                        src="/logo-storeai.png"
                        alt="StoreAI Logo"
                        style={{
                            width: isCollapsed ? '40px' : '60px',
                            height: 'auto',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))',
                            transition: 'width 0.3s ease'
                        }}
                    />
                </div>
                {!mobileOpen && (
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        style={{
                            position: 'absolute',
                            right: isCollapsed ? '-12px' : '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: '#7c3aed',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            cursor: 'pointer',
                            zIndex: 10,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        {isCollapsed ? <ChevronRight size={14} /> : <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} />}
                    </button>
                )}
                {mobileOpen && (
                    <div style={{ position: 'absolute', top: '24px', right: '20px' }}>
                        <X size={20} onClick={() => setMobileOpen(false)} style={{ cursor: 'pointer', opacity: 0.7 }} />
                    </div>
                )}
            </div>

            <div className="sidebar-menu" style={{ paddingTop: '10px' }}>
                <div style={{
                    marginBottom: '12px',
                    padding: isCollapsed ? '8px 0' : '8px 12px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '40px'
                }}>
                    {user?.activeTenant?.logo ? (
                        <img src={user.activeTenant.logo} style={{ maxHeight: '20px', objectFit: 'contain' }} alt="Tenant" />
                    ) : (
                        !isCollapsed && (
                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600, letterSpacing: '0.05em' }}>
                                {user?.activeTenant?.name || 'StoreAI Intelligence Platform'}
                            </span>
                        )
                    )}
                </div>
                {(() => {
                    let sectionTracker = '';
                    return finalMenuItems.map((item: any, index) => {
                        if (item.divider) {
                            if (isCollapsed) return <div key={index} className="menu-divider-mini" style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '15px 10px' }}></div>;

                            sectionTracker = item.divider;
                            const sectionName = item.divider;
                            const isSectionCollapsed = collapsedSections.includes(sectionName);
                            return (
                                <div
                                    key={index}
                                    className="menu-divider"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        toggleSection(sectionName);
                                    }}
                                    style={{
                                        cursor: 'pointer',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        userSelect: 'none'
                                    }}
                                >
                                    {sectionName}
                                    {isSectionCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                                </div>
                            );
                        }

                        const itemSection = sectionTracker;
                        if (itemSection && collapsedSections.includes(itemSection)) {
                            return null;
                        }

                        return (
                            <button
                                key={index}
                                className={`menu-item ${currentPath === item.path ? 'active' : ''}`}
                                onClick={() => handleNavigate(item.path)}
                                title={isCollapsed ? item.label : ''}
                            >
                                <item.icon size={18} style={{ opacity: currentPath === item.path ? 1 : 0.7 }} />
                                {!isCollapsed && <span>{item.label}</span>}
                            </button>
                        );
                    });
                })()}
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
                    <div className="profile-info" style={{ display: isCollapsed ? 'none' : 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>{user.firstName}</span>
                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{user.role}</span>
                    </div>
                </div>

                <button onClick={logout} className="btn" style={{
                    width: '100%', background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '0.8rem', padding: '8px', display: 'flex', justifyContent: 'center'
                }}>
                    <LogOut size={14} style={{ marginRight: isCollapsed ? '0' : '8px' }} /> {!isCollapsed && 'LOGOUT SYSTEM'}
                </button>
            </div>
        </aside>
    );
};

export default memo(Sidebar);
