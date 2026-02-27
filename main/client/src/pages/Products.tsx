import { useOutletContext } from 'react-router-dom';
import { ShoppingCart, AlertCircle, Plus, Tag, Package } from 'lucide-react';
import { motion } from 'framer-motion';

const Products = () => {
    const { data, setModal } = useOutletContext<any>() as any;
    const { products } = data || {};

    return (
        <div className="px-2.5 max-w-[1600px] mx-auto">
            {/* Header/Banner for Products */}
            <div className="flex items-center gap-3 mt-4 mb-6 border-b border-blue-100 pb-4">
                <div className="bg-blue-50 p-2 rounded-xl">
                    <Package size={24} className="text-[#0061A8]" />
                </div>
                <div>
                    <h1 className="text-2xl font-extrabold text-[#002244] tracking-tight">Product Catalog</h1>
                    <p className="text-sm font-medium text-slate-500">Manage your active inventory and market assets</p>
                </div>
            </div>

            <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-8 pb-10">
                {products?.filter((p: any) => !p.isDeleted).map((p: any, i: number) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={p.id}
                        className="card glass-effect group flex flex-col p-0 overflow-hidden rounded-3xl border border-[#0061A8]/10 bg-white shadow-[0_10px_40px_-10px_rgba(0,97,168,0.05)] transition-all duration-[400ms] ease-[cubic-bezier(0.175,0.885,0.32,1.275)] relative h-full hover:-translate-y-2 hover:scale-[1.02] hover:shadow-[0_20px_50px_-12px_rgba(0,97,168,0.2)] hover:border-[#00a3e0]/30"
                    >
                        {/* --- Hero Image / Icon Area --- */}
                        <div className="h-[220px] relative flex items-center justify-center border-b border-[#0061A8]/5"
                            style={{
                                background: p.image
                                    ? `url(${p.image}) center/cover no-repeat`
                                    : 'radial-gradient(circle at 50% 100%, #eff6ff 0%, #dbeafe 100%)',
                            }}>
                            {!p.image && (
                                <div className="bg-white p-6 rounded-full shadow-[0_10px_25px_rgba(0,97,168,0.1)] flex items-center justify-center">
                                    <Package size={44} color="#0061A8" strokeWidth={1.5} />
                                </div>
                            )}

                            {/* Stock Badge */}
                            <div className="absolute top-4 right-4">
                                <span className={`flex items-center gap-1.5 px-3 py-1 backdrop-blur-md border shadow-sm rounded-xl text-xs font-extrabold ${p.stockQuantity <= (p.lowStockThreshold || 10) ? 'bg-rose-100 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                                    <div className="w-1.5 h-1.5 rounded-full bg-current"></div>
                                    {p.stockQuantity} {p.unit}
                                </span>
                            </div>

                            {/* Category Pill */}
                            <div className="absolute bottom-4 left-4">
                                <span className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-[11px] font-extrabold text-[#0061A8] tracking-widest uppercase shadow-sm border border-slate-100/50">
                                    <Tag size={12} /> {p.category?.name || 'ASSET'}
                                </span>
                            </div>
                        </div>

                        {/* --- Card Body --- */}
                        <div className="p-6 flex flex-col gap-4 flex-1 bg-[#fafcff]">
                            <div>
                                <h3 className="text-[1.4rem] font-extrabold tracking-tight leading-tight mb-1 text-[#002244]">
                                    {p.name}
                                </h3>
                                <div className="text-xs text-slate-500 font-bold font-mono tracking-widest">
                                    SKU: {p.sku}
                                </div>
                            </div>

                            <div className="flex items-baseline gap-1 pb-4 border-b border-black/5">
                                <span className="text-[1.8rem] font-extrabold text-[#00A3E0] tracking-tight">
                                    ₹{p.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </span>
                            </div>

                            <p className="text-sm text-slate-600 leading-relaxed font-medium line-clamp-2 m-0">
                                {p.description || "Premium inventory item perfectly aligned with standard retail operations."}
                            </p>

                            <div className="mt-auto pt-3 grid grid-cols-2 gap-3">
                                <button
                                    className="rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-[#0061A8] hover:text-[#0061A8] transition-all font-bold text-xs uppercase tracking-wider py-3 shadow-sm hover:shadow-md"
                                    onClick={() => setModal({ type: 'requisitions', metadata: { productId: p.id, name: p.name } })}
                                >
                                    Stock Request
                                </button>
                                <button
                                    className="rounded-xl bg-gradient-to-r from-[#0061A8] to-[#00A3E0] hover:from-[#004d85] hover:to-[#0086b8] text-white transition-all font-bold text-xs uppercase tracking-wider py-3 shadow-lg shadow-blue-500/20 hover:-translate-y-0.5 active:scale-[0.98]"
                                    onClick={() => setModal({ type: 'sales', metadata: { items: [{ productId: p.id, quantity: 1, unitPrice: p.price }] } })}
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
