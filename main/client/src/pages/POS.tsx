import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
    ShoppingCart, QrCode, CreditCard, DollarSign, Smartphone, Award, Printer, RotateCcw,
    CheckCircle, Wifi, WifiOff, Maximize2, Minimize2, Search, Image as ImageIcon,
    Truck, UserCheck, Tag, Plus, Minus, Trash2, Download, Sparkles,
    Clock, FileText, User, RefreshCw, Key, Check,
    PauseCircle, PlayCircle, ArrowDown, ArrowUp, Edit3, X, Percent, Hash,
    ShoppingBag, Phone, ChevronRight
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createSale, getCustomers, createCustomer } from '../services/api';
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
    discountPercent?: number;
    category?: string;
    image?: string;
    batchNumber?: string;
    expiryDate?: string;
    unit?: string;
}

interface ParkedBill {
    id: string;
    label: string;
    parkedAt: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    items: CartItem[];
    discountAmount: number;
    isHomeDelivery: boolean;
    deliveryAddress?: string;
    deliveryCharge?: number;
    notes?: string;
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

    // --- Active Cart State ---
    const [cart, setCart] = useState<CartItem[]>([]);
    const [selectedItemIndex, setSelectedItemIndex] = useState<number>(0);

    // --- Parked Orders (Multi-Cart / Hold & Recall) ---
    const [parkedBills, setParkedBills] = useState<ParkedBill[]>(() => {
        try {
            const saved = localStorage.getItem('parked_orders');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });
    const [isParkedModalOpen, setIsParkedModalOpen] = useState(false);

    // Save parked bills to localStorage so other modules (e.g. Sales.tsx) can see them
    useEffect(() => {
        try {
            localStorage.setItem('parked_orders', JSON.stringify(parkedBills));
        } catch (e) {
            console.error('Failed to sync parked bills to storage', e);
        }
    }, [parkedBills]);

    // --- Input & Scanner State ---
    const [barcodeInput, setBarcodeInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const barcodeInputRef = useRef<HTMLInputElement>(null);
    const customerPhoneInputRef = useRef<HTMLInputElement>(null);
    const cashTenderInputRef = useRef<HTMLInputElement>(null);

    // --- View Modes: Supermarket Billing Table vs Touch POS Mode ---
    const [viewMode, setViewMode] = useState<'SUPERMARKET' | 'TOUCH_POS'>('SUPERMARKET');
    const [selectedSpeedKeyCategory, setSelectedSpeedKeyCategory] = useState('ALL');

    // --- Payment & Tender State ---
    const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'LOYALTY' | 'CREDIT'>('CASH');
    const [cashReceived, setCashReceived] = useState<number>(0);
    const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState<number>(0);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [offlineQueueCount, setOfflineQueueCount] = useState<number>(() => getOfflineQueue().length);
    const [isSyncingOffline, setIsSyncingOffline] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

    // --- Salesperson & Hardware Preferences ---
    const [salesperson, setSalesperson] = useState('Rajesh Kumar (Counter 1)');
    const [thermalPaperWidth, setThermalPaperWidth] = useState<'58mm' | '80mm'>('80mm');
    const [isHardwareModalOpen, setIsHardwareModalOpen] = useState(false);
    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [discountAmount, setDiscountAmount] = useState<number>(0);

    // --- Inline Quick Edit Modal (F2/F3/F4) ---
    const [editModal, setEditModal] = useState<{
        isOpen: boolean;
        type: 'QTY' | 'RATE' | 'DISC';
        itemIndex: number;
        value: string;
    }>({ isOpen: false, type: 'QTY', itemIndex: 0, value: '' });

    // --- UPI Dynamic QR Modal ---
    const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);

    // --- Cashier Shift State ---
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
    const [customerPhone, setCustomerPhone] = useState('9876543210');
    const [customerName, setCustomerName] = useState('Rahul Verma');
    const [customerEmail, setCustomerEmail] = useState('rahul.verma@gmail.com');
    const [customerLoyaltyBalance, setCustomerLoyaltyBalance] = useState(250);
    const [isRepeatCustomer, setIsRepeatCustomer] = useState(true);
    const [customerVisitCount, setCustomerVisitCount] = useState(6);
    const [isHomeDelivery, setIsHomeDelivery] = useState(false);
    const [deliveryAddress, setDeliveryAddress] = useState('Plot 88, Sunrise Towers, Andheri East');
    const [deliveryCharge, setDeliveryCharge] = useState<number>(50);

    // --- Multi-MRP / Batch Selection Modal State ---
    const [batchSelectionProduct, setBatchSelectionProduct] = useState<any>(null);

    // --- Live Clock ---
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Demo commodities with Multi-MRP & Batches
    const demoCommodities = [
        {
            id: 'c1', sku: 'GRO-001', name: 'Organic Basmati Rice 5kg', price: 650, mrp: 720, gstPercentage: 5, category: 'Groceries',
            batches: [
                { batchNumber: 'BATCH-2026-R01', mrp: 720, price: 650, expiryDate: '2027-06-30', stock: 80 },
                { batchNumber: 'BATCH-2026-R02', mrp: 750, price: 680, expiryDate: '2027-09-30', stock: 40 }
            ],
            batchNumber: 'BATCH-2026-R01', expiryDate: '2027-06-30', stockQuantity: 120, unit: 'Bag',
            image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&q=80'
        },
        {
            id: 'c2', sku: 'ELE-102', name: 'Wireless Noise Cancelling Earbuds', price: 2499, mrp: 3999, gstPercentage: 18, category: 'Electronics',
            batchNumber: 'BATCH-2026-E12', expiryDate: '2028-12-31', stockQuantity: 45, unit: 'Pcs',
            image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&q=80'
        },
        {
            id: 'c3', sku: 'APP-204', name: 'Premium Cotton Polo T-Shirt', price: 899, mrp: 1299, gstPercentage: 12, category: 'Apparel',
            batchNumber: 'BATCH-2026-A04', expiryDate: 'N/A', stockQuantity: 80, unit: 'Pcs',
            image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=300&q=80'
        },
        {
            id: 'c4', sku: 'BEV-301', name: 'Natural Sparkling Juice 330ml', price: 150, mrp: 160, gstPercentage: 18, category: 'Beverages',
            batches: [
                { batchNumber: 'BATCH-2026-B88', mrp: 160, price: 150, expiryDate: '2026-11-15', stock: 120 },
                { batchNumber: 'BATCH-2026-B92', mrp: 165, price: 155, expiryDate: '2027-02-15', stock: 80 }
            ],
            batchNumber: 'BATCH-2026-B88', expiryDate: '2026-11-15', stockQuantity: 200, unit: 'Can',
            image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=300&q=80'
        },
        {
            id: 'c5', sku: 'PRO-409', name: 'Fresh Farm Mangoes 1kg', price: 350, mrp: 380, gstPercentage: 0, category: 'Produce',
            batchNumber: 'BATCH-2026-F09', expiryDate: '2026-08-05', stockQuantity: 30, unit: 'Kg',
            image: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&q=80'
        },
        {
            id: 'c6', sku: 'HAR-512', name: 'Cordless Power Drill Tool Pack', price: 3899, mrp: 4999, gstPercentage: 18, category: 'Hardware',
            batchNumber: 'BATCH-2026-H55', expiryDate: '2029-01-01', stockQuantity: 15, unit: 'Pack',
            image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=300&q=80'
        },
        {
            id: 'c7', sku: 'BAK-601', name: 'Artisanal Whole Wheat Bread', price: 90, mrp: 95, gstPercentage: 5, category: 'Bakery & Dairy',
            batchNumber: 'BATCH-2026-BK1', expiryDate: '2026-07-29', stockQuantity: 50, unit: 'Loaf',
            image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80'
        },
        {
            id: 'c8', sku: 'PHA-702', name: 'Multivitamin Health Supplements', price: 499, mrp: 599, gstPercentage: 12, category: 'Pharmacy',
            batchNumber: 'BATCH-2026-PH9', expiryDate: '2027-10-20', stockQuantity: 90, unit: 'Bottle',
            image: 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&q=80'
        },
        // Standard Quick Items (Speed Keys)
        { id: 'sk1', sku: 'BAG-SM', name: 'Bio Carry Bag Small', price: 5, mrp: 5, gstPercentage: 18, category: 'Bags', stockQuantity: 1000, unit: 'Pcs' },
        { id: 'sk2', sku: 'BAG-MD', name: 'Bio Carry Bag Large', price: 10, mrp: 10, gstPercentage: 18, category: 'Bags', stockQuantity: 1000, unit: 'Pcs' },
        { id: 'sk3', sku: 'PRO-BAN', name: 'Fresh Cavendish Bananas 1kg', price: 60, mrp: 65, gstPercentage: 0, category: 'Produce', stockQuantity: 150, unit: 'Kg' },
        { id: 'sk4', sku: 'PRO-TOM', name: 'Fresh Hybrid Tomatoes 1kg', price: 40, mrp: 45, gstPercentage: 0, category: 'Produce', stockQuantity: 100, unit: 'Kg' },
        { id: 'sk5', sku: 'PRO-POT', name: 'Farm Fresh Potatoes 1kg', price: 35, mrp: 40, gstPercentage: 0, category: 'Produce', stockQuantity: 200, unit: 'Kg' },
        { id: 'sk6', sku: 'DAI-MLK', name: 'Standard Toned Milk 500ml', price: 33, mrp: 33, gstPercentage: 0, category: 'Bakery & Dairy', stockQuantity: 80, unit: 'Pkt' },
        { id: 'sk7', sku: 'DAI-CURD', name: 'Fresh Curd Dahi 400g', price: 45, mrp: 45, gstPercentage: 0, category: 'Bakery & Dairy', stockQuantity: 60, unit: 'Tub' },
        { id: 'sk8', sku: 'BEV-WTR', name: 'Mineral Water Chilled 1L', price: 20, mrp: 20, gstPercentage: 18, category: 'Beverages', stockQuantity: 150, unit: 'Btl' }
    ];

    const displayProducts = useMemo(() => {
        return products.length > 0 ? products : demoCommodities;
    }, [products]);

    // Live search suggestions
    const searchSuggestions = useMemo(() => {
        if (!searchQuery.trim()) return [];
        const q = searchQuery.toLowerCase().trim();
        return displayProducts.filter(p =>
            p.name?.toLowerCase().includes(q) ||
            p.sku?.toLowerCase().includes(q)
        ).slice(0, 6);
    }, [searchQuery, displayProducts]);

    // Filter products for Speed Keys panel
    const speedKeyCategories = ['ALL', 'Bags', 'Produce', 'Bakery & Dairy', 'Beverages', 'Groceries', 'Electronics'];
    const filteredSpeedKeyProducts = useMemo(() => {
        return displayProducts.filter(p => {
            const cat = p.category?.name || p.category || 'General';
            return selectedSpeedKeyCategory === 'ALL' || cat === selectedSpeedKeyCategory;
        });
    }, [displayProducts, selectedSpeedKeyCategory]);

    // Focus scanner on initial mount
    useEffect(() => {
        barcodeInputRef.current?.focus();
    }, []);

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

    // --- Customer Lookup by Phone ---
    const handleCustomerPhoneLookup = async (phoneToLookup: string) => {
        const clean = phoneToLookup.trim();
        if (clean.length < 5) return;

        try {
            const res = await getCustomers();
            const list = res.data || [];
            const match = list.find((c: any) => c.phone?.replace(/\D/g, '').includes(clean.replace(/\D/g, '')));
            if (match) {
                setCustomerName(match.name);
                setCustomerPhone(match.phone);
                setCustomerEmail(match.email || '');
                setCustomerLoyaltyBalance(match.loyaltyPoints || 300);
                setIsRepeatCustomer(true);
                setCustomerVisitCount((match.orderCount || 4) + 1);
                return;
            }
        } catch (e) {
            // fallback to demo data match
        }

        if (clean === '9876543210' || clean.includes('98765')) {
            setCustomerName('Rahul Verma');
            setCustomerLoyaltyBalance(250);
            setIsRepeatCustomer(true);
            setCustomerVisitCount(6);
        } else if (clean.length === 10) {
            // New customer quick-detection
            setCustomerName('Walk-in Customer');
            setCustomerLoyaltyBalance(0);
            setIsRepeatCustomer(false);
        }
    };

    // --- Add to Cart with Multiplier Support ---
    const handleAddToCart = (product: any, selectedBatch?: any, qtyMultiplier: number = 1) => {
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
            updated = cart.map((item, idx) =>
                idx === existingIndex
                    ? { ...item, quantity: item.quantity + qtyMultiplier }
                    : item
            );
            setSelectedItemIndex(existingIndex);
        } else {
            const newItem: CartItem = {
                id: product.id,
                name: product.name,
                sku: product.sku,
                price: Number(batch.price || product.price),
                mrp: Number(batch.mrp || product.mrp || product.price),
                gstPercentage: Number(product.gstPercentage ?? 18),
                category: product.category?.name || product.category || 'General',
                batchNumber: batch.batchNumber,
                expiryDate: batch.expiryDate,
                unit: product.unit || 'Pcs',
                discountPercent: 0,
                quantity: qtyMultiplier
            };
            updated = [newItem, ...cart]; // New items at top of grid for immediate visibility
            setSelectedItemIndex(0);
        }

        setCart(updated);
        setBatchSelectionProduct(null);
        setSearchQuery('');
        setShowSuggestions(false);
        barcodeInputRef.current?.focus();
    };

    // --- Smart Barcode Multiplier Input Handler ---
    // Syntax: "3*GRO-001" or "5*102" or direct SKU "GRO-001"
    const handleBarcodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const raw = barcodeInput.trim();
        if (!raw) return;

        let multiplier = 1;
        let query = raw;

        const starMatch = raw.match(/^(\d+)\s*\*\s*(.+)$/);
        if (starMatch) {
            multiplier = Math.max(1, parseInt(starMatch[1], 10));
            query = starMatch[2].trim();
        }

        // Match by exact SKU, partial SKU, or name
        const cleanQuery = query.toLowerCase();
        let found = displayProducts.find(p => p.sku?.toLowerCase() === cleanQuery);
        if (!found) {
            found = displayProducts.find(p => p.sku?.toLowerCase().includes(cleanQuery));
        }
        if (!found) {
            found = displayProducts.find(p => p.name?.toLowerCase().includes(cleanQuery));
        }

        if (found) {
            handleAddToCart(found, undefined, multiplier);
            setBarcodeInput('');
        } else {
            alert(`Item code "${query}" not recognized in catalog.`);
        }
    };

    // Update quantity
    const updateQuantity = (index: number, delta: number) => {
        setCart(prev => {
            const item = prev[index];
            if (!item) return prev;
            const newQty = item.quantity + delta;
            if (newQty <= 0) {
                return prev.filter((_, idx) => idx !== index);
            }
            return prev.map((itm, idx) => idx === index ? { ...itm, quantity: newQty } : itm);
        });
    };

    // Delete item line
    const removeCartItem = (index: number) => {
        setCart(prev => prev.filter((_, idx) => idx !== index));
        setSelectedItemIndex(prev => Math.max(0, prev - 1));
    };

    // Inline edit confirm
    const handleConfirmInlineEdit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const val = parseFloat(editModal.value);
        if (isNaN(val) || val < 0) return setEditModal(prev => ({ ...prev, isOpen: false }));

        setCart(prev => prev.map((item, idx) => {
            if (idx !== editModal.itemIndex) return item;
            if (editModal.type === 'QTY') {
                return { ...item, quantity: Math.max(1, Math.round(val)) };
            }
            if (editModal.type === 'RATE') {
                return { ...item, price: val };
            }
            if (editModal.type === 'DISC') {
                return { ...item, discountPercent: Math.min(100, Math.max(0, val)) };
            }
            return item;
        }));

        setEditModal({ isOpen: false, type: 'QTY', itemIndex: 0, value: '' });
        barcodeInputRef.current?.focus();
    };

    // --- PARK BILL (Hold Order) ---
    const handleParkCurrentBill = () => {
        if (cart.length === 0) {
            alert('Cannot park an empty cart! Scan items first.');
            return;
        }

        const newParkedBill: ParkedBill = {
            id: `PARK-${Date.now().toString().slice(-5)}`,
            label: customerName ? `${customerName} (${cart.length} items)` : `Customer #${parkedBills.length + 1}`,
            parkedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            customerName: customerName || 'Walk-in Customer',
            customerPhone: customerPhone || '',
            customerEmail: customerEmail || '',
            items: [...cart],
            discountAmount,
            isHomeDelivery,
            deliveryAddress,
            deliveryCharge
        };

        const updated = [newParkedBill, ...parkedBills];
        setParkedBills(updated);

        // Reset current counter for next customer immediately
        setCart([]);
        setDiscountAmount(0);
        setLoyaltyPointsToRedeem(0);
        setCashReceived(0);
        setCustomerName('Walk-in Customer');
        setCustomerPhone('');
        setCustomerLoyaltyBalance(0);
        setBarcodeInput('');
        barcodeInputRef.current?.focus();

        alert(`Bill "${newParkedBill.label}" PARKED successfully. Ready for next customer.`);
    };

    // --- RECALL PARKED BILL ---
    const handleRecallParkedBill = (parkedId: string) => {
        const found = parkedBills.find(p => p.id === parkedId);
        if (!found) return;

        // If current cart has items, warn or auto-park current cart
        if (cart.length > 0) {
            const confirmSwitch = window.confirm('Current bill has items. Would you like to park current bill before recalling?');
            if (confirmSwitch) {
                handleParkCurrentBill();
            }
        }

        setCart(found.items);
        setCustomerName(found.customerName);
        setCustomerPhone(found.customerPhone);
        setCustomerEmail(found.customerEmail || '');
        setDiscountAmount(found.discountAmount || 0);
        setIsHomeDelivery(found.isHomeDelivery || false);
        setDeliveryAddress(found.deliveryAddress || '');
        setDeliveryCharge(found.deliveryCharge || 50);

        // Remove from parked bills
        setParkedBills(prev => prev.filter(p => p.id !== parkedId));
        setIsParkedModalOpen(false);
        barcodeInputRef.current?.focus();
    };

    const handleDiscardParkedBill = (parkedId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm('Delete this parked order permanently?')) {
            setParkedBills(prev => prev.filter(p => p.id !== parkedId));
        }
    };

    // Financial calculations
    const subtotal = cart.reduce((sum, item) => {
        const linePrice = item.price * (1 - (item.discountPercent || 0) / 100);
        return sum + (linePrice * item.quantity);
    }, 0);

    const totalGst = cart.reduce((sum, item) => {
        const linePrice = item.price * (1 - (item.discountPercent || 0) / 100);
        return sum + (linePrice * item.quantity * (item.gstPercentage / 100));
    }, 0);

    const cgst = totalGst / 2;
    const sgst = totalGst / 2;
    const loyaltyDiscount = loyaltyPointsToRedeem;
    const deliveryFee = isHomeDelivery ? Number(deliveryCharge || 0) : 0;
    const grandTotalExact = subtotal + totalGst + deliveryFee - loyaltyDiscount - Number(discountAmount || 0);
    const roundOff = Math.round(grandTotalExact) - grandTotalExact;
    const grandTotal = Math.max(0, Math.round(grandTotalExact));
    const changeDue = Math.max(0, cashReceived - grandTotal);
    const totalUnits = cart.reduce((s, c) => s + c.quantity, 0);

    // --- Complete Sale Flow ---
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
            customerName: customerName || 'Walk-in Customer',
            customerPhone: customerPhone || 'N/A',
            items: cart.map(c => ({
                name: c.name,
                quantity: c.quantity,
                price: c.price * (1 - (c.discountPercent || 0) / 100),
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

    const resetPosTerminal = () => {
        setCart([]);
        setBarcodeInput('');
        setSearchQuery('');
        setCashReceived(0);
        setLoyaltyPointsToRedeem(0);
        setDiscountAmount(0);
        setIsHomeDelivery(false);
        setCustomerName('Walk-in Customer');
        setCustomerPhone('');
        setCustomerLoyaltyBalance(0);
        barcodeInputRef.current?.focus();
        if (typeof refreshData === 'function') {
            refreshData('sales');
        }
    };

    // --- KEYBOARD SHORTCUTS ENGINE (F1 - F12) ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Function keys override
            if (['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'].includes(e.key)) {
                e.preventDefault();
            }

            switch (e.key) {
                case 'F1': // Focus Scanner
                    barcodeInputRef.current?.focus();
                    break;
                case 'F2': // Edit Quantity of selected item
                    if (cart.length > 0 && cart[selectedItemIndex]) {
                        setEditModal({
                            isOpen: true,
                            type: 'QTY',
                            itemIndex: selectedItemIndex,
                            value: cart[selectedItemIndex].quantity.toString()
                        });
                    }
                    break;
                case 'F3': // Edit Rate of selected item
                    if (cart.length > 0 && cart[selectedItemIndex]) {
                        setEditModal({
                            isOpen: true,
                            type: 'RATE',
                            itemIndex: selectedItemIndex,
                            value: cart[selectedItemIndex].price.toString()
                        });
                    }
                    break;
                case 'F4': // Edit Item Discount %
                    if (cart.length > 0 && cart[selectedItemIndex]) {
                        setEditModal({
                            isOpen: true,
                            type: 'DISC',
                            itemIndex: selectedItemIndex,
                            value: (cart[selectedItemIndex].discountPercent || 0).toString()
                        });
                    }
                    break;
                case 'F5': // Bill Discount Modal
                    setIsDiscountModalOpen(true);
                    break;
                case 'F6': // Focus Customer Phone
                    customerPhoneInputRef.current?.focus();
                    break;
                case 'F7': // Park / Hold Bill
                    handleParkCurrentBill();
                    break;
                case 'F8': // Recall Parked Bill
                    setIsParkedModalOpen(true);
                    break;
                case 'F9': // Card Payment Mode
                    setPaymentMethod('CARD');
                    break;
                case 'F10': // Cash Payment Mode & Focus Tender
                    setPaymentMethod('CASH');
                    cashTenderInputRef.current?.focus();
                    break;
                case 'F11': // UPI QR Mode & Modal
                    setPaymentMethod('UPI');
                    setIsUpiModalOpen(true);
                    break;
                case 'F12': // Settle Bill & Print
                    if (cart.length > 0) handleCompleteSale();
                    break;
                case 'Delete':
                case 'Backspace':
                    // Void item only when not typing inside an input field
                    if (
                        document.activeElement?.tagName !== 'INPUT' &&
                        document.activeElement?.tagName !== 'TEXTAREA' &&
                        cart.length > 0
                    ) {
                        e.preventDefault();
                        removeCartItem(selectedItemIndex);
                    }
                    break;
                case 'ArrowDown':
                    if (
                        document.activeElement?.tagName !== 'INPUT' &&
                        cart.length > 0
                    ) {
                        e.preventDefault();
                        setSelectedItemIndex(prev => Math.min(cart.length - 1, prev + 1));
                    }
                    break;
                case 'ArrowUp':
                    if (
                        document.activeElement?.tagName !== 'INPUT' &&
                        cart.length > 0
                    ) {
                        e.preventDefault();
                        setSelectedItemIndex(prev => Math.max(0, prev - 1));
                    }
                    break;
                case 'Escape':
                    setIsReceiptModalOpen(false);
                    setIsShiftModalOpen(false);
                    setIsHardwareModalOpen(false);
                    setIsDiscountModalOpen(false);
                    setIsParkedModalOpen(false);
                    setIsUpiModalOpen(false);
                    setBatchSelectionProduct(null);
                    setEditModal(prev => ({ ...prev, isOpen: false }));
                    barcodeInputRef.current?.focus();
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart, selectedItemIndex, paymentMethod, parkedBills, customerName, customerPhone]);

    const downloadPDFInvoice = (receipt: ReceiptData) => {
        const doc = new jsPDF() as any;
        const pageWidth = doc.internal.pageSize.getWidth();
        const rightMargin = 15;

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
        doc.text("CUSTOMER DETAILS:", 15, 48);
        doc.setFont("helvetica", "normal");
        doc.text(`${receipt.customerName || 'Walk-in'} (${receipt.customerPhone || 'N/A'})`, 15, 54);

        const tableData = receipt.items.map((item, idx) => [
            idx + 1,
            `${item.name} [${item.batchNumber || 'STD'}]`,
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
        <div className={`pos-terminal-container font-['Outfit'] select-none ${isFullscreen ? 'fixed inset-0 z-[99999] bg-slate-950 text-white p-3 overflow-y-auto' : 'space-y-3'}`}>

            {/* --- TOP COUNTER STRIP & COCKPIT CONTROLS --- */}
            <div className="bg-slate-900 text-slate-100 px-4 py-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-lg border border-slate-800">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-500/20">
                        <ShoppingCart className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-black text-sm tracking-wide text-white">StoreAI RETAIL POS</span>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-[10px] border border-emerald-500/30">
                                COUNTER #01
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium">
                            Cashier: <span className="text-white font-semibold">{shift.cashierName}</span> • Shift: {shift.id} • {currentTime}
                        </p>
                    </div>
                </div>

                {/* Center / Right Control Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* View Mode Toggle: Supermarket Table vs Touch POS */}
                    <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 text-xs">
                        <button
                            onClick={() => setViewMode('SUPERMARKET')}
                            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${viewMode === 'SUPERMARKET' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            <Hash className="w-3.5 h-3.5" /> High-Speed Grid
                        </button>
                        <button
                            onClick={() => setViewMode('TOUCH_POS')}
                            className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${viewMode === 'TOUCH_POS' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                        >
                            <ShoppingBag className="w-3.5 h-3.5" /> Touch Speed Keys
                        </button>
                    </div>

                    {/* Parked Orders Badge & Recall Button (F8) */}
                    <button
                        onClick={() => setIsParkedModalOpen(true)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all border ${parkedBills.length > 0
                            ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 animate-pulse'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'}`}
                    >
                        <PauseCircle className="w-3.5 h-3.5" />
                        PARKED: {parkedBills.length} (F8)
                    </button>

                    {/* Hold Current Bill Button (F7) */}
                    <button
                        onClick={handleParkCurrentBill}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                        <Plus className="w-3.5 h-3.5 text-emerald-400" />
                        Hold Bill (F7)
                    </button>

                    {/* Offline / Online indicator */}
                    <button
                        onClick={() => setIsOnline(!isOnline)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border ${isOnline
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-amber-950 text-amber-300 border-amber-800'}`}
                    >
                        {isOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-amber-400" />}
                        {isOnline ? 'Online' : 'Offline'}
                    </button>

                    {offlineQueueCount > 0 && (
                        <button
                            onClick={triggerOfflineSync}
                            disabled={isSyncingOffline || !isOnline}
                            className="bg-amber-500 text-slate-950 font-bold px-2 py-1 rounded-xl text-[10px] flex items-center gap-1"
                        >
                            <RefreshCw className={`w-3 h-3 ${isSyncingOffline ? 'animate-spin' : ''}`} />
                            Sync ({offlineQueueCount})
                        </button>
                    )}

                    {/* Fullscreen & Reset */}
                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700"
                        title="Toggle Fullscreen"
                    >
                        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={resetPosTerminal}
                        className="px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold flex items-center gap-1"
                        title="Clear current cart"
                    >
                        <RotateCcw className="w-3 h-3" /> Clear
                    </button>
                </div>
            </div>

            {/* --- CUSTOMER QUICK STRIP (F6) --- */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3 flex-1 min-w-[280px]">
                    <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300 uppercase shrink-0">
                        <UserCheck className="w-4 h-4 text-emerald-500" />
                        Cust (F6):
                    </div>
                    <div className="relative flex-1 max-w-[200px]">
                        <Phone className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                        <input
                            ref={customerPhoneInputRef}
                            type="text"
                            value={customerPhone}
                            onChange={(e) => {
                                setCustomerPhone(e.target.value);
                                handleCustomerPhoneLookup(e.target.value);
                            }}
                            placeholder="Mobile # (F6)"
                            className="w-full pl-8 pr-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>
                    <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Customer Name"
                        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none max-w-[180px]"
                    />

                    {isRepeatCustomer && (
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 text-[10px] font-extrabold border border-indigo-200 dark:border-indigo-800 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-indigo-500" />
                            Visit #{customerVisitCount}
                        </span>
                    )}
                </div>

                {/* Loyalty Redemption & Delivery Controls */}
                <div className="flex items-center gap-3 shrink-0">
                    {customerLoyaltyBalance > 0 && (
                        <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2.5 py-1 rounded-xl">
                            <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span className="text-xs font-bold text-amber-900 dark:text-amber-200">
                                Pts: {customerLoyaltyBalance} (₹{customerLoyaltyBalance})
                            </span>
                            <button
                                onClick={() => {
                                    if (loyaltyPointsToRedeem > 0) {
                                        setLoyaltyPointsToRedeem(0);
                                    } else {
                                        setLoyaltyPointsToRedeem(Math.min(customerLoyaltyBalance, subtotal));
                                    }
                                }}
                                className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-colors ${loyaltyPointsToRedeem > 0
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 hover:bg-amber-300'}`}
                            >
                                {loyaltyPointsToRedeem > 0 ? 'Applied' : 'Redeem'}
                            </button>
                        </div>
                    )}

                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isHomeDelivery}
                            onChange={(e) => setIsHomeDelivery(e.target.checked)}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <Truck className="w-3.5 h-3.5 text-emerald-500" /> Delivery (+₹{deliveryCharge})
                    </label>

                    <button
                        onClick={() => setIsShiftModalOpen(true)}
                        className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1"
                    >
                        <Clock className="w-3 h-3 text-slate-400" /> Shift (F9)
                    </button>
                </div>
            </div>

            {/* --- PRIMARY SCANNER & MULTIPLIER BAR (F1) --- */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 shadow-sm">
                <form onSubmit={handleBarcodeSubmit} className="flex items-center gap-2 relative">
                    <div className="relative flex-1">
                        <QrCode className="w-5 h-5 absolute left-3.5 top-3 text-emerald-500" />
                        <input
                            ref={barcodeInputRef}
                            type="text"
                            value={barcodeInput}
                            onChange={(e) => {
                                setBarcodeInput(e.target.value);
                                setSearchQuery(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setShowSuggestions(true)}
                            placeholder="Scan Barcode (F1) or Multiplier (e.g. 3*GRO-001 or 5*102) & press Enter..."
                            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-extrabold text-slate-900 dark:text-white placeholder-slate-400 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />

                        {/* Search Autocomplete Suggestions Dropdown */}
                        {showSuggestions && searchSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                                {searchSuggestions.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => {
                                            handleAddToCart(item);
                                            setBarcodeInput('');
                                            setShowSuggestions(false);
                                        }}
                                        className="p-2.5 flex items-center justify-between hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer transition-colors"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <span className="font-mono text-xs font-extrabold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                                                {item.sku}
                                            </span>
                                            <div>
                                                <p className="text-xs font-bold text-slate-900 dark:text-white">{item.name}</p>
                                                <p className="text-[10px] text-slate-400">{item.category?.name || item.category} • Stock: {item.stockQuantity ?? 50} {item.unit || 'units'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">₹{item.price}</span>
                                            {item.mrp && item.mrp > item.price && (
                                                <span className="text-[10px] text-slate-400 line-through ml-1.5">MRP ₹{item.mrp}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-emerald-600/20 flex items-center gap-1.5 shrink-0"
                    >
                        <Plus className="w-4 h-4" /> Add Item
                    </button>
                </form>
            </div>

            {/* --- MAIN BILLING COCKPIT (TABLE + TENDER / SPEED KEYS) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">

                {/* LEFT: HIGH-SPEED BILLING GRID (7 OR 8 COLS) */}
                <div className={`${viewMode === 'TOUCH_POS' ? 'lg:col-span-7' : 'lg:col-span-8'} bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 flex flex-col justify-between shadow-sm min-w-0`}>
                    <div className="space-y-2">
                        {/* Table Header Controls */}
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                    <Hash className="w-3.5 h-3.5 text-emerald-500" />
                                    BILLING GRID ({cart.length} Lines • {totalUnits} Units)
                                </span>
                                {cart.length > 0 && (
                                    <span className="text-[10px] text-slate-400 font-mono">
                                        Use ↑↓ arrows to select, Del to void, F2 to change qty
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                                <button
                                    onClick={() => setIsDiscountModalOpen(true)}
                                    className="px-2 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-1 text-[11px]"
                                >
                                    <Tag className="w-3 h-3" /> Bill Disc (F5)
                                </button>
                            </div>
                        </div>

                        {/* HIGH-DENSITY SUPERMARKET TABLE */}
                        <div className="overflow-x-auto max-h-[380px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
                            <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px]">
                                        <th className="py-2 px-2 w-8 text-center">#</th>
                                        <th className="py-2 px-2">Code</th>
                                        <th className="py-2 px-3">Item Description</th>
                                        <th className="py-2 px-2">Batch/Exp</th>
                                        <th className="py-2 px-2 text-right">MRP</th>
                                        <th className="py-2 px-2 text-right">Rate (₹)</th>
                                        <th className="py-2 px-3 text-center">Qty</th>
                                        <th className="py-2 px-2 text-right">Disc%</th>
                                        <th className="py-2 px-2 text-right">GST%</th>
                                        <th className="py-2 px-3 text-right">Amount (₹)</th>
                                        <th className="py-2 px-2 text-center w-8">Void</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                                    {cart.length === 0 ? (
                                        <tr>
                                            <td colSpan={11} className="text-center py-16 text-slate-400">
                                                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-500" />
                                                <p className="font-bold text-xs">Bill is empty. Scan barcode (F1) or type multiplier (e.g. 3*GRO-001).</p>
                                                <p className="text-[11px] text-slate-400 mt-1">Press F7 to Hold, F8 to Recall parked bills, F10 for Cash.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        cart.map((item, idx) => {
                                            const isSelected = selectedItemIndex === idx;
                                            const linePrice = item.price * (1 - (item.discountPercent || 0) / 100);
                                            const lineTotal = linePrice * item.quantity;

                                            return (
                                                <tr
                                                    key={`${item.id}-${item.batchNumber}-${idx}`}
                                                    onClick={() => setSelectedItemIndex(idx)}
                                                    className={`cursor-pointer transition-colors ${isSelected
                                                        ? 'bg-emerald-500/10 dark:bg-emerald-500/20 font-bold border-l-4 border-emerald-500'
                                                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'}`}
                                                >
                                                    <td className="py-2.5 px-2 text-center font-mono text-[11px] text-slate-400">
                                                        {idx + 1}
                                                    </td>
                                                    <td className="py-2.5 px-2 font-mono font-bold text-[11px] text-slate-600 dark:text-slate-400">
                                                        {item.sku}
                                                    </td>
                                                    <td className="py-2.5 px-3">
                                                        <div className="font-bold text-slate-900 dark:text-white leading-tight">
                                                            {item.name}
                                                        </div>
                                                        <span className="text-[9px] text-slate-400">{item.category} • {item.unit || 'Pcs'}</span>
                                                    </td>
                                                    <td className="py-2.5 px-2 font-mono text-[10px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                        {item.batchNumber || 'STD'}
                                                        {item.expiryDate && item.expiryDate !== 'N/A' && (
                                                            <span className="block text-[9px] text-amber-500">Exp: {item.expiryDate}</span>
                                                        )}
                                                    </td>
                                                    <td className="py-2.5 px-2 text-right text-slate-400 line-through text-[11px]">
                                                        {item.mrp ? `₹${item.mrp}` : '-'}
                                                    </td>
                                                    <td className="py-2.5 px-2 text-right font-bold text-slate-800 dark:text-slate-200">
                                                        <span
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditModal({ isOpen: true, type: 'RATE', itemIndex: idx, value: item.price.toString() });
                                                            }}
                                                            className="hover:underline hover:text-emerald-600 cursor-pointer"
                                                            title="Click to edit rate (F3)"
                                                        >
                                                            ₹{item.price.toFixed(2)}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); updateQuantity(idx, -1); }}
                                                                className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center text-xs"
                                                            >
                                                                -
                                                            </button>
                                                            <span
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditModal({ isOpen: true, type: 'QTY', itemIndex: idx, value: item.quantity.toString() });
                                                                }}
                                                                className="w-8 text-center font-black text-xs text-slate-900 dark:text-white hover:underline cursor-pointer"
                                                                title="Click to edit qty (F2)"
                                                            >
                                                                {item.quantity}
                                                            </span>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); updateQuantity(idx, 1); }}
                                                                className="w-5 h-5 rounded bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 font-bold flex items-center justify-center text-xs"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="py-2.5 px-2 text-right">
                                                        <span
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditModal({ isOpen: true, type: 'DISC', itemIndex: idx, value: (item.discountPercent || 0).toString() });
                                                            }}
                                                            className="hover:underline hover:text-indigo-600 cursor-pointer text-[11px] font-bold text-slate-600 dark:text-slate-300"
                                                            title="Click to edit discount (F4)"
                                                        >
                                                            {item.discountPercent ? `${item.discountPercent}%` : '0%'}
                                                        </span>
                                                    </td>
                                                    <td className="py-2.5 px-2 text-right font-mono text-[11px] text-slate-500">
                                                        {item.gstPercentage}%
                                                    </td>
                                                    <td className="py-2.5 px-3 text-right font-black text-xs text-slate-900 dark:text-white">
                                                        ₹{lineTotal.toFixed(2)}
                                                    </td>
                                                    <td className="py-2.5 px-2 text-center">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); removeCartItem(idx); }}
                                                            className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                                                            title="Void item (Del)"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Table Footer Line Summary */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-3 font-semibold">
                            <span>Lines: <strong className="text-slate-900 dark:text-white">{cart.length}</strong></span>
                            <span>Total Qty: <strong className="text-slate-900 dark:text-white">{totalUnits}</strong></span>
                            {subtotal > 0 && (
                                <span>Gross: <strong className="text-slate-900 dark:text-white">₹{subtotal.toFixed(2)}</strong></span>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-400 font-mono">F2: Qty • F3: Price • F4: Item Disc • Del: Void</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT/CENTER: TOUCH SPEED KEYS (ONLY VISIBLE IN TOUCH POS MODE) */}
                {viewMode === 'TOUCH_POS' && (
                    <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 flex flex-col justify-between shadow-sm min-w-0">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase flex items-center gap-1.5">
                                    <ShoppingBag className="w-3.5 h-3.5 text-amber-500" /> Speed Keys (Touch Tiles)
                                </span>
                            </div>

                            {/* Speed Key Categories */}
                            <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                                {speedKeyCategories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setSelectedSpeedKeyCategory(cat)}
                                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all ${selectedSpeedKeyCategory === cat
                                            ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {/* Speed Key Buttons Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[310px] overflow-y-auto pr-1">
                                {filteredSpeedKeyProducts.slice(0, 15).map(item => (
                                    <div
                                        key={item.id}
                                        onClick={() => handleAddToCart(item)}
                                        className="p-2.5 bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-500 hover:text-white border border-slate-200 dark:border-slate-700/80 rounded-xl cursor-pointer transition-all hover:scale-[1.02] group flex flex-col justify-between"
                                    >
                                        <div>
                                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-emerald-700 group-hover:text-white">
                                                {item.sku}
                                            </span>
                                            <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-white line-clamp-2 mt-1">
                                                {item.name}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-slate-200 dark:border-slate-700/50 group-hover:border-emerald-400">
                                            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 group-hover:text-white">
                                                ₹{item.price}
                                            </span>
                                            <span className="text-[10px] text-slate-400 group-hover:text-white/80">
                                                {item.unit || 'unit'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* RIGHT: TENDER & PAYMENT SETTLEMENT PANEL (4 COLS) */}
                <div className={`${viewMode === 'TOUCH_POS' ? 'lg:col-span-12 xl:col-span-12' : 'lg:col-span-4'} bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between shadow-sm min-w-0`}>
                    <div className="space-y-3">
                        {/* Summary Breakup */}
                        <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="font-bold text-slate-900 dark:text-white">₹{subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Taxes (CGST + SGST)</span>
                                <span>₹{totalGst.toFixed(2)}</span>
                            </div>
                            {discountAmount > 0 && (
                                <div className="flex justify-between text-indigo-600 dark:text-indigo-400 font-bold">
                                    <span>Special Discount (F5)</span>
                                    <span>-₹{Number(discountAmount).toFixed(2)}</span>
                                </div>
                            )}
                            {loyaltyDiscount > 0 && (
                                <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold">
                                    <span>Loyalty Points Off</span>
                                    <span>-₹{loyaltyDiscount.toFixed(2)}</span>
                                </div>
                            )}
                            {isHomeDelivery && (
                                <div className="flex justify-between text-emerald-600 font-bold">
                                    <span>Home Delivery</span>
                                    <span>+₹{deliveryFee.toFixed(2)}</span>
                                </div>
                            )}
                            {roundOff !== 0 && (
                                <div className="flex justify-between text-slate-400 text-[11px]">
                                    <span>Round Off</span>
                                    <span>₹{roundOff.toFixed(2)}</span>
                                </div>
                            )}

                            {/* GIANT NET PAYABLE */}
                            <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div>
                                    <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider">
                                        NET PAYABLE
                                    </span>
                                    <p className="text-[10px] text-slate-400">{totalUnits} items included</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                                        ₹{grandTotal.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* FAST PAYMENT METHOD SELECTOR (F9 - F11) */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                Payment Method (F9 / F10 / F11)
                            </label>
                            <div className="grid grid-cols-4 gap-1.5">
                                {[
                                    { id: 'CASH', label: 'Cash', icon: DollarSign, key: 'F10' },
                                    { id: 'UPI', label: 'UPI QR', icon: Smartphone, key: 'F11' },
                                    { id: 'CARD', label: 'Card', icon: CreditCard, key: 'F9' },
                                    { id: 'CREDIT', label: 'Khata', icon: FileText, key: '' },
                                ].map(m => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => {
                                            setPaymentMethod(m.id as any);
                                            if (m.id === 'UPI') setIsUpiModalOpen(true);
                                            if (m.id === 'CASH') cashTenderInputRef.current?.focus();
                                        }}
                                        className={`py-2 px-1 rounded-xl text-xs font-black flex flex-col items-center gap-0.5 transition-all border ${paymentMethod === m.id
                                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'}`}
                                    >
                                        <m.icon className="w-4 h-4" />
                                        <span>{m.label}</span>
                                        {m.key && <span className="text-[9px] opacity-75 font-mono">{m.key}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* CASH TENDER & CHANGE DUE CALCULATOR */}
                        {paymentMethod === 'CASH' && (
                            <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase">Cash Tendered (₹)</label>
                                        <input
                                            ref={cashTenderInputRef}
                                            type="number"
                                            value={cashReceived || ''}
                                            onChange={(e) => setCashReceived(Number(e.target.value))}
                                            placeholder="₹ Received"
                                            className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-black text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase">Change Due (₹)</label>
                                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-sm font-black text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                                            <span>₹{changeDue.toFixed(2)}</span>
                                            {changeDue > 0 && <Check className="w-4 h-4 text-emerald-600" />}
                                        </div>
                                    </div>
                                </div>

                                {/* Fast Denomination Buttons (Cashier Ergonomics) */}
                                <div className="flex gap-1 flex-wrap pt-1">
                                    {[
                                        { label: 'Exact', amt: grandTotal },
                                        { label: '+₹50', amt: (cashReceived || grandTotal) + 50 },
                                        { label: '+₹100', amt: (cashReceived || grandTotal) + 100 },
                                        { label: '+₹500', amt: (cashReceived || grandTotal) + 500 },
                                        { label: '+₹2000', amt: (cashReceived || grandTotal) + 2000 },
                                    ].map((btn, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setCashReceived(btn.amt)}
                                            className="flex-1 py-1 px-1.5 bg-white dark:bg-slate-800 hover:bg-emerald-600 hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg text-[10px] font-bold transition-colors text-slate-700 dark:text-slate-300"
                                        >
                                            {btn.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SETTLE & PRINT BUTTON (F12) */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                        <button
                            onClick={handleCompleteSale}
                            disabled={cart.length === 0}
                            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                        >
                            <CheckCircle className="w-5 h-5" />
                            SETTLE & PRINT RECEIPT (F12)
                        </button>
                    </div>
                </div>
            </div>

            {/* --- BOTTOM FUNCTION KEYBAR (Sticky) --- */}
            <div className="bg-slate-900 text-slate-200 px-3 py-2 rounded-2xl flex items-center justify-between gap-1 overflow-x-auto text-[11px] font-mono shadow-md border border-slate-800">
                <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1 font-bold text-emerald-400">
                        <Key className="w-3.5 h-3.5" /> POS HOTKEYS:
                    </span>
                    <button onClick={() => barcodeInputRef.current?.focus()} className="hover:text-emerald-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        <kbd className="text-emerald-400 font-bold">F1</kbd> Scan
                    </button>
                    <button
                        onClick={() => {
                            if (cart.length > 0) {
                                setEditModal({ isOpen: true, type: 'QTY', itemIndex: selectedItemIndex, value: cart[selectedItemIndex]?.quantity.toString() || '1' });
                            }
                        }}
                        className="hover:text-emerald-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700"
                    >
                        <kbd className="text-emerald-400 font-bold">F2</kbd> Qty
                    </button>
                    <button
                        onClick={() => {
                            if (cart.length > 0) {
                                setEditModal({ isOpen: true, type: 'RATE', itemIndex: selectedItemIndex, value: cart[selectedItemIndex]?.price.toString() || '0' });
                            }
                        }}
                        className="hover:text-emerald-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700"
                    >
                        <kbd className="text-emerald-400 font-bold">F3</kbd> Rate
                    </button>
                    <button
                        onClick={() => {
                            if (cart.length > 0) {
                                setEditModal({ isOpen: true, type: 'DISC', itemIndex: selectedItemIndex, value: (cart[selectedItemIndex]?.discountPercent || 0).toString() });
                            }
                        }}
                        className="hover:text-emerald-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700"
                    >
                        <kbd className="text-emerald-400 font-bold">F4</kbd> Line Disc
                    </button>
                    <button onClick={() => setIsDiscountModalOpen(true)} className="hover:text-emerald-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        <kbd className="text-emerald-400 font-bold">F5</kbd> Bill Disc
                    </button>
                    <button onClick={() => customerPhoneInputRef.current?.focus()} className="hover:text-emerald-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        <kbd className="text-emerald-400 font-bold">F6</kbd> Customer
                    </button>
                    <button onClick={handleParkCurrentBill} className="hover:text-emerald-400 flex items-center gap-1 bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                        <kbd className="text-amber-400 font-bold">F7</kbd> Hold Bill
                    </button>
                    <button onClick={() => setIsParkedModalOpen(true)} className="hover:text-emerald-400 flex items-center gap-1 bg-amber-950 text-amber-300 px-2 py-0.5 rounded border border-amber-800">
                        <kbd className="text-amber-400 font-bold">F8</kbd> Recall ({parkedBills.length})
                    </button>
                    <button onClick={() => setPaymentMethod('CARD')} className="hover:text-emerald-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        <kbd className="text-emerald-400 font-bold">F9</kbd> Card
                    </button>
                    <button onClick={() => { setPaymentMethod('CASH'); cashTenderInputRef.current?.focus(); }} className="hover:text-emerald-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        <kbd className="text-emerald-400 font-bold">F10</kbd> Cash
                    </button>
                    <button onClick={() => { setPaymentMethod('UPI'); setIsUpiModalOpen(true); }} className="hover:text-emerald-400 flex items-center gap-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                        <kbd className="text-emerald-400 font-bold">F11</kbd> UPI QR
                    </button>
                    <button onClick={handleCompleteSale} className="hover:text-emerald-400 flex items-center gap-1 bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-700 font-bold">
                        <kbd className="text-emerald-400 font-bold">F12</kbd> Settle & Print
                    </button>
                    <span className="text-slate-500 text-[10px]">| Del: Void • Esc: Cancel</span>
                </div>
            </div>

            {/* ========================================================
                MODAL 1: PARKED ORDERS / RECALL BILL MODAL (F8)
               ======================================================== */}
            {isParkedModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
                            <div>
                                <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                                    <PauseCircle className="w-5 h-5 text-amber-500" /> Parked Bills / Recall Orders (F8)
                                </h3>
                                <p className="text-xs text-slate-500">Resume previously parked carts or clear stale bills</p>
                            </div>
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 font-bold text-xs rounded-full">
                                {parkedBills.length} on Hold
                            </span>
                        </div>

                        <div className="space-y-2.5 max-h-[320px] overflow-y-auto">
                            {parkedBills.length === 0 ? (
                                <div className="text-center py-10 text-slate-400 text-xs">
                                    <PauseCircle className="w-8 h-8 mx-auto mb-2 opacity-30 text-amber-500" />
                                    No bills currently on hold. Press F7 during billing to park an order.
                                </div>
                            ) : (
                                parkedBills.map(bill => {
                                    const total = bill.items.reduce((s, i) => s + (i.price * i.quantity), 0);
                                    return (
                                        <div
                                            key={bill.id}
                                            onClick={() => handleRecallParkedBill(bill.id)}
                                            className="p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 cursor-pointer transition-all flex justify-between items-center group"
                                        >
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-black text-slate-900 dark:text-white">{bill.customerName}</span>
                                                    <span className="text-[10px] text-slate-400 font-mono">({bill.customerPhone || 'No Phone'})</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                    Parked at {bill.parkedAt} • {bill.items.length} item lines ({bill.items.reduce((s, i) => s + i.quantity, 0)} units)
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                                    ₹{total.toFixed(2)}
                                                </span>
                                                <button
                                                    onClick={() => handleRecallParkedBill(bill.id)}
                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow"
                                                >
                                                    <PlayCircle className="w-3.5 h-3.5" /> Resume
                                                </button>
                                                <button
                                                    onClick={(e) => handleDiscardParkedBill(bill.id, e)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                                                    title="Discard"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between">
                            <button
                                onClick={handleParkCurrentBill}
                                disabled={cart.length === 0}
                                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl"
                            >
                                Park Current Bill (F7)
                            </button>
                            <button
                                onClick={() => setIsParkedModalOpen(false)}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl"
                            >
                                Close (Esc)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL 2: INLINE QUICK EDIT MODAL (F2/F3/F4)
               ======================================================== */}
            {editModal.isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <form onSubmit={handleConfirmInlineEdit} className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div>
                            <h3 className="font-black text-sm text-slate-900 dark:text-white flex items-center gap-2">
                                <Edit3 className="w-4 h-4 text-emerald-500" />
                                {editModal.type === 'QTY' && 'Update Quantity (F2)'}
                                {editModal.type === 'RATE' && 'Update Unit Rate (F3)'}
                                {editModal.type === 'DISC' && 'Apply Item Discount % (F4)'}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                {cart[editModal.itemIndex]?.name}
                            </p>
                        </div>

                        <div>
                            <input
                                autoFocus
                                type="number"
                                step={editModal.type === 'RATE' ? '0.01' : '1'}
                                value={editModal.value}
                                onChange={(e) => setEditModal(prev => ({ ...prev, value: e.target.value }))}
                                className="w-full p-3 bg-slate-50 dark:bg-slate-900 border-2 border-emerald-500 rounded-xl text-lg font-black text-slate-900 dark:text-white outline-none"
                            />
                        </div>

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl"
                            >
                                Save Changes (Enter)
                            </button>
                            <button
                                type="button"
                                onClick={() => setEditModal(prev => ({ ...prev, isOpen: false }))}
                                className="py-2 px-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl"
                            >
                                Cancel (Esc)
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* ========================================================
                MODAL 3: DYNAMIC UPI QR SCANNER (F11)
               ======================================================== */}
            {isUpiModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div>
                            <h3 className="font-black text-base text-slate-900 dark:text-white">SCAN & PAY VIA UPI</h3>
                            <p className="text-xs text-slate-500">PhonePe • Google Pay • Paytm • BHIM</p>
                        </div>

                        {/* Visual UPI QR code */}
                        <div className="w-48 h-48 mx-auto bg-white p-2 rounded-2xl border-2 border-slate-900 shadow-md flex items-center justify-center">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=storeai@icici%26pn=StoreAI%20Supermarket%26am=${grandTotal}%26cu=INR`}
                                alt="UPI QR Code"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        <div>
                            <span className="text-xs text-slate-400 font-mono">Payable Amount:</span>
                            <p className="text-2xl font-black text-emerald-600">₹{grandTotal.toFixed(2)}</p>
                            <p className="text-[10px] text-slate-400 mt-1">VPA: storeai@icici • Merchant: StoreAI Supermarket</p>
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={() => {
                                    setIsUpiModalOpen(false);
                                    handleCompleteSale();
                                }}
                                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2"
                            >
                                <Check className="w-4 h-4" /> Payment Confirmed (Print)
                            </button>
                            <button
                                onClick={() => setIsUpiModalOpen(false)}
                                className="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl"
                            >
                                Cancel / Change Method (Esc)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================
                MODAL 4: MULTI-MRP & BATCH SELECTOR MODAL
               ======================================================== */}
            {batchSelectionProduct && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div>
                            <h3 className="font-black text-sm text-slate-900 dark:text-white">Select Batch & MRP</h3>
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

            {/* ========================================================
                MODAL 5: CASHIER SHIFT MANAGER & Z-REPORT (F9)
               ======================================================== */}
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
                            <form onSubmit={(e) => {
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
                            }} className="space-y-3 text-xs">
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

            {/* ========================================================
                MODAL 6: BILL DISCOUNT MODAL (F5)
               ======================================================== */}
            {isDiscountModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                            <Tag className="w-4 h-4 text-indigo-500" /> Apply Bill Discount (F5)
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

            {/* ========================================================
                MODAL 7: THERMAL RECEIPT & PRINT MODAL
               ======================================================== */}
            {isReceiptModalOpen && lastSaleReceipt && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200 dark:border-slate-700">
                        <div className="text-center pb-2 border-b border-slate-200 dark:border-slate-700">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 mx-auto flex items-center justify-center mb-1">
                                <Check className="w-6 h-6" />
                            </div>
                            <h3 className="font-black text-lg text-slate-900 dark:text-white">SALE COMPLETED</h3>
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
                                <Printer className="w-3.5 h-3.5" /> Thermal Print
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
