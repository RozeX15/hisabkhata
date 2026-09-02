import React from 'react';
import { useI18n } from '../lib/i18n';
import { DashboardSummary, Wallet, Category, Transaction, SavingsGoal, Loan } from '../types';
import { formatCurrency } from '../lib/currencies';
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
  Plus,
  BarChart3,
  Calendar,
  CheckCircle2,
  PieChart as PieChartIcon
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
  Legend
} from 'recharts';

interface DashboardViewProps {
  summary: DashboardSummary | null;
  wallets: Wallet[];
  categories: Category[];
  currency: string;
  onOpenAddTransaction: (type?: 'income' | 'expense' | 'transfer') => void;
  onOpenAddGoal: () => void;
  onOpenContributeGoal: (goal: SavingsGoal) => void;
  onOpenAddBudget: () => void;
  onOpenAiAdvisor: () => void;
  onNavigate: (view: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  wallets,
  categories,
  currency,
  onOpenAddTransaction,
  onOpenAddGoal,
  onOpenContributeGoal,
  onOpenAddBudget,
  onOpenAiAdvisor,
  onNavigate,
}) => {
  const { t } = useI18n();

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

  const categoryPieData = summary.topExpenseCategories.map(c => ({
    name: c.name,
    value: c.amount,
    color: c.color,
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Hero Balance & Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Balance Card */}
        <div className="relative overflow-hidden p-5 rounded-3xl bg-gradient-to-br from-teal-800 via-teal-700 to-slate-900 text-white shadow-xl shadow-teal-900/10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-teal-100 uppercase tracking-wider">
              {t('total_balance')}
            </span>
            <div className="p-2 bg-white/10 rounded-xl">
              <WalletIcon className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black tracking-tight mb-1">
            {formatCurrency(summary.totalBalance, currency)}
          </div>
          <p className="text-xs text-teal-200 font-medium">
            Across {wallets.length} active {wallets.length === 1 ? 'account' : 'accounts'}
          </p>
        </div>

        {/* This Month Income */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('total_income')}
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mb-1">
            {formatCurrency(summary.totalIncomeThisMonth, currency)}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className={`font-bold ${summary.incomeChangePercent >= 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
              {summary.incomeChangePercent >= 0 ? `+${summary.incomeChangePercent}%` : `${summary.incomeChangePercent}%`}
            </span>
            <span className="text-slate-400 dark:text-slate-500">vs last month</span>
          </div>
        </div>

        {/* This Month Expenses */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('total_expenses')}
            </span>
            <div className="p-2 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 tracking-tight mb-1">
            {formatCurrency(summary.totalExpensesThisMonth, currency)}
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <span className={`font-bold ${summary.expenseChangePercent > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
              {summary.expenseChangePercent >= 0 ? `+${summary.expenseChangePercent}%` : `${summary.expenseChangePercent}%`}
            </span>
            <span className="text-slate-400 dark:text-slate-500">vs last month</span>
          </div>
        </div>

        {/* Net Cashflow / Savings */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('net_savings')}
            </span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
              <PiggyBank className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black tracking-tight mb-1 ${summary.netSavingsThisMonth >= 0 ? 'text-teal-700 dark:text-teal-400' : 'text-red-500'}`}>
            {formatCurrency(summary.netSavingsThisMonth, currency)}
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {summary.netSavingsThisMonth >= 0 ? 'Positive cashflow surplus' : 'Deficit this month'}
          </p>
        </div>
      </div>

      {/* 2. Quick Action Toolbar */}
      <div className="p-3 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          <button
            id="quick-add-expense"
            type="button"
            onClick={() => onOpenAddTransaction('expense')}
            className="px-3.5 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Add Expense</span>
          </button>

          <button
            id="quick-add-income"
            type="button"
            onClick={() => onOpenAddTransaction('income')}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Add Income</span>
          </button>

          <button
            id="quick-add-transfer"
            type="button"
            onClick={() => onOpenAddTransaction('transfer')}
            className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>Transfer</span>
          </button>

          <button
            id="quick-add-goal"
            type="button"
            onClick={onOpenAddGoal}
            className="px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Target className="w-4 h-4" />
            <span>New Goal</span>
          </button>

          <button
            id="quick-add-budget"
            type="button"
            onClick={onOpenAddBudget}
            className="px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
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
      {summary.smartInsights.length > 0 && (
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
              <p className="text-xs text-slate-400">Past 6 months comparison</p>
            </div>
            <div className="flex items-center gap-3 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Income
              </span>
              <span className="flex items-center gap-1.5 text-red-500">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" /> Expense
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.monthlySpendingTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: number) => [`${currency} ${val.toLocaleString()}`, '']}
                  contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
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
              <p className="text-xs text-slate-400">Current month distribution</p>
            </div>
          </div>

          <div className="flex-1 min-h-[180px] flex items-center justify-center">
            {categoryPieData.length === 0 ? (
              <p className="text-xs text-slate-400">No expense transactions recorded this month</p>
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
                    formatter={(val: number) => [`${currency} ${val.toLocaleString()}`, '']}
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Legend categories */}
          <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
            {summary.topExpenseCategories.slice(0, 4).map((c, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-slate-600 dark:text-slate-300 font-medium truncate">{c.name}</span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white shrink-0">
                  {c.percentage}% ({formatCurrency(c.amount, currency)})
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
              <p className="text-xs text-slate-400">Track and prevent overspending</p>
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
            {summary.budgetSummaries.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <PieChartIcon className="w-8 h-8 mx-auto mb-1 opacity-30" />
                <p className="text-xs font-medium">No budgets created yet</p>
              </div>
            ) : (
              summary.budgetSummaries.map((b) => {
                const isOver = b.status === 'over_budget';
                const isWarning = b.status === 'warning';
                return (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {b.categoryName}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">
                          {formatCurrency(b.spent, currency)} / {formatCurrency(b.amount, currency)}
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
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
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
              <p className="text-xs text-slate-400">Milestones & emergency funds</p>
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
            {summary.savingsGoals.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <Target className="w-8 h-8 mx-auto mb-1 opacity-30" />
                <p className="text-xs font-medium">No savings goals created yet</p>
              </div>
            ) : (
              summary.savingsGoals.map((g) => {
                const percent = Math.round((g.currentAmount / g.targetAmount) * 100);
                const isCompleted = percent >= 100;
                return (
                  <div key={g.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
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
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{formatCurrency(g.currentAmount, currency)} saved</span>
                        <span>Target: {formatCurrency(g.targetAmount, currency)}</span>
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
            <p className="text-xs text-slate-400">Latest financial activities</p>
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

        <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
          {summary.recentTransactions.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No transactions recorded yet. Click "Add" above to start.
            </div>
          ) : (
            summary.recentTransactions.map((tx) => {
              const isIncome = tx.type === 'income';
              const isTransfer = tx.type === 'transfer';
              return (
                <div key={tx.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-2xl shrink-0 ${
                      isIncome ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400' :
                      isTransfer ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400' :
                      'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                    }`}>
                      {isIncome ? <ArrowUpRight className="w-4 h-4" /> : isTransfer ? <ArrowLeftRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                        {tx.description}
                      </p>
                      <p className="text-[11px] text-slate-400 flex items-center gap-2">
                        <span>{tx.date}</span>
                        {tx.note && <span className="truncate max-w-[120px]">({tx.note})</span>}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className={`text-xs sm:text-sm font-extrabold ${
                      isIncome ? 'text-emerald-600 dark:text-emerald-400' :
                      isTransfer ? 'text-blue-600 dark:text-blue-400' :
                      'text-red-600 dark:text-red-400'
                    }`}>
                      {isIncome ? '+' : isTransfer ? '' : '-'}{formatCurrency(tx.amount, currency)}
                    </p>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {tx.type}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
