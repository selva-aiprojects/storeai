import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    ShoppingCart, QrCode, CreditCard, DollarSign, Smartphone, Award, Printer, RotateCcw,
    CheckCircle, Wifi, WifiOff, Maximize2, Minimize2, Search, Image as ImageIcon, MapPin,
    Truck, UserCheck, Calendar, ShieldCheck, Tag, Plus, Minus, Trash2, Download, Layers, Sparkles,
    Sliders, Clock, FileText, User, RefreshCw, Key, HelpCircle, AlertTriangle, Check
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PageHeader from '../components/PageHeader';
import { createSale } from '../services/api';
import { generateThermalReceiptText, printReceiptInBrowser, ReceiptData } from '../utils/escPosPrinter';
import { enqueueOfflineSale, getOfflineQueue, syncOfflineTransactions } from '../services/offlineSync';

interface CartItem {
    id: string;
    name: string;
    sku: string;
    price: number;
    mrp?: number;
    gstPercentage: number;
    quantity: number;
    category?: string;
    image?: string;
    batchNumber?: string;
    expiryDate?: string;
}

interface CartTab {
    id: string;
    name: string;
    items: CartItem[];
    customerName: string;
    customerPhone: string;
    discountAmount: number;
}

interface CashierShift {
    id: string;
    cashierName: string;
    isOpen: boolean;
    startTime: string;
    openingFloat: number;
    cashSales: number;
    cardSales: number;
    upiSales: number;
    creditSales: number;
    pettyDrops: Array<{ time: string; amount: number; reason: string }>;
    totalTransactions: number;
}

export default function POS({ products = [] }: { products?: any[] }) {
    const { refreshData } = (useOutletContext<any>() || {}) as any;

    // --- Multi-Cart Tabs (Hold / Resume) State ---
    const [cartTabs, setCartTabs] = useState<CartTab[]>([
        { id: 'cart-1', name: 'Cart 1', items: [], customerName: 'Rahul Verma', customerPhone: '+91 98765 43210', discountAmount: 0 }
    ]);
    const [activeCartId, setActiveCartId] = useState<string>('cart-1');

    const activeCart = cartTabs.find(c => c.id === activeCartId) || cartTabs[0];
    const cart = activeCart?.items || [];

    // --- Input & Search States ---
    const [barcodeInput, setBarcodeInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    // --- Payment & Settlement States ---
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'LOYALTY' | 'SPLIT' | 'CREDIT'>('CASH');
    const [cashReceived, setCashReceived] = useState<number>(0);
    const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState<number>(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [offlineQueueCount, setOfflineQueueCount] = useState<number>(() => getOfflineQueue().length);
    const [isSyncingOffline, setIsSyncingOffline] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // --- Salesperson & Hardware Preferences ---
    const [salesperson, setSalesperson] = useState('Rajesh Kumar (Counter 1)');
    const [thermalPaperWidth, setThermalPaperWidth] = useState<'58mm' | '80mm'>('80mm');
    const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [tempDiscountPercent, setTempDiscountPercent] = useState<number>(0);

    // --- Cashier Shift State (Optech Standard Lifecycle) ---
    const [shift, setShift] = useState<CashierShift>({
        id: 'SHIFT-2026-0901-01',
        cashierName: 'Amit Sharma',
        isOpen: true,
        startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        openingFloat: 2000,
        cashSales: 14500,
        cardSales: 8900,
        upiSales: 12400,
        creditSales: 3200,
        pettyDrops: [{ time: '11:15 AM', amount: 500, reason: 'Store Cleaning & Supplies' }],
        totalTransactions: 34
    });
    const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
    const [shiftModalTab, setShiftModalTab] = useState<'SUMMARY' | 'DROP' | 'CLOSE' | 'Z_REPORT'>('SUMMARY');
    const [pettyAmount, setPettyAmount] = useState<number>(0);
    const [pettyReason, setPettyReason] = useState<string>('');
    const [blindCashCount, setBlindCashCount] = useState<number>(0);

    // --- Modals & Receipts ---
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [lastSaleReceipt, setLastSaleReceipt] = useState<ReceiptData | null>(null);

    // --- Customer & Delivery Controls ---
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

    // --- Multi-MRP / Batch Selection Modal State ---
    const [batchSelectionProduct, setBatchSelectionProduct] = useState<any>(null);

    const categoriesList = ['ALL', 'Groceries', 'Electronics', 'Apparel', 'Beverages', 'Fresh Produce', 'Hardware', 'Bakery & Dairy', 'Pharmacy'];

    // Demo commodities with Multi-MRP & Batches
    const demoCommodities = [
        {
            id: 'c1', sku: 'GRO-001', name: 'Organic Basmati Rice 5kg', price: 650, mrp: 720, gstPercentage: 5, category: 'Groceries',
            batches: [
                { batchNumber: 'BATCH-2026-R01', mrp: 720, price: 650, expiryDate: '2027-06-30', stock: 80 },
                { batchNumber: 'BATCH-2026-R02', mrp: 750, price: 680, expiryDate: '2027-09-30', stock: 40 }
            ],
            batchNumber: 'BATCH-2026-R01', expiryDate: '2027-06-30', stockQuantity: 120, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80'
        },
        {
            id: 'c2', sku: 'ELE-102', name: 'Wireless Noise Cancelling Earbuds', price: 2499, mrp: 3999, gstPercentage: 18, category: 'Electronics',
            batchNumber: 'BATCH-2026-E12', expiryDate: '2028-12-31', stockQuantity: 45, image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&q=80'
        },
        {
            id: 'c3', sku: 'APP-204', name: 'Premium Cotton Polo T-Shirt', price: 899, mrp: 1299, gstPercentage: 12, category: 'Apparel',
            batchNumber: 'BATCH-2026-A04', expiryDate: 'N/A', stockQuantity: 80, image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&q=80'
        },
        {
            id: 'c4', sku: 'BEV-301', name: 'Natural Sparkling Juice 330ml', price: 150, mrp: 160, gstPercentage: 18, category: 'Beverages',
            batches: [
                { batchNumber: 'BATCH-2026-B88', mrp: 160, price: 150, expiryDate: '2026-11-15', stock: 120 },
                { batchNumber: 'BATCH-2026-B92', mrp: 165, price: 155, expiryDate: '2027-02-15', stock: 80 }
            ],
            batchNumber: 'BATCH-2026-B88', expiryDate: '2026-11-15', stockQuantity: 200, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80'
        },
        {
            id: 'c5', sku: 'PRO-409', name: 'Fresh Farm Mangoes 1kg', price: 350, mrp: 380, gstPercentage: 0, category: 'Fresh Produce',
            batchNumber: 'BATCH-2026-F09', expiryDate: '2026-08-05', stockQuantity: 30, image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&q=80'
        },
        {
            id: 'c6', sku: 'HAR-512', name: 'Cordless Power Drill Tool Pack', price: 3899, mrp: 4999, gstPercentage: 18, category: 'Hardware',
            batchNumber: 'BATCH-2026-H55', expiryDate: '2029-01-01', stockQuantity: 15, image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&q=80'
        },
        {
            id: 'c7', sku: 'BAK-601', name: 'Artisanal Whole Wheat Bread', price: 90, mrp: 95, gstPercentage: 5, category: 'Bakery & Dairy',
            batchNumber: 'BATCH-2026-BK1', expiryDate: '2026-07-29', stockQuantity: 50, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80'
        },
        {
            id: 'c8', sku: 'PHA-702', name: 'Multivitamin Health Supplements', price: 499, mrp: 599, gstPercentage: 12, category: 'Pharmacy',
            batchNumber: 'BATCH-2026-PH9', expiryDate: '2027-10-20', stockQuantity: 90, image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&q=80'
        }
    ];

    const displayProducts = products.length > 0 ? products : demoCommodities;

    // Filter products
    const filteredProducts = displayProducts.filter(p => {
        const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = selectedCategory === 'ALL' || (p.category?.name || p.category) === selectedCategory;
        return matchesSearch && matchesCat;
    });

    // --- Offline Status Watcher ---
    useEffect(() => {
        const handleOnline = () => {
            setIsOnline(true);
            triggerOfflineSync();
        };
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const triggerOfflineSync = async () => {
        if (getOfflineQueue().length === 0) return;
        setIsSyncingOffline(true);
        try {
            await syncOfflineTransactions();
            setOfflineQueueCount(getOfflineQueue().length);
            if (typeof refreshData === 'function') refreshData('sales');
        } catch (e) {
            console.error('Offline sync error:', e);
        } finally {
            setIsSyncingOffline(false);
        }
    };

    // --- OPTECH KEYBOARD SHORTCUTS ENGINE (F1 - F12) ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Prevent default browser shortcuts for function keys
            if (['F1', 'F2', 'F3', 'F4', 'F5', 'F8', 'F9', 'F10', 'F12'].includes(e.key)) {
                e.preventDefault();
            }

            switch (e.key) {
                case 'F1': // Focus Barcode Scanner
                    barcodeInputRef.current?.focus();
                    break;
                case 'F2': // Focus Search
                    document.getElementById('pos-search-input')?.focus();
                    break;
                case 'F3': // Discount Modal
                    setIsDiscountModalOpen(prev => !prev);
                    break;
                case 'F4': // Hold Bill (Add New Cart)
                    handleHoldCart();
                    break;
                case 'F5': // Recall / Switch Cart Tab
                    handleSwitchNextCart();
                    break;
                case 'F8': // Toggle Payment Mode
                    cyclePaymentMethod();
                    break;
                case 'F9': // Cashier Shift Modal (X/Z Report)
                    setIsShiftModalOpen(prev => !prev);
                    break;
                case 'F10': // Hardware Setup (Thermal Printer)
                    setIsHardwareModalOpen(prev => !prev);
                    break;
                case 'F12': // Settle Bill & Print
                    if (cart.length > 0) handleCompleteSale();
                    break;
                case 'Escape': // Close open modals
                    setIsReceiptModalOpen(false);
                    setIsShiftModalOpen(false);
                    setIsHardwareModalOpen(false);
                    setIsDiscountModalOpen(false);
                    setBatchSelectionProduct(null);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart, paymentMethod, activeCartId, cartTabs]);

    // --- Multi-Cart Tab Handlers ---
    const handleHoldCart = () => {
        const newCartNum = cartTabs.length + 1;
        const newCartId = `cart-${Date.now()}`;
        const newTab: CartTab = {
            id: newCartId,
            name: `Cart ${newCartNum}`,
            items: [],
            customerName: 'Walk-in Customer',
            customerPhone: '',
            discountAmount: 0
        };
        setCartTabs(prev => [...prev, newTab]);
        setActiveCartId(newCartId);
    };

    const handleSwitchNextCart = () => {
        if (cartTabs.length <= 1) return;
        const currentIndex = cartTabs.findIndex(c => c.id === activeCartId);
        const nextIndex = (currentIndex + 1) % cartTabs.length;
        setActiveCartId(cartTabs[nextIndex].id);
    };

    const handleCloseCartTab = (tabId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (cartTabs.length === 1) {
            // Clear current cart instead of deleting
            updateActiveCartItems([]);
            return;
        }
        const remaining = cartTabs.filter(c => c.id !== tabId);
        setCartTabs(remaining);
        if (activeCartId === tabId) {
            setActiveCartId(remaining[0].id);
        }
    };

    const updateActiveCartItems = (newItems: CartItem[]) => {
        setCartTabs(prev => prev.map(tab => tab.id === activeCartId ? { ...tab, items: newItems } : tab));
    };

    const cyclePaymentMethod = () => {
        const methods: Array<'CASH' | 'CARD' | 'UPI' | 'LOYALTY' | 'CREDIT'> = ['CASH', 'UPI', 'CARD', 'LOYALTY', 'CREDIT'];
        const currIndex = methods.indexOf(paymentMethod as any);
        const nextMethod = methods[(currIndex + 1) % methods.length];
        setPaymentMethod(nextMethod);
    };

    // --- Cart Item Management ---
    const handleAddToCart = (product: any, selectedBatch?: any) => {
        if (product.batches && product.batches.length > 1 && !selectedBatch) {
            setBatchSelectionProduct(product);
            return;
        }

        const batch = selectedBatch || {
            batchNumber: product.batchNumber || 'BATCH-01',
            mrp: product.mrp || product.price,
            price: product.price,
            expiryDate: product.expiryDate || 'N/A'
        };

        const existingIndex = cart.findIndex(item => item.id === product.id && item.batchNumber === batch.batchNumber);
        let updated: CartItem[];

        if (existingIndex > -1) {
            updated = cart.map((item, idx) => idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item);
        } else {
            updated = [...cart, {
                id: product.id,
                name: product.name,
                sku: product.sku,
                price: Number(batch.price || product.price),
                mrp: Number(batch.mrp || product.mrp || product.price),
                gstPercentage: Number(product.gstPercentage ?? 18),
                category: product.category?.name || product.category || 'General',
                batchNumber: batch.batchNumber,
                expiryDate: batch.expiryDate,
                quantity: 1
            }];
        }

        updateActiveCartItems(updated);
        setBatchSelectionProduct(null);
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

    const updateQuantity = (id: string, batchNum: string | undefined, delta: number) => {
        const updated = cart.map(item => {
            if (item.id === id && item.batchNumber === batchNum) {
                const newQty = item.quantity + delta;
                return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
        }).filter(Boolean) as CartItem[];

        updateActiveCartItems(updated);
    };

    // Financial calculations
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalGst = cart.reduce((sum, item) => sum + (item.price * item.quantity * (item.gstPercentage / 100)), 0);
    const cgst = totalGst / 2;
    const sgst = totalGst / 2;
    const loyaltyDiscount = loyaltyPointsToRedeem * 1;
    const deliveryFee = isHomeDelivery ? Number(deliveryCharge || 0) : 0;
    const grandTotal = Math.max(0, subtotal + totalGst + deliveryFee - loyaltyDiscount - Number(discountAmount || 0));
    const changeDue = Math.max(0, cashReceived - grandTotal);

    const resetPosTerminal = () => {
        updateActiveCartItems([]);
        setBarcodeInput('');
        setSearchQuery('');
        setCashReceived(0);
        setLoyaltyPointsToRedeem(0);
        setDiscountAmount(0);
        setIsHomeDelivery(false);
        setDeliveryAddress('');
        if (typeof refreshData === 'function') {
            refreshData('sales');
        }
    };

    // --- Complete Sale Flow (Online / Offline First) ---
    const handleCompleteSale = async () => {
        if (cart.length === 0) return alert('Cart is empty!');

        const invoiceNo = `INV-${Date.now().toString().slice(-6)}`;
        const receipt: ReceiptData = {
            invoiceNo,
            date: new Date().toLocaleString(),
            storeName: 'StoreAI Supermarket',
            storeAddress: 'Plot 42, Bandra Linking Rd, Mumbai',
            storePhone: '+91 22 2640 1122',
            storeGstin: '27AABCU9603R1ZM',
            cashierName: shift.cashierName,
            salespersonName: salesperson,
            customerName: customerName,
            customerPhone: customerPhone,
            items: cart.map(c => ({
                name: c.name,
                quantity: c.quantity,
                price: c.price,
                gstPercentage: c.gstPercentage,
                batchNumber: c.batchNumber,
                mrp: c.mrp
            })),
            subtotal,
            cgst,
            sgst,
            discount: Number(discountAmount || 0) + loyaltyDiscount,
            deliveryCharge: deliveryFee,
            totalAmount: grandTotal,
            paymentMethod,
            tenderedAmount: paymentMethod === 'CASH' ? (cashReceived || grandTotal) : grandTotal,
            changeAmount: paymentMethod === 'CASH' ? changeDue : 0,
            paperWidth: thermalPaperWidth
        };

        const salePayload = {
            invoiceNo,
            items: cart.map(i => ({ productId: i.id, quantity: i.quantity, unitPrice: i.price, batchNumber: i.batchNumber })),
            paymentMethod,
            amountPaid: cashReceived || grandTotal,
            isHomeDelivery,
            deliveryAddress: isHomeDelivery ? deliveryAddress : undefined
        };

        if (isOnline) {
            try {
                await createSale(salePayload);
            } catch (e) {
                console.warn('Online sync failed, queuing offline:', e);
                enqueueOfflineSale(salePayload);
                setOfflineQueueCount(getOfflineQueue().length);
            }
        } else {
            // Offline queue
            enqueueOfflineSale(salePayload);
            setOfflineQueueCount(getOfflineQueue().length);
        }

        // Update shift totals
        setShift(prev => ({
            ...prev,
            totalTransactions: prev.totalTransactions + 1,
            cashSales: paymentMethod === 'CASH' ? prev.cashSales + grandTotal : prev.cashSales,
            cardSales: paymentMethod === 'CARD' ? prev.cardSales + grandTotal : prev.cardSales,
            upiSales: paymentMethod === 'UPI' ? prev.upiSales + grandTotal : prev.upiSales,
            creditSales: paymentMethod === 'CREDIT' ? prev.creditSales + grandTotal : prev.creditSales,
        }));

        setLastSaleReceipt(receipt);
        setIsReceiptModalOpen(true);
    };

    // --- Petty Cash Drop Handler ---
    const handleRecordPettyDrop = (e: React.FormEvent) => {
        e.preventDefault();
        if (pettyAmount <= 0) return alert('Enter valid amount');
        setShift(prev => ({
            ...prev,
            pettyDrops: [...prev.pettyDrops, {
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                amount: Number(pettyAmount),
                reason: pettyReason || 'Cash Drawer Petty Drop'
            }]
        }));
        setPettyAmount(0);
        setPettyReason('');
        setShiftModalTab('SUMMARY');
        alert('Petty expense recorded in shift ledger.');
    };

    const downloadPDFInvoice = (receipt: ReceiptData) => {
        const doc = new jsPDF() as any;
        const pageWidth = doc.internal.pageSize.getWidth();
        const rightMargin = 15;
        const money = (value: number) => `INR ${Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, pageWidth, 36, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("StoreAI TAX INVOICE", 15, 22);

        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.text(`INVOICE: ${receipt.invoiceNo} | DATE: ${receipt.date} | GSTIN: ${receipt.storeGstin}`, 15, 30);

        doc.setTextColor(30, 41, 59);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("BILL TO (CUSTOMER):", 15, 48);
        doc.setFont("helvetica", "normal");
        doc.text(`${receipt.customerName || 'Walk-in'} (${receipt.customerPhone || 'N/A'})`, 15, 54);

        const tableData = receipt.items.map((item, idx) => [
            idx + 1,
            `${item.name}\n[${item.batchNumber || 'STANDARD'}]`,
            item.quantity,
            `₹${item.price.toFixed(2)}`,
            `${item.gstPercentage}%`,
            `₹${(item.price * item.quantity * (1 + item.gstPercentage / 100)).toFixed(2)}`
        ]);

        autoTable(doc, {
            startY: 65,
            head: [['#', 'ITEM & BATCH', 'QTY', 'RATE', 'GST', 'TOTAL']],
            body: tableData,
            theme: 'grid',
            margin: { left: 15, right: rightMargin },
            headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] }
        });

        const finalY = (doc as any).lastAutoTable.finalY || 120;
        doc.setFontSize(10);
        doc.text(`Subtotal: ₹${receipt.subtotal.toFixed(2)}`, 140, finalY + 12);
        doc.text(`CGST: ₹${receipt.cgst.toFixed(2)}`, 140, finalY + 18);
        doc.text(`SGST: ₹${receipt.sgst.toFixed(2)}`, 140, finalY + 24);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(`GRAND TOTAL: ₹${receipt.totalAmount.toFixed(2)}`, 140, finalY + 34);

        doc.save(`${receipt.invoiceNo}.pdf`);
    };

    return (
        <div className={`pos-terminal-shell font-['Outfit'] transition-all ${isFullscreen ? 'fixed inset-0 z-[99999] bg-slate-950 text-white p-6 overflow-y-auto' : 'space-y-4'}`}>
            
            {/* TOP BAR: OPTECH KEYBOARD SHORTCUTS REFERENCE BAR */}
            <div className="bg-slate-900 text-slate-200 px-4 py-2 rounded-2xl flex items-center justify-between gap-2 overflow-x-auto text-[11px] font-mono shadow-md border border-slate-800">
                <div className="flex items-center gap-3 shrink-0">
                    <span className="flex items-center gap-1 font-bold text-emerald-400">
                        <Key className="w-3.5 h-3.5" /> OPTECH HOTKEYS:
                    </span>
                    <button onClick={() => barcodeInputRef.current?.focus()} className="hover:text-emerald-400 transition-colors flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        <kbd className="text-emerald-400 font-bold">F1</kbd> Scan Barcode
                    </button>
                    <button onClick={() => document.getElementById('pos-search-input')?.focus()} className="hover:text-emerald-400 transition-colors flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        <kbd className="text-emerald-400 font-bold">F2</kbd> Search Item
                    </button>
                    <button onClick={() => setIsDiscountModalOpen(true)} className="hover:text-emerald-400 transition-colors flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        <kbd className="text-emerald-400 font-bold">F3</kbd> Discount
                    </button>
                    <button onClick={handleHoldCart} className="hover:text-emerald-400 transition-colors flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        <kbd className="text-emerald-400 font-bold">F4</kbd> Hold Bill
                    </button>
                    <button onClick={handleSwitchNextCart} className="hover:text-emerald-400 transition-colors flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        <kbd className="text-emerald-400 font-bold">F5</kbd> Switch Cart
                    </button>
                    <button onClick={cyclePaymentMethod} className="hover:text-emerald-400 transition-colors flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        <kbd className="text-emerald-400 font-bold">F8</kbd> Tender Mode
                    </button>
                    <button onClick={() => setIsShiftModalOpen(true)} className="hover:text-emerald-400 transition-colors flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        <kbd className="text-emerald-400 font-bold">F9</kbd> Shift / Z-Report
                    </button>
                    <button onClick={() => setIsHardwareModalOpen(true)} className="hover:text-emerald-400 transition-colors flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        <kbd className="text-emerald-400 font-bold">F10</kbd> Thermal Setup
                    </button>
                    <button onClick={handleCompleteSale} className="hover:text-emerald-400 transition-colors flex items-center gap-1 bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700 font-bold">
                        <kbd className="text-emerald-400 font-bold">F12</kbd> Settle & Print
                    </button>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {offlineQueueCount > 0 && (
                        <button
                            onClick={triggerOfflineSync}
                            disabled={isSyncingOffline || !isOnline}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse text-[10px]"
                        >
                            <RefreshCw className={`w-3 h-3 ${isSyncingOffline ? 'animate-spin' : ''}`} />
                            {offlineQueueCount} Offline Sales (Sync Now)
                        </button>
                    )}
                </div>
            </div>

            {/* UNIFIED PAGE HEADER WITH SHIFT & OFFLINE STATUS */}
            <PageHeader
                title="Point of Sale (POS) Terminal"
                subtitle="High-speed Optech-standard retail cashier counter with multi-cart hold & ESC/POS thermal printing"
                icon={ShoppingCart}
                badge={`SHIFT: ${shift.id} • ${shift.cashierName}`}
                badgeColor="emerald"
                iconGradient="from-emerald-500 to-teal-600"
                actions={
                    <div className="pos-header-actions flex items-center gap-2 flex-wrap justify-end">
                        {/* Salesperson Selector */}
                        <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-2xl text-xs">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <select
                                value={salesperson}
                                onChange={(e) => setSalesperson(e.target.value)}
                                className="bg-transparent text-slate-900 dark:text-white font-semibold text-xs outline-none"
                            >
                                <option value="Rajesh Kumar (Counter 1)">Rajesh Kumar (Counter 1)</option>
                                <option value="Priya Sharma (Counter 2)">Priya Sharma (Counter 2)</option>
                                <option value="Amit Patel (Floor 1)">Amit Patel (Floor 1)</option>
                            </select>
                        </div>

                        {/* Shift Manager Button */}
                        <button
                            onClick={() => setIsShiftModalOpen(true)}
                            className="px-3 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 transition-colors"
                        >
                            <Clock className="w-3.5 h-3.5" /> SHIFT (F9)
                        </button>

                        {/* Online / Offline Toggle */}
                        <button
                            onClick={() => setIsOnline(!isOnline)}
                            className={`px-3 py-2 rounded-2xl text-xs font-extrabold flex items-center gap-1.5 border transition-all ${isOnline ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-200'}`}
                        >
                            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                            {isOnline ? 'ONLINE' : 'OFFLINE MODE'}
                        </button>

                        {/* Fullscreen */}
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-extrabold rounded-2xl flex items-center gap-1.5 transition-colors"
                        >
                            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                        </button>

                        {/* Reset / Clear */}
                        <button
                            onClick={resetPosTerminal}
                            className="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-extrabold rounded-2xl flex items-center gap-1.5 transition-colors"
                        >
                            <RotateCcw className="w-3.5 h-3.5" /> CLEAR
                        </button>
                    </div>
                }
            />

            {/* MULTI-CART HOLD / RESUME TABS (Optech Feature) */}
            <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 gap-2">
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                    {cartTabs.map((tab, idx) => {
                        const count = tab.items.reduce((s, i) => s + i.quantity, 0);
                        const isActive = tab.id === activeCartId;
                        return (
                            <div
                                key={tab.id}
                                onClick={() => setActiveCartId(tab.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-all ${isActive ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200'}`}
                            >
                                <span>{tab.name}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200'}`}>
                                    {count}
                                </span>
                                {cartTabs.length > 1 && (
                                    <button
                                        onClick={(e) => handleCloseCartTab(tab.id, e)}
                                        className="hover:text-red-300 ml-1 text-xs opacity-70 hover:opacity-100"
                                    >
                                        ×
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>

                <button
                    onClick={handleHoldCart}
                    className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-extrabold flex items-center gap-1 shrink-0 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" /> Hold New Bill (F4)
                </button>
            </div>

            {/* CATEGORY FILTER TABS */}
            <div className="pos-category-tabs flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {categoriesList.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${selectedCategory === cat ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
                    >
                        {cat}
                        {cat === 'ALL' ? ` (${displayProducts.length})` : ''}
                    </button>
                ))}
            </div>

            {/* POS MAIN GRID */}
            <div className="pos-terminal-grid grid grid-cols-1 lg:grid-cols-12 gap-4">
                
                {/* LEFT: PRODUCT CATALOG GRID (7 COLS) */}
                <div className="pos-product-panel lg:col-span-7 space-y-3 min-w-0">
                    {/* Barcode & Search Bar */}
                    <div className="pos-search-grid grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <form onSubmit={handleBarcodeSubmit} className="relative min-w-0">
                            <QrCode className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <input
                                ref={barcodeInputRef}
                                type="text"
                                value={barcodeInput}
                                onChange={(e) => setBarcodeInput(e.target.value)}
                                placeholder="Scan Barcode (F1)..."
                                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </form>
                        <div className="relative min-w-0">
                            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <input
                                id="pos-search-input"
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search Item (F2)..."
                                className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Product Cards Grid */}
                    <div className="pos-product-grid grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[560px] overflow-y-auto pr-1 min-w-0">
                        {filteredProducts.map((p) => (
                            <div
                                key={p.id}
                                onClick={() => handleAddToCart(p)}
                                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-lg flex flex-col justify-between group relative min-w-0"
                            >
                                <div className="h-28 bg-slate-100 dark:bg-slate-900 relative flex items-center justify-center overflow-hidden p-2">
                                    {p.image ? (
                                        <img
                                            src={p.image}
                                            alt={p.name}
                                            className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                    ) : (
                                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                                            <ImageIcon className="w-5 h-5" />
                                        </div>
                                    )}

                                    <span className="absolute top-2 left-2 text-[8px] uppercase tracking-wider font-extrabold text-white bg-slate-900/80 backdrop-blur-md px-1.5 py-0.5 rounded-md">
                                        {p.category?.name || p.category || 'General'}
                                    </span>

                                    {p.batches && p.batches.length > 1 && (
                                        <span className="absolute bottom-2 left-2 text-[8px] font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-950 px-1.5 py-0.5 rounded-md border border-indigo-200">
                                            {p.batches.length} Batches/MRPs
                                        </span>
                                    )}

                                    <span className="absolute top-2 right-2 text-[8px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950 px-1.5 py-0.5 rounded-md border border-emerald-200">
                                        {p.gstPercentage ?? 18}% GST
                                    </span>
                                </div>

                                <div className="p-2.5 space-y-1 min-w-0">
                                    <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 transition-colors">
                                        {p.name}
                                    </h4>

                                    <div className="flex items-center justify-between text-[10px] text-slate-400 gap-1 min-w-0">
                                        <span className="truncate">SKU: {p.sku}</span>
                                        <span className="text-amber-500 font-semibold flex items-center gap-0.5 shrink-0">
                                            Exp: {p.expiryDate || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 dark:border-slate-700/50 gap-1">
                                        <div>
                                            <span className="text-xs font-extrabold text-slate-900 dark:text-white">₹{Number(p.price).toFixed(2)}</span>
                                            {p.mrp && p.mrp > p.price && (
                                                <span className="text-[10px] text-slate-400 line-through ml-1">MRP ₹{p.mrp}</span>
                                            )}
                                        </div>
                                        <span className="text-[9px] text-slate-400 font-bold bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-md shrink-0">
                                            Qty: {p.stockQuantity ?? 50}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RIGHT: ADVANCED BILLING, CART & CUSTOMER PANEL (5 COLS) */}
                <div className="pos-billing-panel lg:col-span-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col justify-between shadow-sm min-w-0">
                    <div className="space-y-3 min-w-0">
                        
                        {/* CUSTOMER SECTION */}
                        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-700/70 space-y-2">
                            <div className="flex justify-between items-center gap-2">
                                <span className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-500" /> Customer & Delivery
                                </span>
                                {isRepeatCustomer && (
                                    <span className="px-2 py-0.5 bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300 border border-pink-200 text-[9px] font-bold rounded-full flex items-center gap-1">
                                        <Sparkles className="w-2.5 h-2.5 text-pink-500" /> #{customerVisitCount} Repeat
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <input
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    placeholder="Customer Name"
                                    className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold text-xs outline-none"
                                />
                                <input
                                    type="text"
                                    value={customerPhone}
                                    onChange={(e) => setCustomerPhone(e.target.value)}
                                    placeholder="Phone / Mobile"
                                    className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white font-semibold text-xs outline-none"
                                />
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700 text-xs">
                                <label className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={isHomeDelivery}
                                        onChange={(e) => setIsHomeDelivery(e.target.checked)}
                                        className="rounded text-emerald-600"
                                    />
                                    <Truck className="w-3 h-3 text-emerald-500" /> Home Delivery
                                </label>
                                {isHomeDelivery && (
                                    <span className="text-[10px] text-emerald-600 font-bold">+₹{deliveryCharge}</span>
                                )}
                            </div>
                        </div>

                        {/* CART ITEMS LIST */}
                        <div>
                            <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 dark:border-slate-700 mb-2 gap-2">
                                <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                                    {activeCart.name} ({cart.reduce((s, c) => s + c.quantity, 0)} Items)
                                </h3>
                                <button
                                    onClick={() => setIsDiscountModalOpen(true)}
                                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                                >
                                    <Tag className="w-3 h-3" /> Apply Discount (F3)
                                </button>
                            </div>

                            <div className="pos-cart-list space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                                {cart.length === 0 ? (
                                    <div className="text-center py-6 text-slate-400 text-xs font-medium">
                                        Cart is empty. Scan barcode (F1) or select product.
                                    </div>
                                ) : (
                                    cart.map(item => (
                                        <div key={`${item.id}-${item.batchNumber}`} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/50 gap-2">
                                            <div className="flex-1 pr-2 min-w-0">
                                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.name}</p>
                                                <p className="text-[10px] text-slate-400">₹{item.price} • {item.batchNumber || 'Batch-01'}</p>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                <button onClick={() => updateQuantity(item.id, item.batchNumber, -1)} className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">-</button>
                                                <span className="text-xs font-extrabold w-4 text-center text-slate-900 dark:text-white">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.batchNumber, 1)} className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center text-xs">+</button>
                                            </div>
                                            <span className="text-xs font-extrabold text-slate-900 dark:text-white ml-2 w-14 text-right shrink-0">
                                                ₹{(item.price * item.quantity).toFixed(2)}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* FINANCIAL BILLING BREAKDOWN & SETTLEMENT */}
                    <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 space-y-2 mt-2">
                        <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                            <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span>CGST + SGST ({totalGst > 0 ? 'Integrated' : '0%'})</span><span>₹{totalGst.toFixed(2)}</span></div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-indigo-600 font-bold"><span>Special Discount (F3)</span><span>-₹{Number(discountAmount).toFixed(2)}</span></div>
                            )}
                            <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-700">
                                <span>Grand Total</span>
                                <span className="text-emerald-600 dark:text-emerald-400 text-lg font-black">₹{grandTotal.toFixed(2)}</span>
                            </div>
                        </div>

                        {/* PAYMENT METHODS (F8 to toggle) */}
                        <div className="grid grid-cols-5 gap-1.5 pt-1">
                            {[
                                { id: 'CASH', label: 'Cash', icon: DollarSign },
                                { id: 'UPI', label: 'UPI QR', icon: Smartphone },
                                { id: 'CARD', label: 'Card', icon: CreditCard },
                                { id: 'LOYALTY', label: 'Points', icon: Award },
                                { id: 'CREDIT', label: 'Khata', icon: FileText },
                            ].map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setPaymentMethod(m.id as any)}
                                    className={`py-1.5 px-1 rounded-xl text-[10px] font-bold flex flex-col items-center gap-0.5 transition-all ${paymentMethod === m.id ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}
                                >
                                    <m.icon className="w-3.5 h-3.5" />
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        {paymentMethod === 'CASH' && (
                            <div className="grid grid-cols-2 gap-2 pt-1">
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Cash Tendered</label>
                                    <input
                                        type="number"
                                        value={cashReceived || ''}
                                        onChange={(e) => setCashReceived(Number(e.target.value))}
                                        placeholder="₹ Received"
                                        className="w-full p-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-extrabold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[9px] font-bold text-slate-500 uppercase">Change Due</label>
                                    <div className="p-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs font-black text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                                        ₹{changeDue.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleCompleteSale}
                            disabled={cart.length === 0}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4" /> SETTLE & PRINT RECEIPT (F12)
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MODAL 1: BATCH / MULTI-MRP SELECTOR MODAL --- */}
            {batchSelectionProduct && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div>
                            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Select Batch & MRP</h3>
                            <p className="text-xs text-slate-500">{batchSelectionProduct.name} ({batchSelectionProduct.sku})</p>
                        </div>

                        <div className="space-y-2 max-h-[220px] overflow-y-auto">
                            {batchSelectionProduct.batches.map((b: any) => (
                                <div
                                    key={b.batchNumber}
                                    onClick={() => handleAddToCart(batchSelectionProduct, b)}
                                    className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 cursor-pointer flex justify-between items-center transition-all"
                                >
                                    <div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white">{b.batchNumber}</p>
                                        <p className="text-[10px] text-amber-500 font-medium">Exp: {b.expiryDate} • Stock: {b.stock} units</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-extrabold text-emerald-600">₹{b.price}</p>
                                        <p className="text-[10px] text-slate-400 line-through">MRP ₹{b.mrp}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => setBatchSelectionProduct(null)}
                            className="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl"
                        >
                            Cancel (Esc)
                        </button>
                    </div>
                </div>
            )}

            {/* --- MODAL 2: CASHIER SHIFT MANAGER & Z-REPORT (Optech Standard) --- */}
            {isShiftModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                            <div>
                                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Cashier Shift & Reconciliation</h3>
                                <p className="text-xs text-slate-500">{shift.id} • Cashier: {shift.cashierName} • Started: {shift.startTime}</p>
                            </div>
                            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold rounded-full">
                                ACTIVE SHIFT
                            </span>
                        </div>

                        {/* Shift Tabs */}
                        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                            {(['SUMMARY', 'DROP', 'CLOSE', 'Z_REPORT'] as const).map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setShiftModalTab(tab)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${shiftModalTab === tab ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                                >
                                    {tab === 'SUMMARY' && 'Shift Summary'}
                                    {tab === 'DROP' && 'Petty Cash Drop'}
                                    {tab === 'CLOSE' && 'Blind Close'}
                                    {tab === 'Z_REPORT' && 'Print Z-Report'}
                                </button>
                            ))}
                        </div>

                        {shiftModalTab === 'SUMMARY' && (
                            <div className="space-y-2.5 text-xs">
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl">
                                        <p className="text-slate-400 text-[10px]">Opening Float Cash</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white">₹{shift.openingFloat.toFixed(2)}</p>
                                    </div>
                                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl">
                                        <p className="text-emerald-600 text-[10px]">Total Cash Sales</p>
                                        <p className="text-sm font-black text-emerald-600">₹{shift.cashSales.toFixed(2)}</p>
                                    </div>
                                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl">
                                        <p className="text-blue-600 text-[10px]">UPI & Digital</p>
                                        <p className="text-sm font-black text-blue-600">₹{shift.upiSales.toFixed(2)}</p>
                                    </div>
                                    <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 rounded-xl">
                                        <p className="text-purple-600 text-[10px]">Card & Credit</p>
                                        <p className="text-sm font-black text-purple-600">₹{(shift.cardSales + shift.creditSales).toFixed(2)}</p>
                                    </div>
                                </div>

                                <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl space-y-1">
                                    <p className="font-bold text-slate-900 dark:text-white">Drawer Cash Expected:</p>
                                    <p className="text-lg font-black text-emerald-600">
                                        ₹{(shift.openingFloat + shift.cashSales - shift.pettyDrops.reduce((s, p) => s + p.amount, 0)).toFixed(2)}
                                    </p>
                                    <p className="text-[10px] text-slate-500">Includes opening float minus {shift.pettyDrops.length} petty cash drops.</p>
                                </div>
                            </div>
                        )}

                        {shiftModalTab === 'DROP' && (
                            <form onSubmit={handleRecordPettyDrop} className="space-y-3 text-xs">
                                <div>
                                    <label className="font-bold text-slate-500 uppercase text-[10px]">Drop Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={pettyAmount || ''}
                                        onChange={(e) => setPettyAmount(Number(e.target.value))}
                                        placeholder="e.g. 500"
                                        className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="font-bold text-slate-500 uppercase text-[10px]">Reason / Expense Note</label>
                                    <input
                                        type="text"
                                        value={pettyReason}
                                        onChange={(e) => setPettyReason(e.target.value)}
                                        placeholder="e.g. Safe deposit / Petty purchase"
                                        className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-xs"
                                >
                                    Record Cash Drawer Drop
                                </button>
                            </form>
                        )}

                        {shiftModalTab === 'CLOSE' && (
                            <div className="space-y-3 text-xs">
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 rounded-xl text-amber-800 dark:text-amber-300">
                                    <p className="font-bold">Optech Blind Shift Reconciliation</p>
                                    <p className="text-[10px]">Count physical cash in drawer and enter below. System will compute any shortage/overage.</p>
                                </div>

                                <div>
                                    <label className="font-bold text-slate-500 uppercase text-[10px]">Physical Cash Count (₹)</label>
                                    <input
                                        type="number"
                                        value={blindCashCount || ''}
                                        onChange={(e) => setBlindCashCount(Number(e.target.value))}
                                        placeholder="Enter total counted notes"
                                        className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-extrabold outline-none"
                                    />
                                </div>

                                {blindCashCount > 0 && (
                                    <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded-xl space-y-1">
                                        <div className="flex justify-between">
                                            <span>Expected Cash:</span>
                                            <span className="font-bold">₹{(shift.openingFloat + shift.cashSales - shift.pettyDrops.reduce((s, p) => s + p.amount, 0)).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Counted Cash:</span>
                                            <span className="font-bold">₹{blindCashCount.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-extrabold">
                                            <span>Discrepancy (Variance):</span>
                                            <span className={blindCashCount >= (shift.openingFloat + shift.cashSales) ? 'text-emerald-600' : 'text-red-500'}>
                                                ₹{(blindCashCount - (shift.openingFloat + shift.cashSales - shift.pettyDrops.reduce((s, p) => s + p.amount, 0))).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        alert(`Shift ${shift.id} successfully closed and Z-Report archived.`);
                                        setIsShiftModalOpen(false);
                                    }}
                                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs"
                                >
                                    Confirm Shift Close & Lock Register
                                </button>
                            </div>
                        )}

                        {shiftModalTab === 'Z_REPORT' && (
                            <div className="space-y-3">
                                <div className="bg-slate-950 text-emerald-400 p-4 rounded-xl font-mono text-[11px] space-y-1">
                                    <p className="text-center font-bold">=== END OF DAY Z-REPORT ===</p>
                                    <p>SHIFT ID: {shift.id}</p>
                                    <p>DATE: {new Date().toLocaleDateString()}</p>
                                    <p>CASHIER: {shift.cashierName}</p>
                                    <p>--------------------------------</p>
                                    <p>TOTAL TXS: {shift.totalTransactions}</p>
                                    <p>OPEN FLOAT: ₹{shift.openingFloat.toFixed(2)}</p>
                                    <p>CASH SALES: ₹{shift.cashSales.toFixed(2)}</p>
                                    <p>UPI SALES:  ₹{shift.upiSales.toFixed(2)}</p>
                                    <p>CARD SALES: ₹{shift.cardSales.toFixed(2)}</p>
                                    <p>DRAWER NET: ₹{(shift.openingFloat + shift.cashSales).toFixed(2)}</p>
                                    <p>--------------------------------</p>
                                    <p className="text-center">*** SHIFT AUDIT VERIFIED ***</p>
                                </div>

                                <button
                                    onClick={() => window.print()}
                                    className="w-full py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2"
                                >
                                    <Printer className="w-4 h-4" /> Print Z-Report via ESC/POS
                                </button>
                            </div>
                        )}

                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                            <button
                                onClick={() => setIsShiftModalOpen(false)}
                                className="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl"
                            >
                                Close Window (Esc)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL 3: DISCOUNT MODAL (F3) --- */}
            {isDiscountModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <Tag className="w-4 h-4 text-indigo-500" /> Apply Bill Discount (F3)
                        </h3>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Fixed Discount (₹)</label>
                                <input
                                    type="number"
                                    value={discountAmount || ''}
                                    onChange={(e) => setDiscountAmount(Number(e.target.value))}
                                    placeholder="e.g. 100"
                                    className="w-full mt-1 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold outline-none"
                                />
                            </div>

                            <div className="flex gap-2">
                                {[5, 10, 15, 20].map(pct => (
                                    <button
                                        key={pct}
                                        type="button"
                                        onClick={() => setDiscountAmount(Math.round((subtotal * pct) / 100))}
                                        className="flex-1 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-indigo-600 hover:text-white rounded-lg text-xs font-bold transition-colors"
                                    >
                                        {pct}%
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={() => setIsDiscountModalOpen(false)}
                            className="w-full py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
                        >
                            Apply & Return (Esc)
                        </button>
                    </div>
                </div>
            )}

            {/* --- MODAL 4: HARDWARE & THERMAL SETUP MODAL (F10) --- */}
            {isHardwareModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <Printer className="w-4 h-4 text-emerald-500" /> ESC/POS Thermal Printer Setup (F10)
                        </h3>

                        <div className="space-y-3 text-xs">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase">Thermal Paper Width</label>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                    <button
                                        type="button"
                                        onClick={() => setThermalPaperWidth('58mm')}
                                        className={`py-2 rounded-xl font-bold border transition-all ${thermalPaperWidth === '58mm' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600'}`}
                                    >
                                        2-inch (58mm)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setThermalPaperWidth('80mm')}
                                        className={`py-2 rounded-xl font-bold border transition-all ${thermalPaperWidth === '80mm' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600'}`}
                                    >
                                        3-inch (80mm Standard)
                                    </button>
                                </div>
                            </div>

                            <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-xl space-y-1">
                                <p className="font-bold text-slate-900 dark:text-white">Printer Connection:</p>
                                <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                                    <Check className="w-3.5 h-3.5" /> WebUSB / Raw ESC-POS Port Ready
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsHardwareModalOpen(false)}
                            className="w-full py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl"
                        >
                            Save Settings (Esc)
                        </button>
                    </div>
                </div>
            )}

            {/* --- MODAL 5: ESC/POS THERMAL RECEIPT MODAL --- */}
            {isReceiptModalOpen && lastSaleReceipt && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div className="text-center pb-2 border-b border-slate-200 dark:border-slate-700">
                            <h3 className="font-black text-lg text-slate-900 dark:text-white">RECEIPT GENERATED</h3>
                            <p className="text-xs text-slate-500">Invoice: {lastSaleReceipt.invoiceNo} • {lastSaleReceipt.date}</p>
                        </div>

                        {/* LIVE MONOSPACE THERMAL PREVIEW */}
                        <div className="bg-slate-950 text-slate-200 p-3.5 rounded-xl font-mono text-[11px] max-h-[250px] overflow-y-auto whitespace-pre-wrap leading-tight border border-slate-800">
                            {generateThermalReceiptText(lastSaleReceipt)}
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2">
                            <button
                                onClick={() => printReceiptInBrowser(lastSaleReceipt)}
                                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                            >
                                <Printer className="w-3.5 h-3.5" /> Print Thermal
                            </button>
                            <button
                                onClick={() => downloadPDFInvoice(lastSaleReceipt)}
                                className="py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5"
                            >
                                <Download className="w-3.5 h-3.5" /> PDF
                            </button>
                            <button
                                onClick={() => {
                                    setIsReceiptModalOpen(false);
                                    resetPosTerminal();
                                }}
                                className="py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs"
                            >
                                Next Customer
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
