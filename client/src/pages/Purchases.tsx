import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Ship, CheckCircle, Package, ArrowRight, ClipboardList, Briefcase } from 'lucide-react';
import { approveOrder } from '../services/api';

const Purchases = () => {
    const { data, refreshData, setModal, user } = useOutletContext<any>() as any;
    const { orders, requisitions } = data || {};
    const [tab, setTab] = useState('orders'); // orders | requisitions

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
        if (['APPROVED', 'SHIPPED', 'COMPLETED', 'RECEIVED', 'ORDERED'].includes(status)) color = 'badge-success';
        if (status === 'REJECTED' || status === 'CANCELLED') color = 'badge-danger';
        return <span className={`badge ${color}`}>{status}</span>;
    };

    return (
        <div>
            {/* Procurement Hub Header */}
            <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <button
                    onClick={() => setTab('orders')}
                    style={{
                        background: 'none', border: 'none', color: tab === 'orders' ? 'var(--accent-primary)' : 'var(--text-muted)',
                        fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', padding: '10px 20px',
                        borderBottom: tab === 'orders' ? '2px solid var(--accent-primary)' : 'none'
                    }}
                >
                    <Briefcase size={14} style={{ marginRight: '6px' }} /> PURCHASE ORDERS
                </button>
                <button
                    onClick={() => setTab('requisitions')}
                    style={{
                        background: 'none', border: 'none', color: tab === 'requisitions' ? 'var(--accent-primary)' : 'var(--text-muted)',
                        fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', padding: '10px 20px',
                        borderBottom: tab === 'requisitions' ? '2px solid var(--accent-primary)' : 'none'
                    }}
                >
                    <ClipboardList size={14} style={{ marginRight: '6px' }} /> DEMAND REQUISITIONS
                </button>
            </div>

            <div className="table-container">
                {tab === 'orders' ? (
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
                                    <td><b>{o.orderNumber}</b><div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(o.createdAt).toLocaleDateString()}</div></td>
                                    <td style={{ fontWeight: 700 }}>{o.supplier?.name}</td>
                                    <td><StatusBadge status={o.status} /></td>
                                    <td>${o.totalAmount.toFixed(2)}</td>
                                    <td>{o.trackingNumber ? <div style={{ fontSize: '0.7rem' }}><b>{o.shippingCarrier}:</b> {o.trackingNumber}</div> : <span style={{ color: 'var(--text-muted)' }}>--</span>}</td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            {(o.status === 'DRAFT' || o.status === 'PENDING') && (
                                                <button className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.7rem', color: 'var(--accent-success)' }} onClick={() => handleApprove(o.id)}>
                                                    <CheckCircle size={14} /> APPROVE
                                                </button>
                                            )}
                                            {o.status === 'APPROVED' && <button className="btn btn-secondary" style={{ padding: '5px' }} onClick={() => setModal({ type: 'tracking_po', metadata: o })}><Ship size={14} /></button>}
                                            {['APPROVED', 'SHIPPED', 'PARTIAL_RECEIVED'].includes(o.status) && <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.7rem' }} onClick={() => setModal({ type: 'grn', metadata: o })}><Package size={14} /> INWARD</button>}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>REQUISITION #</th>
                                <th>PRIORITY</th>
                                <th>REQUESTED BY</th>
                                <th>ARTIFACTS</th>
                                <th>STATUS</th>
                                <th>ACTION</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requisitions?.map((r: any) => (
                                <tr key={r.id}>
                                    <td><b>{r.requisitionNo}</b><div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</div></td>
                                    <td>
                                        <span className={`badge ${r.priority === 'URGENT' || r.priority === 'HIGH' ? 'badge-danger' : 'badge-warning'}`}>
                                            {r.priority}
                                        </span>
                                    </td>
                                    <td>{r.requestedBy?.firstName} {r.requestedBy?.lastName}</td>
                                    <td>{r.items?.length} Items</td>
                                    <td><StatusBadge status={r.status} /></td>
                                    <td>
                                        {r.status === 'PENDING' && (
                                            <button
                                                className="btn btn-primary"
                                                style={{ padding: '6px 12px', fontSize: '0.7rem' }}
                                                onClick={() => setModal({ type: 'purchases', metadata: { items: r.items.map((i: any) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.product?.costPrice || 0 })) } })}
                                            >
                                                CONVERT TO PO <ArrowRight size={12} style={{ marginLeft: '4px' }} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Purchases;
