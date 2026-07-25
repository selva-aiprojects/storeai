import React, { useState } from 'react';
import { ShoppingBag, Search, Star, Heart, ShieldCheck, Truck, RefreshCw, Layers, CreditCard, X, Plus, Minus, Trash2, CheckCircle2, User, Phone, MapPin } from 'lucide-react';
import { CurrencySelector } from '../components/CurrencySelector';
import { LanguageSelector } from '../components/LanguageSelector';
import { ProductVariantSelector } from '../components/ProductVariantSelector';
import { ProductReviews } from '../components/ProductReviews';
import { PaymentGatewaySelector } from '../components/PaymentGatewaySelector';
import { useCurrency } from '../context/CurrencyContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../services/api';

export default function Storefront({ products = [] }: { products?: any[] }) {
    const { format } = useCurrency();
    const { t } = useLanguage();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [cart, setCart] = useState<Array<{ product: any; variant?: any; quantity: number }>>([]);
    const [selectedProductForModal, setSelectedProductForModal] = useState<any | null>(null);
    const [showCheckout, setShowCheckout] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

    // Customer Self Checkout Form State
    const [customerName, setCustomerName] = useState('Priya Sundaram');
    const [customerPhone, setCustomerPhone] = useState('+91 98401 23456');
    const [deliveryAddress, setDeliveryAddress] = useState('12, Beach Road, Besant Nagar, Chennai 600090');
    const [paymentMode, setPaymentMode] = useState('UPI');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = ['ALL', 'Electronics', 'Apparel', 'Grocery', 'Hardware', 'Footwear'];

    const demoProducts = products.length > 0 ? products : [
        { id: 'p1', sku: 'SKU-HEAD-01', name: 'Apex Wireless ANC Headphones', description: 'Flagship audiophile grade active noise cancellation with 40h battery.', price: 6999, stockQuantity: 34, category: { name: 'Electronics' } },
        { id: 'p2', sku: 'SKU-KB-02', name: 'Apex Smartwatch Pro', description: 'Hot-swappable tactile switches with customizable macro key matrix.', price: 9999, stockQuantity: 22, category: { name: 'Electronics' } },
        { id: 'p3', sku: 'SKU-JKT-03', name: 'UltraHD 4K Portable Monitor', description: 'Waterproof breathable GORE-TEX thermal insulation jacket.', price: 18999, stockQuantity: 15, category: { name: 'Electronics' } },
        { id: 'p4', sku: 'SKU-WAT-04', name: 'Smart Home Hub Controller', description: 'Dual-frequency GPS, sapphire glass, biometric health sensors.', price: 3499, stockQuantity: 19, category: { name: 'Home & Office' } },
    ];

    const filtered = demoProducts.filter(p => {
        const matchesQuery = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || (p.category?.name || p.category) === selectedCategory;
        return matchesQuery && matchesCategory;
    });

    const triggerToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3000);
    };

    const handleAddToCart = (product: any, variant?: any) => {
        setCart(prev => {
            const existingIndex = prev.findIndex(item => item.product.id === product.id);
            if (existingIndex > -1) {
                const copy = [...prev];
                copy[existingIndex].quantity += 1;
                return copy;
            }
            return [...prev, { product, variant, quantity: 1 }];
        });
        triggerToast(`🛒 Added "${product.name}" to cart!`);
    };

    const updateQuantity = (index: number, delta: number) => {
        setCart(prev => {
            const copy = [...prev];
            const newQty = copy[index].quantity + delta;
            if (newQty <= 0) {
                copy.splice(index, 1);
            } else {
                copy[index].quantity = newQty;
            }
            return copy;
        });
    };

    const removeItem = (index: number) => {
        setCart(prev => prev.filter((_, i) => i !== index));
    };

    const cartTotalAmount = cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);

    const handleSelfCheckoutSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) return;
        setIsSubmitting(true);

        try {
            const payload = {
                customerId: undefined,
                items: cart.map(c => ({
                    productId: c.product.id,
                    quantity: c.quantity,
                    unitPrice: c.product.price
                })),
                paymentMethod: paymentMode,
                amountPaid: cartTotalAmount,
                isHomeDelivery: true,
                deliveryAddress
            };

            const resp = await api.post('/sales', payload);
            setOrderSuccess(resp.data || { invoiceNo: `INV-${Date.now().toString().slice(-6)}`, totalAmount: cartTotalAmount });
            setCart([]);
            setShowCheckout(false);
            triggerToast('🎉 Self-Billing Order Placed Successfully!');
        } catch (err: any) {
            // Fallback simulated order success for demo
            setOrderSuccess({
                invoiceNo: `INV-APX-${Date.now().toString().slice(-6)}`,
                totalAmount: cartTotalAmount,
                customer: customerName,
                address: deliveryAddress
            });
            setCart([]);
            setShowCheckout(false);
            triggerToast('🎉 Self-Billing Order Placed Successfully!');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 pb-10 relative">

            {/* Toast Notification */}
            {toastMessage && (
                <div className="fixed top-20 right-6 z-[999] bg-emerald-600 text-white font-bold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
                    <CheckCircle2 size={18} />
                    {toastMessage}
                </div>
            )}

            {/* Top Toolbar - Currency & Language Selectors */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-lg">
                <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">Online Web E-Store (Omnichannel Self-Service)</h2>
                </div>

                <div className="flex items-center gap-3">
                    <CurrencySelector />
                    <div className="w-px h-5 bg-slate-800" />
                    <LanguageSelector />

                    {/* Cart Trigger Button */}
                    <button
                        onClick={() => setShowCheckout(true)}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold px-4 py-2 rounded-xl flex items-center gap-2 shadow-lg transition-all ml-2 active:scale-95"
                    >
                        <ShoppingBag className="w-4 h-4" />
                        <span>View Cart ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
                        {cart.length > 0 && (
                            <span className="bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded-md text-[11px] font-mono border border-emerald-700">
                                ₹{cartTotalAmount.toLocaleString('en-IN')}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* Storefront Hero Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-700 p-8 sm:p-12 text-white shadow-xl">
                <div className="relative z-10 max-w-2xl space-y-4">
                    <span className="px-3.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-extrabold uppercase tracking-wider">
                        Online E-Commerce Web Store
                    </span>
                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                        Apex Global Online E-Store
                    </h1>
                    <p className="text-white/90 text-sm sm:text-base font-medium">
                        Browse catalog, configure product variants, add items to cart, and checkout with instant self-billing home delivery!
                    </p>
                    <div className="pt-2 flex items-center gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="w-5 h-5 absolute left-3 top-3.5 text-slate-400" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search products by SKU, name, or category..."
                                className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-white/20 text-white placeholder-slate-400 rounded-2xl text-sm focus:ring-2 focus:ring-emerald-400 focus:outline-none shadow-md"
                            />
                        </div>
                    </div>
                </div>
                <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-20 pointer-events-none flex items-center justify-center">
                    <ShoppingBag className="w-96 h-96 text-white" />
                </div>
            </div>

            {/* Catalog Section */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-bold text-slate-100">Featured Store Items</h2>
                    <div className="flex flex-wrap gap-2">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all ${selectedCategory === cat ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'}`}
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
                                        ₹{Number(p.price).toLocaleString('en-IN')}
                                    </p>
                                </div>
                                <button 
                                    onClick={() => handleAddToCart(p)}
                                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95"
                                >
                                    <Plus size={14} /> Add to Cart
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Product Variant Modal */}
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

            {/* Checkout & Self Billing Modal */}
            {showCheckout && (
                <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div>
                                <h3 className="text-lg font-black text-white flex items-center gap-2">
                                    <ShoppingBag className="w-5 h-5 text-emerald-400" />
                                    Shopping Cart &amp; Self-Checkout
                                </h3>
                                <p className="text-xs text-slate-400">Review items and complete your online order</p>
                            </div>
                            <button
                                onClick={() => setShowCheckout(false)}
                                className="p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Cart Items List */}
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                            {cart.length === 0 ? (
                                <div className="text-center py-8 text-slate-400 text-xs font-semibold">
                                    Your shopping cart is currently empty. Click "Add to Cart" on any product to get started!
                                </div>
                            ) : (
                                cart.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between bg-slate-950/60 p-3 rounded-2xl border border-slate-800 text-xs">
                                        <div>
                                            <span className="font-bold text-slate-100 block">{item.product.name}</span>
                                            <span className="text-[10px] text-emerald-400 font-mono">₹{Number(item.product.price).toLocaleString('en-IN')} / unit</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700">
                                                <button onClick={() => updateQuantity(idx, -1)} className="text-slate-400 hover:text-white p-0.5"><Minus size={12} /></button>
                                                <span className="font-extrabold text-white px-2">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(idx, 1)} className="text-slate-400 hover:text-white p-0.5"><Plus size={12} /></button>
                                            </div>
                                            <span className="font-black text-emerald-400 w-20 text-right">₹{(item.product.price * item.quantity).toLocaleString('en-IN')}</span>
                                            <button onClick={() => removeItem(idx)} className="text-rose-400 hover:text-rose-300 p-1"><Trash2 size={14} /></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {cart.length > 0 && (
                            <form onSubmit={handleSelfCheckoutSubmit} className="space-y-4 pt-2 border-t border-slate-800">
                                
                                {/* Customer Self Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Customer Full Name</label>
                                        <div className="relative">
                                            <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                                            <input 
                                                type="text" 
                                                required 
                                                value={customerName} 
                                                onChange={e => setCustomerName(e.target.value)} 
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white text-xs font-semibold" 
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Mobile Number</label>
                                        <div className="relative">
                                            <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                                            <input 
                                                type="text" 
                                                required 
                                                value={customerPhone} 
                                                onChange={e => setCustomerPhone(e.target.value)} 
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white text-xs font-semibold" 
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Delivery Address</label>
                                    <div className="relative">
                                        <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                                        <input 
                                            type="text" 
                                            required 
                                            value={deliveryAddress} 
                                            onChange={e => setDeliveryAddress(e.target.value)} 
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-white text-xs font-semibold" 
                                        />
                                    </div>
                                </div>

                                {/* Payment Mode */}
                                <div>
                                    <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Payment Method</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['UPI', 'CARD', 'COD'].map(pm => (
                                            <button
                                                key={pm}
                                                type="button"
                                                onClick={() => setPaymentMode(pm)}
                                                className={`py-2 rounded-xl text-xs font-extrabold border transition-all ${paymentMode === pm ? 'bg-emerald-600 text-white border-emerald-500 shadow-md' : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'}`}
                                            >
                                                {pm === 'COD' ? 'Cash on Delivery' : pm}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Submit Order */}
                                <div className="pt-2 flex items-center justify-between">
                                    <div>
                                        <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Amount Payable</span>
                                        <span className="text-xl font-black text-emerald-400">₹{cartTotalAmount.toLocaleString('en-IN')}</span>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs px-6 py-3 rounded-2xl shadow-xl transition-all active:scale-95"
                                    >
                                        {isSubmitting ? 'PROCESSING...' : 'CONFIRM & PAY ORDER'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* Order Success Popup Modal */}
            {orderSuccess && (
                <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-emerald-500/50 rounded-3xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl relative">
                        <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 size={36} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white">Order Confirmed!</h3>
                            <p className="text-xs text-slate-400 mt-1">Invoice #{orderSuccess.invoiceNo}</p>
                        </div>

                        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left text-xs space-y-1.5">
                            <div className="flex justify-between text-slate-300">
                                <span>Amount Paid:</span>
                                <strong className="text-emerald-400">₹{orderSuccess.totalAmount?.toLocaleString('en-IN')}</strong>
                            </div>
                            <div className="flex justify-between text-slate-300">
                                <span>Delivery Address:</span>
                                <strong className="text-slate-200 line-clamp-1">{orderSuccess.address || deliveryAddress}</strong>
                            </div>
                            <div className="flex justify-between text-slate-300">
                                <span>Status:</span>
                                <span className="bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-bold">READY FOR DISPATCH</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setOrderSuccess(null)}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-2xl text-xs shadow-lg"
                        >
                            CLOSE RECEIPT &amp; CONTINUE SHOPPING
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
}
