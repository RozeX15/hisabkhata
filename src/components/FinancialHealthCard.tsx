import React, { useState } from 'react';
import { Wallet, Transaction, BudgetProgress, Loan } from '../types';
import { evaluateFinancialHealth, FinancialHealthEvaluation } from '../lib/financialHealth';
import { formatCurrency } from '../lib/currencies';
import {
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  PiggyBank,
  Wallet as WalletIcon,
  CreditCard,
  LifeBuoy
} from 'lucide-react';

interface FinancialHealthCardProps {
  wallets: Wallet[];
  transactions: Transaction[];
  budgets?: BudgetProgress[];
  loans?: Loan[];
  currency: string;
  onOpenAiAdvisor?: () => void;
  onNavigate?: (view: string) => void;
}

export const FinancialHealthCard: React.FC<FinancialHealthCardProps> = ({
  wallets,
  transactions,
  budgets = [],
  loans = [],
  currency,
  onOpenAiAdvisor,
  onNavigate,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const health: FinancialHealthEvaluation = evaluateFinancialHealth(
    wallets,
    transactions,
    budgets,
    loans,
    currency
  );

  // Pillar visual colors
  const getPillarColor = (score: number, max: number) => {
    const pct = (score / max) * 100;
    if (pct >= 80) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500';
    if (pct >= 60) return 'text-teal-600 dark:text-teal-400 bg-teal-500';
    if (pct >= 40) return 'text-amber-600 dark:text-amber-400 bg-amber-500';
    return 'text-rose-600 dark:text-rose-400 bg-rose-500';
  };

  const getPillarBg = (score: number, max: number) => {
    const pct = (score / max) * 100;
    if (pct >= 80) return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800';
    if (pct >= 60) return 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800';
    if (pct >= 40) return 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800';
    return 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800';
  };

  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700';
      case 'B':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-950/70 dark:text-teal-300 border-teal-300 dark:border-teal-700';
      case 'C':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-700';
      default:
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 dark:border-rose-700';
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-5">
      {/* Top Banner: Score, Grade, Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-4">
          {/* Radial score badge */}
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100 dark:text-slate-700"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={
                  health.overallScore >= 75
                    ? 'text-emerald-500'
                    : health.overallScore >= 55
                    ? 'text-teal-500'
                    : health.overallScore >= 35
                    ? 'text-amber-500'
                    : 'text-rose-500'
                }
                strokeDasharray={`${health.overallScore}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black text-slate-900 dark:text-white leading-none">
                {health.overallScore}
              </span>
              <span className="text-[9px] font-bold text-slate-400 leading-none mt-0.5">/100</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Financial Health Score
              </h3>
              <span className={`px-2 py-0.5 rounded-md text-xs font-black border ${getGradeBadge(health.grade)}`}>
                Grade {health.grade}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Status:{' '}
              <strong className="text-slate-900 dark:text-slate-200">
                {health.statusLabel}
              </strong>{' '}
              • Evaluated across 4 liquidity and wealth resilience pillars
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          {onOpenAiAdvisor && (
            <button
              id="health-ai-coach-btn"
              type="button"
              onClick={onOpenAiAdvisor}
              className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Ask AI Coach</span>
            </button>
          )}

          <button
            id="health-expand-btn"
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
            title={isExpanded ? 'Collapse' : 'Expand full diagnostics'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 4 Pillars Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Pillar 1: Savings Performance */}
        <div className={`p-4 rounded-2xl border ${getPillarBg(health.pillars.savings.score, health.pillars.savings.maxScore)}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <PiggyBank className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Savings Velocity</span>
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white">
              {health.pillars.savings.score}/{health.pillars.savings.maxScore}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full ${getPillarColor(health.pillars.savings.score, health.pillars.savings.maxScore).split(' ')[1]}`}
              style={{ width: `${(health.pillars.savings.score / health.pillars.savings.maxScore) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
            {health.pillars.savings.summary}
          </p>
        </div>

        {/* Pillar 2: Budget Control */}
        <div className={`p-4 rounded-2xl border ${getPillarBg(health.pillars.budget.score, health.pillars.budget.maxScore)}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <WalletIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Budget Adherence</span>
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white">
              {health.pillars.budget.score}/{health.pillars.budget.maxScore}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full ${getPillarColor(health.pillars.budget.score, health.pillars.budget.maxScore).split(' ')[1]}`}
              style={{ width: `${(health.pillars.budget.score / health.pillars.budget.maxScore) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
            {health.pillars.budget.summary}
          </p>
        </div>

        {/* Pillar 3: Debt Burden */}
        <div className={`p-4 rounded-2xl border ${getPillarBg(health.pillars.debt.score, health.pillars.debt.maxScore)}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Debt / Liabilities</span>
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white">
              {health.pillars.debt.score}/{health.pillars.debt.maxScore}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full ${getPillarColor(health.pillars.debt.score, health.pillars.debt.maxScore).split(' ')[1]}`}
              style={{ width: `${(health.pillars.debt.score / health.pillars.debt.maxScore) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
            {health.pillars.debt.summary}
          </p>
        </div>

        {/* Pillar 4: Emergency Runway */}
        <div className={`p-4 rounded-2xl border ${getPillarBg(health.pillars.emergency.score, health.pillars.emergency.maxScore)}`}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <LifeBuoy className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Emergency Buffer</span>
            </div>
            <span className="text-xs font-black text-slate-900 dark:text-white">
              {health.pillars.emergency.score}/{health.pillars.emergency.maxScore}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full ${getPillarColor(health.pillars.emergency.score, health.pillars.emergency.maxScore).split(' ')[1]}`}
              style={{ width: `${(health.pillars.emergency.score / health.pillars.emergency.maxScore) * 100}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
            {health.metrics.emergencyMonthsRunway} months runway buffer
          </p>
        </div>
      </div>

      {/* Expanded Diagnostics & Smart Recommendations */}
      {isExpanded && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">
              Smart Actionable Recommendations
            </h4>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {health.recommendations.length} action items identified
            </span>
          </div>

          <div className="space-y-2.5">
            {health.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    rec.priority === 'high'
                      ? 'bg-rose-500'
                      : rec.priority === 'medium'
                      ? 'bg-amber-500'
                      : 'bg-teal-500'
                  }`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-900 dark:text-white">
                        {rec.title}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                        rec.priority === 'high'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          : rec.priority === 'medium'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300'
                      }`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {rec.description}
                    </p>
                  </div>
                </div>

                {rec.actionView && onNavigate && (
                  <button
                    type="button"
                    onClick={() => onNavigate(rec.actionView!)}
                    className="self-end sm:self-center px-3 py-1 rounded-xl text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <span>{rec.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
