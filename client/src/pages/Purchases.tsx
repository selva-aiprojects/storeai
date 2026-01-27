import { useOutletContext } from 'react-router-dom';
import { Ship, CheckCircle, Package } from 'lucide-react';
import { approveOrder } from '../services/api';

const Purchases = () => {
    const { data, refreshData, setModal, user } = useOutletContext<any>() as any;
    const { orders } = data || {};

    const handleApprove = async (id: string) => {
        if (confirm('Approve this Purchase Order? This will commit funds to the ledger.')) {
            try {
                await approveOrder(id, user.id);
                refreshData();
            } catch (e: any) { alert("Error approving order: " + e.message); }
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        let color = 'badge-warning';
        if (status === 'APPROVED') color = 'badge-primary';
        if (status === 'SHIPPED') color = 'badge-primary'; // Or distinct color
        if (status === 'PARTIAL_RECEIVED') color = 'badge-warning'; // Orange
        if (status === 'COMPLETED' || status === 'RECEIVED') color = 'badge-success';
        if (status === 'CANCELLED') color = 'badge-danger';

        return <span className={`badge ${color}`}>{status}</span>;
    };

    return (
        <div className="table-container">
            <table>
                <thead>
                    <tr>
                        <th>P.O. REF</th>
                        <th>PARTNER</th>
                        <th>STATUS</th>
                        <th>VALUATION</th>
                        <th>LOGISTICS</th>
                        <th>ACTION</th>
                    </tr>
                </thead>
                <tbody>
                    {orders?.map((o: any) => (
                        <tr key={o.id}>
                            <td>
                                <b>{o.orderNumber}</b>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleDateString()}</div>
                            </td>
                            <td style={{ fontWeight: 700 }}>
                                {o.supplier?.name}
                                {o.supplier?.status === 'BLOCKED' && <span style={{ color: 'red', fontSize: '0.6rem', marginLeft: '5px' }}>(BLOCKED)</span>}
                            </td>
                            <td><StatusBadge status={o.status} /></td>
                            <td>${o.totalAmount.toFixed(2)}</td>
                            <td>
                                {o.trackingNumber ? (
                                    <div style={{ fontSize: '0.7rem' }}><b>{o.shippingCarrier}:</b> {o.trackingNumber}</div>
                                ) : <span style={{ color: 'var(--text-muted)' }}>--</span>}
                            </td>
                            <td>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    {/* Action Logic based on Workflow State */}

                                    {(o.status === 'DRAFT' || o.status === 'PENDING') && (
                                        <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.7rem', color: 'var(--accent-success)', borderColor: 'var(--accent-success)' }} onClick={() => handleApprove(o.id)} title="Approve PO">
                                            <CheckCircle size={14} style={{ marginRight: '4px' }} /> APPROVE
                                        </button>
                                    )}

                                    {o.status === 'APPROVED' && (
                                        <button className="btn btn-secondary" style={{ padding: '5px' }} onClick={() => setModal({ type: 'tracking_po', metadata: o })} title="Add Tracking Info">
                                            <Ship size={14} />
                                        </button>
                                    )}

                                    {['APPROVED', 'SHIPPED', 'PARTIAL_RECEIVED'].includes(o.status) && (
                                        <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.7rem' }} onClick={() => setModal({ type: 'grn', metadata: o })}>
                                            <Package size={14} style={{ marginRight: '4px' }} /> INWARD
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Purchases;
