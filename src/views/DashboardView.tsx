import React, { useMemo, useState } from 'react';
import { useI18n } from '../lib/i18n';
import { DashboardSummary, Wallet, Category, Transaction, SavingsGoal, Loan } from '../types';
import { api } from '../lib/api';
import {
  formatCurrency,
  convertCurrency,
  getExchangeRate,
  useLiveExchangeRates
} from '../lib/currencies';
import {
  Wallet as WalletIcon,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  PiggyBank,
  Sparkles,
  AlertTriangle,
  Target,
  HandCoins,
  ChevronRight,
  ChevronLeft,
  Plus,
  BarChart3,
  Calendar,
  CheckCircle2,
  PieChart as PieChartIcon,
  Trash2,
  RotateCcw,
  SlidersHorizontal,
  X,
  Filter,
  Layers,
  ChevronDown
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid
} from 'recharts';
import { ActivityLogWidget } from '../components/ActivityLogWidget';

interface DashboardViewProps {
  summary: DashboardSummary | null;
  wallets: Wallet[];
  categories: Category[];
  currency: string;
  transactions?: Transaction[];
  baseCurrency?: string;
  onOpenAddTransaction: (type?: 'income' | 'expense' | 'transfer') => void;
  onOpenAddGoal: () => void;
  onOpenContributeGoal: (goal: SavingsGoal) => void;
  onOpenAddBudget: () => void;
  onOpenAiAdvisor: () => void;
  onNavigate: (view: string) => void;
  onRefreshData?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  wallets,
  categories,
  currency,
  transactions,
  baseCurrency,
  onOpenAddTransaction,
  onOpenAddGoal,
  onOpenContributeGoal,
  onOpenAddBudget,
  onOpenAiAdvisor,
  onNavigate,
  onRefreshData,
}) => {
  const { t } = useI18n();
  useLiveExchangeRates();

  // Determine base account currency (default BDT)
  const base = baseCurrency || 'BDT';
  const isConverted = currency !== base;

  // Month Selection State (Defaults to current year-month YYYY-MM)
  const currentMonthStr = useMemo(() => new Date().toISOString().substring(0, 7), []);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  
  // Modals for deleting/resetting metrics
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearType, setClearType] = useState<'all' | 'income' | 'expense'>('all');
  const [isResetBalanceModalOpen, setIsResetBalanceModalOpen] = useState(false);
  const [targetResetBalance, setTargetResetBalance] = useState<string>('0');
  const [actionProcessing, setActionProcessing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Available Month Options (Past 12 months + Future 2 months + All Time)
  const monthOptions = useMemo(() => {
    const list: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = -12; i <= 2; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      list.push({ value: val, label });
    }
    // Sort descending (newest first)
    list.reverse();
    return list;
  }, []);

  const handlePrevMonth = () => {
    if (selectedMonth === 'all') {
      setSelectedMonth(currentMonthStr);
      return;
    }
    const [yStr, mStr] = selectedMonth.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) - 1;
    if (m < 1) {
      m = 12;
      y -= 1;
    }
    setSelectedMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    if (selectedMonth === 'all') {
      setSelectedMonth(currentMonthStr);
      return;
    }
    const [yStr, mStr] = selectedMonth.split('-');
    let y = parseInt(yStr, 10);
    let m = parseInt(mStr, 10) + 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    setSelectedMonth(`${y}-${String(m).padStart(2, '0')}`);
  };

  const formatMonthTitle = (val: string) => {
    if (val === 'all') return 'All Time (Cumulative)';
    try {
      const [year, month] = val.split('-');
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    } catch {
      return val;
    }
  };

  // Resolve all available transactions (combining prop or summary recent)
  const allTxList = useMemo(() => {
    if (transactions && transactions.length > 0) return transactions;
    if (summary?.recentTransactions && summary.recentTransactions.length > 0) return summary.recentTransactions;
    return [];
  }, [transactions, summary?.recentTransactions]);

  // Filtered transactions based on selectedMonth
  const filteredTransactions = useMemo(() => {
    if (!allTxList || allTxList.length === 0) return [];
    if (selectedMonth === 'all') return allTxList;
    return allTxList.filter(t => t.date && t.date.startsWith(selectedMonth));
  }, [allTxList, selectedMonth]);

  // 1. Live converted total balance
  const displayTotalBalance = useMemo(() => {
    if (wallets && wallets.length > 0) {
      return wallets.reduce((sum, w) => {
        const wCurr = w.currency || base;
        return sum + convertCurrency(Number(w.balance) || 0, wCurr, currency);
      }, 0);
    }
    return convertCurrency(summary?.totalBalance || 0, base, currency);
  }, [wallets, summary?.totalBalance, base, currency]);

  // 2. Dynamic period income (for selected month or all time)
  const displaySelectedIncome = useMemo(() => {
    if (filteredTransactions.length > 0) {
      const incomeTx = filteredTransactions.filter(t => t.type === 'income');
      return incomeTx.reduce((sum, t) => {
        const tCurr = t.currency || base;
        return sum + convertCurrency(Number(t.amount) || 0, tCurr, currency);
      }, 0);
    }
    if (selectedMonth === currentMonthStr) {
      return convertCurrency(summary?.totalIncomeThisMonth || 0, base, currency);
    }
    return 0;
  }, [filteredTransactions, selectedMonth, currentMonthStr, summary?.totalIncomeThisMonth, base, currency]);

  // 3. Dynamic period expenses (for selected month or all time)
  const displaySelectedExpenses = useMemo(() => {
    if (filteredTransactions.length > 0) {
      const expenseTx = filteredTransactions.filter(t => t.type === 'expense');
      return expenseTx.reduce((sum, t) => {
        const tCurr = t.currency || base;
        return sum + convertCurrency(Number(t.amount) || 0, tCurr, currency);
      }, 0);
    }
    if (selectedMonth === currentMonthStr) {
      return convertCurrency(summary?.totalExpensesThisMonth || 0, base, currency);
    }
    return 0;
  }, [filteredTransactions, selectedMonth, currentMonthStr, summary?.totalExpensesThisMonth, base, currency]);

  // 4. Live converted net savings / cashflow for selected month
  const displayNetSavings = displaySelectedIncome - displaySelectedExpenses;

  // Actions: Clear Month Transactions (All, Income, or Expense)
  const handleExecuteClear = async () => {
    if (selectedMonth === 'all') {
      alert('Please choose a specific month to clear records, or use Reset Balance to adjust wallet balances.');
      return;
    }

    setActionProcessing(true);
    setActionFeedback(null);
    try {
      const res = await api.clearMonthTransactions(selectedMonth, clearType);
      setIsClearModalOpen(false);
      setActionFeedback(res.message || `Successfully cleared ${clearType} records for ${formatMonthTitle(selectedMonth)}.`);
      setTimeout(() => setActionFeedback(null), 4000);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to clear month data');
    } finally {
      setActionProcessing(false);
    }
  };

  // Actions: Reset All Wallet Balances
  const handleExecuteResetBalances = async () => {
    setActionProcessing(true);
    setActionFeedback(null);
    try {
      const targetNum = parseFloat(targetResetBalance) || 0;
      const res = await api.resetAllWallets(targetNum);
      setIsResetBalanceModalOpen(false);
      setActionFeedback(res.message || `All wallet balances updated to ${targetNum} ${base}.`);
      setTimeout(() => setActionFeedback(null), 4000);
      if (onRefreshData) onRefreshData();
    } catch (err: any) {
      alert(err.message || 'Failed to reset balances');
    } finally {
      setActionProcessing(false);
    }
  };

  // 5. Converted monthly spending trend for the chart
  const convertedMonthlyTrend = useMemo(() => {
    if (!summary?.monthlySpendingTrend) return [];
    return summary.monthlySpendingTrend.map((m) => ({
      month: m.month,
      income: Math.round(convertCurrency(m.income, base, currency)),
      expense: Math.round(convertCurrency(m.expense, base, currency)),
    }));
  }, [summary?.monthlySpendingTrend, base, currency]);

  // 6. Converted top expense categories & pie data
  const convertedTopCategories = useMemo(() => {
    if (!summary?.topExpenseCategories) return [];
    return summary.topExpenseCategories.map((c) => ({
      ...c,
      convertedAmount: convertCurrency(c.amount, base, currency),
    }));
  }, [summary?.topExpenseCategories, base, currency]);

  const categoryPieData = useMemo(() => {
    return convertedTopCategories.map(c => ({
      name: c.name,
      value: c.convertedAmount,
      color: c.color,
    }));
  }, [convertedTopCategories]);

  // Exchange rate details
  const rateFromBaseToCurr = getExchangeRate(base, currency);
  const rateFromCurrToBase = getExchangeRate(currency, base);

  if (!summary) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="animate-pulse space-y-4 w-full max-w-4xl">
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
            <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Live Conversion Banner */}
      {isConverted ? (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/5 border-2 border-teal-500/30 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div>
              <p className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>Live Currency Conversion Active ({currency})</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 uppercase tracking-wider">
                  Live FX
                </span>
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-medium">
                Balance, Income, Expenses & Budgets auto-convert from <strong>{base}</strong> to <strong>{currency}</strong> in real time.
                <span className="font-mono font-black text-teal-700 dark:text-teal-400 ml-2">
                  1 {base} ≈ {formatCurrency(rateFromBaseToCurr, currency)} &nbsp;|&nbsp; 1 {currency} ≈ {formatCurrency(rateFromCurrToBase, base)}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-extrabold text-slate-700 dark:text-slate-200 shadow-2xs">
              Base: {base}
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-teal-700 text-white text-[11px] font-extrabold shadow-2xs">
              Viewing: {currency}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-xs shadow-xs">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 shrink-0" />
            <span>Active Financial Base Currency: <strong className="text-slate-900 dark:text-white font-black">{base}</strong></span>
            <span className="text-slate-400 dark:text-slate-500">({wallets.length} active wallets)</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 hidden md:block">
            Change currency anytime from the top bar for live conversion across balance, income, expense and savings
          </div>
        </div>
      )}

      {/* Action Feedback Banner */}
      {actionFeedback && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="p-1 hover:bg-emerald-500/20 rounded-lg transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Month Navigator & Period Control Toolbar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Month Selection & Stepping */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900/70 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              id="dashboard-prev-month-btn"
              type="button"
              onClick={handlePrevMonth}
              title="Previous Month"
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition shadow-2xs cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative flex items-center">
              <Calendar className="w-4 h-4 text-teal-600 dark:text-teal-400 absolute left-2.5 pointer-events-none" />
              <select
                id="dashboard-month-selector"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="pl-8 pr-7 py-1.5 bg-transparent text-xs font-extrabold text-slate-900 dark:text-white outline-none cursor-pointer appearance-none"
              >
                <option value="all" className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">All Time (Cumulative)</option>
                {monthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white">
                    {opt.label} {opt.value === currentMonthStr ? '• Current' : ''}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 absolute right-1.5 pointer-events-none" />
            </div>

            <button
              id="dashboard-next-month-btn"
              type="button"
              onClick={handleNextMonth}
              title="Next Month"
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition shadow-2xs cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {selectedMonth !== currentMonthStr && (
            <button
              id="dashboard-jump-current-month-btn"
              type="button"
              onClick={() => setSelectedMonth(currentMonthStr)}
              className="px-2.5 py-1.5 text-xs font-bold rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200 dark:border-teal-800/60 transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Current Month</span>
            </button>
          )}

          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 hidden sm:inline">
            Viewing: <strong className="text-slate-900 dark:text-white">{formatMonthTitle(selectedMonth)}</strong>
          </span>
        </div>

        {/* Right: Data Management Actions */}
        <div className="flex items-center gap-2">
          {selectedMonth !== 'all' && (
            <button
              id="dashboard-clear-month-btn"
              type="button"
              onClick={() => {
                setClearType('all');
                setIsClearModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/60 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Month Data</span>
            </button>
          )}

          <button
            id="dashboard-adjust-balance-btn"
            type="button"
            onClick={() => {
              setTargetResetBalance('0');
              setIsResetBalanceModalOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Adjust / Reset Balance</span>
          </button>
        </div>
      </div>

      {/* 1. Hero Balance & Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Balance Card */}
        <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-teal-800 via-teal-700 to-slate-900 text-white shadow-xl shadow-teal-900/10 flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-teal-100 uppercase tracking-wider">
                {t('total_balance')}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  id="dashboard-card-adjust-balance"
                  type="button"
                  onClick={() => setIsResetBalanceModalOpen(true)}
                  title="Adjust or Zero Total Balance"
                  className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] font-extrabold text-teal-100 transition cursor-pointer"
                >
                  Adjust
                </button>
                <div className="p-1.5 bg-white/10 rounded-xl">
                  <WalletIcon className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
              {formatCurrency(displayTotalBalance, currency)}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-teal-200 font-medium pt-2 border-t border-white/10 mt-2">
            <span>Across {wallets.length} active {wallets.length === 1 ? 'account' : 'accounts'}</span>
            {isConverted && (
              <span className="text-[11px] text-teal-200/80 font-mono">
                ≈ {formatCurrency(summary.totalBalance, base)}
              </span>
            )}
          </div>
        </div>

        {/* Selected Period Income */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t('total_income')}
                </span>
                <span className="text-[11px] text-teal-700 dark:text-teal-400 font-bold truncate max-w-[140px]">
                  {formatMonthTitle(selectedMonth)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedMonth !== 'all' && (
                  <button
                    id="dashboard-clear-income-btn"
                    type="button"
                    onClick={() => {
                      setClearType('income');
                      setIsClearModalOpen(true);
                    }}
                    title="Clear income records for this month"
                    className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-[10px] font-extrabold text-rose-700 dark:text-rose-400 transition cursor-pointer border border-rose-200 dark:border-rose-900/40"
                  >
                    Clear
                  </button>
                )}
                <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
            <div className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight mb-1">
              {formatCurrency(displaySelectedIncome, currency)}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-700/60 mt-2">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              {filteredTransactions.filter(t => t.type === 'income').length} deposits recorded
            </span>
            {isConverted && (
              <span className="text-[11px] text-slate-600 dark:text-slate-300 font-mono font-semibold">
                ≈ {formatCurrency(convertCurrency(displaySelectedIncome, currency, base), base)}
              </span>
            )}
          </div>
        </div>

        {/* Selected Period Expenses */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t('total_expenses')}
                </span>
                <span className="text-[11px] text-rose-700 dark:text-rose-400 font-bold truncate max-w-[140px]">
                  {formatMonthTitle(selectedMonth)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedMonth !== 'all' && (
                  <button
                    id="dashboard-clear-expenses-btn"
                    type="button"
                    onClick={() => {
                      setClearType('expense');
                      setIsClearModalOpen(true);
                    }}
                    title="Clear expense records for this month"
                    className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-[10px] font-extrabold text-rose-700 dark:text-rose-400 transition cursor-pointer border border-rose-200 dark:border-rose-900/40"
                  >
                    Clear
                  </button>
                )}
                <div className="p-1.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-xl border border-red-200/60 dark:border-red-900/40">
                  <TrendingDown className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
            <div className="text-2xl font-black text-red-600 dark:text-red-400 tracking-tight mb-1">
              {formatCurrency(displaySelectedExpenses, currency)}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-700/60 mt-2">
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              {filteredTransactions.filter(t => t.type === 'expense').length} expenses recorded
            </span>
            {isConverted && (
              <span className="text-[11px] text-slate-600 dark:text-slate-300 font-mono font-semibold">
                ≈ {formatCurrency(convertCurrency(displaySelectedExpenses, currency, base), base)}
              </span>
            )}
          </div>
        </div>

        {/* Selected Period Net Cashflow / Savings */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col">
                <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {t('net_savings')}
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold truncate max-w-[140px]">
                  {formatMonthTitle(selectedMonth)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {selectedMonth !== 'all' && (
                  <button
                    id="dashboard-clear-savings-btn"
                    type="button"
                    onClick={() => {
                      setClearType('all');
                      setIsClearModalOpen(true);
                    }}
                    title="Clear all transactions for this month"
                    className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-[10px] font-extrabold text-rose-700 dark:text-rose-400 transition cursor-pointer border border-rose-200 dark:border-rose-900/40"
                  >
                    Reset
                  </button>
                )}
                <div className="p-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-200/60 dark:border-amber-900/40">
                  <PiggyBank className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
            <div className={`text-2xl font-black tracking-tight mb-1 ${displayNetSavings >= 0 ? 'text-teal-700 dark:text-teal-400' : 'text-red-600 dark:text-red-400'}`}>
              {formatCurrency(displayNetSavings, currency)}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-medium pt-2 border-t border-slate-200 dark:border-slate-700/60 mt-2">
            <span>{displayNetSavings >= 0 ? 'Surplus (Positive)' : 'Deficit (Negative)'}</span>
            {isConverted && (
              <span className="text-[11px] text-slate-600 dark:text-slate-300 font-mono font-semibold">
                ≈ {formatCurrency(convertCurrency(displayNetSavings, currency, base), base)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Quick Action Toolbar */}
      <div className="p-3 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            id="quick-add-expense"
            type="button"
            onClick={() => onOpenAddTransaction('expense')}
            className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-red-200 dark:border-red-900/40 shadow-2xs"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Add Expense</span>
          </button>

          <button
            id="quick-add-income"
            type="button"
            onClick={() => onOpenAddTransaction('income')}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-emerald-200 dark:border-emerald-900/40 shadow-2xs"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Add Income</span>
          </button>

          <button
            id="quick-add-transfer"
            type="button"
            onClick={() => onOpenAddTransaction('transfer')}
            className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-blue-200 dark:border-blue-900/40 shadow-2xs"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Transfer</span>
          </button>

          <button
            id="quick-add-goal"
            type="button"
            onClick={onOpenAddGoal}
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-amber-200 dark:border-amber-900/40 shadow-2xs"
          >
            <Target className="w-4 h-4" />
            <span>New Goal</span>
          </button>

          <button
            id="quick-add-budget"
            type="button"
            onClick={onOpenAddBudget}
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-purple-200 dark:border-purple-900/40 shadow-2xs"
          >
            <PieChartIcon className="w-4 h-4" />
            <span>Set Budget</span>
          </button>
        </div>

        <button
          id="dashboard-coach-btn"
          type="button"
          onClick={onOpenAiAdvisor}
          className="px-4 py-2 bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-800 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Ask AI Coach</span>
        </button>
      </div>

      {/* 3. Smart Insights Recommendation Strip */}
      {(summary.smartInsights || []).length > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-900/10 via-amber-500/10 to-teal-900/5 border border-teal-500/20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-700 text-white shrink-0">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-900 dark:text-white">
                Smart Financial Insight
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                {summary.smartInsights[0].descriptionKey ? t(summary.smartInsights[0].descriptionKey, summary.smartInsights[0].params) : ((summary.smartInsights[0] as any).message || (summary.smartInsights[0] as any).titleKey || '')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('insights')}
            className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. Financial Charts: 6-Month Trend & Expense Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 6-Month Income vs Expense Flow */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Cashflow & Spending Trend
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Past 6 months comparison</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Income
              </span>
              <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Expense
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={convertedMonthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.7} />
                <XAxis dataKey="month" stroke="#475569" fontSize={11} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} tick={{ fill: '#475569', fontSize: 11, fontWeight: 600 }} />
                <Tooltip
                  formatter={(val: number) => [formatCurrency(val, currency), '']}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: '1px solid #334155', color: '#fff', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}
                />
                <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Distribution */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Expense Breakdown
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Current month distribution</p>
            </div>
          </div>

          <div className="flex-1 min-h-[180px] flex items-center justify-center">
            {categoryPieData.length === 0 ? (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">No expense transactions recorded this month</p>
            ) : (
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {categoryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#0F766E'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [formatCurrency(val, currency), '']}
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: '1px solid #334155', color: '#fff', fontSize: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend categories */}
          <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
            {convertedTopCategories.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-slate-700 dark:text-slate-300 font-semibold truncate">{c.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white shrink-0">
                  {c.percentage}% ({formatCurrency(c.convertedAmount, currency)})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Budgets & Savings Goals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Budgets */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Monthly Category Budgets
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Track and prevent overspending</p>
            </div>
            <button
              type="button"
              onClick={onOpenAddBudget}
              className="p-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Set Budget</span>
            </button>
          </div>

          <div className="space-y-4">
            {(summary.budgetSummaries || []).length === 0 ? (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                <PieChartIcon className="w-8 h-8 mx-auto mb-1 opacity-40 text-teal-600" />
                <p className="text-xs font-semibold">No budgets created yet</p>
              </div>
            ) : (
              summary.budgetSummaries.map((b) => {
                const isOver = b.status === 'over_budget';
                const isWarning = b.status === 'warning';
                const convertedSpent = convertCurrency(b.spent, base, currency);
                const convertedAmount = convertCurrency(b.amount, base, currency);
                return (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {b.categoryName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 dark:text-slate-300 font-semibold">
                          {formatCurrency(convertedSpent, currency)} / {formatCurrency(convertedAmount, currency)}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isOver ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' :
                          isWarning ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                          'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}>
                          {b.percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-700/80 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-teal-600'
                        }`}
                        style={{ width: `${Math.min(100, b.percentage)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Savings Goals */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Active Savings Goals
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Milestones & emergency funds</p>
            </div>
            <button
              type="button"
              onClick={onOpenAddGoal}
              className="p-1.5 text-xs font-bold text-teal-700 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Goal</span>
            </button>
          </div>

          <div className="space-y-3">
            {(summary.savingsGoals || []).length === 0 ? (
              <div className="text-center py-6 text-slate-500 dark:text-slate-400">
                <Target className="w-8 h-8 mx-auto mb-1 opacity-40 text-teal-600" />
                <p className="text-xs font-semibold">No savings goals created yet</p>
              </div>
            ) : (
              summary.savingsGoals.map((g) => {
                const percent = Math.round((g.currentAmount / g.targetAmount) * 100);
                const isCompleted = percent >= 100;
                const convertedCurrent = convertCurrency(g.currentAmount, g.currency || base, currency);
                const convertedTarget = convertCurrency(g.targetAmount, g.currency || base, currency);
                return (
                  <div key={g.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {g.name}
                        </span>
                        <span className="text-xs font-bold text-teal-700 dark:text-teal-400 shrink-0">
                          {percent}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-1.5">
                        <div
                          className="h-full bg-teal-600 rounded-full transition-all"
                          style={{ width: `${Math.min(100, percent)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                        <span>{formatCurrency(convertedCurrent, currency)} saved</span>
                        <span>Target: {formatCurrency(convertedTarget, currency)}</span>
                      </div>
                    </div>
                    {!isCompleted && (
                      <button
                        type="button"
                        onClick={() => onOpenContributeGoal(g)}
                        className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0 cursor-pointer"
                      >
                        Deposit
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 6. Recent Transactions Ledger */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
              {t('recent_transactions')}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">Latest financial activities</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('transactions')}
            className="text-xs font-bold text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View all transactions</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-xs font-medium">
              No transactions recorded for {formatMonthTitle(selectedMonth)}. Click "Add" above to start.
            </div>
          ) : (
            filteredTransactions.slice(0, 10).map((tx) => {
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';
              const convertedTxAmount = convertCurrency(tx.amount, tx.currency || base, currency);
              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-2xl shrink-0 ${
                      isIncome ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40' :
                      isTransfer ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40' :
                      'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200/60 dark:border-red-900/40'
                    }`}>
                      {isIncome ? <ArrowUpRight className="w-4 h-4" /> : isTransfer ? <ArrowLeftRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {tx.description}
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
                        <span>{tx.date}</span>
                        {tx.note && <span className="truncate max-w-[120px]">({tx.note})</span>}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`text-xs sm:text-sm font-extrabold ${
                      isIncome ? 'text-emerald-700 dark:text-emerald-400' :
                      isTransfer ? 'text-blue-700 dark:text-blue-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {isIncome ? '+' : isTransfer ? '' : '-'}{formatCurrency(convertedTxAmount, currency)}
                    </p>
                    <div className="flex items-center justify-end gap-1 text-[10px] text-slate-600 dark:text-slate-400 font-medium">
                      <span className="uppercase font-bold">{tx.type}</span>
                      {isConverted && (
                        <span className="font-mono font-semibold">({formatCurrency(tx.amount, tx.currency || base)})</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 7. Live Action Confirmation & Activity Audit Log Widget */}
      <ActivityLogWidget onNavigate={onNavigate} currency={currency} />

      {/* MODAL: Clear / Delete Month Financial Records */}
      {isClearModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                <Trash2 className="w-5 h-5" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Clear Month Records
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              You are modifying financial records for: <strong className="text-teal-700 dark:text-teal-400 font-bold">{formatMonthTitle(selectedMonth)}</strong>. Choose which records to delete:
            </p>

            <div className="space-y-2">
              <label
                onClick={() => setClearType('all')}
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                  clearType === 'all'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-slate-900 dark:text-white ring-1 ring-rose-400/40'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="clearType"
                  checked={clearType === 'all'}
                  onChange={() => setClearType('all')}
                  className="mt-0.5 text-rose-600"
                />
                <div className="text-xs">
                  <p className="font-extrabold text-slate-900 dark:text-white">All Records (Income, Expense & Transfers)</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">Resets this month's income, expenses, and net savings back to 0. Balances in affected wallets will be recalculated automatically.</p>
                </div>
              </label>

              <label
                onClick={() => setClearType('income')}
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                  clearType === 'income'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 text-slate-900 dark:text-white ring-1 ring-emerald-400/40'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="clearType"
                  checked={clearType === 'income'}
                  onChange={() => setClearType('income')}
                  className="mt-0.5 text-emerald-600"
                />
                <div className="text-xs">
                  <p className="font-extrabold text-slate-900 dark:text-white">Income Records Only</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">Deletes this month's income transactions. Resets Total Income to 0 for this month and deducts from wallet balances.</p>
                </div>
              </label>

              <label
                onClick={() => setClearType('expense')}
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition ${
                  clearType === 'expense'
                    ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20 text-slate-900 dark:text-white ring-1 ring-rose-400/40'
                    : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="clearType"
                  checked={clearType === 'expense'}
                  onChange={() => setClearType('expense')}
                  className="mt-0.5 text-rose-600"
                />
                <div className="text-xs">
                  <p className="font-extrabold text-slate-900 dark:text-white">Expense Records Only</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium mt-0.5">Deletes this month's expense transactions. Resets Total Expenses to 0 for this month and refunds wallet balances.</p>
                </div>
              </label>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/50 text-[11px] text-amber-900 dark:text-amber-300 font-semibold">
              ⚠️ <strong>Warning:</strong> Deleted transactions cannot be recovered. Wallet account balances will adjust automatically.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsClearModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="dashboard-confirm-clear-btn"
                type="button"
                disabled={actionProcessing}
                onClick={handleExecuteClear}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-lg shadow-rose-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {actionProcessing ? 'Clearing...' : 'Confirm & Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Adjust or Reset Total Balance */}
      {isResetBalanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400">
                <SlidersHorizontal className="w-5 h-5" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Adjust Total Balance
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsResetBalanceModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 uppercase font-bold">Current Total Net Balance</p>
                <p className="text-xl font-black text-slate-900 dark:text-white">{formatCurrency(displayTotalBalance, currency)}</p>
              </div>
              <span className="text-xs font-bold text-teal-700 dark:text-teal-400">Across {wallets.length} Wallets</span>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Set Target Balance (in {base}):
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="dashboard-target-balance-input"
                  type="number"
                  step="any"
                  value={targetResetBalance}
                  onChange={(e) => setTargetResetBalance(e.target.value)}
                  placeholder="0"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-extrabold outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="button"
                  onClick={() => setTargetResetBalance('0')}
                  className="px-3 py-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs font-extrabold rounded-xl border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 transition cursor-pointer"
                >
                  Set to 0
                </button>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                Setting this will adjust your wallet account balances to this target amount.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetBalanceModalOpen(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="dashboard-confirm-reset-balance-btn"
                type="button"
                disabled={actionProcessing}
                onClick={handleExecuteResetBalances}
                className="flex-1 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-lg shadow-teal-700/20 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {actionProcessing ? 'Updating...' : 'Update Total Balance'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
