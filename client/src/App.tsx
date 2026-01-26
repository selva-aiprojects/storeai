import { useState, useEffect } from 'react';
import {
    LayoutDashboard, Package, ShoppingCart, Users, BadgeDollarSign,
    Settings, Plus, LogOut, Trash2,
    Building2, FolderTree, CheckCircle2,
    X, Layers, FileText,
    CalendarCheck, TrendingUp, Info, Truck,
    Wallet, CreditCard, ArrowDownRight, ArrowUpRight, History, Download, UserPlus,
    ExternalLink, MapPin, Box, Ship, Home, Map, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import Barcode from 'react-barcode';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import api, {
    getProducts, login as loginApi, getMe,
    getSales, getDashboardStats, getSuppliers, getCategories,
    createSupplier, createCategory, createProduct, createOrder, receiveOrder, createSale,
    getEmployees, markAttendance, updatePerformance, updateSupplier,
    getUsers, createUser, createEmployee, getDepartments,
    getCustomers, createCustomer, getPayrolls, createPayroll
} from './services/api';

// --- PDF Helpers ---

const generateInvoicePDF = (sale: any) => {
    const doc = new jsPDF() as any;
    doc.setFontSize(22); doc.setTextColor(99, 102, 241);
    doc.text('STOREAI ENTERPRISE', 105, 20, { align: 'center' });
    doc.setFontSize(10); doc.setTextColor(150);
    doc.text(`Protocol: INVOICE_${sale.invoiceNo}`, 105, 26, { align: 'center' });
    const tableData = sale.items.map((item: any) => [
        item.product.name, item.quantity, `$${item.unitPrice}`, `$${(item.quantity * item.unitPrice).toFixed(2)}`
    ]);
    doc.autoTable({
        startY: 50, head: [['Artifact', 'Qty', 'Rate', 'Total']],
        body: tableData, theme: 'grid', headStyles: { fillColor: [99, 102, 241] }
    });

    if (sale.isHomeDelivery) {
        doc.setFontSize(10); doc.setTextColor(50);
        doc.text('HOME DELIVERY PROTOCOL ACTIVE', 10, 40);
        doc.text(`Destination: ${sale.deliveryAddress}, ${sale.deliveryCity}`, 10, 45);
        doc.text(`Team: ${sale.team}`, 10, 50);
    }

    doc.save(`Invoice_${sale.invoiceNo}.pdf`);
};

const generateQuotePDF = (deal: any) => {
    const doc = new jsPDF() as any;
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFontSize(22); doc.setTextColor(255, 255, 255);
    doc.text('OFFICIAL QUOTATION', 105, 15, { align: 'center' });
    doc.setFontSize(10); doc.setTextColor(148, 163, 184);
    doc.text(`Ref: ${deal.title.toUpperCase()}`, 105, 25, { align: 'center' });
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 105, 30, { align: 'center' });

    doc.setTextColor(30); doc.setFontSize(12);
    doc.text(`Prepared For: ${deal.customer?.name || "Valued Client"}`, 15, 50);

    // Safety check for items
    const items = deal.items || [];
    const tableData = items.map((item: any) => [
        item.product?.name || "Service Item", item.quantity, `$${item.price || 0}`, `$${(item.quantity * (item.price || 0)).toFixed(2)}`
    ]);

    doc.autoTable({
        startY: 60,
        head: [['Artifact', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total Value: $${(deal.value || 0).toLocaleString()}`, 160, finalY, { align: 'right' });
    doc.save(`Quote_${deal.title.replace(/\s/g, '_')}.pdf`);
};

function App() {
    const [user, setUser] = useState<any>(null);
    const [view, setView] = useState('dashboard');
    const [data, setData] = useState<any>({
        products: [], users: [], sales: [], orders: [],
        employees: [], suppliers: [], categories: [], ledger: [], financialSummary: null, stats: null,
        departments: [], customers: [], payrolls: [], reports: null
    });
    const [loading, setLoading] = useState(false);
    const [authForm, setAuthForm] = useState({ email: '', password: '' });
    const [modal, setModal] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('store_ai_token');
        if (token) fetchMe();
    }, []);

    useEffect(() => {
        if (user) refreshData();
    }, [view, user]);

    const refreshData = async () => {
        setLoading(true);
        const newData: any = { ...data };

        const safeFetch = async (endpoint: string, key: string, transform: (d: any) => any = (d) => d) => {
            try {
                const resp = await api.get(endpoint);
                newData[key] = transform(resp.data);
            } catch (e) {
                console.warn(`Failed to fetch ${endpoint}:`, e);
                newData[key] = Array.isArray(data[key]) ? [] : null;
            }
        };

        const safeFetchService = async (serviceCall: () => Promise<any>, key: string) => {
            try {
                const resp = await serviceCall();
                newData[key] = resp.data;
            } catch (e) {
                console.warn(`Failed to call service for ${key}:`, e);
                newData[key] = Array.isArray(data[key]) ? [] : null;
            }
        };

        await Promise.all([
            safeFetch('/dashboard/stats', 'stats'),
            safeFetchService(getProducts, 'products'),
            safeFetchService(getSales, 'sales'),
            safeFetch('/orders', 'orders'),
            safeFetchService(getUsers, 'users'),
            safeFetch('/payment', 'transactions'),
            safeFetch('/accounts/ledger', 'ledger'),
            safeFetch('/accounts/summary', 'financialSummary'), // Corrected from liabilities to summary
            safeFetch('/inventory/warehouses', 'warehouses'),
            safeFetchService(getSuppliers, 'suppliers'),
            safeFetchService(getCategories, 'categories'),
            safeFetchService(getEmployees, 'employees'),
            safeFetchService(getPayrolls, 'payrolls'),
            safeFetchService(getCustomers, 'customers'),
            safeFetch('/reports/comprehensive', 'reports'),
            safeFetch('/crm', 'deals')
        ]);

        setData(newData);
        setLoading(false);
    };

    const handleDelete = async (type: string, id: string) => {
        if (!window.confirm(`Initiate Soft Delete on this ${type}?`)) return;
        try {
            await api.patch(`/${type}/${id}`, { isDeleted: true });
            refreshData();
        } catch (e) { alert("Failed to delete."); }
    };

    const fetchMe = async () => {
        try {
            const resp = await getMe();
            setUser(resp.data);
        } catch (e) { localStorage.removeItem('store_ai_token'); }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const resp = await loginApi(authForm);
            localStorage.setItem('store_ai_token', resp.data.token);
            setUser(resp.data.user);
        } catch (e) { alert("Login failed. Check credentials."); }
    };

    if (!user) {
        return (
            <div className="modal-overlay" style={{ background: '#050810', backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(129, 140, 248, 0.1) 0%, transparent 70%)' }}>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ maxWidth: '400px', width: '90%', padding: '40px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '32px' }}>
                        <Layers color="#818cf8" size={48} />
                        <span style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '0.1em' }}>STORE<span style={{ color: '#818cf8' }}>AI</span></span>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Security Gateway v2.0</div>
                    </div>
                    <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="form-group">
                            <label>ENCRYPTED EMAIL</label>
                            <input type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} required placeholder="admin@storeai.com" />
                        </div>
                        <div className="form-group">
                            <label>ACCESS PHRASE</label>
                            <input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} required placeholder="••••••••" />
                        </div>
                        <button className="btn btn-primary" style={{ padding: '14px', marginTop: '10px', fontSize: '0.8rem' }}>AUTHENTICATE</button>
                    </form>
                    <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                        &copy; 2026 STOREAI QUANTUM CORE. ALL RIGHTS RESERVED.
                    </div>
                </motion.div >
            </div >
        );
    }

    return (
        <div className="app-container">
            <aside className="sidebar">
                <div className="sidebar-header"><Layers size={20} style={{ marginRight: '10px' }} color="#818cf8" /> STORE<span style={{ color: '#818cf8' }}>AI</span></div>
                <div className="sidebar-menu">
                    <button className={`menu-item ${view === 'dashboard' ? 'active' : ''}`} onClick={() => setView('dashboard')}><LayoutDashboard size={18} /> Operational Feed</button>
                    <div className="menu-divider">Core Inventory</div>
                    <button className={`menu-item ${view === 'products' ? 'active' : ''}`} onClick={() => setView('products')}><Package size={18} /> Catalog Matrix</button>
                    <button className={`menu-item ${view === 'procurement' ? 'active' : ''}`} onClick={() => setView('procurement')}><Truck size={18} /> Supply Chain</button>
                    <button className={`menu-item ${view === 'suppliers' ? 'active' : ''}`} onClick={() => setView('suppliers')}><Building2 size={18} /> Partners</button>
                    <div className="menu-divider">Financial Center</div>
                    <button className={`menu-item ${view === 'sales' ? 'active' : ''}`} onClick={() => setView('sales')}><CreditCard size={18} /> Sales Terminal</button>
                    <button className={`menu-item ${view === 'accounts' ? 'active' : ''}`} onClick={() => setView('accounts')}><Wallet size={18} /> Capital Ledger</button>
                    <div className="menu-divider">Organization</div>
                    <button className={`menu-item ${view === 'hr' ? 'active' : ''}`} onClick={() => setView('hr')}><Users size={18} /> Workforce Portal</button>
                    <button className={`menu-item ${view === 'customers' ? 'active' : ''}`} onClick={() => setView('customers')}><Home size={18} /> Delivery Nodes</button>
                    <button className={`menu-item ${view === 'reports' ? 'active' : ''}`} onClick={() => setView('reports')}><TrendingUp size={18} /> Intelligence</button>
                    {user.role === 'SUPER_ADMIN' && <button className={`menu-item ${view === 'users' ? 'active' : ''}`} onClick={() => setView('users')}><Settings size={18} /> System Core</button>}
                </div>
                <div className="sidebar-footer">
                    <div className="profile-card"><div className="avatar">{user.firstName[0]}</div><div className="profile-info"><span>{user.firstName}</span><span className="profile-role">{user.role}</span></div></div>
                    <button onClick={() => { localStorage.removeItem('store_ai_token'); setUser(null); }} className="btn btn-secondary" style={{ width: '100%', marginTop: '20px' }}>Logout</button>
                </div>
            </aside>

            <div className="main-content">
                <header className="header"><div className="header-title" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>SYSTEM // <span style={{ color: '#fff', fontWeight: 700 }}>{view.toUpperCase()}</span></div><div className="header-actions">
                    <button className="btn btn-secondary" onClick={refreshData} style={{ fontSize: '0.7rem' }}>Sync Data</button>
                    {['products', 'suppliers', 'accounts', 'sales', 'procurement', 'hr', 'users', 'customers'].includes(view) && (
                        <button className="btn btn-primary" onClick={() => setModal({ type: view === 'procurement' ? 'orders' : (view === 'accounts' ? 'payment' : (view === 'hr' ? 'employees' : view)) })} style={{ fontSize: '0.7rem' }}>
                            <Plus size={14} /> New {view === 'users' ? 'Operator' : (view === 'customers' ? 'Client' : 'Artifact')}
                        </button>
                    )}
                </div></header>

                <div className="page-container">
                    <AnimatePresence mode="wait"><motion.div key={view} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                        {view === 'dashboard' && <DashboardView stats={data.stats} setView={setView} />}
                        {view === 'products' && <ProductsView items={data.products} refresh={refreshData} setModal={setModal} onDelete={(id: string) => handleDelete('products', id)} />}
                        {view === 'procurement' && <ProcurementView items={data.orders} refresh={refreshData} setModal={setModal} />}
                        {view === 'suppliers' && <SuppliersView items={data.suppliers} refresh={refreshData} />}
                        {view === 'sales' && <SalesView items={data.sales} refresh={refreshData} setModal={setModal} currentUser={user} />}
                        {view === 'crm' && <PipelineView deals={data.deals} refresh={refreshData} setModal={setModal} />}
                        {view === 'accounts' && <AccountsView ledger={data.ledger} summary={data.financialSummary} />}
                        {view === 'hr' && <HRView items={data.employees} payrolls={data.payrolls} refresh={refreshData} setModal={setModal} onDelete={(id: string) => handleDelete('hr/employees', id)} />}
                        {view === 'users' && <UsersView items={data.users} refresh={refreshData} />}
                        {view === 'customers' && <CustomersView items={data.customers} />}
                        {view === 'reports' && <ReportsView data={data.reports} />}
                        {view === 'warehouse' && <WarehouseView warehouses={data.warehouses} />}
                    </motion.div></AnimatePresence>
                </div>

                <footer className="footer">
                    <div className="footer-branding">
                        <span>A PRODUCT FROM</span>
                        <div className="cognivectra-logo">
                            COGNIVE<span className="cognivectra-accent">CTRA</span>
                        </div>
                    </div>
                    <div className="footer-copyright">
                        &copy; {new Date().getFullYear()} StoreAI Enterprise Solutions. All operational telemetry strictly logged.
                    </div>
                </footer>
            </div>

            <AnimatePresence>{modal && <FormModal type={modal.type} metadata={modal.metadata} categories={data.categories} suppliers={data.suppliers} products={data.products} departments={data.departments} users={data.users} customers={data.customers} employees={data.employees} warehouses={data.warehouses} onClose={() => { setModal(null); refreshData(); }} />}</AnimatePresence>
        </div>
    );
}

// --- Views Components ---
const ReportsView = ({ data }: any) => {
    if (!data) return <div className="card" style={{ textAlign: 'center', padding: '100px 0' }}>Initializing Predictive Intelligence Matrix...</div>;
    const COLORS = ['#818cf8', '#22d3ee', '#fbbf24', '#f43f5e', '#8b5cf6'];
    const pieData = data.sales.map((s: any) => ({ name: s.team, value: s._sum.totalAmount }));

    const [predictions, setPredictions] = useState<any[]>([]);

    useEffect(() => {
        api.get('/reports/prediction').then(res => setPredictions(res.data)).catch(console.error);
    }, []);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="card" style={{ borderLeft: '4px solid var(--accent-primary)', padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{ padding: '8px', background: 'rgba(129, 140, 248, 0.1)', borderRadius: '8px' }}><TrendingUp size={20} color="#818cf8" /></div>
                    <div className="card-header" style={{ marginBottom: 0 }}>AI PREDICTIVE STOCK INTELLIGENCE</div>
                </div>
                <div className="table-container">
                    <table>
                        <thead><tr><th>ARTIFACT</th><th>BURN RATE</th><th>DAYS LEFT</th><th>STOCK-OUT DATE</th><th>STATUS</th><th>AI SUGGESTION</th></tr></thead>
                        <tbody>{predictions.map((p: any) => (
                            <tr key={p.id}>
                                <td><b>{p.name}</b></td>
                                <td>{p.burnRate.toFixed(1)} / day</td>
                                <td>{p.daysLeft} Days</td>
                                <td style={{ color: 'var(--text-muted)' }}>{p.stockOutDate}</td>
                                <td><span className={`badge ${p.status === 'CRITICAL' ? 'badge-danger' : (p.status === 'WARNING' ? 'badge-warning' : 'badge-success')}`}>{p.status}</span></td>
                                <td>{p.suggestedReorder > 0 ? <b style={{ color: 'var(--accent-primary)' }}>REORDER +{p.suggestedReorder}</b> : <span style={{ color: 'var(--text-muted)' }}>Optimum</span>}</td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
                <div className="card" style={{ minHeight: '380px' }}>
                    <div className="card-header">DEPARTMENTAL REVENUE DISTRIBUTION</div>
                    <div style={{ height: '300px', marginTop: '20px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={pieData} innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                                    {pieData.map((_entry: any, index: number) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <Tooltip contentStyle={{ background: '#0a0f1d', border: '1px solid var(--border-color)', borderRadius: '8px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '30px' }}>
                    <div style={{ textAlign: 'center' }}>
                        <div className="metric-title" style={{ letterSpacing: '0.1em' }}>TOTAL ASSET QUANTITY</div>
                        <div className="metric-value" style={{ fontSize: '3rem', fontWeight: 800 }}>{data.inventory.totalQuantity}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--accent-success)', marginTop: '4px' }}>Active artifacts across all nodes</div>
                    </div>
                    <div style={{ width: '100%', height: '1px', background: 'var(--border-color)' }}></div>
                    <div style={{ textAlign: 'center' }}>
                        <div className="metric-title" style={{ letterSpacing: '0.1em' }}>LIQUID VALUATION</div>
                        <div className="metric-value" style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--accent-success)' }}>${(data.inventory.totalValue / 1000).toFixed(1)}k</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>Net inventory market value</div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">FINANCIAL LIQUIDITY (LEDGER RECAP)</div>
                <div style={{ height: '300px', marginTop: '20px' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.finance}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="type" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: '#0a0f1d', border: '1px solid var(--border-color)', borderRadius: '8px' }} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                            <Bar dataKey="_sum.amount" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const DashboardView = ({ stats, setView }: any) => (
    <div className="dashboard-grid">
        <div className="card metric-card" onClick={() => setView('accounts')} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="metric-title">GROSS REVENUE</div>
                <div style={{ padding: '6px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '6px' }}><CreditCard size={16} color="var(--accent-success)" /></div>
            </div>
            <div className="metric-value" style={{ color: 'var(--accent-success)' }}>${stats?.revenue?.toLocaleString() || '0.00'}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}><ArrowUpRight size={12} /> Live stream active</div>
        </div>
        <div className="card metric-card" onClick={() => setView('procurement')} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="metric-title">SUPPLY PIPELINE</div>
                <div style={{ padding: '6px', background: 'rgba(34, 211, 238, 0.1)', borderRadius: '6px' }}><Truck size={16} color="var(--accent-secondary)" /></div>
            </div>
            <div className="metric-value">{stats?.activeOrders || '0'} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--text-muted)' }}>Orders</span></div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Inbound logistics tracking</div>
        </div>
        <div className="card metric-card" onClick={() => setView('products')} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="metric-title">SYSTEM ALERTS</div>
                <div style={{ padding: '6px', background: 'rgba(244, 63, 94, 0.1)', borderRadius: '6px' }}><Info size={16} color="var(--accent-danger)" /></div>
            </div>
            <div className="metric-value" style={{ color: 'var(--accent-danger)' }}>{stats?.lowStock || '0'} <span style={{ fontSize: '0.8rem', fontWeight: 400 }}>Critical</span></div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Inventory below threshold</div>
        </div>
        <div className="card metric-card" onClick={() => setView('reports')} style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="metric-title">AI CORE</div>
                <div style={{ padding: '6px', background: 'rgba(129, 140, 248, 0.1)', borderRadius: '6px' }}><Layers size={16} color="var(--accent-primary)" /></div>
            </div>
            <div className="metric-value">SYNAPSE</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Predictive analytics ready</div>
        </div>
    </div>
);

const ProductsView = ({ items, onDelete, setModal }: any) => (
    <div className="table-container">
        <table><thead><tr><th>ARTIFACT</th><th>VELOCITY</th><th>STOCK</th><th>STATUS</th><th>STRATEGY</th><th>CRUD</th></tr></thead>
            <tbody>{items.filter((i: any) => !i.isDeleted).map((p: any) => (
                <tr key={p.id}>
                    <td><b>{p.name}</b><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.sku}</div></td>
                    <td>{p.avgDailySales || 0} / Day</td>
                    <td>{p.stockQuantity}</td>
                    <td><span className={`badge ${p.stockQuantity <= p.reorderPoint ? 'badge-danger' : 'badge-success'}`}>{p.stockQuantity <= p.reorderPoint ? 'REORDER' : 'OK'}</span></td>
                    <td><button className="btn btn-secondary" style={{ fontSize: '0.7rem' }} onClick={() => setModal({ type: 'pricing_rule', metadata: p })}>Configure Rules</button></td>
                    <td><button className="btn btn-secondary" style={{ padding: '5px', color: 'var(--accent-danger)' }} onClick={() => onDelete(p.id)}><Trash2 size={14} /></button></td>
                </tr>
            ))}</tbody></table>
    </div>
);

const AccountsView = ({ ledger, summary }: any) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="card metric-card"><div className="metric-title">RECEIVABLES</div><div className="metric-value" style={{ color: 'var(--accent-success)' }}>+${summary?.receivables?.toFixed(2) || '0.00'}</div></div>
            <div className="card metric-card"><div className="metric-title">PAYABLES</div><div className="metric-value" style={{ color: 'var(--accent-danger)' }}>-${summary?.payables?.toFixed(2) || '0.00'}</div></div>
            <div className="card metric-card"><div className="metric-title">NET LIQUIDITY</div><div className="metric-value">${summary?.netBalance?.toFixed(2) || '0.00'}</div></div>
        </div>
        <div className="card">
            <div className="table-container"><table style={{ marginTop: '20px' }}><thead><tr><th>TIMESTAMP</th><th>PROTOCOL</th><th>CATEGORY</th><th>VALUATION</th><th>SIG</th></tr></thead>
                <tbody>{ledger.map((l: any) => (
                    <tr key={l.id}><td>{new Date(l.createdAt).toLocaleString()}</td><td>{l.title}</td><td>{l.category}</td><td style={{ color: l.type === 'CREDIT' ? 'var(--accent-success)' : 'var(--accent-danger)' }}>{l.type === 'CREDIT' ? '+' : '-'}${l.amount.toFixed(2)}</td><td>{l.description}</td></tr>
                ))}</tbody></table></div>
        </div>
    </div>
);

const HRView = ({ items, payrolls, refresh, setModal, onDelete }: any) => {
    const logAtt = async (id: string, st: string) => { await markAttendance({ employeeId: id, status: st }); refresh(); };
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div className="card">
                <div className="card-header"><Users size={16} style={{ marginRight: '10px' }} /> WORKFORCE ROSTER</div>
                <div className="table-container" style={{ marginTop: '15px' }}>
                    <table><thead><tr><th>IDENTITY</th><th>OPERATIONAL ID</th><th>SHIFT STATUS</th><th>ANNUAL SALARY</th><th>PERFORMANCE</th><th>ATTENDANCE</th><th>ACTION</th></tr></thead>
                        <tbody>{items.filter((i: any) => !i.isDeleted).map((e: any) => (
                            <tr key={e.id}>
                                <td><div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div className="avatar" style={{ width: '32px', height: '32px' }}>{(e.firstName?.[0] || e.user?.firstName?.[0] || '?')}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <b>{e.firstName ? `${e.firstName} ${e.lastName}` : (e.user ? `${e.user.firstName} ${e.user.lastName}` : 'Unknown')}</b>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{e.designation}</span>
                                    </div>
                                </div></td>
                                <td>{e.employeeId}</td>
                                <td><span className="badge" style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155' }}>Active Shift</span></td>
                                <td style={{ fontWeight: 800 }}>${e.salary?.toLocaleString()}</td>
                                <td><div style={{ display: 'flex', gap: '3px' }}>{[1, 2, 3, 4, 5].map(i => <div key={i} style={{ width: '12px', height: '12px', borderRadius: '2px', background: i <= (e.performanceRating || 0) ? 'var(--accent-success)' : '#334155' }}></div>)}</div></td>
                                <td><span className={`badge ${e.attendances?.[0]?.status === 'PRESENT' ? 'badge-success' : 'badge-danger'}`}>{e.attendances?.[0]?.status || 'UNDOCUMENTED'}</span></td>
                                <td><div style={{ display: 'flex', gap: '5px' }}>
                                    <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.7rem' }} onClick={() => logAtt(e.id, 'PRESENT')}>Presence</button>
                                    <button className="btn btn-primary" style={{ padding: '5px' }} onClick={() => setModal({ type: 'payroll', metadata: e })}><BadgeDollarSign size={14} /></button>
                                    <button className="btn btn-secondary" style={{ padding: '5px', color: 'var(--accent-danger)' }} onClick={() => onDelete(e.id)}><Trash2 size={14} /></button>
                                </div></td>
                            </tr>
                        ))}</tbody></table>
                </div>
            </div>

            <div className="card">
                <div className="card-header"><Wallet size={16} style={{ marginRight: '10px' }} /> DISBURSEMENT LOG (PAYROLL)</div>
                <div className="table-container" style={{ marginTop: '15px' }}>
                    <table><thead><tr><th>TIMESTAMP</th><th>EMPLOYEE</th><th>MONTH</th><th>BASE</th><th>VARIABLE (BONUS/OT)</th><th>TOTAL PAYOUT</th><th>STATUS</th></tr></thead>
                        <tbody>{payrolls.map((p: any) => (
                            <tr key={p.id}>
                                <td>{new Date(p.paymentDate).toLocaleDateString()}</td>
                                <td><b>{p.employee?.user?.firstName} {p.employee?.user?.lastName}</b></td>
                                <td>{p.month}</td>
                                <td>${p.amount.toFixed(2)}</td>
                                <td style={{ color: 'var(--accent-success)' }}>+${(p.incentive + p.overtimeAmount).toFixed(2)}</td>
                                <td style={{ fontWeight: 800, color: 'var(--accent-danger)' }}>-${p.totalPayout.toFixed(2)}</td>
                                <td><span className="badge badge-success">{p.status}</span></td>
                            </tr>
                        ))}</tbody></table>
                </div>
            </div>
        </div>
    );
};

const ProcurementView = ({ items, refresh, setModal }: any) => (
    <div className="table-container">
        <table><thead><tr><th>P.O. REF</th><th>PARTNER</th><th>STATUS</th><th>VALUATION</th><th>TRACKING</th><th>ACTION</th></tr></thead>
            <tbody>{items.map((o: any) => (
                <tr key={o.id}>
                    <td>{o.orderNumber}</td>
                    <td style={{ fontWeight: 700 }}>{o.supplier?.name}</td>
                    <td><span className={`badge ${o.status === 'RECEIVED' ? 'badge-success' : (o.status === 'SHIPPED' ? 'badge-primary' : 'badge-warning')}`}>{o.status}</span></td>
                    <td>${o.totalAmount.toFixed(2)}</td>
                    <td>{o.trackingNumber ? <div style={{ fontSize: '0.7rem' }}><b>{o.shippingCarrier}:</b> {o.trackingNumber}</div> : <span style={{ color: 'var(--text-muted)' }}>No Tracking</span>}</td>
                    <td><div style={{ display: 'flex', gap: '5px' }}>
                        {o.status === 'PENDING' && <button className="btn btn-secondary" style={{ padding: '5px' }} onClick={() => setModal({ type: 'tracking_po', metadata: o })} title="Ship Order"><Ship size={14} /></button>}
                        {o.status !== 'RECEIVED' && <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.7rem' }} onClick={async () => { await receiveOrder(o.id); refresh(); }}>INWARD</button>}
                    </div></td>
                </tr>
            ))}</tbody></table>
    </div>
);

const SalesView = ({ items, refresh, setModal, currentUser }: any) => {
    // If user is from Shipment Team, only show Home Deliveries
    const filteredItems = currentUser.role === 'SHIPMENT' ? items.filter((s: any) => s.isHomeDelivery) : items;

    return (
        <div className="table-container">
            <table><thead><tr><th>INVOICE</th><th>CLIENT TYPE</th><th>TEAM</th><th>VALUATION</th><th>TRACKING / DESTINATION</th><th>PDF</th><th>ACTION</th></tr></thead>
                <tbody>{filteredItems.map((s: any) => (
                    <tr key={s.id}>
                        <td>{s.invoiceNo}</td>
                        <td><span className={`badge ${s.isHomeDelivery ? 'badge-primary' : 'badge-warning'}`}>{s.isHomeDelivery ? 'HOME DELIVERY' : 'RETAIL'}</span></td>
                        <td><span className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>{s.team}</span></td>
                        <td><b>${s.totalAmount.toFixed(2)}</b></td>
                        <td>
                            {s.isHomeDelivery ? (
                                <div style={{ fontSize: '0.7rem' }}>
                                    <MapPin size={10} style={{ marginRight: '5px' }} /> {s.deliveryAddress}, {s.deliveryCity}
                                    {s.trackingNumber && <div style={{ color: 'var(--accent-success)' }}><b>{s.shippingCarrier}:</b> {s.trackingNumber}</div>}
                                </div>
                            ) : 'Counter Sale'}
                        </td>
                        <td><button className="btn btn-secondary" onClick={() => generateInvoicePDF(s)}><FileText size={14} /></button></td>
                        <td>{s.status === 'PENDING' && s.isHomeDelivery && <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.7rem' }} onClick={() => setModal({ type: 'tracking_sale', metadata: s })}>Log Shipment</button>}</td>
                    </tr>
                ))}</tbody></table>
        </div>
    );
};

const CustomersView = ({ items }: any) => (
    <div className="table-container">
        <table><thead><tr><th>CLIENT IDENTITY</th><th>LOCATION</th><th>CONTACT</th></tr></thead>
            <tbody>{items.map((c: any) => (
                <tr key={c.id}>
                    <td><b>{c.name}</b><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{c.email}</div></td>
                    <td>{c.address}, {c.city} {c.zipCode}</td>
                    <td>{c.phone}</td>
                </tr>
            ))}</tbody></table>
    </div>
);

const UsersView = ({ items }: any) => (
    <div className="table-container">
        <table><thead><tr><th>IDENTITY</th><th>EMAIL</th><th>ROLE</th><th>STATUS</th></tr></thead>
            <tbody>{items.map((u: any) => (
                <tr key={u.id}><td><b>{u.firstName} {u.lastName}</b></td><td>{u.email}</td><td>{u.role}</td><td>{u.isActive ? 'ACTIVE' : 'LOCKED'}</td></tr>
            ))}</tbody></table>
    </div>
);

const SuppliersView = ({ items }: any) => (
    <div className="table-container">
        <table><thead><tr><th>NAME</th><th>EMAIL</th><th>ACCESS</th></tr></thead>
            <tbody>{items.map((s: any) => (
                <tr key={s.id}><td><b>{s.name}</b></td><td>{s.email}</td><td>{s.isBlocked ? 'BLOCKED' : 'ACTIVE'}</td></tr>
            ))}</tbody></table>
    </div>
);

const WarehouseView = ({ warehouses }: any) => (
    <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {warehouses.map((w: any) => (
            <div key={w.id} className="card">
                <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{w.name}</span>
                    {w.isDefault && <span className="badge badge-primary">HUB</span>}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '15px' }}>{w.location}</div>
                <div className="table-container">
                    <table><thead><tr><th>ITEM</th><th>QTY</th><th>RESERVED</th></tr></thead><tbody>
                        {w.stocks.map((s: any) => (
                            <tr key={s.id}>
                                <td>{s.product.name}</td>
                                <td>{s.quantity}</td>
                                <td>{s.reserved > 0 ? <span className="badge badge-warning">{s.reserved}</span> : '-'}</td>
                            </tr>
                        ))}
                    </tbody></table>
                </div>
            </div>
        ))}
    </div>
);

const PipelineView = ({ deals, refresh, setModal }: any) => {
    const stages = ['NEW', 'QUALIFIED', 'NEGOTIATION', 'WON', 'LOST'];

    const moveStage = async (id: string, currentStage: string) => {
        const nextIdx = stages.indexOf(currentStage) + 1;
        if (nextIdx < stages.length) {
            await api.patch(`/crm/${id}/stage`, { stage: stages[nextIdx] });
            refresh();
        }
    };

    return (
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', alignItems: 'start' }}>
            {stages.map(stage => (
                <div key={stage} style={{ background: '#1e293b', padding: '10px', borderRadius: '8px', minHeight: '300px' }}>
                    <div style={{ fontWeight: 800, marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #334155', color: stage === 'WON' ? 'var(--accent-success)' : (stage === 'LOST' ? 'var(--accent-danger)' : '#fff') }}>{stage}</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {deals.filter((d: any) => d.stage === stage).map((d: any) => (
                            <div key={d.id} className="card" style={{ padding: '10px', background: '#0f172a', border: '1px solid #334155' }}>
                                <div style={{ fontWeight: 700 }}>{d.title}</div>
                                <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{d.customer?.name}</div>
                                <div style={{ marginTop: '10px', fontWeight: 800, color: '#22d3ee' }}>${d.value.toLocaleString()}</div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                                    <div style={{ fontSize: '0.7rem' }}>{d.probability}% Prob.</div>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <div onClick={() => generateQuotePDF(d)} style={{ cursor: 'pointer', padding: '2px 6px', background: 'var(--accent-primary)', color: '#fff', borderRadius: '4px', fontSize: '0.7rem' }}>Quote</div>
                                        {stage !== 'WON' && stage !== 'LOST' && <div onClick={() => moveStage(d.id, stage)} style={{ cursor: 'pointer', padding: '2px 6px', background: '#334155', borderRadius: '4px', fontSize: '0.7rem' }}>Next &rarr;</div>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Form Modal ---
const FormModal = ({ type, metadata, onClose, categories, suppliers, products, departments, users, customers, employees, warehouses }: any) => {
    const [formData, setFormData] = useState<any>({});
    useEffect(() => {
        const init = {
            products: { name: '', sku: '', categoryId: '', price: 0, costPrice: 0, stockQuantity: 0, lowStockThreshold: 10, leadTimeDays: 7, avgDailySales: 1.0 },
            suppliers: { name: '', email: '' },
            orders: { supplierId: '', items: [{ productId: '', quantity: 1, unitPrice: 0 }] },
            payment: { amount: 0, method: 'CASH', type: 'RECEIVABLE', transactionId: '' },
            sales: { items: [{ productId: '', quantity: 1, unitPrice: 0 }], customerId: '', team: 'SALES', isHomeDelivery: false, deliveryAddress: '', deliveryCity: '' },
            users: { email: '', password: '', firstName: '', lastName: '', role: 'STAFF' },
            employees: { employeeId: '', designation: '', joiningDate: new Date().toISOString().split('T')[0], salary: 0, incentivePercentage: 0, departmentId: '', userId: '' },
            tracking_po: { trackingNumber: '', shippingCarrier: '', status: 'SHIPPED', expectedDeliveryDate: '' },
            tracking_sale: { trackingNumber: '', shippingCarrier: '', status: 'SHIPPED' },
            customers: { name: '', email: '', phone: '', address: '', city: '', zipCode: '' },
            payroll: { employeeId: metadata?.id || '', amount: metadata?.salary || 0, month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }), status: 'PAID', monthlySales: 0, overtimeHours: 0 },
            pricing_rule: { productId: metadata?.id || '', name: 'Volume Discount', minQuantity: 10, discountPercent: 5.0 },
            document_receipt: { type: 'RECEIPT', sourceWarehouseId: warehouses?.[0]?.id, items: [{ productId: '', quantity: 0 }], notes: '' },
            document_transfer: { type: 'TRANSFER', sourceWarehouseId: warehouses?.[0]?.id, targetWarehouseId: '', items: [{ productId: '', quantity: 0 }], notes: '' },
            deals: { title: 'New Deal', value: 0, customerId: '', items: [{ productId: '', quantity: 1, price: 0 }] }
        };
        setFormData((init as any)[type] || {});
    }, [type, metadata, warehouses]);

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        try {
            if (type === 'products') await createProduct(formData);
            if (type === 'suppliers') await createSupplier(formData);
            if (type === 'orders') await createOrder(formData);
            if (type === 'payment') await api.post('/accounts/payment', formData);
            if (type === 'sales') await createSale({ ...formData, taxAmount: 0 });
            if (type === 'users') await createUser(formData);
            if (type === 'employees') await createEmployee(formData);
            if (type === 'tracking_po') await api.patch(`/orders/${metadata.id}/tracking`, formData);
            if (type === 'tracking_sale') await api.patch(`/sales/${metadata.id}/tracking`, formData);
            if (type === 'customers') await createCustomer(formData);
            if (type === 'payroll') await createPayroll(formData);
            if (type === 'deals') await api.post('/crm', formData);
            onClose();
        } catch (e: any) { alert("Execution Error."); }
    };

    return (
        <div className="modal-overlay" onClick={onClose}><motion.div initial={{ y: 20 }} animate={{ y: 0 }} className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: type === 'hr' ? '600px' : '500px' }}>
            <div className="modal-header"><span>{type.toUpperCase()} PROTOCOL</span><X onClick={onClose} style={{ cursor: 'pointer' }} /></div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                {type === 'deals' && (
                    <>
                        <div className="form-group"><label>Deal Title</label><input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required /></div>
                        <div className="form-group"><label>Customer Identity</label><select value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value })} required><option value="">Select Client</option>{customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        <div className="form-group"><label>Initial Value ($ Estimate)</label><input type="number" value={formData.value} onChange={e => setFormData({ ...formData, value: parseFloat(e.target.value) })} /></div>
                    </>
                )}

                {type.startsWith('document_') && (
                    <>
                        <div className="form-group"><label>Source Warehouse</label><select value={formData.sourceWarehouseId} onChange={e => setFormData({ ...formData, sourceWarehouseId: e.target.value })}>{warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
                        {type === 'document_transfer' && <div className="form-group"><label>Target Warehouse</label><select value={formData.targetWarehouseId} onChange={e => setFormData({ ...formData, targetWarehouseId: e.target.value })} required><option value="">Select Destination</option>{warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>}
                        {formData.items?.map((item: any, idx: number) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '5px' }}><select value={item.productId} onChange={e => { const n = [...formData.items]; n[idx].productId = e.target.value; setFormData({ ...formData, items: n }); }} required><option value="">Artifact</option>{products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><input type="number" value={item.quantity} onChange={e => { const n = [...formData.items]; n[idx].quantity = parseInt(e.target.value); setFormData({ ...formData, items: n }); }} placeholder="Qty" /></div>
                        ))}
                        <div className="form-group"><label>Notes</label><input value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} /></div>
                    </>
                )}
                {type === 'sales' && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div className="form-group"><label>Assigned Team</label><select value={formData.team} onChange={e => setFormData({ ...formData, team: e.target.value })}><option value="SALES">Sales Team</option><option value="OPERATIONS">Operations Team</option><option value="MANAGEMENT">Management Team</option><option value="SHIPMENT">Shipment Team</option><option value="OTHERS">Others</option></select></div>
                            <div className="form-group"><label>Customer Identity</label><select value={formData.customerId} onChange={e => {
                                const c = customers.find((x: any) => x.id === e.target.value);
                                setFormData({ ...formData, customerId: e.target.value, deliveryAddress: c?.address || '', deliveryCity: c?.city || '' })
                            }}><option value="">Walk-in Retail</option>{customers.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        </div>
                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><input type="checkbox" checked={!!(formData as any).isHomeDelivery} onChange={e => setFormData({ ...formData, isHomeDelivery: e.target.checked })} /> <label>Home Delivery Protocol</label></div>
                        {(formData as any).isHomeDelivery && (
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                                <div className="form-group"><label>Delivery Address</label><input value={formData.deliveryAddress} onChange={e => setFormData({ ...formData, deliveryAddress: e.target.value })} placeholder="Street node" /></div>
                                <div className="form-group"><label>City</label><input value={formData.deliveryCity} onChange={e => setFormData({ ...formData, deliveryCity: e.target.value })} placeholder="Metropolis" /></div>
                            </div>
                        )}
                        {formData.items?.map((item: any, idx: number) => (
                            <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '5px' }}><select value={item.productId} onChange={e => { const n = [...formData.items]; n[idx].productId = e.target.value; n[idx].unitPrice = products.find((p: any) => p.id === e.target.value)?.price || 0; setFormData({ ...formData, items: n }); }} required><option value="">Artifact</option>{products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}</select><input type="number" value={item.quantity} onChange={e => { const n = [...formData.items]; n[idx].quantity = parseInt(e.target.value); setFormData({ ...formData, items: n }); }} /></div>
                        ))}
                    </>
                )}
                {type === 'payroll' && (
                    <>
                        <div className="form-group"><label>Employee</label><input value={`${metadata?.user?.firstName} ${metadata?.user?.lastName}`} disabled /></div>
                        <div className="form-group"><label>Disbursement Amount ($)</label><input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })} /></div>
                        <div className="form-group"><label>Payroll Month</label><input value={formData.month} onChange={e => setFormData({ ...formData, month: e.target.value })} placeholder="January 2026" /></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div className="form-group"><label>Monthly Sales ($)</label><input type="number" value={formData.monthlySales} onChange={e => setFormData({ ...formData, monthlySales: parseFloat(e.target.value) })} /></div>
                            <div className="form-group"><label>Overtime (Hours)</label><input type="number" value={formData.overtimeHours} onChange={e => setFormData({ ...formData, overtimeHours: parseFloat(e.target.value) })} /></div>
                        </div>
                        <div className="form-group"><label>Status</label><select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}><option value="PAID">Disbursed (Paid)</option><option value="PENDING">Pending (Accrued)</option></select></div>
                    </>
                )}
                {type === 'users' && (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div className="form-group"><label>First Name</label><input value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} required /></div>
                            <div className="form-group"><label>Last Name</label><input value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} required /></div>
                        </div>
                        <div className="form-group"><label>Email</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required /></div>
                        <div className="form-group"><label>Password</label><input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required /></div>
                        <div className="form-group"><label>System Role</label><select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}><option value="STAFF">Staff</option><option value="ADMIN">Admin</option><option value="ACCOUNTANT">Accountant</option><option value="HR">HR Manager</option><option value="SHIPMENT">Shipment Team</option><option value="SUPER_ADMIN">Super Admin</option></select></div>
                    </>
                )}
                {type === 'customers' && (
                    <>
                        <div className="form-group"><label>Name</label><input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required /></div>
                        <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div><label>Email</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                            <div><label>Phone</label><input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} /></div>
                        </div>
                        <div className="form-group"><label>Home Address</label><input value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} /></div>
                    </>
                )}
                {type === 'employees' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>Personal Identity</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <input value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} placeholder="First Name" />
                                <input value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} placeholder="Last Name" />
                            </div>
                        </div>
                        <div className="form-group" style={{ gridColumn: 'span 2' }}><label>System User Link</label><select value={formData.userId} onChange={e => setFormData({ ...formData, userId: e.target.value })}><option value="">None (Standalone)</option>{users.map((u: any) => <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>)}</select></div>
                        <div className="form-group"><label>Operational ID</label><input value={formData.employeeId} onChange={e => setFormData({ ...formData, employeeId: e.target.value })} required /></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div className="form-group"><label>Annual Salary ($)</label><input type="number" value={formData.salary} onChange={e => setFormData({ ...formData, salary: parseFloat(e.target.value) })} /></div>
                            <div className="form-group"><label>Incentive %</label><input type="number" step="0.01" value={formData.incentivePercentage} onChange={e => setFormData({ ...formData, incentivePercentage: parseFloat(e.target.value) })} /></div>
                        </div>
                    </div>
                )}
                {type === 'pricing_rule' && (
                    <>
                        <div className="form-group"><label>Strategy Name</label><input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="e.g. Bulk Buy" required /></div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div className="form-group"><label>Min Quantity Trigger</label><input type="number" value={formData.minQuantity} onChange={e => setFormData({ ...formData, minQuantity: parseInt(e.target.value) })} /></div>
                            <div className="form-group"><label>Discount (%)</label><input type="number" step="0.1" value={formData.discountPercent} onChange={e => setFormData({ ...formData, discountPercent: parseFloat(e.target.value) })} /></div>
                        </div>
                    </>
                )}
                {type.startsWith('tracking_') && (
                    <>
                        <div className="form-group"><label>Carrier</label><input value={formData.shippingCarrier} onChange={e => setFormData({ ...formData, shippingCarrier: e.target.value })} placeholder="FedEx, DHL..." required /></div>
                        <div className="form-group"><label>Tracking Number</label><input value={formData.trackingNumber} onChange={e => setFormData({ ...formData, trackingNumber: e.target.value })} placeholder="TR-900-X" required /></div>
                    </>
                )}
                <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={onClose}>Abort</button><button type="submit" className="btn btn-primary">Commit Protocol</button></div>
            </form>
        </motion.div></div>
    );
};

export default App;
