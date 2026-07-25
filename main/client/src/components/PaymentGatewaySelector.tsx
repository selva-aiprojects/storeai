import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useCurrency } from '../context/CurrencyContext';

export interface PaymentGatewaySelectorProps {
  totalAmountUSD: number;
  onPaymentComplete?: (method: string, details: any) => void;
}

const GATEWAYS = [
  { id: 'stripe', name: 'Credit / Debit Card (Stripe)', subtitle: 'Visa, MasterCard, Amex', icon: '💳' },
  { id: 'paypal', name: 'PayPal Express', subtitle: 'Pay with PayPal balance or bank', icon: '🅿️' },
  { id: 'applepay', name: 'Apple Pay / Google Pay', subtitle: 'Instant 1-click biometric checkout', icon: '📱' },
  { id: 'klarna', name: 'Buy Now, Pay Later (Klarna)', subtitle: '4 interest-free installments', icon: '🏦' },
];

export const PaymentGatewaySelector: React.FC<PaymentGatewaySelectorProps> = ({ totalAmountUSD, onPaymentComplete }) => {
  const { t } = useLanguage();
  const { format, currency } = useCurrency();
  const [selected, setSelected] = useState<'stripe' | 'paypal' | 'applepay' | 'klarna'>('stripe');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setTimeout(() => {
      setProcessing(false);
      setSuccess(true);
      onPaymentComplete?.(selected, { gateway: selected, currency, amount: totalAmountUSD, transactionId: `TXN-${Math.floor(100000 + Math.random() * 900000)}` });
    }, 1200);
  };

  const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)', fontSize: '0.8rem', color: 'var(--text-primary)', background: 'var(--bg-body)', outline: 'none', boxSizing: 'border-box' };

  if (success) return (
    <div style={{ background: 'var(--status-success-light)', border: '1px solid var(--status-success)', borderRadius: 'var(--radius-xl)', padding: '24px', textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>✅</div>
      <h4 style={{ fontWeight: 700, color: 'var(--status-success-dark)', margin: '0 0 6px' }}>Global Payment Authorized!</h4>
      <p style={{ fontSize: '0.8rem', color: 'var(--status-success-dark)' }}>Charged {format(totalAmountUSD)} via {selected.toUpperCase()}. Order confirmed.</p>
    </div>
  );

  return (
    <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-xl)', padding: '24px', boxShadow: 'var(--shadow-sm)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
        <h3 style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)', margin: 0 }}>{t('payment_method')}</h3>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>{currency} · 256-bit SSL</span>
      </div>

      {/* Gateway Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
        {GATEWAYS.map(gw => {
          const isSelected = selected === gw.id;
          return (
            <button
              key={gw.id}
              type="button"
              onClick={() => setSelected(gw.id as any)}
              style={{
                padding: '12px', borderRadius: 'var(--radius-lg)', border: isSelected ? '1px solid var(--module-dashboard)' : '1px solid var(--border-default)',
                background: isSelected ? 'var(--module-dashboard-bg)' : 'var(--bg-hover)',
                textAlign: 'left', cursor: 'pointer', transition: 'all var(--transition-fast)',
                boxShadow: isSelected ? 'var(--shadow-dashboard)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1rem' }}>{gw.icon}</span>
                {isSelected && <span style={{ fontSize: '0.7rem', color: 'var(--module-dashboard)', fontWeight: 700 }}>✓</span>}
              </div>
              <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '6px' }}>{gw.name}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{gw.subtitle}</div>
            </button>
          );
        })}
      </div>

      {/* Detail Form */}
      <form onSubmit={handlePay} style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {selected === 'stripe' && (
          <>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Card Number</label>
              <input defaultValue="4242 •••• •••• 4242" style={{ ...inputStyle, fontFamily: 'monospace' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>Expiry</label>
                <input defaultValue="12/28" style={{ ...inputStyle, fontFamily: 'monospace' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>CVC</label>
                <input defaultValue="888" style={{ ...inputStyle, fontFamily: 'monospace' }} />
              </div>
            </div>
          </>
        )}
        {selected === 'paypal' && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>You will be redirected to PayPal to complete checkout in <strong>{currency}</strong>.</p>}
        {selected === 'klarna' && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Pay in 4 interest-free payments of <strong style={{ color: 'var(--status-success)' }}>{format(totalAmountUSD / 4)}</strong> every 2 weeks.</p>}
        {selected === 'applepay' && <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Confirm payment using Touch ID / Face ID on your device.</p>}

        <button
          type="submit"
          disabled={processing}
          style={{
            width: '100%', padding: '12px', borderRadius: 'var(--radius-lg)', border: 'none',
            background: processing ? 'var(--status-neutral)' : 'var(--status-success)',
            color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: processing ? 'not-allowed' : 'pointer',
            boxShadow: 'var(--shadow-sales)', transition: 'all var(--transition-fast)',
          }}
        >
          {processing ? 'Processing Verification...' : `Pay ${format(totalAmountUSD)}`}
        </button>
      </form>
    </div>
  );
};
