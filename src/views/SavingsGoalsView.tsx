import React from 'react';
import { useI18n } from '../lib/i18n';
import { SavingsGoal } from '../types';
import { formatCurrency } from '../lib/currencies';
import {
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldCheck,
  Laptop,
  Plane,
  Home,
  Car
} from 'lucide-react';

interface SavingsGoalsViewProps {
  goals: SavingsGoal[];
  currency: string;
  onOpenAddGoal: () => void;
  onOpenContribute: (g: SavingsGoal) => void;
  onDeleteGoal: (id: string) => Promise<void>;
}

export const SavingsGoalsView: React.FC<SavingsGoalsViewProps> = ({
  goals,
  currency,
  onOpenAddGoal,
  onOpenContribute,
  onDeleteGoal,
}) => {
  const { t } = useI18n();
  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldCheck': return ShieldCheck;
      case 'Laptop': return Laptop;
      case 'Plane': return Plane;
      case 'Home': return Home;
      case 'Car': return Car;
      default: return Target;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('nav_savings_goals')} & Vaults
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Total Saved in Vaults: <strong className="text-teal-700 dark:text-teal-400">{formatCurrency(totalSaved, currency)}</strong> of {formatCurrency(totalTarget, currency)} target
          </p>
        </div>

        <button
          id="add-goal-btn"
          type="button"
          onClick={onOpenAddGoal}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-700/20 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('add_goal')}</span>
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/80">
            <Target className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">No Active Savings Goals</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Create target goals for emergency funds, education, travel, or hardware upgrades.
            </p>
            <button
              type="button"
              onClick={onOpenAddGoal}
              className="px-4 py-2 bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Create First Goal
            </button>
          </div>
        ) : (
          goals.map((g) => {
            const percent = Math.round((g.currentAmount / g.targetAmount) * 100);
            const isCompleted = percent >= 100 || g.status === 'completed';
            const IconComp = getIcon(g.icon || 'Target');

            return (
              <div
                key={g.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 flex items-center justify-center">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {g.name}
                        </h3>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>Target: {g.targetDate}</span>
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteGoal(g.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {g.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mb-3">
                      {g.description}
                    </p>
                  )}

                  {/* Progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">
                        {formatCurrency(g.currentAmount, currency)} saved
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {formatCurrency(g.targetAmount, currency)}
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isCompleted ? 'bg-emerald-500' : 'bg-teal-600'
                        }`}
                        style={{ width: `${Math.min(100, percent)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" /> Goal Achieved!
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-teal-700 dark:text-teal-400">
                        {percent}% Complete
                      </span>
                    )}
                  </div>

                  {!isCompleted && (
                    <button
                      type="button"
                      onClick={() => onOpenContribute(g)}
                      className="px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                    >
                      Deposit Funds
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
