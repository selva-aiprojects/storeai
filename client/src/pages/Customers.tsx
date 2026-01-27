import { useOutletContext } from 'react-router-dom';
import { Plus, User, MapPin, Phone } from 'lucide-react';

const Customers = () => {
    const { data, setModal } = useOutletContext<any>();
    const { customers } = data || {};

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="section-header">Client Directory</div>
                <button className="btn btn-primary" onClick={() => setModal({ type: 'customers' })}>
                    <Plus size={16} style={{ marginRight: '8px' }} /> NEW CUSTOMER
                </button>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>CLIENT</th>
                            <th>CONTACT INFO</th>
                            <th>PRIMARY ADDRESS</th>
                            <th>ACTIVITY</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers?.map((c: any) => (
                            <tr key={c.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '32px', height: '32px', background: 'var(--bg-hover)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <User size={16} color="var(--accent-primary)" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700 }}>{c.name}</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{c.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                                        <Phone size={12} /> {c.phone || 'N/A'}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'flex-start', gap: '5px' }}>
                                        <MapPin size={14} color="var(--accent-danger)" style={{ marginTop: '2px' }} />
                                        <div>
                                            <div>{c.address || 'No Address Logged'}</div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{c.city} {c.zipCode}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className="badge" style={{ background: 'rgba(129, 140, 248, 0.1)', color: 'var(--accent-primary)' }}>
                                        {c.sales?.length || 0} ORDERS
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

export default Customers;
