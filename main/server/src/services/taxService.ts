export interface TaxRequest {
  country: string;
  region?: string; // State or Province
  amount: number;
}

export interface TaxResult {
  country: string;
  region: string;
  taxRatePercent: number;
  taxAmount: number;
  taxName: string;
}

export function calculateRegionalTax(req: TaxRequest): TaxResult {
  const country = (req.country || 'IN').toUpperCase();
  const region = (req.region || '').toUpperCase();
  const amount = req.amount || 0;

  // Multi-Jurisdiction Tax Matrix
  if (country === 'US' || country === 'USA') {
    const stateRates: Record<string, number> = {
      CA: 7.25, NY: 8.875, TX: 6.25, FL: 6.0, IL: 6.25, WA: 6.5
    };
    const rate = stateRates[region] || 6.5;
    return { country: 'US', region: region || 'Standard US State Tax', taxRatePercent: rate, taxAmount: Number(((amount * rate) / 100).toFixed(2)), taxName: `US Sales Tax (${region || 'State'})` };
  }

  if (['DE', 'FR', 'ES', 'IT', 'NL', 'EU'].includes(country)) {
    const vatRates: Record<string, number> = { DE: 19, FR: 20, ES: 21, IT: 22, NL: 21 };
    const rate = vatRates[country] || 20;
    return { country, region: 'EU Member State', taxRatePercent: rate, taxAmount: Number(((amount * rate) / 100).toFixed(2)), taxName: `EU Standard VAT (${country})` };
  }

  if (['AE', 'SA', 'QA', 'GCC'].includes(country)) {
    const rate = country === 'SA' ? 15 : 5;
    return { country, region: 'GCC Region', taxRatePercent: rate, taxAmount: Number(((amount * rate) / 100).toFixed(2)), taxName: `GCC VAT (${rate}%)` };
  }

  // Default India GST (18%)
  const rate = 18;
  return { country: 'IN', region: region || 'India GST', taxRatePercent: rate, taxAmount: Number(((amount * rate) / 100).toFixed(2)), taxName: 'GST (18% Standard)' };
}
