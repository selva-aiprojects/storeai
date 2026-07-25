import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rateVsUSD: number;
  flag: string;
}

export const DEFAULT_CURRENCIES: Record<string, CurrencyRate> = {
  USD: { code: 'USD', name: 'US Dollar', symbol: '$', rateVsUSD: 1.0, flag: '🇺🇸' },
  EUR: { code: 'EUR', name: 'Euro', symbol: '€', rateVsUSD: 0.92, flag: '🇪🇺' },
  GBP: { code: 'GBP', name: 'British Pound', symbol: '£', rateVsUSD: 0.78, flag: '🇬🇧' },
  INR: { code: 'INR', name: 'Indian Rupee', symbol: '₹', rateVsUSD: 83.5, flag: '🇮🇳' },
  JPY: { code: 'JPY', name: 'Japanese Yen', symbol: '¥', rateVsUSD: 155.2, flag: '🇯🇵' },
  CAD: { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', rateVsUSD: 1.37, flag: '🇨🇦' },
  AUD: { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', rateVsUSD: 1.51, flag: '🇦🇺' },
  AED: { code: 'AED', name: 'UAE Dirham', symbol: 'AED', rateVsUSD: 3.67, flag: '🇦🇪' },
};

interface CurrencyContextType {
  currency: string;
  setCurrency: (code: string) => void;
  currencies: Record<string, CurrencyRate>;
  convert: (amountInUSD: number) => number;
  format: (amountInUSD: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: 'USD',
  setCurrency: () => {},
  currencies: DEFAULT_CURRENCIES,
  convert: (amt) => amt,
  format: (amt) => `$${amt.toFixed(2)}`,
});

export const CurrencyProvider: React.FC<{ children: React.ReactNode; tenantCurrency?: string }> = ({
  children,
  tenantCurrency
}) => {
  const [currency, setCurrencyState] = useState<string>(() => {
    return localStorage.getItem('storeai_currency') || tenantCurrency || 'INR';
  });

  // Automatically update currency when tenantCurrency details are fetched
  useEffect(() => {
    if (tenantCurrency && !localStorage.getItem('storeai_currency')) {
      setCurrencyState(tenantCurrency.toUpperCase());
    }
  }, [tenantCurrency]);

  const setCurrency = (code: string) => {
    setCurrencyState(code.toUpperCase());
    localStorage.setItem('storeai_currency', code.toUpperCase());
  };

  const activeCurrency = DEFAULT_CURRENCIES[currency] || DEFAULT_CURRENCIES.USD;

  const convert = (amountInUSD: number): number => {
    const val = amountInUSD * activeCurrency.rateVsUSD;
    return Math.round(val * 100) / 100;
  };

  const format = (amountInUSD: number): string => {
    const val = convert(amountInUSD);
    return `${activeCurrency.symbol}${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, currencies: DEFAULT_CURRENCIES, convert, format }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);
