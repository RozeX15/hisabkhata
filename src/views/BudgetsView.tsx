import React from 'react';
import { useI18n } from '../lib/i18n';
import { BudgetProgress } from '../types';
import { formatCurrency } from '../lib/currencies';
import {
  PieChart as PieChartIcon,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  TrendingDown
} from 'lucide-react';

interface BudgetsViewProps {
  budgets: BudgetProgress[];
  currency: string;
  onOpenAddBudget: () => void;
  onDeleteBudget: (id: string) => Promise<void>;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  currency,
  onOpenAddBudget,
  onDeleteBudget,
}) => {
  const { t } = useI18n();
  const totalBudgeted = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header with summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('nav_budgets')} Management
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Total Budget Limit: <strong className="text-slate-900 dark:text-white">{formatCurrency(totalBudgeted, currency)}</strong> •
            Total Spent: <strong className="text-red-500">{formatCurrency(totalSpent, currency)}</strong>
          </p>
        </div>

        <button
          id="add-budget-btn"
          type="button"
          onClick={onOpenAddBudget}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-700/20 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('set_budget')}</span>
        </button>
      </div>

      {/* Budgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/80">
            <PieChartIcon className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">No Category Budgets Configured</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Set monthly spending caps on groceries, entertainment, or transport to receive proactive alerts.
            </p>
            <button
              type="button"
              onClick={onOpenAddBudget}
              className="px-4 py-2 bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Create First Budget
            </button>
          </div>
        ) : (
          budgets.map((b) => {
            const isOver = b.status === 'over_budget';
            const isWarning = b.status === 'warning';
            return (
              <div
                key={b.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {b.categoryName}
                      </h3>
                      <span className="text-[11px] text-slate-400 capitalize">
                        {b.period} Cycle ({b.month})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteBudget(b.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-1.5 mt-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">Spent: {formatCurrency(b.spent, currency)}</span>
                      <span className="font-bold text-slate-900 dark:text-white">Cap: {formatCurrency(b.amount, currency)}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isOver ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-teal-600'
                        }`}
                        style={{ width: `${Math.min(100, b.percentage)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    {isOver ? (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    ) : isWarning ? (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                    <span className={`font-bold ${isOver ? 'text-red-500' : isWarning ? 'text-amber-500' : 'text-emerald-600'}`}>
                      {isOver ? `Exceeded by ${formatCurrency(b.spent - b.amount, currency)}` : `${formatCurrency(b.remaining, currency)} remaining`}
                    </span>
                  </div>
                  <span className="font-extrabold text-slate-700 dark:text-slate-300">
                    {b.percentage}%
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
