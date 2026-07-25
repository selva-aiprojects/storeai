import React, { useState } from 'react';
import { Truck, FileText, DollarSign, CheckCircle2, Clock, Upload, ArrowUpRight, ShieldCheck } from 'lucide-react';

export default function VendorPortal() {
    const [activeTab, setActiveTab] = useState<'POS' | 'RFQS' | 'PAYMENTS'>('POS');

    const purchaseOrders = [
        { id: 'PO-9081', date: '2026-07-24', items: 'Smart LED Panels (200 pcs)', amount: '₹1,45,000', status: 'PENDING_DISPATCH' },
        { id: 'PO-9042', date: '2026-07-20', items: 'Industrial Cables (500 meters)', amount: '₹88,000', status: 'DELIVERED' },
        { id: 'PO-8991', date: '2026-07-15', items: 'Copper Connectors (1000 pcs)', amount: '₹42,500', status: 'DELIVERED' },
    ];

    const rfqs = [
        { id: 'RFQ-301', title: 'Supply of 500 units High-Efficiency Transformers', deadline: '2026-07-30', estBudget: '₹4,50,000' },
        { id: 'RFQ-298', title: 'Annual Contract for Packaging Cardboard Boxes', deadline: '2026-08-05', estBudget: '₹2,10,000' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                        <Truck className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Vendor Self-Service Portal</h1>
                        <p className="text-sm text-slate-500">Manage PO acceptance, submit RFQ bids & upload shipping notices</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold rounded-xl flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" /> Verified Supplier ID: SUP-882
                    </span>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 font-medium">Active Purchase Orders</span>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">1 Order Pending</p>
                </div>
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 font-medium">Pending Remittance Ledger</span>
                    <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">₹1,45,000</p>
                </div>
                <div className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs text-slate-500 font-medium">Open RFQ Opportunities</span>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">2 Open Bids</p>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                <button
                    onClick={() => setActiveTab('POS')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'POS' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    Purchase Orders (3)
                </button>
                <button
                    onClick={() => setActiveTab('RFQS')}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${activeTab === 'RFQS' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                >
                    RFQ Bidding Center (2)
                </button>
            </div>

            {/* Tab Contents */}
            {activeTab === 'POS' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900/50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700">
                                <th className="p-4">PO Number</th>
                                <th className="p-4">Date</th>
                                <th className="p-4">Items Summary</th>
                                <th className="p-4">Amount</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
                            {purchaseOrders.map(po => (
                                <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                    <td className="p-4 font-bold text-amber-600 dark:text-amber-400">{po.id}</td>
                                    <td className="p-4 text-slate-500">{po.date}</td>
                                    <td className="p-4 font-medium text-slate-900 dark:text-white">{po.items}</td>
                                    <td className="p-4 font-bold text-slate-900 dark:text-white">{po.amount}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${po.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>
                                            {po.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors">
                                            Upload ASN
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {activeTab === 'RFQS' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {rfqs.map(rfq => (
                        <div key={rfq.id} className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
                            <div className="flex justify-between items-start">
                                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">{rfq.id}</span>
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500">Deadline: {rfq.deadline}</span>
                            </div>
                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{rfq.title}</h4>
                            <p className="text-xs text-slate-500">Estimated Project Value: <strong className="text-slate-900 dark:text-white">{rfq.estBudget}</strong></p>
                            <button className="w-full py-2 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1">
                                Submit Quote Bid <ArrowUpRight className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
