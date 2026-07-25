import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, User, MapPin, Phone, Mail, ShieldCheck, DollarSign, CreditCard, Award, ArrowUpRight } from 'lucide-react';

const Customers = () => {
    const { data, setModal } = useOutletContext<any>();
    const { customers } = data || {};

    const demoCustomers = [
        { id: 'c1', name: 'Rahul Verma', email: 'rahul.verma@gmail.com', phone: '+91 98765 43210', gstin: '27AAAAA0000A1Z5', category: 'B2C Retail', creditLimit: 50000, creditPeriodDays: 15, outstandingBalance: 3450, address: 'Flat 402, Green Valley Apts', city: 'Mumbai', zipCode: '400050', loyaltyPoints: 450, totalOrders: 12 },
        { id: 'c2', name: 'Metro Distributors Corp', email: 'billing@metrodist.in', phone: '+91 91234 56789', gstin: '27AABCM8920C1Z9', category: 'B2B Wholesale', creditLimit: 500000, creditPeriodDays: 45, outstandingBalance: 128900, address: 'Plot 88, Sunrise Industrial Park', city: 'Thane', zipCode: '400604', loyaltyPoints: 2300, totalOrders: 28 },
        { id: 'c3', name: 'Ananya Sharma', email: 'ananya.s@outlook.com', phone: '+91 99887 76655', gstin: 'N/A (Retail Consumer)', category: 'B2C Retail', creditLimit: 25000, creditPeriodDays: 7, outstandingBalance: 0, address: 'B-12, Palms Enclave, Powai', city: 'Mumbai', zipCode: '400076', loyaltyPoints: 890, totalOrders: 9 },
        { id: 'c4', name: 'Apex Retail Enterprises', email: 'accounts@apexretail.com', phone: '+91 98220 11223', gstin: '27AAACA1234F1ZB', category: 'B2B Wholesale', creditLimit: 1000000, creditPeriodDays: 60, outstandingBalance: 340000, address: 'Tower 4, Mindspace Tech Hub', city: 'Navi Mumbai', zipCode: '400708', loyaltyPoints: 5400, totalOrders: 42 }
    ];

    const displayCustomers = (customers && customers.length > 0) ? customers : demoCustomers;

    return (
        <div className="space-y-6 font-['Outfit']">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-lg shadow-indigo-500/20">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Customer & Client Directory</h1>
                        <p className="text-sm font-medium text-slate-500">Manage B2B wholesale credits, GSTIN tax IDs, credit limits & loyalty ledger balances</p>
                    </div>
                </div>

                <button
                    onClick={() => setModal({ type: 'customers' })}
                    className="px-5 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all hover:scale-105"
                >
                    <Plus className="w-4 h-4" /> REGISTER NEW CLIENT
                </button>
            </div>

            {/* Customers Data Table */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Active Customer Directory ({displayCustomers.length})</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100/70 dark:bg-slate-900/80 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700">
                                <th className="p-4">Client Name & Category</th>
                                <th className="p-4">GSTIN Tax ID</th>
                                <th className="p-4">Contact Info</th>
                                <th className="p-4">Credit Limit & Terms</th>
                                <th className="p-4">Outstanding Balance</th>
                                <th className="p-4">Loyalty Points</th>
                                <th className="p-4">Primary Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/70 text-xs font-medium">
                            {displayCustomers.map((c: any) => (
                                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold flex items-center justify-center shrink-0">
                                                <User className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-slate-900 dark:text-white text-sm">{c.name}</div>
                                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${c.category === 'B2B Wholesale' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                                    {c.category || 'Retail Client'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                                        {c.gstin || '27AAAAA0000A1Z5'}
                                    </td>
                                    <td className="p-4 space-y-0.5">
                                        <div className="flex items-center gap-1 text-slate-900 dark:text-white font-semibold">
                                            <Phone className="w-3.5 h-3.5 text-purple-500" /> {c.phone || 'N/A'}
                                        </div>
                                        <div className="text-[11px] text-slate-400">{c.email}</div>
                                    </td>
                                    <td className="p-4 space-y-0.5">
                                        <div className="font-bold text-slate-900 dark:text-white">
                                            ₹{(c.creditLimit || 50000).toLocaleString()}
                                        </div>
                                        <div className="text-[10px] text-purple-600 dark:text-purple-400 font-bold">
                                            {c.creditPeriodDays || 30} Days Net Terms
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`font-extrabold text-sm ${Number(c.outstandingBalance || 0) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                            ₹{Number(c.outstandingBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-extrabold text-xs rounded-xl flex items-center gap-1 w-fit">
                                            <Award className="w-3.5 h-3.5 text-amber-500" /> {c.loyaltyPoints || 0} Pts
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-500">
                                        <div className="flex items-start gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{c.address || 'Central Office'}</p>
                                                <p className="text-[10px] text-slate-400">{c.city} {c.zipCode}</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Customers;
