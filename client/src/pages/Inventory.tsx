import { useOutletContext } from 'react-router-dom';
import { Trash2 } from 'lucide-react';

const Inventory = () => {
    const { data, setModal, refreshData } = useOutletContext<any>() as any; // Cast to bypass strict type for now
    const { products } = data || {};

    const handleDelete = async (id: string) => {
        if (window.confirm('Are you sure you want to decommission this artifact? This action is immutable in the audit logs.')) {
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
                        <th>ARTIFACT</th>
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
                            <td><span className="badge" style={{ background: 'rgba(255,255,255,0.05)' }}>{p.category?.name || 'Uncategorized'}</span></td>
                            <td>
                                <div><b>${p.price?.toFixed(2)}</b></div>
                                <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>GST: {p.gstRate}% | Other: {p.otherTaxRate}%</div>
                            </td>
                            <td>
                                <div><b>${p.costPrice?.toFixed(2)}</b></div>
                                <div style={{ fontSize: '0.65rem', opacity: 0.6 }}>Transport: ${p.transportationCost?.toFixed(2)}</div>
                            </td>
                            <td><b>{p.stockQuantity}</b> <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{p.unit}</span></td>
                            <td>
                                <span className={`badge ${p.stockQuantity <= (p.lowStockThreshold || 10) ? 'badge-danger' : 'badge-success'}`}>
                                    {p.stockQuantity <= (p.lowStockThreshold || 10) ? 'REORDER' : 'OPTIMAL'}
                                </span>
                            </td>
                            <td>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.7rem' }} title="Pricing Rules" onClick={() => setModal({ type: 'pricing_rule', metadata: p })}>
                                        RULES
                                    </button>
                                    <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.7rem' }} title="View Batches" onClick={() => setModal({ type: 'view_batches', metadata: p })}>
                                        BATCHES
                                    </button>
                                    <button className="btn btn-secondary" style={{ padding: '6px 10px', color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }} onClick={() => handleDelete(p.id)}>
                                        <Trash2 size={14} />
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
