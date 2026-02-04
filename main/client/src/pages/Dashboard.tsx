import { useOutletContext } from 'react-router-dom';
import { Package, Truck, CheckCircle2, FileText, AlertTriangle, Layers, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const Dashboard = () => {
    const { data } = useOutletContext<any>();
    const { stats, sales = [], orders = [], products = [], inventory } = data || {};

    // --- Financial Status ---
    const totalRevenue = stats?.revenue || sales.reduce((acc: number, s: any) => acc + (s.totalAmount || 0), 0);
    const totalProcurement = stats?.procurement || orders.reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);
    const netStatus = totalRevenue - totalProcurement;

    // --- Activity Widgets ---
    const toBePacked = stats?.activity?.toBePacked ?? sales.filter((s: any) => s.status === 'PENDING' && s.isHomeDelivery).length;
    const toBeShipped = stats?.activity?.toBeShipped ?? sales.filter((s: any) => s.status === 'PACKED').length;
    const toBeDelivered = stats?.activity?.toBeDelivered ?? sales.filter((s: any) => s.status === 'SHIPPED').length;
    const toBeInvoiced = stats?.activity?.toBeInvoiced ?? sales.filter((s: any) => s.paymentStatus === 'PENDING').length;

    const quantityInHand = inventory?.totalQuantity || products.reduce((acc: number, p: any) => acc + (p.stockQuantity || 0), 0) || 0;
    const quantityToReceive = stats?.activeOrders || orders.filter((o: any) => o.status !== 'RECEIVED').reduce((acc: number, o: any) => acc + (o.items?.length || 0), 0);

    const lowStockItems = products.filter((p: any) => p.stockQuantity <= p.reorderPoint).length;
    const activeItems = products.filter((p: any) => !p.isDeleted).length;
    const itemGroups = new Set(products.map((p: any) => p.categoryId)).size;

    // Top Selling Items Logic
    const salesMap = new Map();
    sales.forEach((sale: any) => {
        sale.items.forEach((item: any) => {
            const current = salesMap.get(item.product?.name) || 0;
            salesMap.set(item.product?.name, current + item.quantity);
        });
    });
    const topSelling = Array.from(salesMap.entries())
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

    const activeItemsData = [
        { name: 'Active', value: activeItems },
        { name: 'Inactive', value: Math.max(0, products.length - activeItems) },
    ];
    const COLORS = ['#10b981', '#1e293b'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* --- Financial Status --- */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div className="section-header" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-700)' }}>Enterprise Financial Pulse</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Real-time consolidated view</div>
            </div>

            <div className="dashboard-grid">
                <div className="card" style={{ borderLeft: '4px solid var(--success)', background: 'white' }}>
                    <div className="card-header">TOTAL REVENUE (SALES)</div>
                    <div className="metric-value">
                        <span style={{ color: 'var(--success)' }}>₹{totalRevenue.toLocaleString()}</span>
                    </div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--danger)', background: 'white' }}>
                    <div className="card-header">TOTAL PROCUREMENT (COSTS)</div>
                    <div className="metric-value">
                        <span style={{ color: 'var(--danger)' }}>-₹{totalProcurement.toLocaleString()}</span>
                    </div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--primary-500)', background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.05) 0%, white 100%)' }}>
                    <div className="card-header">OPERATIONAL NET BALANCE</div>
                    <div className="metric-value">
                        <span style={{ color: netStatus >= 0 ? 'var(--primary-600)' : 'var(--danger)' }}>
                            {netStatus >= 0 ? '+' : '-'}₹{Math.abs(netStatus).toLocaleString()}
                        </span>
                    </div>
                </div>
            </div>

            {/* --- Sales Activity Section --- */}
            <div className="section-header" style={{ marginTop: '10px', fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Workflow Pipeline</div>
            <div className="dashboard-grid">
                <ActivityCard count={toBePacked} label="To Be Packed" icon={Package} color="var(--secondary-500)" />
                <ActivityCard count={toBeShipped} label="To Be Shipped" icon={Truck} color="var(--warning)" />
                <ActivityCard count={toBeDelivered} label="To Be Delivered" icon={CheckCircle2} color="var(--success)" />
                <ActivityCard count={toBeInvoiced} label="To Be Invoiced" icon={FileText} color="var(--danger)" />
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

                {/* --- Product Details --- */}
                <div className="card">
                    <div className="card-header">PRODUCT PORTFOLIO</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '20px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <DetailRow label="Low Stock Items" value={lowStockItems} isDanger />
                            <DetailRow label="All Item Groups" value={itemGroups} />
                            <DetailRow label="All Items" value={products.length} />
                            <DetailRow label="Active Percentage" value={`${Math.round((activeItems / (products.length || 1)) * 100)}%`} />
                        </div>
                        <div style={{ height: '160px', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-600)' }}>{activeItems}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>ACTIVE</div>
                            </div>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={activeItemsData} innerRadius={50} outerRadius={70} dataKey="value" stroke="none" startAngle={90} endAngle={-270}>
                                        {activeItemsData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* --- Inventory Summary --- */}
                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div className="card-header">INVENTORY MOMENTUM</div>
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>QUANTITY IN HAND</span>
                            <span className="metric-value" style={{ fontSize: '1.75rem' }}>{quantityInHand.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>TO BE RECEIVED</span>
                            <span className="metric-value" style={{ fontSize: '1.75rem', color: 'var(--secondary-500)' }}>{quantityToReceive.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Top Selling & Purchase --- */}
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
                <div className="card">
                    <div className="card-header">TOP PERFORMING PRODUCTS</div>
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {topSelling.length > 0 ? topSelling.map((item: any, idx: number) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #f1f5f9' }}>
                                <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-500)', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                    <Layers size={18} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.qty} units sold</div>
                                </div>
                                <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--primary-600)', opacity: 0.3 }}>0{idx + 1}</div>
                            </div>
                        )) : <div style={{ opacity: 0.5, textAlign: 'center', padding: '20px' }}>No performance data available.</div>}
                    </div>
                </div>

                <div className="card" style={{ background: 'var(--primary-gradient)', color: 'white' }}>
                    <div className="card-header" style={{ color: 'rgba(255,255,255,0.8)' }}>SUPPLY CHAIN ADVISOR</div>
                    <div style={{ marginTop: '30px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: '8px' }}>Pending Inventory Inward</div>
                        <div className="metric-value" style={{ color: 'white', fontSize: '2.5rem' }}>{quantityToReceive}</div>
                        <div style={{ marginTop: '20px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.1)', fontSize: '0.85rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                            Real-time tracking active <CheckCircle2 size={16} />
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Direct Release Advisor (FIFO/Expiry focus) --- */}
            <div className="section-header" style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Direct Release Advisor (FIFO Compliance)</div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>PRODUCT</th>
                            <th>NEXT BATCH</th>
                            <th>UOM</th>
                            <th>AVAIL QTY</th>
                            <th>EXPIRY STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products?.slice(0, 8).map((p: any) => {
                            const bestBatch = p.batches?.length > 0 ? [...p.batches].sort((a: any, b: any) => new Date(a.expiryDate || '9999').getTime() - new Date(b.expiryDate || '9999').getTime())[0] : null;
                            if (!bestBatch) return null;
                            const isExpiringSoon = bestBatch.expiryDate && (new Date(bestBatch.expiryDate).getTime() - new Date().getTime()) < (30 * 24 * 60 * 60 * 1000);
                            return (
                                <tr key={p.id}>
                                    <td><b>{p.name}</b></td>
                                    <td><code style={{ color: 'var(--secondary-500)', fontWeight: 700 }}>{bestBatch.batchNumber}</code></td>
                                    <td>{p.unit}</td>
                                    <td><b>{bestBatch.quantityAvailable}</b></td>
                                    <td>
                                        <span className={`badge ${isExpiringSoon ? 'badge-danger' : 'badge-success'}`} style={{ borderRadius: '6px', fontSize: '0.7rem' }}>
                                            {bestBatch.expiryDate ? new Date(bestBatch.expiryDate).toLocaleDateString() : 'STABLE'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>


        </div>
    );
};

// Helper Components
const ActivityCard = ({ count, label, icon: Icon, color }: any) => (
    <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
        <div style={{ fontSize: '2.5rem', fontWeight: 800, color }}>{count}</div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ marginTop: '8px', color: 'var(--text-muted)', opacity: 0.5 }}><Icon size={20} /></div>
    </div>
);

const DetailRow = ({ label, value, isDanger }: any) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: isDanger ? 'var(--accent-danger)' : 'var(--text-muted)', fontSize: '0.9rem' }}>{label}</span>
        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>{value}</span>
    </div>
);

export default Dashboard;
