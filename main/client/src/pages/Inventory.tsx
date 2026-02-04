import { useOutletContext } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

const Inventory = () => {
    const { data, setModal, refreshData } = useOutletContext<any>() as any; // Cast to bypass strict type for now
    const { products } = data || {};

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to remove this item? This action will be permanent in the business logs.')) {
            try {
                const { deleteProduct } = await import('../services/api');
                await deleteProduct(id);
                refreshData('essential');
            } catch (e: any) {
                alert("Decommissioning Error: " + (e.response?.data?.error || e.message));
            }
        }
    };

    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ITEM</th>
                        <th>CATEGORY</th>
                        <th>PRICING & TAX</th>
                        <th>COST & LOGISTICS</th>
                        <th>STOCK (UOM)</th>
                        <th>STATUS</th>
                        <th>ACTION</th>
                    </tr>
                </thead>
                <tbody>
                    {products?.filter((i: any) => !i.isDeleted).map((p: any) => (
                        <tr key={p.id}>
                            <td>
                                <b>{p.name}</b>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>SKU: {p.sku}</div>
                            </td>
                            <td><span className="badge" style={{ background: '#f1f5f9', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }}>{p.category?.name || 'Uncategorized'}</span></td>
                            <td>
                                <div><b style={{ color: 'var(--primary-600)' }}>₹{p.price?.toFixed(2)}</b></div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>GST: {p.gstRate}% | Other: {p.otherTaxRate}%</div>
                            </td>
                            <td>
                                <div><b>₹{p.costPrice?.toFixed(2)}</b></div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Transport: ₹{p.transportationCost?.toFixed(2)}</div>
                            </td>
                            <td><b style={{ color: 'var(--text-primary)' }}>{p.stockQuantity}</b> <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.unit}</span></td>
                            <td>
                                <span className={`badge ${p.stockQuantity <= (p.lowStockThreshold || 10) ? 'badge-danger' : 'badge-success'}`} style={{ borderRadius: '6px' }}>
                                    {p.stockQuantity <= (p.lowStockThreshold || 10) ? 'REORDER' : 'OPTIMAL'}
                                </span>
                            </td>
                            <td>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                                    <button className="btn btn-secondary" style={{ padding: '6px 8px', fontSize: '0.65rem', height: '28px' }} onClick={() => setModal({ type: 'pricing_rule', metadata: p })}>
                                        RULES
                                    </button>
                                    <button className="btn btn-secondary" style={{ padding: '6px 8px', fontSize: '0.65rem', height: '28px' }} onClick={() => setModal({ type: 'view_batches', metadata: p })}>
                                        BATCHES
                                    </button>
                                    <button className="btn btn-secondary" style={{ padding: '6px 8px', color: 'var(--danger)', borderColor: '#fee2e2', height: '28px' }} onClick={() => handleDelete(p.id)}>
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </td>

                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Inventory;
