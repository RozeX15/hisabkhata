import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { SavingsGoal, Wallet } from '../types';
import confetti from 'canvas-confetti';
import {
  X,
  Target,
  ShieldCheck,
  Laptop,
  Plane,
  Home,
  Car,
  Heart,
  Loader2,
  PlusCircle
} from 'lucide-react';

interface SavingsGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  defaultCurrency: string;
}

interface ContributeModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: SavingsGoal | null;
  wallets: Wallet[];
  onContribute: (goalId: string, amount: number, walletId: string, note?: string) => Promise<void>;
  defaultCurrency: string;
}

const GOAL_ICONS = [
  { id: 'ShieldCheck', icon: ShieldCheck, label: 'Emergency' },
  { id: 'Laptop', icon: Laptop, label: 'Gadget' },
  { id: 'Plane', icon: Plane, label: 'Travel' },
  { id: 'Home', icon: Home, label: 'House' },
  { id: 'Car', icon: Car, label: 'Vehicle' },
  { id: 'Target', icon: Target, label: 'General' },
];

export const SavingsGoalModal: React.FC<SavingsGoalModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultCurrency,
}) => {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [initialAmount, setInitialAmount] = useState('0');
  const [targetDate, setTargetDate] = useState('2026-12-31');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Target');
  const [color, setColor] = useState('#0F766E');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numTarget = parseFloat(targetAmount);
    if (!name.trim() || !numTarget || numTarget <= 0) {
      setError('Please provide a goal name and positive target amount.');
      return;
    }

    setLoading(true);
    try {
      await onSave({
        name: name.trim(),
        targetAmount: numTarget,
        currentAmount: parseFloat(initialAmount) || 0,
        targetDate,
        description: description.trim(),
        icon,
        color,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create goal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/80">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {t('add_goal')}
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
              Goal Name
            </label>
            <input
              id="goal-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Emergency Fund, New Laptop, Umrah Trip"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Target ({defaultCurrency})
              </label>
              <input
                id="goal-target-input"
                type="number"
                step="any"
                min="1"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="100000"
                className="w-full font-bold px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Saved so far ({defaultCurrency})
              </label>
              <input
                id="goal-saved-input"
                type="number"
                step="any"
                min="0"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                placeholder="0"
                className="w-full font-bold px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Target Date
            </label>
            <input
              id="goal-date-input"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Icon Category
            </label>
            <div className="grid grid-cols-6 gap-1.5">
              {GOAL_ICONS.map((item) => {
                const IconComp = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setIcon(item.id)}
                    className={`p-2 rounded-xl flex items-center justify-center border transition cursor-pointer ${
                      icon === item.id
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <IconComp className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
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
              id="goal-submit-btn"
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

export const ContributeGoalModal: React.FC<ContributeModalProps> = ({
  isOpen,
  onClose,
  goal,
  wallets,
  onContribute,
  defaultCurrency,
}) => {
  const { t } = useI18n();
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!num || num <= 0 || !walletId) {
      setError('Please provide a valid contribution amount and funding wallet.');
      return;
    }

    setLoading(true);
    try {
      await onContribute(goal.id, num, walletId, note);
      // Trigger celebratory confetti!
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Contribution failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700/80">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Deposit to: {goal.name}
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

          <div className="p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>Goal Target:</span>
              <span className="font-bold text-slate-900 dark:text-white">{defaultCurrency} {goal.targetAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Remaining:</span>
              <span className="font-bold text-teal-700 dark:text-teal-400">{defaultCurrency} {Math.max(0, goal.targetAmount - goal.currentAmount).toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Deposit Amount ({defaultCurrency})
            </label>
            <input
              id="contribute-amount-input"
              type="number"
              step="any"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 5000"
              className="w-full text-xl font-bold px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Deduct from Wallet
            </label>
            <select
              id="contribute-wallet-select"
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
              id="contribute-note-input"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Monthly salary savings allocation"
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
              id="contribute-submit-btn"
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-bold rounded-xl shadow-md shadow-teal-700/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Deposit Funds</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const SavingsContributeModal = ContributeGoalModal;
