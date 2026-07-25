import React from 'react';
import { useCurrency, DEFAULT_CURRENCIES } from '../context/CurrencyContext';

export const CurrencySelector: React.FC = () => {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="relative inline-flex items-center gap-1.5">
      <span style={{ fontSize: '0.75rem', color: 'var(--module-sales)' }}>&#36;</span>
      <select
        value={currency}
        onChange={(e) => setCurrency(e.target.value)}
        style={{
          background: 'var(--sidebar-bg)',
          color: 'var(--text-on-dark)',
          fontSize: '0.75rem',
          fontWeight: 600,
          padding: '4px 10px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--sidebar-border)',
          outline: 'none',
          cursor: 'pointer',
          transition: 'border var(--transition-fast)',
        }}
        title="Select Store Currency"
      >
        {Object.values(DEFAULT_CURRENCIES).map((curr) => (
          <option key={curr.code} value={curr.code}>
            {curr.flag} {curr.code} ({curr.symbol})
          </option>
        ))}
      </select>
    </div>
  );
};
