import React, { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { Wallet } from '../types';
import {
  X,
  Wallet as WalletIcon,
  Building2,
  CreditCard,
  Smartphone,
  PiggyBank,
  Check,
  Loader2,
  Crown
} from 'lucide-react';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (walletData: any) => Promise<void>;
  wallet?: Wallet | null;
  defaultCurrency: string;
  onOpenUpgrade?: () => void;
}

const WALLET_TYPES = [
  { id: 'cash', label: 'Cash / Physical', icon: WalletIcon },
  { id: 'bank', label: 'Bank Account', icon: Building2 },
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
  { id: 'bkash', label: 'bKash MFS', icon: Smartphone },
  { id: 'nagad', label: 'Nagad MFS', icon: Smartphone },
  { id: 'savings', label: 'Savings Vault', icon: PiggyBank },
];

const WALLET_COLORS = [
  '#10B981', // Emerald
  '#0F766E', // Teal
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#E2136E', // bKash Pink
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#334155', // Slate
];

export const WalletModal: React.FC<WalletModalProps> = ({
  isOpen,
  onClose,
  onSave,
  wallet,
  defaultCurrency,
  onOpenUpgrade,
}) => {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [type, setType] = useState('cash');
  const [balance, setBalance] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [color, setColor] = useState('#0F766E');
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (wallet) {
      setName(wallet.name);
      setType(wallet.type);
      setBalance(String(wallet.balance));
      setAccountNumber(wallet.accountNumber || '');
      setColor(wallet.color);
      setIsDefault(wallet.isDefault);
    } else {
      setName('');
      setType('cash');
      setBalance('0');
      setAccountNumber('');
      setColor('#0F766E');
      setIsDefault(false);
    }
    setError(null);
  }, [wallet, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this wallet.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        type,
        balance: parseFloat(balance) || 0,
        accountNumber: accountNumber.trim() || undefined,
        color,
        isDefault,
        currency: defaultCurrency,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/80">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {wallet ? t('edit_wallet') : t('add_wallet')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/50 space-y-2">
              <p>{error}</p>
              {onOpenUpgrade && (error.includes('PRO') || error.includes('limit') || error.includes('Plan')) && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenUpgrade();
                  }}
                  className="w-full py-2 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Crown className="w-3.5 h-3.5" />
                  <span>Upgrade to PRO for Unlimited Wallets</span>
                </button>
              )}
            </div>
          )}

          {/* Wallet Name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              {t('wallet_name')}
            </label>
            <input
              id="wallet-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. City Bank Salary, Cash on Hand, bKash"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
              autoFocus
            />
          </div>

          {/* Wallet Type */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              {t('wallet_type')}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {WALLET_TYPES.map((wt) => {
                const Icon = wt.icon;
                const isSelected = type === wt.id;
                return (
                  <button
                    key={wt.id}
                    type="button"
                    onClick={() => setType(wt.id)}
                    className={`flex flex-col items-center p-2.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-800 dark:text-teal-300 font-bold'
                        : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span>{wt.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Initial Balance */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              {wallet ? 'Updated Balance' : t('initial_balance')} ({defaultCurrency})
            </label>
            <input
              id="wallet-balance-input"
              type="number"
              step="any"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
              className="w-full text-lg font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Account Number / Details */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Account Number / Note (Optional)
            </label>
            <input
              id="wallet-acc-input"
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="e.g. **** 4892 or 01712-XXXXXX"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Color theme */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Accent Color
            </label>
            <div className="flex flex-wrap gap-2">
              {WALLET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer"
                  style={{ backgroundColor: c }}
                >
                  {color === c && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </div>

          {/* Default Wallet Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="wallet-default-check"
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
            />
            <label htmlFor="wallet-default-check" className="text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer">
              Set as primary / default wallet
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              id="wallet-submit-btn"
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold rounded-xl shadow-md shadow-teal-700/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{t('save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
