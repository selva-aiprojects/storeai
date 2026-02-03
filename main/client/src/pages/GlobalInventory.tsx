import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { getGlobalProducts } from '../services/api';
import { Package, Building2, Search, Filter } from 'lucide-react';

const GlobalInventory = () => {
    const { setModal } = useOutletContext<any>() as any;
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [tenantFilter, setTenantFilter] = useState('');

    const fetchGlobalData = async () => {
        setLoading(true);
        try {
            const resp = await getGlobalProducts();
            setProducts(resp.data);
        } catch (e) {
            console.error("Failed to fetch global inventory:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchGlobalData();
    }, []);

    const tenants = Array.from(new Set(products.map(p => p.tenant?.slug))).filter(Boolean);

    const filtered = products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
        const matchesTenant = !tenantFilter || p.tenant?.slug === tenantFilter;
        return matchesSearch && matchesTenant && !p.isDeleted;
    });

    return (
        <div className="page-container">
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <div>
                    <h1 className="page-title">
                        <Package size={28} />
                        Global Stock Master
                    </h1>
                    <p className="page-subtitle">Cross-tenant inventory monitoring & audit (Super Admin Only)</p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                        <input
                            type="text"
                            placeholder="Search SKU or Name..."
                            className="form-control"
                            style={{ paddingLeft: '36px', width: '250px' }}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="form-control"
                        value={tenantFilter}
                        onChange={(e) => setTenantFilter(e.target.value)}
                        style={{ width: '180px' }}
                    >
                        <option value="">All Organizations</option>
                        {tenants.map(t => (
                            <option key={t as string} value={t as string}>{t as string}</option>
                        ))}
                    </select>
                    <button className="btn btn-primary" onClick={fetchGlobalData}>Refresh</button>
                </div>
            </div>

            <div className="table-container card">
                <table>
                    <thead>
                        <tr>
                            <th>ORGANIZATION</th>
                            <th>ARTIFACT</th>
                            <th>CATEGORY</th>
                            <th>STOCK (UOM)</th>
                            <th>UNIT COST</th>
                            <th>MARKET PRICE</th>
                            <th>STATUS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>Loading platform data...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>No inventory found across tenants.</td></tr>
                        ) : filtered.map((p: any) => (
                            <tr key={p.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Building2 size={14} style={{ opacity: 0.5 }} />
                                        <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '0.85rem' }}>
                                            {p.tenant?.name?.toUpperCase() || 'UNKNOWN'}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.65rem', opacity: 0.5 }}>Slug: {p.tenant?.slug}</div>
                                </td>
                                <td>
                                    <b>{p.name}</b>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>
                                </td>
                                <td><span className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>{p.category?.name || 'Uncategorized'}</span></td>
                                <td><b>{p.stockQuantity}</b> <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{p.unit}</span></td>
                                <td>${p.costPrice?.toFixed(2)}</td>
                                <td><b>${p.price?.toFixed(2)}</b></td>
                                <td>
                                    <span className={`badge ${p.stockQuantity <= (p.lowStockThreshold || 10) ? 'badge-danger' : 'badge-success'}`}>
                                        {p.stockQuantity <= (p.lowStockThreshold || 10) ? 'REORDER' : 'OPTIMAL'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GlobalInventory;
