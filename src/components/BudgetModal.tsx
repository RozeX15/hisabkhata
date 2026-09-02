import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { Category } from '../types';
import { X, Loader2 } from 'lucide-react';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  categories: Category[];
  defaultCurrency: string;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  defaultCurrency,
}) => {
  const { t } = useI18n();
  const [categoryId, setCategoryId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const expenseCategories = categories.filter(c => c.type === 'expense');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0) {
      setError('Please provide a positive budget limit amount.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        categoryId: categoryId || (expenseCategories[0]?.id || null),
        amount: num,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save budget');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/80">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('set_budget')}
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

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Category
            </label>
            <select
              id="budget-category-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customName || t(c.nameKey) || c.id}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Monthly Budget Limit ({defaultCurrency})
            </label>
            <input
              id="budget-amount-input"
              type="number"
              step="any"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 15000"
              className="w-full text-xl font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
              autoFocus
            />
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
              id="budget-submit-btn"
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
