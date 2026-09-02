import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { supportedCurrencies } from '../lib/currencies';
import { Coins, ChevronDown, Check } from 'lucide-react';

export const CurrencySelector: React.FC<{
  currentCurrency?: string;
  onSelect?: (curr: string) => void;
}> = ({ currentCurrency: propCurr, onSelect: propOnSelect }) => {
  const { currency, setCurrency } = useI18n();
  const currentCurrency = propCurr || currency;
  const onSelect = propOnSelect || setCurrency;

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const active = supportedCurrencies[currentCurrency] || supportedCurrencies.BDT;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        id="currency-selector-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/70 transition shadow-xs cursor-pointer"
      >
        <Coins className="w-4 h-4 text-amber-500" />
        <span>{active.symbol} {active.code}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-60 origin-top-right rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 py-1.5 max-h-80 overflow-y-auto focus:outline-none">
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700/60">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Select Currency</p>
          </div>
          {Object.values(supportedCurrencies).map((curr) => (
            <button
              key={curr.code}
              id={`curr-option-${curr.code}`}
              type="button"
              onClick={() => {
                onSelect(curr.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs sm:text-sm text-left ${
                currentCurrency === curr.code
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
              } transition`}
            >
              <div className="flex items-center gap-2">
                <span className="w-6 text-center font-bold text-amber-600 dark:text-amber-400">{curr.symbol}</span>
                <span className="font-semibold">{curr.code}</span>
                <span className="text-[11px] text-slate-400 font-normal truncate max-w-[100px]">{curr.name}</span>
              </div>
              {currentCurrency === curr.code && <Check className="w-4 h-4 text-amber-600 dark:text-amber-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
