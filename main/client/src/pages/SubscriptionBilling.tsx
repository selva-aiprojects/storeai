import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, Clock, Calendar, AlertCircle, Plus, ArrowRight } from 'lucide-react';

export default function SubscriptionBilling() {
    const plans = [
        { name: 'Starter Retail Pack', price: '₹1,999 / mo', interval: 'MONTHLY', activeSubs: 24 },
        { name: 'Enterprise Wholesale Tier', price: '₹8,499 / mo', interval: 'MONTHLY', activeSubs: 12 },
        { name: 'Annual Pro Store Plan', price: '₹19,999 / yr', interval: 'YEARLY', activeSubs: 8 },
    ];

    const subscriptions = [
        { customer: 'Bharat Traders', plan: 'Enterprise Wholesale Tier', status: 'ACTIVE', nextBilling: '2026-08-15', amount: '₹8,499' },
        { customer: 'Global Supermarket', plan: 'Starter Retail Pack', status: 'ACTIVE', nextBilling: '2026-08-01', amount: '₹1,999' },
        { customer: 'Apex Mart', plan: 'Starter Retail Pack', status: 'PAST_DUE', nextBilling: '2026-07-20', amount: '₹1,999' },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 flex items-center justify-center font-bold">
                        <RefreshCw className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Subscription & Recurring Billing</h1>
                        <p className="text-sm text-slate-500">Manage recurring plans, auto-invoicing, dunning retries & subscription lifecycles</p>
                    </div>
                </div>
                <button className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md">
                    <Plus className="w-4 h-4" /> Create Plan
                </button>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {plans.map(p => (
                    <div key={p.name} className="p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                        <span className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950 px-2 py-0.5 rounded">{p.interval}</span>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">{p.name}</h4>
                        <p className="text-xl font-extrabold text-slate-900 dark:text-white">{p.price}</p>
                        <p className="text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700">{p.activeSubs} Active Subscribers</p>
                    </div>
                ))}
            </div>

            {/* Active Subscriptions Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Subscriber Directory</h3>
                </div>
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700">
                            <th className="p-4">Customer</th>
                            <th className="p-4">Plan Name</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Next Invoice Date</th>
                            <th className="p-4">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-xs">
                        {subscriptions.map((sub, i) => (
                            <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                <td className="p-4 font-bold text-slate-900 dark:text-white">{sub.customer}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-300">{sub.plan}</td>
                                <td className="p-4 font-bold text-slate-900 dark:text-white">{sub.amount}</td>
                                <td className="p-4 text-slate-500">{sub.nextBilling}</td>
                                <td className="p-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${sub.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'}`}>
                                        {sub.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
