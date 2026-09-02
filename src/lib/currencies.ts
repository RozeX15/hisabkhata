import { CurrencyInfo } from '../types';

export const supportedCurrencies: Record<string, CurrencyInfo> = {
  BDT: {
    code: 'BDT',
    symbol: '৳',
    name: 'Bangladeshi Taka',
    exchangeRateToUSD: 0.0084, // 1 USD ~ 119 BDT
    decimalPlaces: 2,
    symbolPlacement: 'before',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    exchangeRateToUSD: 1.0,
    decimalPlaces: 2,
    symbolPlacement: 'before',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    exchangeRateToUSD: 1.08,
    decimalPlaces: 2,
    symbolPlacement: 'before',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    exchangeRateToUSD: 1.28,
    decimalPlaces: 2,
    symbolPlacement: 'before',
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    name: 'Indian Rupee',
    exchangeRateToUSD: 0.012,
    decimalPlaces: 2,
    symbolPlacement: 'before',
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    name: 'Chinese Yuan',
    exchangeRateToUSD: 0.14,
    decimalPlaces: 2,
    symbolPlacement: 'before',
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    name: 'Japanese Yen',
    exchangeRateToUSD: 0.0068,
    decimalPlaces: 0,
    symbolPlacement: 'before',
  },
  KRW: {
    code: 'KRW',
    symbol: '₩',
    name: 'South Korean Won',
    exchangeRateToUSD: 0.00075,
    decimalPlaces: 0,
    symbolPlacement: 'before',
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    name: 'UAE Dirham',
    exchangeRateToUSD: 0.27,
    decimalPlaces: 2,
    symbolPlacement: 'after',
  },
  SAR: {
    code: 'SAR',
    symbol: '﷼',
    name: 'Saudi Riyal',
    exchangeRateToUSD: 0.27,
    decimalPlaces: 2,
    symbolPlacement: 'after',
  },
  CAD: {
    code: 'CAD',
    symbol: 'CA$',
    name: 'Canadian Dollar',
    exchangeRateToUSD: 0.73,
    decimalPlaces: 2,
    symbolPlacement: 'before',
  },
  AUD: {
    code: 'AUD',
    symbol: 'AU$',
    name: 'Australian Dollar',
    exchangeRateToUSD: 0.65,
    decimalPlaces: 2,
    symbolPlacement: 'before',
  },
};

export function formatMoney(amount: number, currencyCode: string = 'BDT', locale: string = 'en-US'): string {
  const curr = supportedCurrencies[currencyCode] || supportedCurrencies.BDT;
  const num = Number(amount) || 0;
  
  const formattedNumber = new Intl.NumberFormat(locale, {
    minimumFractionDigits: curr.decimalPlaces,
    maximumFractionDigits: curr.decimalPlaces,
  }).format(Math.abs(num));

  const sign = num < 0 ? '-' : '';

  if (curr.symbolPlacement === 'after') {
    return `${sign}${formattedNumber} ${curr.symbol}`;
  }
  return `${sign}${curr.symbol}${formattedNumber}`;
}

export function convertCurrency(amount: number, fromCurrency: string, toCurrency: string): number {
  if (fromCurrency === toCurrency) return amount;
  const fromRate = supportedCurrencies[fromCurrency]?.exchangeRateToUSD || 1;
  const toRate = supportedCurrencies[toCurrency]?.exchangeRateToUSD || 1;
  const inUSD = amount * fromRate;
  return inUSD / toRate;
}

export const formatCurrency = formatMoney;
