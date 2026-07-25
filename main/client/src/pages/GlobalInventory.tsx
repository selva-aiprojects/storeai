import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getGlobalProducts } from '../services/api';
import { Package, Building2, Search, MapPin, Tag, ShieldCheck, RefreshCw } from 'lucide-react';

const GlobalInventory = () => {
    const { setModal } = useOutletContext<any>() as any;
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [tenantFilter, setTenantFilter] = useState('');

    const demoGlobal = [
        { id: 'gp1', name: 'Organic Basmati Rice 5kg', sku: 'GRO-001', hsnCode: 'HSN-1006', stockQuantity: 120, unit: 'Bags', costPrice: 500, price: 650, lowStockThreshold: 20, binLocation: 'BIN-A1-R02', tenant: { name: 'Metro Retail Hub', slug: 'metro-retail' } },
        { id: 'gp2', name: 'Wireless Bluetooth Earbuds Pro', sku: 'ELE-102', hsnCode: 'HSN-8518', stockQuantity: 45, unit: 'Units', costPrice: 1800, price: 2499, lowStockThreshold: 10, binLocation: 'BIN-B4-R01', tenant: { name: 'TechLogix Store', slug: 'techlogix' } },
        { id: 'gp3', name: 'Cotton Crewneck Polo T-Shirt', sku: 'APP-204', hsnCode: 'HSN-6109', stockQuantity: 80, unit: 'Pcs', costPrice: 450, price: 899, lowStockThreshold: 15, binLocation: 'BIN-C2-R05', tenant: { name: 'Vardhman Apparels', slug: 'vardhman' } }
    ];

    const fetchGlobalData = async () => {
        setLoading(true);
        try {
            const resp = await getGlobalProducts();
            if (resp.data && resp.data.length > 0) {
                setProducts(resp.data);
            } else {
                setProducts(demoGlobal);
            }
        } catch (e) {
            console.error("Failed to fetch global inventory:", e);
            setProducts(demoGlobal);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGlobalData();
    }, []);

    const displayItems = products.length > 0 ? products : demoGlobal;
    const tenants = Array.from(new Set(displayItems.map(p => p.tenant?.slug))).filter(Boolean);

    const filtered = displayItems.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
        const matchesTenant = !tenantFilter || p.tenant?.slug === tenantFilter;
        return matchesSearch && matchesTenant && !p.isDeleted;
    });

    return (
        <div className="space-y-6 font-['Outfit']">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-cyan-500/20">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Global Stock Master & Audit</h1>
                        <p className="text-sm font-medium text-slate-500">Cross-tenant multi-warehouse inventory valuation & HSN audit (Super Admin)</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search SKU or Product Name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-cyan-500 w-[220px]"
                        />
                    </div>

                    <select
                        value={tenantFilter}
                        onChange={(e) => setTenantFilter(e.target.value)}
                        className="py-2 px-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none"
                    >
                        <option value="">All Tenant Workspaces</option>
                        {tenants.map(t => (
                            <option key={t as string} value={t as string}>{t as string}</option>
                        ))}
                    </select>

                    <button
                        onClick={fetchGlobalData}
                        className="p-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold text-xs flex items-center gap-1 shadow-md transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" /> Refresh
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100/70 dark:bg-slate-900/80 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700">
                                <th className="p-4">Tenant Organization</th>
                                <th className="p-4">Product Name & HSN</th>
                                <th className="p-4">Stock (UOM)</th>
                                <th className="p-4">Bin Location</th>
                                <th className="p-4">Unit Cost</th>
                                <th className="p-4">Selling Price</th>
                                <th className="p-4">Total Asset Valuation</th>
                                <th className="p-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/70 text-xs font-medium">
                            {filtered.map((p: any) => {
                                const cost = Number(p.costPrice || 0);
                                const totalValuation = Number(p.stockQuantity || 0) * cost;

                                return (
                                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-cyan-500" />
                                                <span className="font-extrabold text-slate-900 dark:text-white uppercase">
                                                    {p.tenant?.name || 'STORE AI TENANT'}
                                                </span>
                                            </div>
                                            <div className="text-[10px] text-slate-400 font-mono">Slug: {p.tenant?.slug || 'tenant-01'}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-extrabold text-slate-900 dark:text-white">{p.name}</div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                                                <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">SKU: {p.sku}</span>
                                                <span className="bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400 px-1.5 py-0.5 rounded font-mono">{p.hsnCode || 'HSN-8500'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-black text-slate-900 dark:text-white text-sm">{p.stockQuantity}</span>
                                            <span className="text-[10px] text-slate-400 ml-1 font-bold">{p.unit || 'Units'}</span>
                                        </td>
                                        <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 text-rose-500" /> {p.binLocation || 'BIN-A1'}
                                            </div>
                                        </td>
                                        <td className="p-4 font-semibold text-slate-800 dark:text-slate-200">
                                            ₹{cost.toFixed(2)}
                                        </td>
                                        <td className="p-4 font-black text-cyan-600 dark:text-cyan-400">
                                            ₹{Number(p.price || 0).toFixed(2)}
                                        </td>
                                        <td className="p-4 font-black text-emerald-600 dark:text-emerald-400">
                                            ₹{totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${p.stockQuantity <= (p.lowStockThreshold || 10) ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                                                {p.stockQuantity <= (p.lowStockThreshold || 10) ? 'REORDER ALERT' : 'OPTIMAL'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GlobalInventory;
