import React, { useState } from 'react';
import { User, ShoppingBag, Award, Download, RotateCcw, PackageCheck } from 'lucide-react';
import { RMAPortal } from '../components/RMAPortal';
import { useCurrency } from '../context/CurrencyContext';

export default function CustomerPortal() {
    const { format } = useCurrency();
    const [activeTab, setActiveTab] = useState<'orders' | 'returns'>('orders');

    const orders = [
        { id: 'ORD-9821', date: '2026-07-22', totalUSD: 149.99, status: 'DELIVERED', items: 3, trackingNo: 'TRK-8812903' },
        { id: 'ORD-9740', date: '2026-07-10', totalUSD: 320.00, status: 'DELIVERED', items: 5, trackingNo: 'TRK-8800124' },
    ];

    return (
        <div className="space-y-6">
            {/* Customer Profile Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-md">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold text-xl">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-100">Customer Self-Service Portal</h1>
                        <p className="text-xs text-slate-400">Manage orders, global returns (RMA), track shipments & tax invoices</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-md text-xs font-bold flex items-center gap-2">
                        <Award className="w-4 h-4" /> Global VIP Member (450 Points)
                    </div>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800">
                    <span className="text-xs text-slate-400 font-medium">Total Orders Placed</span>
                    <p className="text-2xl font-extrabold text-slate-100 mt-1">2 Orders</p>
                </div>
                <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800">
                    <span className="text-xs text-slate-400 font-medium">Available Store Credit Wallet</span>
                    <p className="text-2xl font-extrabold text-emerald-400 mt-1">{format(150.00)}</p>
                    <span className="text-[10px] text-slate-500 font-mono">100% usable on checkout</span>
                </div>
                <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800">
                    <span className="text-xs text-slate-400 font-medium">Active Returns (RMA)</span>
                    <p className="text-2xl font-extrabold text-amber-400 mt-1">2 Requests</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-800 gap-2">
                <button
                    onClick={() => setActiveTab('orders')}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                        activeTab === 'orders'
                            ? 'border-emerald-500 text-emerald-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <ShoppingBag className="w-4 h-4" /> Order History
                </button>
                <button
                    onClick={() => setActiveTab('returns')}
                    className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                        activeTab === 'returns'
                            ? 'border-amber-500 text-amber-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                >
                    <RotateCcw className="w-4 h-4" /> Self-Service Returns & RMA
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'orders' ? (
                <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4 shadow-sm">
                    <h3 className="font-bold text-slate-100 text-base">Your Order History</h3>
                    
                    <div className="space-y-3">
                        {orders.map(o => (
                            <div key={o.id} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-extrabold text-xs text-amber-400 font-mono">{o.id}</span>
                                        <span className="px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800/60 text-[10px] font-bold rounded-md">
                                            {o.status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-400">Placed on {o.date} • {o.items} Items • Tracking: <span className="font-mono text-slate-300">{o.trackingNo}</span></p>
                                </div>

                                <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
                                    <span className="font-bold text-sm text-emerald-400">{format(o.totalUSD)}</span>
                                    <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors">
                                        <Download className="w-3.5 h-3.5" /> Tax Invoice (PDF)
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <RMAPortal />
            )}
        </div>
    );
}
