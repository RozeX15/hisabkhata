import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { Loan, Wallet } from '../types';
import {
  X,
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  Calendar,
  User as UserIcon,
  Phone
} from 'lucide-react';

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  defaultCurrency: string;
}

interface LoanPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  loan: Loan | null;
  wallets: Wallet[];
  onRecordPayment: (loanId: string, amount: number, walletId: string, note?: string) => Promise<void>;
  defaultCurrency: string;
}

export const LoanModal: React.FC<LoanModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultCurrency,
}) => {
  const { t } = useI18n();
  const [type, setType] = useState<'owe_me' | 'i_owe'>('owe_me');
  const [personName, setPersonName] = useState('');
  const [personContact, setPersonContact] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('2026-12-31');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!personName.trim() || !num || num <= 0) {
      setError('Please provide person name and a valid positive amount.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        type,
        personName: personName.trim(),
        personContact: personContact.trim() || undefined,
        amount: num,
        dueDate,
        description: description.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save loan record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/80">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('add_loan')}
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
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
            <button
              type="button"
              onClick={() => setType('owe_me')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
                type === 'owe_me'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>{t('owe_me')}</span>
            </button>

            <button
              type="button"
              onClick={() => setType('i_owe')}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition ${
                type === 'i_owe'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{t('i_owe')}</span>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              {t('person_name')}
            </label>
            <input
              id="loan-person-input"
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="e.g. Tanvir Hossain, Uncle Rafiq"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                {t('amount')} ({defaultCurrency})
              </label>
              <input
                id="loan-amount-input"
                type="number"
                step="any"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10000"
                className="w-full font-bold px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                {t('due_date')}
              </label>
              <input
                id="loan-due-input"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Phone / Contact (Optional)
            </label>
            <input
              id="loan-contact-input"
              type="text"
              value={personContact}
              onChange={(e) => setPersonContact(e.target.value)}
              placeholder="e.g. +880 1819-XXXXXX"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Description / Reason (Optional)
            </label>
            <input
              id="loan-desc-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Advance for office repair"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              id="loan-submit-btn"
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

export const LoanPaymentModal: React.FC<LoanPaymentModalProps> = ({
  isOpen,
  onClose,
  loan,
  wallets,
  onRecordPayment,
  defaultCurrency,
}) => {
  const { t } = useI18n();
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !loan) return null;

  const remaining = Math.max(0, loan.amount - loan.paidAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0 || !walletId) {
      setError('Please provide a valid payment amount and settlement wallet.');
      return;
    }

    setLoading(true);
    try {
      await onRecordPayment(loan.id, num, walletId, note);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Payment settlement failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/80">
          <div className="flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              {loan.type === 'owe_me' ? 'Receive Payment from' : 'Pay Repayment to'} {loan.personName}
            </h2>
          </div>
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

          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl flex justify-between items-center text-xs">
            <div>
              <span className="text-slate-500 block">Total Principal:</span>
              <span className="font-bold text-slate-900 dark:text-white">{defaultCurrency} {loan.amount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Already Settled:</span>
              <span className="font-bold text-emerald-600">{defaultCurrency} {loan.paidAmount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Remaining:</span>
              <span className="font-bold text-amber-600">{defaultCurrency} {remaining.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Settlement Amount ({defaultCurrency})
            </label>
            <input
              id="loan-payment-amount"
              type="number"
              step="any"
              min="1"
              max={remaining}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={String(remaining)}
              className="w-full text-xl font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              {loan.type === 'owe_me' ? 'Deposit Into Wallet' : 'Pay From Wallet'}
            </label>
            <select
              id="loan-payment-wallet"
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} (Balance: {defaultCurrency} {w.balance.toLocaleString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Note (Optional)
            </label>
            <input
              id="loan-payment-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Partial installment via bKash"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              id="loan-payment-submit"
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold rounded-xl shadow-md shadow-teal-700/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Record Settlement</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
