import React, { useState } from 'react';
import { useCurrency } from '../context/CurrencyContext';

export interface ProductVariant {
  id: string;
  sku: string;
  options: { color?: string; size?: string };
  priceAdjustmentUSD: number;
  stock: number;
}

interface ProductVariantSelectorProps {
  basePriceUSD: number;
  baseSKU: string;
  onVariantChange?: (variant: { sku: string; finalPriceUSD: number; stock: number; options: Record<string, string> }) => void;
}

const DEMO_VARIANTS: ProductVariant[] = [
  { id: 'v1', sku: 'SKU-BLK-S', options: { color: 'Midnight Black', size: 'S' }, priceAdjustmentUSD: 0, stock: 18 },
  { id: 'v2', sku: 'SKU-BLK-M', options: { color: 'Midnight Black', size: 'M' }, priceAdjustmentUSD: 10, stock: 24 },
  { id: 'v3', sku: 'SKU-BLK-L', options: { color: 'Midnight Black', size: 'L' }, priceAdjustmentUSD: 20, stock: 12 },
  { id: 'v4', sku: 'SKU-SLV-M', options: { color: 'Space Silver', size: 'M' }, priceAdjustmentUSD: 35, stock: 9 },
  { id: 'v5', sku: 'SKU-BLU-L', options: { color: 'Pacific Blue', size: 'L' }, priceAdjustmentUSD: 45, stock: 5 },
];

const COLORS = ['Midnight Black', 'Space Silver', 'Pacific Blue'];
const SIZES = ['S', 'M', 'L', 'XL'];

export const ProductVariantSelector: React.FC<ProductVariantSelectorProps> = ({ basePriceUSD, baseSKU, onVariantChange }) => {
  const { format } = useCurrency();
  const [selectedColor, setSelectedColor] = useState('Midnight Black');
  const [selectedSize, setSelectedSize] = useState('M');

  const activeVariant = DEMO_VARIANTS.find(v => v.options.color === selectedColor && v.options.size === selectedSize) || DEMO_VARIANTS[1];
  const finalPriceUSD = basePriceUSD + (activeVariant?.priceAdjustmentUSD || 0);

  const handleSelect = (color: string, size: string) => {
    const variant = DEMO_VARIANTS.find(v => v.options.color === color && v.options.size === size) || DEMO_VARIANTS[0];
    onVariantChange?.({ sku: variant.sku, finalPriceUSD: basePriceUSD + variant.priceAdjustmentUSD, stock: variant.stock, options: { color, size } });
  };

  return (
    <div style={{ background: 'var(--sidebar-bg)', border: '1px solid var(--sidebar-border)', borderRadius: 'var(--radius-xl)', padding: '16px', color: 'var(--text-on-dark)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--sidebar-border)', paddingBottom: '12px', marginBottom: '12px' }}>
        <span style={{ fontWeight: 700, fontSize: '0.8rem', color: 'var(--module-inventory)' }}>Product Variant Config</span>
        <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', background: 'rgba(14,165,233,0.1)', color: 'var(--module-inventory)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--module-inventory-bg)' }}>
          {activeVariant.sku}
        </span>
      </div>

      {/* Color */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Color Option</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => { setSelectedColor(c); handleSelect(c, selectedSize); }}
              style={{
                padding: '4px 12px', borderRadius: 'var(--radius-lg)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                background: selectedColor === c ? 'var(--module-sales)' : 'rgba(255,255,255,0.05)',
                color: selectedColor === c ? '#fff' : 'var(--text-muted)',
                border: selectedColor === c ? '1px solid var(--module-sales-light)' : '1px solid var(--sidebar-border)',
                transition: 'all var(--transition-fast)',
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Size */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Size / Dimension</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {SIZES.map(s => (
            <button
              key={s}
              onClick={() => { setSelectedSize(s); handleSelect(selectedColor, s); }}
              style={{
                padding: '4px 12px', borderRadius: 'var(--radius-lg)', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer',
                background: selectedSize === s ? 'var(--module-inventory)' : 'rgba(255,255,255,0.05)',
                color: selectedSize === s ? '#fff' : 'var(--text-muted)',
                border: selectedSize === s ? '1px solid var(--module-inventory-light)' : '1px solid var(--sidebar-border)',
                transition: 'all var(--transition-fast)',
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--sidebar-border)', paddingTop: '10px', fontSize: '0.7rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>Stock: <strong style={{ color: 'var(--text-on-dark)' }}>{activeVariant.stock} units</strong></span>
        <span style={{ color: 'var(--module-sales)', fontWeight: 700, fontSize: '0.875rem' }}>{format(finalPriceUSD)}</span>
      </div>
    </div>
  );
};
