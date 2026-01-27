import { RefreshCw, Plus } from 'lucide-react';
import { useLocation } from 'react-router-dom';

const Header = ({ refreshData, setModal, viewName }: any) => {
    const location = useLocation();

    // Map paths to view names/actions
    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'DASHBOARD';
        return path.substring(1).toUpperCase();
    };

    const showNewButton = ['/inventory', '/sales', '/purchases', '/hr', '/customers', '/accounts'].includes(location.pathname);

    return (
        <header className="header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div className="header-title" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', letterSpacing: '0.1em', fontWeight: 600 }}>
                    OPERATIONAL CORE // <span style={{ color: '#fff' }}>{getPageTitle()}</span>
                </div>
                <div style={{ width: '1px', height: '16px', background: 'var(--border-color)' }}></div>
            </div>
            <div className="header-actions">
                <button className="btn btn-secondary" onClick={refreshData} style={{ fontSize: '0.7rem', padding: '8px 16px' }}>
                    <RefreshCw size={12} style={{ marginRight: '6px' }} /> Synchronize Matrix
                </button>
                {showNewButton && (
                    <button className="btn btn-primary" onClick={() => setModal({ type: 'generic_create' })} style={{ fontSize: '0.7rem', padding: '8px 16px' }}>
                        <Plus size={14} /> New Artifact
                    </button>
                )}
            </div>
        </header>
    );
};

export default Header;
