import { useState, useEffect } from 'react';
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

export function getExchangeRate(fromCurrency: string = 'BDT', toCurrency: string = 'USD'): number {
  if (fromCurrency === toCurrency) return 1;
  const fromRate = supportedCurrencies[fromCurrency]?.exchangeRateToUSD || 1;
  const toRate = supportedCurrencies[toCurrency]?.exchangeRateToUSD || 1;
  if (toRate === 0) return 1;
  return fromRate / toRate;
}

export function convertCurrency(amount: number, fromCurrency: string = 'BDT', toCurrency: string = 'BDT'): number {
  const num = Number(amount) || 0;
  if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) return num;
  
  const fromRate = supportedCurrencies[fromCurrency]?.exchangeRateToUSD || 1;
  const toRate = supportedCurrencies[toCurrency]?.exchangeRateToUSD || 1;
  
  if (toRate === 0) return num;
  
  const inUSD = num * fromRate;
  const converted = inUSD / toRate;
  return converted;
}

export function formatConvertedCurrency(
  amount: number,
  fromCurrency: string = 'BDT',
  toCurrency: string = 'BDT',
  locale: string = 'en-US'
): string {
  const converted = convertCurrency(amount, fromCurrency, toCurrency);
  return formatMoney(converted, toCurrency, locale);
}

export const formatCurrency = formatMoney;

// Real-time Exchange Rates synchronization
let isLiveRatesLoaded = false;
let lastRatesFetchTime = 0;

export async function fetchLiveExchangeRates(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  // Rate limit client fetches: max once per 10 minutes unless forced
  const now = Date.now();
  if (now - lastRatesFetchTime < 10 * 60 * 1000 && isLiveRatesLoaded) {
    return true;
  }

  try {
    // Try localStorage cache first if recent (< 1 hour)
    const cached = localStorage.getItem('hk_exchange_rates_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && now - parsed.timestamp < 60 * 60 * 1000 && parsed.rates) {
          applyRatesFromUsdBase(parsed.rates);
          isLiveRatesLoaded = true;
          lastRatesFetchTime = parsed.timestamp;
        }
      } catch (e) {
        // Cache parse error, proceed to network
      }
    }

    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { Accept: 'application/json' },
    });
    
    if (!response.ok) return false;
    const data = await response.json();

    if (data && data.rates) {
      applyRatesFromUsdBase(data.rates);
      isLiveRatesLoaded = true;
      lastRatesFetchTime = now;
      try {
        localStorage.setItem('hk_exchange_rates_cache', JSON.stringify({
          rates: data.rates,
          timestamp: now,
        }));
      } catch (e) {
        // Storage quota or privacy mode safe
      }
      window.dispatchEvent(new CustomEvent('hk_rates_updated'));
      return true;
    }
  } catch (err) {
    console.warn('Could not fetch live exchange rates, using calibrated standards:', err);
  }
  return false;
}

function applyRatesFromUsdBase(rates: Record<string, number>) {
  Object.keys(supportedCurrencies).forEach((code) => {
    if (code === 'USD') {
      supportedCurrencies[code].exchangeRateToUSD = 1.0;
    } else if (rates[code] && rates[code] > 0) {
      // rates[code] is units per 1 USD (e.g. 121.5 BDT per USD)
      // exchangeRateToUSD is USD per 1 unit (e.g. 1 / 121.5 = 0.00823 USD per BDT)
      supportedCurrencies[code].exchangeRateToUSD = 1 / rates[code];
    }
  });
}

// Auto-trigger live rate sync on module load in browser
if (typeof window !== 'undefined') {
  setTimeout(() => {
    fetchLiveExchangeRates().catch(() => {});
  }, 100);
}

export function useLiveExchangeRates() {
  const [lastUpdate, setLastUpdate] = useState<number>(lastRatesFetchTime);
  const [isLive, setIsLive] = useState<boolean>(isLiveRatesLoaded);

  useEffect(() => {
    const handler = () => {
      setLastUpdate(lastRatesFetchTime);
      setIsLive(isLiveRatesLoaded);
    };
    window.addEventListener('hk_rates_updated', handler);
    return () => window.removeEventListener('hk_rates_updated', handler);
  }, []);

  return {
    currencies: supportedCurrencies,
    isLive,
    lastUpdate,
    refresh: fetchLiveExchangeRates,
  };
}
