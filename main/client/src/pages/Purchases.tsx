import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Ship, CheckCircle, Package, ArrowRight, ClipboardList, Briefcase, Plus, Calendar, FileText, DollarSign, ShieldCheck } from 'lucide-react';
import { approveOrder } from '../services/api';
import PageHeader from '../components/PageHeader';

const Purchases = () => {
    const { data, refreshData, setModal, user } = useOutletContext<any>() as any;

    useEffect(() => {
        refreshData('purchases');
    }, []);
    const { orders, requisitions } = data || {};
    const [tab, setTab] = useState('orders'); // orders | requisitions

    const demoOrders = [
        { id: 'po1', orderNumber: 'PO-2026-0981', supplier: { name: 'Bharat Agro Foods Ltd' }, vendorInvoiceNo: 'VIN-90812', createdAt: '2026-07-24', expectedDeliveryDate: '2026-07-28', status: 'APPROVED', totalAmount: 485000, cgst: 21825, sgst: 21825, shippingCarrier: 'BlueDart Express', trackingNumber: 'BD-88901234', paymentTerms: 'Net 30 Days' },
        { id: 'po2', orderNumber: 'PO-2026-0982', supplier: { name: 'TechLogix India Pvt Ltd' }, vendorInvoiceNo: 'VIN-44109', createdAt: '2026-07-25', expectedDeliveryDate: '2026-07-30', status: 'SHIPPED', totalAmount: 1250000, cgst: 112500, sgst: 112500, shippingCarrier: 'Delhivery Logistics', trackingNumber: 'DEL-9901823', paymentTerms: 'Net 15 Days' },
        { id: 'po3', orderNumber: 'PO-2026-0983', supplier: { name: 'Vardhman Textiles & Fabrics' }, vendorInvoiceNo: 'VIN-12004', createdAt: '2026-07-22', expectedDeliveryDate: '2026-07-26', status: 'PARTIAL_RECEIVED', totalAmount: 390000, cgst: 23400, sgst: 23400, shippingCarrier: 'GATI KWE', trackingNumber: 'GATI-771203', paymentTerms: 'Net 45 Days' }
    ];

    const displayOrders = (orders && orders.length > 0) ? orders : demoOrders;

    const handleApprove = async (id: string) => {
        if (confirm('Approve this Purchase Order? This will commit funds to the ledger.')) {
            try {
                await approveOrder(id, user?.id || 'admin');
                refreshData();
            } catch (e: any) { alert("Error approving order: " + e.message); }
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        let color = 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300';
        if (['APPROVED', 'SHIPPED', 'COMPLETED', 'RECEIVED', 'ORDERED'].includes(status)) color = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300';
        if (status === 'REJECTED' || status === 'CANCELLED') color = 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300';
        return <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${color}`}>{status}</span>;
    };

    return (
        <div className="space-y-6 font-['Outfit']">
            <PageHeader
                title="Procurement & Purchase Orders (P.O.)"
                subtitle="Track vendor purchase commitments, GST tax input, inward GRN & shipping logistics"
                icon={Briefcase}
                badge={`${displayOrders.length} ORDERS`}
                badgeColor="sky"
                iconGradient="from-sky-500 to-blue-600"
                actions={
                    <button
                        onClick={() => setModal({ type: 'purchases' })}
                        className="px-5 py-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-sky-500/20 flex items-center gap-2 transition-all hover:scale-105"
                    >
                        <Plus className="w-4 h-4" /> CREATE PURCHASE ORDER
                    </button>
                }
            />

            {/* Procurement Tabs */}
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-700 pb-2">
                <button
                    onClick={() => setTab('orders')}
                    className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-2 transition-all border ${tab === 'orders' ? 'bg-sky-600 text-white border-sky-500 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
                >
                    <Briefcase className="w-4 h-4" /> PURCHASE ORDERS ({displayOrders.length})
                </button>
                <button
                    onClick={() => setTab('requisitions')}
                    className={`px-5 py-2.5 rounded-2xl font-extrabold text-xs flex items-center gap-2 transition-all border ${tab === 'requisitions' ? 'bg-sky-600 text-white border-sky-500 shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
                >
                    <ClipboardList className="w-4 h-4" /> DEMAND REQUISITIONS
                </button>
            </div>

            {/* Purchase Orders Table */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    {tab === 'orders' ? (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-100/70 dark:bg-slate-900/80 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700">
                                    <th className="p-4">P.O. Reference & Vendor Invoice</th>
                                    <th className="p-4">Supplier Partner</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Valuation & GST Input</th>
                                    <th className="p-4">Expected Delivery & Terms</th>
                                    <th className="p-4">Logistics & Tracking</th>
                                    <th className="p-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/70 text-xs font-medium">
                                {displayOrders.map((o: any) => (
                                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-extrabold text-slate-900 dark:text-white text-sm">{o.orderNumber}</div>
                                            <div className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">
                                                Inv: {o.vendorInvoiceNo || 'VIN-PENDING'}
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-slate-800 dark:text-slate-200">
                                            {o.supplier?.name || 'Primary Vendor'}
                                        </td>
                                        <td className="p-4">
                                            <StatusBadge status={o.status} />
                                        </td>
                                        <td className="p-4 space-y-0.5">
                                            <div className="font-black text-slate-900 dark:text-white text-sm">
                                                ₹{o.totalAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                            </div>
                                            <div className="text-[10px] text-slate-400">
                                                Incl. CGST+SGST Tax Input
                                            </div>
                                        </td>
                                        <td className="p-4 space-y-0.5">
                                            <div className="flex items-center gap-1 font-semibold text-slate-800 dark:text-slate-200">
                                                <Calendar className="w-3.5 h-3.5 text-sky-500" /> {o.expectedDeliveryDate || '2026-07-30'}
                                            </div>
                                            <div className="text-[10px] text-sky-600 dark:text-sky-400 font-bold">
                                                {o.paymentTerms || 'Net 30 Days'}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {o.trackingNumber ? (
                                                <div className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                                    <span className="font-bold text-slate-900 dark:text-white">{o.shippingCarrier}:</span> {o.trackingNumber}
                                                </div>
                                            ) : (
                                                <span className="text-slate-400 text-[11px]">Awaiting Carrier</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                {(o.status === 'DRAFT' || o.status === 'PENDING') && (
                                                    <button className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1" onClick={() => handleApprove(o.id)}>
                                                        <CheckCircle className="w-3.5 h-3.5" /> APPROVE
                                                    </button>
                                                )}
                                                {o.status === 'APPROVED' && (
                                                    <button className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl" onClick={() => setModal({ type: 'tracking_po', metadata: o })}>
                                                        <Ship className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {['APPROVED', 'SHIPPED', 'PARTIAL_RECEIVED'].includes(o.status) && (
                                                    <button className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1" onClick={() => setModal({ type: 'grn', metadata: o })}>
                                                        <Package className="w-3.5 h-3.5" /> INWARD GRN
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-8 text-center text-slate-500 font-medium">
                            Select Demand Requisitions tab to process automated stock replenishment requests.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Purchases;
