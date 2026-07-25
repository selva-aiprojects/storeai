import React, { useState } from 'react';
import {
    ShoppingCart, QrCode, CreditCard, DollarSign, Smartphone, Award, Printer, RotateCcw,
    CheckCircle, Wifi, WifiOff, Maximize2, Minimize2, Search, Image as ImageIcon, MapPin,
    Truck, UserCheck, Calendar, ShieldCheck, Tag, Plus, Minus, Trash2, Download, Layers, Sparkles
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CartItem {
    id: string;
    name: string;
    sku: string;
    price: number;
    gstPercentage: number;
    quantity: number;
    category?: string;
    image?: string;
    batchNumber?: string;
    expiryDate?: string;
}

export default function POS({ products = [] }: { products?: any[] }) {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [barcodeInput, setBarcodeInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'LOYALTY' | 'SPLIT'>('CASH');
    const [cashReceived, setCashReceived] = useState<number>(0);
    const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState<number>(0);
    const [isOnline, setIsOnline] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [lastSaleReceipt, setLastSaleReceipt] = useState<any>(null);

    // Advanced Customer & Delivery Controls
    const [customerName, setCustomerName] = useState('Rahul Verma');
    const [customerPhone, setCustomerPhone] = useState('+91 98765 43210');
    const [customerEmail, setCustomerEmail] = useState('rahul.verma@gmail.com');
    const [isRepeatCustomer, setIsRepeatCustomer] = useState(true);
    const [customerVisitCount, setCustomerVisitCount] = useState(6);
    const [customerBillingAddress, setCustomerBillingAddress] = useState('Flat 402, Green Valley Apts, Bandra West');
    const [isHomeDelivery, setIsHomeDelivery] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState('Plot 88, Sunrise Towers, Andheri East');
    const [deliveryCity, setDeliveryCity] = useState('Mumbai');
    const [deliveryCharge, setDeliveryCharge] = useState<number>(50);
    const [discountAmount, setDiscountAmount] = useState<number>(0);

    const categoriesList = ['ALL', 'Groceries', 'Electronics', 'Apparel', 'Beverages', 'Fresh Produce', 'Hardware', 'Bakery & Dairy', 'Pharmacy'];

    // Sample fallback commodities with batch, expiry, & GST
    const demoCommodities = [
        { id: 'c1', sku: 'GRO-001', name: 'Organic Basmati Rice 5kg', price: 650, gstPercentage: 5, category: 'Groceries', batchNumber: 'BATCH-2026-R01', expiryDate: '2027-06-30', stockQuantity: 120, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80' },
        { id: 'c2', sku: 'ELE-102', name: 'Wireless Noise Cancelling Earbuds', price: 2499, gstPercentage: 18, category: 'Electronics', batchNumber: 'BATCH-2026-E12', expiryDate: '2028-12-31', stockQuantity: 45, image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&q=80' },
        { id: 'c3', sku: 'APP-204', name: 'Premium Cotton Polo T-Shirt', price: 899, gstPercentage: 12, category: 'Apparel', batchNumber: 'BATCH-2026-A04', expiryDate: 'N/A', stockQuantity: 80, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&q=80' },
        { id: 'c4', sku: 'BEV-301', name: 'Natural Sparkling Juice 330ml', price: 150, gstPercentage: 18, category: 'Beverages', batchNumber: 'BATCH-2026-B88', expiryDate: '2026-11-15', stockQuantity: 200, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80' },
        { id: 'c5', sku: 'PRO-409', name: 'Fresh Farm Mangoes 1kg', price: 350, gstPercentage: 0, category: 'Fresh Produce', batchNumber: 'BATCH-2026-F09', expiryDate: '2026-08-05', stockQuantity: 30, image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&q=80' },
        { id: 'c6', sku: 'HAR-512', name: 'Cordless Power Drill Tool Pack', price: 3899, gstPercentage: 18, category: 'Hardware', batchNumber: 'BATCH-2026-H55', expiryDate: '2029-01-01', stockQuantity: 15, image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&q=80' },
        { id: 'c7', sku: 'BAK-601', name: 'Artisanal Whole Wheat Bread', price: 90, gstPercentage: 5, category: 'Bakery & Dairy', batchNumber: 'BATCH-2026-BK1', expiryDate: '2026-07-29', stockQuantity: 50, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80' },
        { id: 'c8', sku: 'PHA-702', name: 'Multivitamin Health Supplements', price: 499, gstPercentage: 12, category: 'Pharmacy', batchNumber: 'BATCH-2026-PH9', expiryDate: '2027-10-20', stockQuantity: 90, image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&q=80' }
    ];

    const displayProducts = products.length > 0 ? products : demoCommodities;

    // Filter products
    const filteredProducts = displayProducts.filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = selectedCategory === 'ALL' || (p.category?.name || p.category) === selectedCategory;
        return matchesSearch && matchesCat;
    });

    const handleAddToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, {
                id: product.id,
                name: product.name,
                sku: product.sku,
                price: Number(product.price),
                gstPercentage: Number(product.gstPercentage ?? 18),
                category: product.category?.name || product.category || 'General',
                batchNumber: product.batchNumber || 'BATCH-DEFAULT',
                expiryDate: product.expiryDate || 'N/A',
                quantity: 1
            }];
        });
    };

    const handleBarcodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const found = displayProducts.find(p => p.sku?.toLowerCase() === barcodeInput.trim().toLowerCase());
        if (found) {
            handleAddToCart(found);
            setBarcodeInput('');
        } else {
            alert(`Product SKU "${barcodeInput}" not found`);
        }
    };

    const updateQuantity = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
        }).filter(Boolean) as CartItem[]);
    };

    // Financial Calculation Breakdown
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalGst = cart.reduce((sum, item) => sum + (item.price * item.quantity * (item.gstPercentage / 100)), 0);
    const cgst = totalGst / 2;
    const sgst = totalGst / 2;
    const loyaltyDiscount = loyaltyPointsToRedeem * 1;
    const deliveryFee = isHomeDelivery ? Number(deliveryCharge || 0) : 0;
    const grandTotal = Math.max(0, subtotal + totalGst + deliveryFee - loyaltyDiscount - Number(discountAmount || 0));
    const changeDue = Math.max(0, cashReceived - grandTotal);

    const handleCompleteSale = () => {
        if (cart.length === 0) return alert('Cart is empty!');

        const receiptData = {
            invoiceNo: `INV-${Date.now().toString().slice(-6)}`,
            date: new Date().toLocaleString(),
            customer: customerName,
            phone: customerPhone,
            email: customerEmail,
            isRepeat: isRepeatCustomer,
            visitCount: customerVisitCount,
            billingAddress: customerBillingAddress,
            isHomeDelivery,
            deliveryAddress: isHomeDelivery ? deliveryAddress : 'Counter Pickup',
            deliveryCity: isHomeDelivery ? deliveryCity : '',
            items: [...cart],
            subtotal,
            cgst,
            sgst,
            totalGst,
            deliveryFee,
            discountAmount: Number(discountAmount || 0),
            loyaltyDiscount,
            grandTotal,
            paymentMethod,
            cashReceived,
            changeDue
        };

        setLastSaleReceipt(receiptData);
        setIsReceiptModalOpen(true);
    };

    const downloadPDFInvoice = (receipt: any) => {
        const doc = new jsPDF() as any;
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 36, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("StoreAI TAX INVOICE", 15, 22);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`INVOICE: ${receipt.invoiceNo} | DATE: ${receipt.date}`, 15, 30);

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("BILL TO (CUSTOMER):", 15, 48);
        doc.setFont("helvetica", "normal");
        doc.text(`${receipt.customer} (${receipt.phone})`, 15, 54);
        doc.text(`${receipt.billingAddress}`, 15, 60);

        if (receipt.isHomeDelivery) {
            doc.setFont("helvetica", "bold");
            doc.text("SHIP TO (DELIVERY ADDRESS):", 125, 48);
            doc.setFont("helvetica", "normal");
            doc.text(`${receipt.deliveryAddress}, ${receipt.deliveryCity}`, 125, 54);
        }

        const tableData = receipt.items.map((item: any, idx: number) => [
            idx + 1,
            `${item.name}\n[${item.sku} | ${item.batchNumber}]`,
            item.category,
            item.quantity,
            `₹${item.price.toFixed(2)}`,
            `${item.gstPercentage}%`,
            `₹${(item.price * item.quantity * (1 + item.gstPercentage / 100)).toFixed(2)}`
        ]);

        autoTable(doc, {
            startY: 70,
            head: [['#', 'ITEM & BATCH', 'CATEGORY', 'QTY', 'RATE', 'GST', 'TOTAL']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' }
        });

        const finalY = (doc as any).lastAutoTable.finalY || 120;
        doc.setFontSize(10);
        doc.text(`Subtotal: ₹${receipt.subtotal.toFixed(2)}`, 140, finalY + 12);
        doc.text(`CGST (9%): ₹${receipt.cgst.toFixed(2)}`, 140, finalY + 18);
        doc.text(`SGST (9%): ₹${receipt.sgst.toFixed(2)}`, 140, finalY + 24);
        if (receipt.deliveryFee > 0) doc.text(`Delivery Fee: ₹${receipt.deliveryFee.toFixed(2)}`, 140, finalY + 30);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`GRAND TOTAL: ₹${receipt.grandTotal.toFixed(2)}`, 140, finalY + 40);

        doc.save(`${receipt.invoiceNo}.pdf`);
    };

    return (
        <div className={`font-['Outfit'] transition-all ${isFullscreen ? 'fixed inset-0 z-[99999] bg-slate-950 text-white p-6 overflow-y-auto' : 'space-y-5'}`}>
            
            {/* TOP POS TERMINAL BAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                        <ShoppingCart className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                Point of Sale (POS) Terminal
                            </h1>
                            <span className="text-[10px] font-extrabold px-2.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-md">
                                REG-01 • ACTIVE
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">Cashier register workspace with GST tax breakdown & home delivery options</p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                    <button
                        onClick={() => setIsOnline(!isOnline)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${isOnline ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200'}`}
                    >
                        {isOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                        {isOnline ? 'ONLINE' : 'OFFLINE MODE'}
                    </button>

                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        {isFullscreen ? 'EXIT FULLSCREEN' : 'FULLSCREEN TERMINAL'}
                    </button>

                    <button
                        onClick={() => {
                            setCart([]);
                            setCashReceived(0);
                            setDiscountAmount(0);
                        }}
                        className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" /> CLEAR CART
                    </button>
                </div>
            </div>

            {/* CATEGORY FILTER TABS */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {categoriesList.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold shrink-0 transition-all ${selectedCategory === cat ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
                    >
                        {cat}
                        {cat === 'ALL' ? ` (${displayProducts.length})` : ''}
                    </button>
                ))}
            </div>

            {/* POS MAIN GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* LEFT: PRODUCT CATALOG GRID (7 COLS) */}
                <div className="lg:col-span-7 space-y-4">
                    {/* Barcode & Search Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <form onSubmit={handleBarcodeSubmit} className="relative">
                            <QrCode className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                value={barcodeInput}
                                onChange={(e) => setBarcodeInput(e.target.value)}
                                placeholder="Scan SKU Barcode (Enter)..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </form>
                        <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search product by name, SKU..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Product Cards Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 max-h-[600px] overflow-y-auto pr-1">
                        {filteredProducts.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => handleAddToCart(p)}
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-lg flex flex-col justify-between group relative"
                            >
                                {/* Product Image & Badges */}
                                <div className="h-32 bg-slate-100 dark:bg-slate-900 relative flex items-center justify-center overflow-hidden p-2">
                                    {p.image ? (
                                        <img
                                            src={p.image}
                                            alt={p.name}
                                            className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                            <ImageIcon className="w-6 h-6" />
                                        </div>
                                    )}

                                    {/* Category Pill */}
                                    <span className="absolute top-2 left-2 text-[9px] uppercase tracking-wider font-extrabold text-white bg-slate-900/80 backdrop-blur-md px-2 py-0.5 rounded-md">
                                        {p.category?.name || p.category || 'General'}
                                    </span>

                                    {/* GST Badge */}
                                    <span className="absolute top-2 right-2 text-[9px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 backdrop-blur-md px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                                        {p.gstPercentage ?? 18}% GST
                                    </span>
                                </div>

                                {/* Card Body & Expiry Info */}
                                <div className="p-3 space-y-1.5">
                                    <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 transition-colors">
                                        {p.name}
                                    </h4>

                                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                                        <span>Batch: {p.batchNumber || 'BATCH-01'}</span>
                                        <span className="text-amber-500 font-semibold flex items-center gap-0.5">
                                            <Calendar className="w-2.5 h-2.5" /> Exp: {p.expiryDate || '2027'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                        <span className="text-sm font-extrabold text-slate-900 dark:text-white">₹{Number(p.price).toFixed(2)}</span>
                                        <span className="text-[10px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                                            Stock: {p.stockQuantity ?? 50}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: ADVANCED BILLING & CUSTOMER DETAILS (5 COLS) */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col justify-between shadow-sm">
                    <div className="space-y-4">
                        
                        {/* CUSTOMER & REPEAT CUSTOMER MARKING SECTION */}
                        <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/70 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                    <UserCheck className="w-4 h-4 text-emerald-500" /> Customer Protocol
                                </span>

                                {/* REPEAT CUSTOMER BADGE */}
                                {isRepeatCustomer && (
                                    <span className="px-2.5 py-0.5 bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300 border border-pink-200 text-[10px] font-bold rounded-full flex items-center gap-1">
                                        <Sparkles className="w-3 h-3 text-pink-500" /> REPEATED CUSTOMER ({customerVisitCount}th Visit)
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        className="w-full mt-0.5 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold text-xs outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</label>
                                    <input
                                        type="text"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        className="w-full mt-0.5 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold text-xs outline-none focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            {/* HOME DELIVERY & ADDRESS TOGGLE */}
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2 whitespace-nowrap cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isHomeDelivery}
                                            onChange={(e) => setIsHomeDelivery(e.target.checked)}
                                            className="rounded border-slate-300 text-emerald-600 focus:ring-0"
                                        />
                                        <Truck className="w-3.5 h-3.5 text-emerald-500" /> Enable Home Delivery
                                    </label>
                                    {isHomeDelivery && (
                                        <span className="text-[10px] text-emerald-600 font-bold">+₹{deliveryCharge} Delivery Fee</span>
                                    )}
                                </div>

                                {isHomeDelivery && (
                                    <div className="space-y-1.5 pt-1">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Delivery Address</label>
                                            <input
                                                type="text"
                                                value={deliveryAddress}
                                                onChange={(e) => setDeliveryAddress(e.target.value)}
                                                placeholder="Enter destination delivery address..."
                                                className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CART ITEMS LIST */}
                        <div>
                            <div className="flex justify-between items-center pb-2 border-b border-slate-200 dark:border-slate-700 mb-2">
                                <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Cart Order</h3>
                                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                    {cart.reduce((s, c) => s + c.quantity, 0)} Items Selected
                                </span>
                            </div>

                            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                                {cart.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400 text-xs font-medium">
                                        Cart is empty. Click commodities on the left or scan barcode.
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                            <div className="flex-1 pr-2">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                                                <p className="text-[10px] text-slate-400">₹{item.price} + {item.gstPercentage}% GST • {item.batchNumber}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <button onClick={() => updateQuantity(item.id, -1)} className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">-</button>
                                                <span className="text-xs font-extrabold w-5 text-center text-slate-900 dark:text-white">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, 1)} className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">+</button>
                                            </div>
                                            <span className="text-xs font-extrabold text-slate-900 dark:text-white ml-3 w-16 text-right">
                                                ₹{(item.price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* COMPREHENSIVE GST FINANCIAL BILLING BREAKDOWN */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700 space-y-3 mt-4">
                        <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                            <div className="flex justify-between"><span>Subtotal (Excl. Tax)</span><span>₹{subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>CGST (9%)</span><span>₹{cgst.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>SGST (9%)</span><span>₹{sgst.toFixed(2)}</span></div>
                            {isHomeDelivery && (
                                <div className="flex justify-between text-emerald-600 font-bold"><span>Home Delivery Fee</span><span>+₹{deliveryFee.toFixed(2)}</span></div>
                            )}
                            <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                                <span>Grand Total</span>
                                <span className="text-emerald-600 dark:text-emerald-400 text-lg font-black">₹{grandTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* PAYMENT METHODS */}
                        <div className="grid grid-cols-4 gap-2 pt-1">
                            {[
                                { id: 'CASH', label: 'Cash', icon: DollarSign },
                                { id: 'CARD', label: 'Card', icon: CreditCard },
                                { id: 'UPI', label: 'UPI QR', icon: Smartphone },
                                { id: 'LOYALTY', label: 'Points', icon: Award },
                            ].map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setPaymentMethod(m.id as any)}
                                    className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center gap-1 transition-all ${paymentMethod === m.id ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                                >
                                    <m.icon className="w-4 h-4" />
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        {paymentMethod === 'CASH' && (
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Cash Received</label>
                                    <input
                                        type="number"
                                        value={cashReceived || ''}
                                        onChange={(e) => setCashReceived(Number(e.target.value))}
                                        placeholder="0.00"
                                        className="w-full p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-extrabold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Change Due</label>
                                    <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-black text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                                        ₹{changeDue.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleCompleteSale}
                            disabled={cart.length === 0}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            <CheckCircle className="w-5 h-5" /> COMPLETE SALE & GENERATE RECEIPT
                        </button>
                    </div>
                </div>
            </div>

            {/* RECEIPT MODAL */}
            {isReceiptModalOpen && lastSaleReceipt && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div className="text-center pb-3 border-b border-dashed border-slate-300 dark:border-slate-700">
                            <h3 className="font-black text-xl text-slate-900 dark:text-white">STORE AI ENTERPRISE</h3>
                            <p className="text-xs text-slate-500">Tax Invoice & Delivery Receipt</p>
                            <p className="text-[11px] text-slate-400 mt-1">Invoice: {lastSaleReceipt.invoiceNo} | {lastSaleReceipt.date}</p>
                            <p className="text-xs font-bold text-emerald-600 mt-1">Customer: {lastSaleReceipt.customer} ({lastSaleReceipt.phone})</p>
                        </div>

                        <div className="space-y-2 text-xs max-h-[200px] overflow-y-auto pr-1">
                            {lastSaleReceipt.items.map((it: any) => (
                                <div key={it.id} className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                                    <span>{it.name} x{it.quantity} [{it.batchNumber}]</span>
                                    <span className="font-bold text-slate-900 dark:text-white">₹{(it.price * it.quantity * (1 + it.gstPercentage / 100)).toFixed(2)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="pt-3 border-t border-dashed border-slate-300 dark:border-slate-700 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                            <div className="flex justify-between"><span>Subtotal:</span><span>₹{lastSaleReceipt.subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>CGST (9%):</span><span>₹{lastSaleReceipt.cgst.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>SGST (9%):</span><span>₹{lastSaleReceipt.sgst.toFixed(2)}</span></div>
                            {lastSaleReceipt.deliveryFee > 0 && (
                                <div className="flex justify-between text-emerald-600 font-bold"><span>Delivery Fee:</span><span>₹{lastSaleReceipt.deliveryFee.toFixed(2)}</span></div>
                            )}
                            <div className="flex justify-between font-extrabold text-base text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                                <span>GRAND TOTAL ({lastSaleReceipt.paymentMethod}):</span>
                                <span className="text-emerald-600">₹{lastSaleReceipt.grandTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-3">
                            <button
                                onClick={() => downloadPDFInvoice(lastSaleReceipt)}
                                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                            >
                                <Download className="w-4 h-4" /> Download PDF Invoice
                            </button>
                            <button
                                onClick={() => window.print()}
                                className="py-3 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                            >
                                <Printer className="w-4 h-4" /> Thermal Print
                            </button>
                            <button
                                onClick={() => setIsReceiptModalOpen(false)}
                                className="py-3 px-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
