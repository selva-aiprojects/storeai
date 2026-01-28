import { useOutletContext } from 'react-router-dom';
import { ShoppingCart, AlertCircle, Plus, Tag, Package } from 'lucide-react';
import { motion } from 'framer-motion';

const Products = () => {
    const { data, setModal } = useOutletContext<any>() as any;
    const { products } = data || {};

    return (
        <div style={{ padding: '0 10px', maxWidth: '1600px', margin: '0 auto' }}>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '32px',
                paddingBottom: '40px'
            }}>
                {products?.filter((p: any) => !p.isDeleted).map((p: any, i: number) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={p.id}
                        className="card glass-effect"
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            padding: 0,
                            overflow: 'hidden',
                            borderRadius: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            background: 'linear-gradient(145deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.3) 100%)',
                            boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            position: 'relative',
                            height: '100%'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-8px) scale(1.02)';
                            e.currentTarget.style.boxShadow = '0 20px 50px -12px rgba(139, 92, 246, 0.25)'; // Purple Glow
                            e.currentTarget.style.borderColor = '#a78bfa'; // Light Purple Border
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0) scale(1)';
                            e.currentTarget.style.boxShadow = '0 10px 40px -10px rgba(0,0,0,0.1)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)';
                        }}
                    >
                        {/* --- Hero Image / Icon Area --- */}
                        <div style={{
                            height: '220px',
                            background: p.image
                                ? `url(${p.image}) center/cover no-repeat`
                                : 'radial-gradient(circle at 50% 100%, #f3e8ff 0%, #e9d5ff 100%)', // Light Purple Gradient
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderBottom: '1px solid rgba(255,255,255,0.5)'
                        }}>
                            {!p.image && (
                                <div style={{
                                    background: '#fff',
                                    padding: '20px',
                                    borderRadius: '50%',
                                    boxShadow: '0 10px 25px rgba(139, 92, 246, 0.15)', // Purple Shadow
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Package size={40} color="#8b5cf6" strokeWidth={1.5} /> {/* Purple Icon */}
                                </div>
                            )}

                            {/* Stock Badge */}
                            <div style={{
                                position: 'absolute',
                                top: '16px',
                                right: '16px',
                            }}>
                                <span className={`badge ${p.stockQuantity <= (p.lowStockThreshold || 10) ? 'badge-danger' : 'badge-success'}`} style={{
                                    backdropFilter: 'blur(8px)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    border: '1px solid rgba(255,255,255,0.5)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>
                                    {p.stockQuantity} {p.unit}
                                </span>
                            </div>

                            {/* Category Pill */}
                            <div style={{
                                position: 'absolute',
                                bottom: '16px',
                                left: '16px',
                            }}>
                                <span style={{
                                    background: 'rgba(255,255,255,0.9)',
                                    backdropFilter: 'blur(4px)',
                                    padding: '6px 12px',
                                    borderRadius: '30px',
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    color: '#7c3aed', // Deep Purple Text
                                    letterSpacing: '0.05em',
                                    textTransform: 'uppercase',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                }}>
                                    <Tag size={10} /> {p.category?.name || 'ASSET'}
                                </span>
                            </div>
                        </div>

                        {/* --- Card Body --- */}
                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, background: 'rgba(255,255,255,0.4)' }}>
                            <div>
                                <h3 style={{
                                    fontSize: '1.4rem',
                                    fontWeight: 800,
                                    letterSpacing: '-0.03em',
                                    lineHeight: 1.1,
                                    marginBottom: '4px',
                                    background: 'linear-gradient(90deg, #1e293b 0%, #334155 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent'
                                }}>
                                    {p.name}
                                </h3>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, fontFamily: 'monospace' }}>
                                    SKU: {p.sku}
                                </div>
                            </div>

                            <div style={{
                                display: 'flex',
                                alignItems: 'baseline',
                                gap: '4px',
                                paddingBottom: '16px',
                                borderBottom: '1px solid rgba(0,0,0,0.05)'
                            }}>
                                <span style={{ fontSize: '1.8rem', fontWeight: 800, color: '#7c3aed', letterSpacing: '-0.05em' }}> {/* Purple Price */}
                                    ${p.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>USD</span>
                            </div>

                            <p style={{
                                fontSize: '0.9rem',
                                color: '#475569',
                                lineHeight: 1.6,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                margin: 0
                            }}>
                                {p.description || "Premium enterprise artifact. Engineered for high-performance retail operations."}
                            </p>

                            <div style={{ marginTop: 'auto', paddingTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <button
                                    className="btn"
                                    onClick={() => setModal({ type: 'requisitions', metadata: { productId: p.id, name: p.name } })}
                                    style={{
                                        justifyContent: 'center',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        background: '#fff',
                                        color: '#334155',
                                        border: '1px solid #e2e8f0',
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                                    }}
                                >
                                    Stock Request
                                </button>
                                <button
                                    className="btn"
                                    onClick={() => setModal({ type: 'sales', metadata: { items: [{ productId: p.id, quantity: 1, unitPrice: p.price }] } })}
                                    style={{
                                        justifyContent: 'center',
                                        fontSize: '0.8rem',
                                        fontWeight: 700,
                                        background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
                                        color: '#fff',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
                                    }}
                                >
                                    Sell Item
                                </button>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default Products;
