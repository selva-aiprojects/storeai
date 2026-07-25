import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Package, Tag, Layers, ArrowUpRight, Plus, ShieldCheck, MapPin, DollarSign, Percent, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const Products = () => {
    const { data, setModal } = useOutletContext<any>() as any;
    const { products } = data || {};

    const demoProducts = [
        { id: 'p1', name: 'Organic Basmati Rice 5kg', sku: 'GRO-001', hsnCode: 'HSN-1006', costPrice: 500, price: 650, gstRate: 5, category: { name: 'Groceries' }, stockQuantity: 120, lowStockThreshold: 20, unit: 'Bags', binLocation: 'BIN-A1-R02', supplier: 'Bharat Agro Foods', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80' },
        { id: 'p2', name: 'Wireless Bluetooth Earbuds Pro', sku: 'ELE-102', hsnCode: 'HSN-8518', costPrice: 1800, price: 2499, gstRate: 18, category: { name: 'Electronics' }, stockQuantity: 45, lowStockThreshold: 10, unit: 'Units', binLocation: 'BIN-B4-R01', supplier: 'TechLogix India', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&q=80' },
        { id: 'p3', name: 'Cotton Crewneck Polo T-Shirt', sku: 'APP-204', hsnCode: 'HSN-6109', costPrice: 450, price: 899, gstRate: 12, category: { name: 'Apparel' }, stockQuantity: 80, lowStockThreshold: 15, unit: 'Pcs', binLocation: 'BIN-C2-R05', supplier: 'Vardhman Textiles', image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&q=80' },
        { id: 'p4', name: 'Sparkling Citrus Energy Drink 250ml', sku: 'BEV-301', hsnCode: 'HSN-2202', costPrice: 80, price: 150, gstRate: 18, category: { name: 'Beverages' }, stockQuantity: 200, lowStockThreshold: 30, unit: 'Cans', binLocation: 'BIN-A3-R01', supplier: 'Universal Beverages', image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80' },
        { id: 'p5', name: 'Heavy Duty Cordless Power Drill 500W', sku: 'HAR-512', hsnCode: 'HSN-8467', costPrice: 2800, price: 3899, gstRate: 18, category: { name: 'Hardware' }, stockQuantity: 15, lowStockThreshold: 5, unit: 'Packs', binLocation: 'BIN-D1-R03', supplier: 'Stanley Black & Decker', image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&q=80' },
        { id: 'p6', name: 'Multivitamin Health Supplements 60 Caps', sku: 'PHA-702', hsnCode: 'HSN-3004', costPrice: 320, price: 499, gstRate: 12, category: { name: 'Pharmacy' }, stockQuantity: 90, lowStockThreshold: 20, unit: 'Bottles', binLocation: 'BIN-E2-R01', supplier: 'Sun Pharma Ltd', image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&q=80' }
    ];

    const displayProducts = (products && products.length > 0) ? products : demoProducts;

    return (
        <div className="px-2.5 max-w-[1600px] mx-auto font-['Outfit'] space-y-6">
            {/* Header/Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-500/20">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Enterprise Product Catalog</h1>
                        <p className="text-sm font-medium text-slate-500">Master inventory records, HSN codes, cost margins & GST tax brackets</p>
                    </div>
                </div>

                <button
                    onClick={() => setModal({ type: 'products' })}
                    className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-extrabold text-xs tracking-wider uppercase flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all hover:scale-105"
                >
                    <Plus className="w-4 h-4" /> Add New Master Product
                </button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-6 pb-10">
                {displayProducts.filter((p: any) => !p.isDeleted).map((p: any, i: number) => {
                    const cost = Number(p.costPrice || (p.price * 0.7));
                    const selling = Number(p.price || 0);
                    const margin = selling > 0 ? (((selling - cost) / selling) * 100).toFixed(1) : '0.0';
                    const gst = p.gstRate || 18;

                    return (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                            key={p.id}
                            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group relative"
                        >
                            {/* Card Hero Image Area */}
                            <div className="h-52 bg-slate-950 relative flex items-center justify-center overflow-hidden p-3">
                                {p.image ? (
                                    <img
                                        src={p.image}
                                        alt={p.name}
                                        className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-300"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                                        <Package className="w-8 h-8" />
                                    </div>
                                )}

                                {/* Stock Quantity Badge */}
                                <span className={`absolute top-3 right-3 px-3 py-1 backdrop-blur-md rounded-xl text-xs font-black shadow-md border ${p.stockQuantity <= (p.lowStockThreshold || 10) ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}>
                                    {p.stockQuantity} {p.unit || 'Units'} Stock
                                </span>

                                {/* Category & GST Pills */}
                                <div className="absolute bottom-3 left-3 flex gap-1.5 flex-wrap">
                                    <span className="px-2.5 py-1 bg-slate-950/80 backdrop-blur-md text-white text-[10px] font-extrabold uppercase rounded-lg border border-white/10 flex items-center gap-1">
                                        <Tag className="w-3 h-3 text-cyan-400" /> {p.category?.name || p.category || 'GENERAL'}
                                    </span>
                                    <span className="px-2.5 py-1 bg-emerald-950/90 backdrop-blur-md text-emerald-300 text-[10px] font-extrabold rounded-lg border border-emerald-500/30">
                                        {gst}% GST
                                    </span>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="p-5 space-y-4 flex-1 flex flex-col justify-between bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                            {p.name}
                                        </h3>
                                    </div>

                                    {/* SKU & HSN Metadata Bar */}
                                    <div className="flex items-center gap-2 text-[11px] font-extrabold text-slate-500">
                                        <span className="bg-slate-200 dark:bg-slate-700/60 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300 font-mono">
                                            SKU: {p.sku}
                                        </span>
                                        <span className="bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded text-blue-600 dark:text-blue-400 font-mono">
                                            {p.hsnCode || 'HSN-8500'}
                                        </span>
                                    </div>

                                    {/* Cost Price, Selling Price & Profit Margin % */}
                                    <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700/70 grid grid-cols-3 gap-2 text-center mt-2">
                                        <div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Cost Price</span>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">₹{cost.toFixed(0)}</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Selling Price</span>
                                            <span className="text-sm font-black text-blue-600 dark:text-cyan-400">₹{selling.toFixed(0)}</span>
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Profit Margin</span>
                                            <span className="text-xs font-black text-emerald-500">+{margin}%</span>
                                        </div>
                                    </div>

                                    {/* Logistics & Bin Location */}
                                    <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1">
                                        <span className="flex items-center gap-1 font-semibold">
                                            <MapPin className="w-3.5 h-3.5 text-rose-500" /> Bin: {p.binLocation || 'BIN-MAIN'}
                                        </span>
                                        <span className="font-medium text-slate-400 truncate max-w-[140px]">
                                            {p.supplier || 'Primary Supplier'}
                                        </span>
                                    </div>
                                </div>

                                {/* Quick Actions */}
                                <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 grid grid-cols-2 gap-2.5">
                                    <button
                                        onClick={() => setModal({ type: 'requisitions', metadata: { productId: p.id, name: p.name } })}
                                        className="py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
                                    >
                                        Requisition
                                    </button>
                                    <button
                                        onClick={() => setModal({ type: 'sales', metadata: { items: [{ productId: p.id, quantity: 1, unitPrice: p.price }] } })}
                                        className="py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
                                    >
                                        Sell Item
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
};

export default Products;
