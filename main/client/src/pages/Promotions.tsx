import React, { useState } from 'react';
import { Tag, Zap, Percent, CheckCircle, Plus } from 'lucide-react';

export const Promotions: React.FC = () => {
  const [coupons, setCoupons] = useState([
    { code: 'WELCOME10', type: 'PERCENT', value: 10, minSpend: 500, status: 'ACTIVE', uses: 142 },
    { code: 'STOREAI500', type: 'FLAT', value: 500, minSpend: 2000, status: 'ACTIVE', uses: 89 },
    { code: 'VIP20', type: 'PERCENT', value: 20, minSpend: 1500, status: 'ACTIVE', uses: 34 }
  ]);
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [type, setType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [value, setValue] = useState(15);
  const [minSpend, setMinSpend] = useState(1000);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setCoupons([{ code: code.toUpperCase(), type, value: Number(value), minSpend: Number(minSpend), status: 'ACTIVE', uses: 0 }, ...coupons]);
    setShowModal(false);
    setCode('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Promotions &amp; Coupon Engine</h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>Manage discount codes, campaign rules &amp; promotional pricing</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{ background: 'var(--module-dashboard)', color: '#fff', border: 'none', borderRadius: 'var(--radius-lg)', padding: '10px 16px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Plus size={16} /> Create Campaign Coupon
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {coupons.map((c) => (
          <div key={c.code} style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '18px', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.9rem', color: 'var(--module-sales)', background: 'var(--module-sales-bg)', padding: '4px 10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--module-sales-light)' }}>
                🏷️ {c.code}
              </span>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'var(--status-success-light)', color: 'var(--status-success-dark)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
                {c.status}
              </span>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {c.type === 'PERCENT' ? `${c.value}% OFF` : `₹${c.value} FLAT DISCOUNT`}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 12px' }}>
              Min Order Spend: <strong>₹{c.minSpend}</strong>
            </p>
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '10px', fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Total Redeemed:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{c.uses} orders</strong>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.7)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-2xl)', maxWidth: '420px', width: '100%', padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 800 }}>Create New Promotional Code</h3>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Coupon Code *</label>
                <input required placeholder="e.g. FESTIVE25" value={code} onChange={e => setCode(e.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '0.8rem', background: 'var(--bg-body)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Discount Type</label>
                  <select value={type} onChange={e => setType(e.target.value as any)} style={{ width: '100%', padding: '8px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '0.8rem', background: 'var(--bg-body)' }}>
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FLAT">Flat Cash Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Value</label>
                  <input type="number" required value={value} onChange={e => setValue(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '0.8rem', background: 'var(--bg-body)', boxSizing: 'border-box' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Minimum Order Spend (₹)</label>
                <input type="number" required value={minSpend} onChange={e => setMinSpend(Number(e.target.value))} style={{ width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '0.8rem', background: 'var(--bg-body)', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-default)', background: 'var(--bg-hover)', fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '10px', borderRadius: 'var(--radius-lg)', border: 'none', background: 'var(--module-dashboard)', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Create Coupon</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
