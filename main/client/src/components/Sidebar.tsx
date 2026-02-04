import { LayoutDashboard, Package, Truck, Building2, CreditCard, Wallet, Users, Home, TrendingUp, Settings, LogOut, Layers, X, BarChart3, ChevronDown, ChevronRight, Receipt, RotateCcw, History, FileText, BookOpen, Landmark, ShieldCheck } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { memo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
        { path: '/accounts', label: 'Finance Hub', icon: Landmark, feature: 'FINANCE_MODULE', permission: 'accounts:read' },
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

    const accessibleItems = menuItems.filter(item => {
        if (user?.role === 'SUPER_ADMIN') return true;
        if (item.divider) return true;
        if (item.feature && user?.features?.[item.feature] === false) return false;
        if (item.permission && !user?.permissions?.includes(item.permission)) return false;
        return true;
    });

    const smartFilteredItems: any[] = [];
    let pendingDivider: any = null;

    accessibleItems.forEach(item => {
        if (item.divider) {
            pendingDivider = item;
        } else {
            if (pendingDivider) {
                smartFilteredItems.push(pendingDivider);
                pendingDivider = null;
            }
            smartFilteredItems.push(item);
        }
    });

    return (
        <aside className={`sidebar ${mobileOpen ? 'mobile-open' : ''} ${isCollapsed ? 'collapsed' : ''}`}>
            {/* Redesigned Sidebar Header */}
            <div className="sidebar-header">
                <motion.div
                    initial={false}
                    animate={{ scale: isCollapsed ? 0.8 : 1 }}
                    style={{ marginBottom: isCollapsed ? '0' : '8px' }}
                >
                    <img
                        src="/logo-storeai.png"
                        alt="StoreAI Logo"
                        style={{
                            width: isCollapsed ? '36px' : '58px',
                            height: 'auto',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 0 8px rgba(79, 70, 229, 0.2))',
                            transition: 'all 0.4s ease'
                        }}
                    />
                </motion.div>

                {!isCollapsed && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="sidebar-brand-accent"
                        style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '0.15em', opacity: 0.9, color: 'var(--text-on-dark)' }}
                    >
                        STORE <span style={{ color: 'var(--primary-500)' }}>AI</span>
                    </motion.div>
                )}


                {!mobileOpen && (
                    <button
                        onClick={() => setIsCollapsed(!isCollapsed)}
                        style={{
                            position: 'absolute',
                            right: isCollapsed ? '30px' : '15px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '8px',
                            width: '28px',
                            height: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            cursor: 'pointer',
                            zIndex: 10,
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <motion.div animate={{ rotate: isCollapsed ? 0 : 180 }}>
                            <ChevronRight size={16} />
                        </motion.div>
                    </button>
                )}

                {mobileOpen && (
                    <div style={{ position: 'absolute', top: '24px', right: '20px' }}>
                        <X size={20} onClick={() => setMobileOpen(false)} style={{ cursor: 'pointer', opacity: 0.7 }} />
                    </div>
                )}
            </div>

            <div className="sidebar-menu">
                {/* Tenant Context Chip */}
                <div style={{
                    marginBottom: '20px',
                    padding: isCollapsed ? '8px 4px' : '10px 14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '42px'
                }}>
                    {user?.activeTenant?.logo ? (
                        <img src={user.activeTenant.logo} style={{ maxHeight: '22px', objectFit: 'contain' }} alt="Tenant" />
                    ) : (
                        !isCollapsed && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, letterSpacing: '0.05em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {user?.activeTenant?.name || 'CORE PLATFORM'}
                                </span>
                            </div>
                        )
                    )}
                </div>

                {(() => {
                    let sectionTracker = '';
                    return smartFilteredItems.map((item: any, index) => {
                        if (item.divider) {
                            sectionTracker = item.divider;
                            const sectionName = item.divider;
                            const isSectionCollapsed = collapsedSections.includes(sectionName);

                            return (
                                <div
                                    key={`div-${index}`}
                                    className="menu-divider"
                                    onClick={() => toggleSection(sectionName)}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <span>{!isCollapsed && sectionName}</span>
                                    {!isCollapsed && (
                                        <motion.div animate={{ rotate: isSectionCollapsed ? 0 : 90 }} style={{ marginLeft: 'auto' }}>
                                            <ChevronRight size={10} style={{ opacity: 0.5 }} />
                                        </motion.div>
                                    )}
                                </div>
                            );
                        }

                        const itemSection = sectionTracker;
                        if (itemSection && collapsedSections.includes(itemSection)) {
                            return null;
                        }

                        return (
                            <motion.button
                                layout
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.02 }}
                                key={`item-${index}`}
                                className={`menu-item ${currentPath === item.path ? 'active' : ''}`}
                                onClick={() => handleNavigate(item.path)}
                                title={isCollapsed ? item.label : ''}
                            >
                                <item.icon size={19} />
                                {!isCollapsed && <span>{item.label}</span>}
                                {currentPath === item.path && !isCollapsed && (
                                    <motion.div
                                        layoutId="active-indicator"
                                        className="active-dot"
                                        style={{
                                            marginLeft: 'auto',
                                            width: '5px',
                                            height: '5px',
                                            borderRadius: '50%',
                                            background: 'var(--primary-500)',
                                            boxShadow: '0 0 8px var(--primary-500)'
                                        }}
                                    />
                                )}
                            </motion.button>
                        );
                    });
                })()}
            </div>


            {/* Redesigned Profile Section */}
            <div style={{
                padding: '24px 16px',
                background: 'rgba(0,0,0,0.15)',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                position: 'relative',
                zIndex: 2
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isCollapsed ? 'center' : 'space-between',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="avatar" style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'var(--primary-gradient)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.9rem',
                            color: '#fff',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                        }}>
                            {user.firstName[0]}
                        </div>

                        {!isCollapsed && (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{user.firstName}</span>
                                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user.role}</span>
                            </div>
                        )}
                    </div>

                    {!isCollapsed && (
                        <button
                            onClick={logout}
                            style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                color: '#ef4444',
                                border: 'none',
                                padding: '8px',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Sign Out"
                        >
                            <LogOut size={16} />
                        </button>
                    )}
                </div>

                {isCollapsed && (
                    <button
                        onClick={logout}
                        style={{
                            width: '100%',
                            marginTop: '16px',
                            background: 'transparent',
                            color: 'rgba(255,255,255,0.4)',
                            border: 'none',
                            padding: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'center'
                        }}
                    >
                        <LogOut size={18} />
                    </button>
                )}
            </div>
        </aside>
    );
};

export default memo(Sidebar);
