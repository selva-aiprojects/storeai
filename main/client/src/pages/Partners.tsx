import { useOutletContext } from 'react-router-dom';
import { Plus, Phone, Mail, Award, Ban } from 'lucide-react';

const Partners = () => {
    const { data, setModal } = useOutletContext<any>();
    const { suppliers } = data || {};

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="section-header">Supplier Partners</div>
                <button className="btn btn-primary" onClick={() => setModal({ type: 'suppliers' })}>
                    <Plus size={16} style={{ marginRight: '8px' }} /> ONBOARD PARTNER
                </button>
            </div>

            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>VENDOR</th>
                            <th>CONNECT</th>
                            <th>STATUS</th>
                            <th>KPI / RATING</th>
                            <th>FINANCIAL TERMS</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers?.filter((s: any) => !s.isDeleted).map((s: any) => (
                            <tr key={s.id}>
                                <td>
                                    <div style={{ fontWeight: 700 }}>{s.name}</div>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>ID: {s.id.slice(0, 8)}</div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                                            <Mail size={12} color="var(--accent-primary)" /> {s.email}
                                        </div>
                                        {s.contact && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                                                <Phone size={12} color="var(--accent-primary)" /> {s.contact}
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${s.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}`}>
                                        {s.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Award size={14} color="#fbbf24" />
                                        <span style={{ fontWeight: 700 }}>{s.rating?.toFixed(1) || '5.0'}</span>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '0.8rem' }}>{s.paymentTerms || 'Standard (Net 30)'}</div>
                                    {s.taxId && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>TAX: {s.taxId}</div>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Partners;
