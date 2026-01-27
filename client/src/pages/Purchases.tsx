import { useOutletContext } from 'react-router-dom';
import { Ship } from 'lucide-react';
import api from '../services/api';

const Purchases = () => {
    const { data, refreshData, setModal } = useOutletContext<any>() as any;
    const { orders } = data || {};

    const receiveOrder = async (id: string) => {
        try {
            await api.patch(`/orders/${id}/receive`);
            refreshData();
        } catch (e) { alert("Error receiving order"); }
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
                        <th>TRACKING</th>
                        <th>ACTION</th>
                    </tr>
                </thead>
                <tbody>
                    {orders?.map((o: any) => (
                        <tr key={o.id}>
                            <td>{o.orderNumber}</td>
                            <td style={{ fontWeight: 700 }}>{o.supplier?.name}</td>
                            <td>
                                <span className={`badge ${o.status === 'RECEIVED' ? 'badge-success' : (o.status === 'SHIPPED' ? 'badge-primary' : 'badge-warning')}`}>
                                    {o.status}
                                </span>
                            </td>
                            <td>${o.totalAmount.toFixed(2)}</td>
                            <td>
                                {o.trackingNumber ? (
                                    <div style={{ fontSize: '0.7rem' }}><b>{o.shippingCarrier}:</b> {o.trackingNumber}</div>
                                ) : <span style={{ color: 'var(--text-muted)' }}>No Tracking</span>}
                            </td>
                            <td>
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    {o.status === 'PENDING' && (
                                        <button className="btn btn-secondary" style={{ padding: '5px' }} onClick={() => setModal({ type: 'tracking_po', metadata: o })} title="Ship Order">
                                            <Ship size={14} />
                                        </button>
                                    )}
                                    {o.status !== 'RECEIVED' && (
                                        <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.7rem' }} onClick={() => receiveOrder(o.id)}>
                                            INWARD
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
