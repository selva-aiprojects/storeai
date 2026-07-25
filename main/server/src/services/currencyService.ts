export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rateVsUSD: number; // exchange rate relative to 1 USD
  flag: string;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyRate> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', rateVsUSD: 1.0, flag: '🇺🇸' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', rateVsUSD: 0.92, flag: '🇪🇺' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', rateVsUSD: 0.78, flag: '🇬🇧' },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', rateVsUSD: 83.5, flag: '🇮🇳' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rateVsUSD: 155.2, flag: '🇯🇵' },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', rateVsUSD: 1.37, flag: '🇨🇦' },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rateVsUSD: 1.51, flag: '🇦🇺' },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'AED', rateVsUSD: 3.67, flag: '🇦🇪' },
};

export function convertCurrency(amount: number, fromCode: string, toCode: string): number {
  const fromCurrency = SUPPORTED_CURRENCIES[fromCode.toUpperCase()] || SUPPORTED_CURRENCIES.USD;
  const toCurrency = SUPPORTED_CURRENCIES[toCode.toUpperCase()] || SUPPORTED_CURRENCIES.USD;

  // Convert from source currency to USD first, then to target currency
  const amountInUSD = amount / fromCurrency.rateVsUSD;
  const converted = amountInUSD * toCurrency.rateVsUSD;
  
  return Math.round(converted * 100) / 100;
}

export function formatCurrencyAmount(amount: number, currencyCode: string): string {
  const curr = SUPPORTED_CURRENCIES[currencyCode.toUpperCase()] || SUPPORTED_CURRENCIES.USD;
  return `${curr.symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
