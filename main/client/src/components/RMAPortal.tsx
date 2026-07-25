import React, { useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';

export interface ReturnRequest {
  id: string;
  orderId: string;
  productName: string;
  quantity: number;
  reason: string;
  condition: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REFUNDED';
  refundAmountUSD: number;
  createdAt: string;
}

const INITIAL_RETURNS: ReturnRequest[] = [
  { id: 'RMA-9081', orderId: 'ORD-8821', productName: 'Wireless Noise-Canceling Headphones', quantity: 1, reason: 'Size / Fit Issue', condition: 'Unopened', status: 'APPROVED', refundAmountUSD: 199.99, createdAt: '2026-07-21' },
  { id: 'RMA-9082', orderId: 'ORD-8845', productName: 'Ergonomic Mechanical Keyboard', quantity: 1, reason: 'Defective / Key switch stutter', condition: 'Opened', status: 'PENDING', refundAmountUSD: 149.50, createdAt: '2026-07-24' },
];

const STATUS_STYLES: Record<string, { background: string; color: string; border: string }> = {
  APPROVED: { background: 'var(--status-success-light)', color: 'var(--status-success-dark)', border: '1px solid var(--status-success)' },
  PENDING: { background: 'var(--status-warning-light)', color: 'var(--status-warning-dark)', border: '1px solid var(--status-warning)' },
  REFUNDED: { background: 'var(--status-info-light)', color: 'var(--status-info-dark)', border: '1px solid var(--status-info)' },
  REJECTED: { background: 'var(--status-danger-light)', color: 'var(--status-danger-dark)', border: '1px solid var(--status-danger)' },
};

export const RMAPortal: React.FC = () => {
  const { format } = useCurrency();
  const [returns, setReturns] = useState<ReturnRequest[]>(INITIAL_RETURNS);
  const [showModal, setShowModal] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [productName, setProductName] = useState('');
  const [reason, setReason] = useState('DEFECTIVE');
  const [condition, setCondition] = useState('OPENED');
  const [comments, setComments] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !productName) return;
    setReturns([{ id: `RMA-${Math.floor(1000 + Math.random() * 9000)}`, orderId, productName, quantity: 1, reason, condition, status: 'PENDING', refundAmountUSD: 129.99, createdAt: new Date().toISOString().split('T')[0] }, ...returns]);
    setShowModal(false);
    setOrderId(''); setProductName(''); setComments('');
  };

  const card = { background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '0.8rem', color: 'var(--text-primary)', background: 'var(--bg-body)', outline: 'none', boxSizing: 'border-box' };
  const selectStyle: React.CSSProperties = { ...inputStyle };

  return (
    <div style={{ ...card, padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ padding: '10px', background: 'var(--module-purchases-bg)', border: '1px solid var(--module-purchases-light)', borderRadius: 'var(--radius-lg)', color: 'var(--module-purchases)' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" /></svg>
          </div>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', margin: 0 }}>Self-Service Returns &amp; RMA Portal</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', margin: '2px 0 0' }}>Initiate global returns, track inspection and receive refunds</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: 'var(--module-purchases)', color: '#fff', border: 'none', borderRadius: 'var(--radius-lg)', padding: '8px 16px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-purchases)' }}
        >
          + Start New Return
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-default)' }}>
              {['RMA #', 'Order ID', 'Product', 'Reason', 'Est. Refund', 'Status', 'Date'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 12px', color: 'var(--text-muted)', fontWeight: 700, background: 'var(--bg-hover)', fontSize: '0.7rem' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {returns.map(rma => (
              <tr key={rma.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--module-purchases)' }}>{rma.id}</td>
                <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: 'var(--text-secondary)' }}>{rma.orderId}</td>
                <td style={{ padding: '10px 12px', fontWeight: 500, color: 'var(--text-primary)' }}>{rma.productName}</td>
                <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{rma.reason}</td>
                <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--status-success)' }}>{format(rma.refundAmountUSD)}</td>
                <td style={{ padding: '10px 12px' }}>
                  <span style={{ ...STATUS_STYLES[rma.status], padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.65rem', fontWeight: 700 }}>
                    {rma.status}
                  </span>
                </td>
                <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{rma.createdAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', maxWidth: '460px', width: '100%', padding: '24px', boxShadow: 'var(--shadow-2xl)' }}>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '16px' }}>Request Order Return (RMA)</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Order Reference ID *</label>
                <input required value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="e.g. ORD-9999" style={inputStyle} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Product Name *</label>
                <input required value={productName} onChange={e => setProductName(e.target.value)} placeholder="Name of item to return" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Return Reason</label>
                  <select value={reason} onChange={e => setReason(e.target.value)} style={selectStyle}>
                    <option value="DEFECTIVE">Defective / Malfunctioning</option>
                    <option value="SIZE_FIT_ISSUE">Size or Fit Issue</option>
                    <option value="WRONG_ITEM">Wrong Item Received</option>
                    <option value="NOT_AS_DESCRIBED">Not as Described</option>
                    <option value="CHANGED_MIND">Changed Mind</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Package Condition</label>
                  <select value={condition} onChange={e => setCondition(e.target.value)} style={selectStyle}>
                    <option value="UNOPENED">Unopened Box</option>
                    <option value="OPENED">Opened / Like New</option>
                    <option value="DAMAGED">Damaged in Transit</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Additional Notes</label>
                <textarea rows={2} value={comments} onChange={e => setComments(e.target.value)} placeholder="Explain reason for return..." style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)', background: 'var(--bg-hover)', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--module-purchases)', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: '0.8rem', boxShadow: 'var(--shadow-purchases)' }}>Submit Return</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
