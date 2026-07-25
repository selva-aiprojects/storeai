import { useOutletContext } from 'react-router-dom';
import { Plus, Phone, Mail, Award, Building2, ShieldCheck, MapPin, Clock, DollarSign } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const Partners = () => {
    const { data, setModal } = useOutletContext<any>();
    const { suppliers } = data || {};

    const demoSuppliers = [
        { id: 'sup1', name: 'Bharat Agro Foods Ltd', email: 'orders@bharatagro.in', contact: '+91 98111 22334', gstin: '27AABCB1234A1Z1', msmeRegNo: 'UDYAM-MH-01-00892', rating: 4.9, paymentTerms: 'Net 30 Days', leadTimeDays: 2, creditLimit: 1500000, outstandingPayable: 185000, status: 'ACTIVE' },
        { id: 'sup2', name: 'TechLogix India Pvt Ltd', email: 'b2b@techlogix.io', contact: '+91 99222 33445', gstin: '27AAACT9821F1Z8', msmeRegNo: 'UDYAM-MH-03-01244', rating: 4.8, paymentTerms: 'Net 15 Days', leadTimeDays: 3, creditLimit: 2500000, outstandingPayable: 420000, status: 'ACTIVE' },
        { id: 'sup3', name: 'Vardhman Textiles & Fabrics', email: 'sales@vardhman.com', contact: '+91 97333 44556', gstin: '27AAACV4512E1Z3', msmeRegNo: 'UDYAM-PB-02-00561', rating: 4.7, paymentTerms: 'Net 45 Days', leadTimeDays: 5, creditLimit: 1000000, outstandingPayable: 95000, status: 'ACTIVE' },
        { id: 'sup4', name: 'Universal Beverages Ltd', email: 'supply@universalbev.in', contact: '+91 96444 55667', gstin: '27AAACU7890D1Z9', msmeRegNo: 'UDYAM-MH-05-09812', rating: 4.6, paymentTerms: 'Net 30 Days', leadTimeDays: 1, creditLimit: 800000, outstandingPayable: 45000, status: 'ACTIVE' }
    ];

    const displaySuppliers = (suppliers && suppliers.length > 0) ? suppliers : demoSuppliers;

    return (
        <div className="space-y-6 font-['Outfit']">
            <PageHeader
                title="Supplier & Vendor Master"
                subtitle="Manage vendor GSTIN tax IDs, MSME certifications, lead times & accounts payable ledgers"
                icon={Building2}
                badge={`${displaySuppliers.length} VENDORS`}
                badgeColor="amber"
                iconGradient="from-amber-500 to-orange-600"
                actions={
                    <button
                        onClick={() => setModal({ type: 'suppliers' })}
                        className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-orange-500/20 flex items-center gap-2 transition-all hover:scale-105"
                    >
                        <Plus className="w-4 h-4" /> ONBOARD NEW SUPPLIER
                    </button>
                }
            />

            {/* Suppliers Data Table */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">Verified Vendor Directory ({displaySuppliers.length})</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100/70 dark:bg-slate-900/80 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700">
                                <th className="p-4">Vendor Partner</th>
                                <th className="p-4">GSTIN & MSME Certification</th>
                                <th className="p-4">Contact Info</th>
                                <th className="p-4">Lead Time & Rating</th>
                                <th className="p-4">Credit Terms</th>
                                <th className="p-4">Accounts Payable Balance</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/70 text-xs font-medium">
                            {displaySuppliers.filter((s: any) => !s.isDeleted).map((s: any) => (
                                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-extrabold text-slate-900 dark:text-white text-sm">{s.name}</div>
                                        <div className="text-[10px] font-mono text-slate-400">ID: {s.id.slice(0, 10)}</div>
                                    </td>
                                    <td className="p-4 space-y-0.5">
                                        <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                                            {s.gstin || '27AABCB1234A1Z1'}
                                        </div>
                                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                            {s.msmeRegNo || 'MSME CERTIFIED'}
                                        </div>
                                    </td>
                                    <td className="p-4 space-y-0.5">
                                        <div className="flex items-center gap-1 text-slate-900 dark:text-white">
                                            <Mail className="w-3.5 h-3.5 text-amber-500" /> {s.email}
                                        </div>
                                        {s.contact && (
                                            <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                                                <Phone className="w-3.5 h-3.5 text-amber-500" /> {s.contact}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 space-y-0.5">
                                        <div className="flex items-center gap-1 font-bold text-amber-500">
                                            <Award className="w-4 h-4 fill-amber-500" /> {s.rating?.toFixed(1) || '4.9'} / 5.0 Rating
                                        </div>
                                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3 text-slate-400" /> {s.leadTimeDays || 2} Days Dispatch Lead Time
                                        </div>
                                    </td>
                                    <td className="p-4 space-y-0.5">
                                        <div className="font-bold text-slate-800 dark:text-slate-200">
                                            {s.paymentTerms || 'Net 30 Days'}
                                        </div>
                                        <div className="text-[10px] text-slate-400">
                                            Credit Limit: ₹{(s.creditLimit || 1000000).toLocaleString()}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-extrabold text-sm text-rose-600 dark:text-rose-400">
                                            ₹{Number(s.outstandingPayable || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-extrabold text-[10px] rounded-full">
                                            {s.status || 'ACTIVE'}
                                        </span>
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

export default Partners;
