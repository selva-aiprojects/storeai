import React, { useState } from 'react';
import { ShoppingBag, Search, Filter, Star, Heart, ArrowRight, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export default function Storefront({ products = [] }: { products?: any[] }) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [cartCount, setCartCount] = useState(0);

    const categories = ['ALL', 'Electronics', 'Apparel', 'Grocery', 'Hardware', 'Footwear'];

    const filtered = (products || []).filter(p => {
        const matchesQuery = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || p.category?.name === selectedCategory;
        return matchesQuery && matchesCategory;
    });

    return (
        <div className="space-y-8 pb-10">
            {/* Storefront Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-8 sm:p-12 text-white shadow-xl">
                <div className="relative z-10 max-w-2xl space-y-4">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
                        Official Storefront
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                        Next-Gen Unified Commerce Catalog
                    </h1>
                    <p className="text-white/80 text-sm sm:text-base">
                        Explore real-time inventory, instant checkout, and direct fulfillment straight from our smart warehouses.
                    </p>
                    <div className="pt-2 flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search catalog..."
                                className="w-full pl-10 pr-4 py-3 bg-white text-slate-900 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none shadow-md"
                            />
                        </div>
                    </div>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none flex items-center justify-center">
                    <ShoppingBag className="w-96 h-96 text-white" />
                </div>
            </div>

            {/* Value Props Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { icon: Truck, title: 'Express Delivery', desc: 'Same-day fulfillment from local bins' },
                    { icon: ShieldCheck, title: 'GST Compliant Tax Invoices', desc: 'Input Tax Credit ready for B2B' },
                    { icon: RefreshCw, title: 'Easy Returns & Refunds', desc: 'Instant self-service portal returns' },
                ].map((item, idx) => (
                    <div key={idx} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center shrink-0">
                            <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white">{item.title}</h4>
                            <p className="text-[11px] text-slate-500">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Catalog Section */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Featured Products</h2>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${selectedCategory === cat ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filtered.map(p => (
                        <div 
                            key={p.id}
                            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition-all group flex flex-col justify-between"
                        >
                            <div>
                                <div className="h-44 bg-slate-100 dark:bg-slate-900 relative flex items-center justify-center p-4">
                                    <ShoppingBag className="w-16 h-16 text-slate-300 dark:text-slate-700 group-hover:scale-110 transition-transform" />
                                    <button className="absolute top-3 right-3 p-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-full text-slate-400 hover:text-rose-500 transition-colors">
                                        <Heart className="w-4 h-4" />
                                    </button>
                                    <span className="absolute bottom-3 left-3 bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                                        In Stock ({p.stockQuantity ?? 45})
                                    </span>
                                </div>
                                <div className="p-4 space-y-2">
                                    <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">{p.sku}</span>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1 group-hover:text-emerald-600 transition-colors">
                                        {p.name}
                                    </h3>
                                    <p className="text-xs text-slate-500 line-clamp-2">{p.description || 'Enterprise grade item with high performance quality.'}</p>
                                </div>
                            </div>

                            <div className="p-4 pt-0 flex items-center justify-between">
                                <div>
                                    <span className="text-xs text-slate-400 font-medium">Price</span>
                                    <p className="text-lg font-extrabold text-slate-900 dark:text-white">₹{Number(p.price).toFixed(2)}</p>
                                </div>
                                <button 
                                    onClick={() => setCartCount(c => c + 1)}
                                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                                >
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
