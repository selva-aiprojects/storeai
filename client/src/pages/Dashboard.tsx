import { useOutletContext } from 'react-router-dom';
import { Package, Truck, CheckCircle2, FileText, AlertTriangle, Layers, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

const Dashboard = () => {
    const { data, user } = useOutletContext<any>();
    const { stats, sales = [], orders = [], products = [], inventory, financialSummary } = data || {};

    // --- Financial Status ---
    const totalRevenue = sales.reduce((acc: number, s: any) => acc + (s.totalAmount || 0), 0);
    const totalProcurement = orders.reduce((acc: number, o: any) => acc + (o.totalAmount || 0), 0);
    const netStatus = totalRevenue - totalProcurement;

    // --- Calculations for Widgets ---
    const toBePacked = sales.filter((s: any) => s.status === 'PENDING' && s.isHomeDelivery).length;
    const toBeShipped = sales.filter((s: any) => s.status === 'PACKED').length;
    const toBeDelivered = sales.filter((s: any) => s.status === 'SHIPPED').length;
    const toBeInvoiced = sales.filter((s: any) => s.paymentStatus === 'PENDING').length;

    const quantityInHand = inventory?.totalQuantity || 0;
    const quantityToReceive = orders.filter((o: any) => o.status !== 'RECEIVED').reduce((acc: number, o: any) => acc + (o.items?.length || 0), 0); // Rough estimate of qty

    const lowStockItems = products.filter((p: any) => p.stockQuantity <= p.reorderPoint).length;
    const activeItems = products.filter((p: any) => !p.isDeleted).length;
    const itemGroups = new Set(products.map((p: any) => p.categoryId)).size;

    // Unconfirmed Items (Mock for now, maybe drafted products)
    const unconfirmedItems = 0;

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
        { name: 'Inactive', value: products.length - activeItems },
    ];
    const COLORS = ['#10b981', '#1e293b'];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* --- Financial Status --- */}
            <div className="section-header">Enterprise Financial Pulse</div>
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div className="card" style={{ borderLeft: '4px solid var(--accent-success)' }}>
                    <div className="card-header">TOTAL REVENUE (SALES)</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-success)' }}>${totalRevenue.toLocaleString()}</div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--accent-danger)' }}>
                    <div className="card-header">TOTAL PROCUREMENT (COSTS)</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-danger)' }}>-${totalProcurement.toLocaleString()}</div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid var(--accent-primary)', background: 'rgba(129, 140, 248, 0.05)' }}>
                    <div className="card-header">OPERATIONAL NET BALANCE</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, color: netStatus >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                        {netStatus >= 0 ? '+' : '-'}${Math.abs(netStatus).toLocaleString()}
                    </div>
                </div>
            </div>

            {/* --- Sales Activity Section --- */}
            <div className="section-header">Sales Activity</div>
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                <ActivityCard count={toBePacked} label="Qty To Be Packed" icon={Package} color="#3b82f6" />
                <ActivityCard count={toBeShipped} label="Pkgs To Be Shipped" icon={Truck} color="#eab308" />
                <ActivityCard count={toBeDelivered} label="Pkgs To Be Delivered" icon={CheckCircle2} color="#10b981" />
                <ActivityCard count={toBeInvoiced} label="Qty To Be Invoiced" icon={FileText} color="#f43f5e" />
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr', gap: '24px' }}>

                {/* --- Product Details --- */}
                <div className="card">
                    <div className="card-header">PRODUCT DETAILS</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <DetailRow label="Low Stock Items" value={lowStockItems} isDanger />
                            <DetailRow label="All Item Groups" value={itemGroups} />
                            <DetailRow label="All Items" value={products.length} />
                            <DetailRow label="Unconfirmed Items" value={unconfirmedItems} />
                        </div>
                        <div style={{ height: '160px', position: 'relative' }}>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{Math.round((activeItems / (products.length || 1)) * 100)}%</div>
                                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>ACTIVE</div>
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
                    <div className="card-header">INVENTORY SUMMARY</div>
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>QUANTITY IN HAND</span>
                            <span style={{ fontSize: '1.8rem', fontWeight: 700 }}>{quantityInHand.toLocaleString()}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>QUANTITY TO BE RECEIVED</span>
                            <span style={{ fontSize: '1.8rem', fontWeight: 700 }}>{quantityToReceive.toLocaleString()}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- Top Selling & Purchase --- */}
            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>TOP SELLING ITEMS</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>This Month</span>
                    </div>
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {topSelling.map((item: any, idx: number) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{ width: '40px', height: '40px', background: 'var(--bg-hover)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Layers size={18} color="var(--accent-primary)" />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600 }}>{item.name}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.qty} pcs sold</div>
                                </div>
                                <div style={{ fontWeight: 700 }}>#{idx + 1}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>PURCHASE ORDER</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>This Month</span>
                    </div>
                    <div style={{ marginTop: '30px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '5px' }}>Quantity Ordered</div>
                        <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--accent-secondary)' }}>{quantityToReceive}</div>
                        <div style={{ marginTop: '15px', color: 'var(--accent-primary)', fontSize: '0.8rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                            View Order Details <ArrowRight size={14} />
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

// Helper Components
const ActivityCard = ({ count, label, icon: Icon, color }: any) => (
    <div className="card hover-up" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
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
