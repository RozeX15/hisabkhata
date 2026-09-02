import React, { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { Transaction, Wallet, Category } from '../types';
import {
  X,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Calendar,
  Wallet as WalletIcon,
  Tag,
  FileText,
  Repeat,
  Loader2
} from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: any) => Promise<void>;
  transaction?: Transaction | null;
  initialType?: 'income' | 'expense' | 'transfer';
  wallets: Wallet[];
  categories: Category[];
  defaultCurrency: string;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  transaction,
  initialType = 'expense',
  wallets,
  categories,
  defaultCurrency,
}) => {
  const { t } = useI18n();
  const [type, setType] = useState<'income' | 'expense' | 'transfer'>(initialType);
  const [amount, setAmount] = useState<string>('');
  const [walletId, setWalletId] = useState<string>('');
  const [toWalletId, setToWalletId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableWallets: Wallet[] = wallets && wallets.length > 0 ? wallets : [
    {
      id: 'w-default-cash',
      userId: '',
      name: 'Cash / Main Account (নগদ হিসাব)',
      type: 'cash',
      balance: 0,
      currency: defaultCurrency,
      color: '#10B981',
      isDefault: true,
      createdAt: '',
      updatedAt: '',
    }
  ];

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmount(String(transaction.amount));
      setWalletId(transaction.walletId || availableWallets[0]?.id);
      setToWalletId(transaction.toWalletId || '');
      setCategoryId(transaction.categoryId || '');
      setDate(transaction.date);
      setDescription(transaction.description || '');
      setNote(transaction.note || '');
      setIsRecurring(Boolean(transaction.isRecurring));
    } else {
      setType(initialType);
      setAmount('');
      const defaultW = availableWallets.find(w => w.isDefault) || availableWallets[0];
      setWalletId(defaultW ? defaultW.id : availableWallets[0]?.id || '');
      const otherW = availableWallets.find(w => w.id !== defaultW?.id);
      setToWalletId(otherW ? otherW.id : '');
      const firstCat = categories.find(c => c.type === (initialType === 'transfer' ? 'income' : initialType));
      setCategoryId(firstCat ? firstCat.id : '');
      setDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setNote('');
      setIsRecurring(false);
    }
    setError(null);
  }, [transaction, isOpen, initialType, wallets, categories]);

  if (!isOpen) return null;

  const filteredCategories = categories.filter(c => c.type === (type === 'transfer' ? 'income' : type));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid positive amount.');
      return;
    }

    const effectiveWalletId = walletId || availableWallets[0]?.id || 'w-default-cash';

    if (type === 'transfer' && (!toWalletId || toWalletId === effectiveWalletId)) {
      setError('Please select a different destination wallet.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        type,
        amount: numAmount,
        walletId: effectiveWalletId,
        toWalletId: type === 'transfer' ? toWalletId : null,
        categoryId: type === 'transfer' ? 'cat-oin' : (categoryId || filteredCategories[0]?.id || 'cat-oex'),
        date,
        description: description.trim() || (type === 'income' ? t('income') : type === 'expense' ? t('expense') : t('transfer')),
        note: note.trim(),
        isRecurring,
        currency: defaultCurrency,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/80">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {transaction ? t('edit_transaction') : t('add_transaction')}
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
            <div className="p-3 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/50">
              {error}
            </div>
          )}

          {/* Type Switcher */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                const cat = categories.find(c => c.type === 'expense');
                if (cat) setCategoryId(cat.id);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
                type === 'expense'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>{t('expense')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('income');
                const cat = categories.find(c => c.type === 'income');
                if (cat) setCategoryId(cat.id);
              }}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
                type === 'income'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{t('income')}</span>
            </button>

            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition ${
                type === 'transfer'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>{t('transfer')}</span>
            </button>
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              {t('amount')} ({defaultCurrency})
            </label>
            <div className="relative">
              <input
                id="tx-amount-input"
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full text-2xl font-extrabold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
                autoFocus
              />
            </div>
          </div>

          {/* Wallets / Payment Source selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                {type === 'transfer' ? t('from_wallet') : 'Payment Account / Source (হিসাবের উৎস)'}
              </label>
              <span className="text-[11px] text-slate-400">Default: Cash Account</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <select
                  id="tx-wallet-select"
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {availableWallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({defaultCurrency} {w.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {type === 'transfer' && (
                <div>
                  <select
                    id="tx-to-wallet-select"
                    value={toWalletId}
                    onChange={(e) => setToWalletId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {availableWallets.filter(w => w.id !== (walletId || availableWallets[0]?.id)).map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({defaultCurrency} {w.balance.toLocaleString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {type !== 'transfer' && (
                <div>
                  <select
                    id="tx-category-select"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    {filteredCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.customName || t(c.nameKey) || c.id}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Quick Helper Tips */}
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              💡 Money will be deducted from or added to this account (e.g. Cash, bKash, Bank). If unsure, keep Cash selected.
            </p>
          </div>

          {/* Date & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                {t('date')}
              </label>
              <input
                id="tx-date-input"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                {t('description')}
              </label>
              <input
                id="tx-desc-input"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Grocery store, Salary payout"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              {t('note')} (Optional)
            </label>
            <input
              id="tx-note-input"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Invoice #2041, Split with friends"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Recurring Toggle */}
          <div className="flex items-center gap-2 pt-1">
            <input
              id="tx-recurring-check"
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500 cursor-pointer"
            />
            <label htmlFor="tx-recurring-check" className="text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer flex items-center gap-1.5">
              <Repeat className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Mark as recurring monthly transaction</span>
            </label>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              id="tx-submit-btn"
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
