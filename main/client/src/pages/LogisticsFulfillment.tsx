import React, { useState } from 'react';
import { Truck, Package, CheckCircle2, ArrowRight } from 'lucide-react';

export const LogisticsFulfillment: React.FC = () => {
  const [shipments, setShipments] = useState([
    { awb: 'AWB-FEDEX-908123', orderId: 'ORD-8821', carrier: 'FedEx Express', carrierIcon: '📦', recipient: 'Rahul Verma (Mumbai, IN)', status: 'IN_TRANSIT', eta: '2026-07-27' },
    { awb: 'AWB-DHL-441092', orderId: 'ORD-8845', carrier: 'DHL Express Global', carrierIcon: '✈️', recipient: 'Elena Rostova (Berlin, DE)', status: 'OUT_FOR_DELIVERY', eta: '2026-07-26' },
    { awb: 'AWB-DELHIVERY-102938', orderId: 'ORD-8890', carrier: 'Delhivery Surface', carrierIcon: '🚛', recipient: 'Suresh Kumar (Bengaluru, IN)', status: 'DELIVERED', eta: '2026-07-24' }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [recipient, setRecipient] = useState('');
  const [carrier, setCarrier] = useState('FedEx Express');

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !recipient) return;
    const awb = `AWB-${carrier.substring(0, 3).toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;
    setShipments([{ awb, orderId, carrier, carrierIcon: carrier.includes('DHL') ? '✈️' : '📦', recipient, status: 'LABEL_CREATED', eta: '2026-07-28' }, ...shipments]);
    setShowModal(false);
    setOrderId(''); setRecipient('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Logistics &amp; AWB Tracking Hub</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>Carrier integrations, automated shipping labels &amp; real-time delivery tracking</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: 'var(--module-inventory)', color: '#fff', border: 'none', borderRadius: 'var(--radius-lg)', padding: '10px 16px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Truck size={16} /> + Generate AWB Shipping Label
        </button>
      </div>

      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '20px', boxShadow: 'var(--shadow-sm)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)', textAlign: 'left', background: 'var(--bg-hover)' }}>
              <th style={{ padding: '10px 12px' }}>AWB NUMBER</th>
              <th style={{ padding: '10px 12px' }}>ORDER ID</th>
              <th style={{ padding: '10px 12px' }}>CARRIER</th>
              <th style={{ padding: '10px 12px' }}>DESTINATION / RECIPIENT</th>
              <th style={{ padding: '10px 12px' }}>EST. DELIVERY</th>
              <th style={{ padding: '10px 12px' }}>STATUS</th>
              <th style={{ padding: '10px 12px' }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {shipments.map(s => (
              <tr key={s.awb} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 800, color: 'var(--module-inventory)' }}>{s.awb}</td>
                <td style={{ padding: '12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{s.orderId}</td>
                <td style={{ padding: '12px', fontWeight: 600 }}>{s.carrierIcon} {s.carrier}</td>
                <td style={{ padding: '12px', color: 'var(--text-primary)' }}>{s.recipient}</td>
                <td style={{ padding: '12px', color: 'var(--text-secondary)' }}>{s.eta}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-full)',
                    background: s.status === 'DELIVERED' ? 'var(--status-success-light)' : 'var(--status-info-light)',
                    color: s.status === 'DELIVERED' ? 'var(--status-success-dark)' : 'var(--status-info-dark)',
                    border: s.status === 'DELIVERED' ? '1px solid var(--status-success)' : '1px solid var(--status-info)'
                  }}>
                    {s.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td style={{ padding: '12px' }}>
                  <button onClick={() => alert(`Tracking ${s.awb} via ${s.carrier} real-time GPS portal`)} style={{ background: 'transparent', border: '1px solid var(--border-default)', padding: '4px 8px', borderRadius: 'var(--radius-md)', fontSize: '0.65rem', fontWeight: 700, cursor: 'pointer', color: 'var(--module-dashboard)' }}>
                    Track Order ↗
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', maxWidth: '440px', width: '100%', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 800 }}>Dispatch Shipment Label (AWB)</h3>
            <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Order Reference ID *</label>
                <input required placeholder="e.g. ORD-9912" value={orderId} onChange={e => setOrderId(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '0.8rem', background: 'var(--bg-body)', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Logistics Partner Carrier</label>
                <select value={carrier} onChange={e => setCarrier(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '0.8rem', background: 'var(--bg-body)' }}>
                  <option value="DHL Express Global">✈️ DHL Express Global (Air Dispatch)</option>
                  <option value="FedEx Priority International">📦 FedEx Priority International</option>
                  <option value="Aramex Express">🚚 Aramex Express</option>
                  <option value="Delhivery Surface / Express">🚛 Delhivery Express</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Recipient Name &amp; Destination Address *</label>
                <input required placeholder="Recipient Name, City, Country" value={recipient} onChange={e => setRecipient(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '0.8rem', background: 'var(--bg-body)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)', background: 'var(--bg-hover)', fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--module-inventory)', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Generate AWB</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
