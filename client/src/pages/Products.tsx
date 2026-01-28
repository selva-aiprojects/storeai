import { useOutletContext } from 'react-router-dom';
import { ShoppingCart, AlertCircle, Plus } from 'lucide-react';

const Products = () => {
    const { data, setModal } = useOutletContext<any>() as any;
    const { products } = data || {};

    return (
        <div style={{ padding: '0 10px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {products?.filter((p: any) => !p.isDeleted).map((p: any) => (
                    <div key={p.id} className="card" style={{
                        display: 'flex',
                        flexDirection: 'column',
                        padding: 0,
                        overflow: 'hidden',
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-color)',
                        borderRadius: '16px',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: 'default'
                    }}>
                        {/* Visual Header */}
                        <div style={{
                            height: '180px',
                            background: p.image ? `url(${p.image}) center/cover no-repeat` : 'var(--bg-gradient)',
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'rgba(255,255,255,0.2)'
                        }}>
                            {!p.image && <ShoppingCart size={64} />}
                            <div style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px'
                            }}>
                                <span className={`badge ${p.stockQuantity <= (p.lowStockThreshold || 10) ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.6rem', padding: '4px 8px' }}>
                                    {p.stockQuantity} {p.unit} IN STOCK
                                </span>
                            </div>
                        </div>

                        {/* Content */}
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{p.name}</h3>
                                    <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>SKU: {p.sku} | {p.category?.name}</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--accent-primary)' }}>${p.price.toFixed(2)}</div>
                                    <div style={{ fontSize: '0.6rem', opacity: 0.4 }}>Tax Incl.</div>
                                </div>
                            </div>

                            <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: '10px 0', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {p.description || "Enterprise-grade artifact engineered for high-performance retail operations. Certified for StoreAI ERP environments."}
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: 'auto', paddingTop: '15px' }}>
                                <button
                                    className="btn btn-secondary"
                                    style={{ fontSize: '0.7rem', height: '40px' }}
                                    onClick={() => setModal({ type: 'requisitions', metadata: { productId: p.id, name: p.name } })}
                                >
                                    <AlertCircle size={14} style={{ marginRight: '6px' }} /> REQUEST STOCK
                                </button>
                                <button
                                    className="btn btn-primary"
                                    style={{ fontSize: '0.7rem', height: '40px' }}
                                    onClick={() => setModal({ type: 'sales', metadata: { items: [{ productId: p.id, quantity: 1, unitPrice: p.price }] } })}
                                >
                                    <Plus size={14} style={{ marginRight: '6px' }} /> SELL NOW
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Products;
