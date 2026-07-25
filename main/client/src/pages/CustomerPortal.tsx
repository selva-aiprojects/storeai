import React, { useState } from 'react';
import { User, ShoppingBag, Award, Download, Clock, CheckCircle2, ChevronRight, FileText } from 'lucide-react';

export default function CustomerPortal() {
    const orders = [
        { id: 'ORD-9821', date: '2026-07-22', total: '₹4,590', status: 'DELIVERED', items: 3, trackingNo: 'TRK-8812903' },
        { id: 'ORD-9740', date: '2026-07-10', total: '₹12,400', status: 'DELIVERED', items: 5, trackingNo: 'TRK-8800124' },
    ];

    return (
        <div className="space-y-6">
            {/* Customer Profile Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold text-xl">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Customer Self-Service Portal</h1>
                        <p className="text-xs text-slate-500">View past orders, track shipments, download tax invoices & manage rewards</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-xl shadow-md text-xs font-bold flex items-center gap-2">
                        <Award className="w-4 h-4" /> Gold Loyalty Tier (450 Points)
                    </div>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 font-medium">Total Orders Placed</span>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">2 Orders</p>
                </div>
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 font-medium">Available Reward Balance</span>
                    <p className="text-2xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">₹450.00 Store Credit</p>
                </div>
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 font-medium">Active Subscriptions</span>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">1 Monthly Plan</p>
                </div>
            </div>

            {/* Order History */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4 shadow-sm">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Your Order History</h3>
                
                <div className="space-y-3">
                    {orders.map(o => (
                        <div key={o.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">{o.id}</span>
                                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold rounded-md">
                                        {o.status}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500">Placed on {o.date} • {o.items} Items • Tracking: {o.trackingNo}</p>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between">
                                <span className="font-bold text-sm text-slate-900 dark:text-white">{o.total}</span>
                                <button className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors">
                                    <Download className="w-3.5 h-3.5" /> GST Invoice (PDF)
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
