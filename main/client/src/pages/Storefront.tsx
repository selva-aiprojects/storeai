import React, { useState } from 'react';
import { ShoppingBag, Search, Star, Heart, ShieldCheck, Truck, RefreshCw, Layers, CreditCard, X } from 'lucide-react';
import { CurrencySelector } from '../components/CurrencySelector';
import { LanguageSelector } from '../components/LanguageSelector';
import { ProductVariantSelector } from '../components/ProductVariantSelector';
import { ProductReviews } from '../components/ProductReviews';
import { PaymentGatewaySelector } from '../components/PaymentGatewaySelector';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';

export default function Storefront({ products = [] }: { products?: any[] }) {
    const { format } = useCurrency();
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [cart, setCart] = useState<Array<{ product: any; variant?: any; quantity: number }>>([]);
    const [selectedProductForModal, setSelectedProductForModal] = useState<any | null>(null);
    const [showCheckout, setShowCheckout] = useState(false);

    const categories = ['ALL', 'Electronics', 'Apparel', 'Grocery', 'Hardware', 'Footwear'];

    const demoProducts = products.length > 0 ? products : [
        { id: 'p1', sku: 'SKU-HEAD-01', name: 'Wireless Pro Noise-Canceling Headphones', description: 'Flagship audiophile grade active noise cancellation with 40h battery.', price: 249.99, stockQuantity: 34, category: { name: 'Electronics' } },
        { id: 'p2', sku: 'SKU-KB-02', name: 'Ergonomic Mechanical RGB Keyboard', description: 'Hot-swappable tactile switches with customizable macro key matrix.', price: 159.50, stockQuantity: 22, category: { name: 'Electronics' } },
        { id: 'p3', sku: 'SKU-JKT-03', name: 'All-Weather Expedition Jacket', description: 'Waterproof breathable GORE-TEX thermal insulation jacket.', price: 189.00, stockQuantity: 15, category: { name: 'Apparel' } },
        { id: 'p4', sku: 'SKU-WAT-04', name: 'Titanium Smartwatch Ultra', description: 'Dual-frequency GPS, sapphire glass, biometric health sensors.', price: 399.00, stockQuantity: 19, category: { name: 'Electronics' } },
    ];

    const filtered = demoProducts.filter(p => {
        const matchesQuery = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || p.category?.name === selectedCategory;
        return matchesQuery && matchesCategory;
    });

    const handleAddToCart = (product: any, variant?: any) => {
        setCart(prev => [...prev, { product, variant, quantity: 1 }]);
    };

    const cartTotalUSD = cart.reduce((sum, item) => sum + (item.product.price || 100), 0);

    return (
        <div className="space-y-8 pb-10">
            {/* Top Toolbar - Currency & Language Selectors */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Global Commerce Control Center</h2>
                </div>

                <div className="flex items-center gap-3">
                    <CurrencySelector />
                    <div className="w-px h-5 bg-slate-800" />
                    <LanguageSelector />

                    {/* Cart Trigger */}
                    <button
                        onClick={() => setShowCheckout(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-2 shadow-md transition-all ml-2"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Cart ({cart.length})</span>
                        {cart.length > 0 && (
                            <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                {format(cartTotalUSD)}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Storefront Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-8 sm:p-12 text-white shadow-xl">
                <div className="relative z-10 max-w-2xl space-y-4">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-semibold uppercase tracking-wider">
                        {t('storefront_title')}
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                        Next-Gen Global Unified Storefront
                    </h1>
                    <p className="text-white/80 text-sm sm:text-base">
                        Real-time multi-currency pricing, international tax calculations, localized languages, and automated global fulfillment.
                    </p>
                    <div className="pt-2 flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={t('search_placeholder')}
                                className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-white/20 text-white placeholder-slate-400 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none shadow-md"
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
                    { icon: Truck, title: 'Express Global Shipping', desc: 'DDP/DDU Duties calculated at checkout' },
                    { icon: ShieldCheck, title: 'Global Multi-Currency Checkout', desc: 'Stripe, PayPal & Apple Pay integration' },
                    { icon: RefreshCw, title: t('return_policy'), desc: 'Automated customer RMA return tracking' },
                ].map((item, idx) => (
                    <div key={idx} className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
                            <item.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="text-xs font-bold text-slate-100">{item.title}</h4>
                            <p className="text-[11px] text-slate-400">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Catalog Section */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-bold text-slate-100">Featured Products</h2>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${selectedCategory === cat ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'}`}
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
                            className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden hover:border-slate-700 transition-all group flex flex-col justify-between"
                        >
                            <div>
                                <div className="h-44 bg-slate-950/60 relative flex items-center justify-center p-4">
                                    <ShoppingBag className="w-16 h-16 text-slate-700 group-hover:scale-110 transition-transform" />
                                    <button 
                                        onClick={() => setSelectedProductForModal(p)}
                                        className="absolute top-3 right-3 p-2 bg-slate-800/80 hover:bg-indigo-600 text-slate-300 hover:text-white rounded-full transition-colors"
                                        title="Configure Variants & Preview"
                                    >
                                        <Layers className="w-4 h-4" />
                                    </button>
                                    <span className="absolute bottom-3 left-3 bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[10px] font-extrabold px-2 py-0.5 rounded-md">
                                        In Stock ({p.stockQuantity ?? 45})
                                    </span>
                                </div>
                                <div className="p-4 space-y-2">
                                    <span className="text-[10px] uppercase font-bold text-emerald-400">{p.sku}</span>
                                    <h3 className="font-bold text-slate-100 text-sm line-clamp-1 group-hover:text-emerald-400 transition-colors">
                                        {p.name}
                                    </h3>
                                    <p className="text-xs text-slate-400 line-clamp-2">{p.description || 'Enterprise grade item with high performance quality.'}</p>
                                </div>
                            </div>

                            <div className="p-4 pt-0 flex items-center justify-between border-t border-slate-800/60 mt-2 pt-3">
                                <div>
                                    <span className="text-[10px] text-slate-400 font-medium block">Price</span>
                                    <p className="text-base font-extrabold text-emerald-400">
                                        {format(Number(p.price))}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => handleAddToCart(p)}
                                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                                >
                                    {t('add_to_cart')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Product Reviews Module */}
            <ProductReviews />

            {/* Product Variant Configuration Modal */}
            {selectedProductForModal && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
                        <button
                            onClick={() => setSelectedProductForModal(null)}
                            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"
                        >
                            <X className="w-4 h-4" />
                        </button>
                        <h3 className="text-base font-bold text-slate-100">{selectedProductForModal.name}</h3>
                        <p className="text-xs text-slate-400">{selectedProductForModal.description}</p>

                        <ProductVariantSelector
                            baseSKU={selectedProductForModal.sku}
                            basePriceUSD={selectedProductForModal.price}
                            onVariantChange={(v) => console.log('Selected variant:', v)}
                        />

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setSelectedProductForModal(null)}
                                className="flex-1 bg-slate-800 text-slate-300 font-semibold py-2.5 rounded-xl text-xs"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    handleAddToCart(selectedProductForModal);
                                    setSelectedProductForModal(null);
                                }}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-xl text-xs shadow-lg"
                            >
                                Add Variant to Cart
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Checkout Drawer / Modal with Payment Gateway Selector */}
            {showCheckout && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                                <CreditCard className="w-5 h-5 text-emerald-400" />
                                {t('order_summary')} & Checkout
                            </h3>
                            <button
                                onClick={() => setShowCheckout(false)}
                                className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Cart Items Summary */}
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                            {cart.length === 0 ? (
                                <p className="text-xs text-slate-400 py-4 text-center">Your cart is empty.</p>
                            ) : (
                                cart.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-slate-950/40 p-2.5 rounded-xl border border-slate-800 text-xs">
                                        <div>
                                            <span className="font-semibold text-slate-200">{item.product.name}</span>
                                            <span className="block text-[10px] text-slate-400">{item.product.sku}</span>
                                        </div>
                                        <span className="font-bold text-emerald-400">{format(item.product.price)}</span>
                                    </div>
                                ))
                            )}
                        </div>

                        {cart.length > 0 && (
                            <div className="pt-2 space-y-3">
                                {/* Coupon Code & Tax Calculation Row */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-xs">
                                    <div>
                                        <label className="block text-[10px] text-slate-400 font-semibold mb-1">🏷️ Promo / Coupon Code</label>
                                        <div className="flex gap-1.5">
                                            <input
                                                type="text"
                                                placeholder="e.g. WELCOME10"
                                                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs uppercase font-mono outline-none focus:border-emerald-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => alert('Coupon WELCOME10 applied! 10% discount saved.')}
                                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] text-slate-400 font-semibold mb-1">🌐 Destination Region Tax</label>
                                        <select className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 text-xs outline-none">
                                            <option>🇮🇳 India GST (18% Standard)</option>
                                            <option>🇺🇸 US Sales Tax (California 7.25%)</option>
                                            <option>🇪🇺 EU Member State VAT (20%)</option>
                                            <option>🇦🇪 GCC VAT (5%)</option>
                                        </select>
                                    </div>
                                </div>

                                <PaymentGatewaySelector totalAmountUSD={cartTotalUSD} />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
