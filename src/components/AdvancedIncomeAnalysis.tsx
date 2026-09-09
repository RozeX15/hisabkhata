import React, { useState } from 'react';
import { Transaction, Category } from '../types';
import { analyzeUserIncome } from '../lib/incomeAnalysis';
import { formatCurrency } from '../lib/currencies';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Repeat,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
  ShieldCheck,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CircleDollarSign,
  Briefcase
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
  AreaChart,
  Area
} from 'recharts';

interface AdvancedIncomeAnalysisProps {
  transactions: Transaction[];
  categories: Category[];
  currency: string;
}

export const AdvancedIncomeAnalysis: React.FC<AdvancedIncomeAnalysisProps> = ({
  transactions,
  categories,
  currency,
}) => {
  const [period, setPeriod] = useState<'all' | '30days' | '90days' | '180days' | '365days'>('all');
  const [activeTab, setActiveTab] = useState<'sources' | 'trends' | 'recurring' | 'forecast'>('sources');

  const analysis = analyzeUserIncome(transactions, categories, period);

  const getSavingsBadgeClass = (rating: string) => {
    switch (rating) {
      case 'excellent':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
      case 'good':
        return 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border-teal-300 dark:border-teal-800';
      case 'moderate':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
      case 'low':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border-orange-300 dark:border-orange-800';
      default:
        return 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800';
    }
  };

  const pieChartData = analysis.incomeBySource.map((s) => ({
    name: s.categoryName,
    value: s.totalAmount,
    color: s.color,
  }));

  return (
    <div className="space-y-6">
      {/* Control Bar & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Advanced Income Analytics
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Inflow Dynamics & Cashflow Modeling
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time multi-source categorization, recurring inflow stability & predictive projections
          </p>
        </div>

        {/* Period Pills */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl shrink-0 overflow-x-auto">
          {(
            [
              { key: 'all', label: 'All Time' },
              { key: '30days', label: '30D' },
              { key: '90days', label: '90D' },
              { key: '180days', label: '6M' },
              { key: '365days', label: '1Y' },
            ] as const
          ).map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                period === p.key
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Inflow
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <CircleDollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(analysis.totalIncome, currency)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Avg/Transaction:
            </span>
            <span>{formatCurrency(analysis.averagePerTransaction, currency)}</span>
          </div>
        </div>

        {/* Monthly Average & Run Rate */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Monthly Inflow Run-Rate
            </span>
            <div className="w-7 h-7 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(analysis.monthlyAverageIncome, currency)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="text-slate-400">Daily Average:</span>
            <span className="font-semibold text-teal-700 dark:text-teal-400">
              {formatCurrency(Math.round(analysis.monthlyAverageIncome / 30), currency)}/day
            </span>
          </div>
        </div>

        {/* MoM Growth / Decline */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              MoM Growth Trend
            </span>
            <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${
              analysis.momGrowthPercent >= 0
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
            }`}>
              {analysis.momGrowthPercent >= 0 ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : (
                <ArrowDownRight className="w-4 h-4" />
              )}
            </div>
          </div>
          <p className={`text-2xl font-black ${
            analysis.momGrowthPercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
          }`}>
            {analysis.momGrowthPercent >= 0 ? `+${analysis.momGrowthPercent}%` : `${analysis.momGrowthPercent}%`}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Compared to previous calendar month
          </p>
        </div>

        {/* Recurring Inflow Baseline */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Recurring Inflow Base
            </span>
            <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center">
              <Repeat className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {formatCurrency(analysis.recurringTotalMonthly, currency)}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-xs">
            <span className="px-2 py-0.5 rounded-full font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 text-[10px]">
              {analysis.recurringPercentage}% Recurring Share
            </span>
          </div>
        </div>
      </div>

      {/* Income vs Expenses Cashflow Summary Strip */}
      <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
              Net Surplus & Savings Performance
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getSavingsBadgeClass(analysis.savingsRateRating)}`}>
              {analysis.savingsRateLabel}
            </span>
          </div>
          <p className="text-sm text-slate-300">
            Current Outflow is{' '}
            <strong className="text-white">
              {analysis.totalIncome > 0
                ? Math.round((analysis.totalExpense / analysis.totalIncome) * 100)
                : 0}%
            </strong>{' '}
            of total inflow. Net retention:{' '}
            <strong className="text-emerald-400">
              {formatCurrency(analysis.netCashflow, currency)}
            </strong>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Savings Velocity</span>
            <span className="text-xl font-black text-emerald-400">
              {analysis.overallSavingsRate}%
            </span>
          </div>
          <div className="w-px h-8 bg-slate-700" />
          <div className="text-right">
            <span className="text-[11px] text-slate-400 block">Net Surplus Gap</span>
            <span className={`text-xl font-black ${analysis.netCashflow >= 0 ? 'text-teal-300' : 'text-rose-400'}`}>
              {analysis.netCashflow >= 0 ? '+' : ''}{formatCurrency(analysis.netCashflow, currency)}
            </span>
          </div>
        </div>
      </div>

      {/* View Switcher Tabs for Details */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
        {[
          { id: 'sources', label: 'Income by Source', icon: PieChartIcon },
          { id: 'trends', label: 'Monthly Trends & Comparison', icon: BarChart3 },
          { id: 'recurring', label: 'Recurring Streams', icon: Repeat },
          { id: 'forecast', label: 'Simple Forecast', icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-teal-700 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Income By Source */}
      {activeTab === 'sources' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Visual Donut Chart */}
          <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
            <div>
              <h4 className="font-black text-slate-900 dark:text-white text-base mb-1">
                Income Source Distribution
              </h4>
              <p className="text-xs text-slate-400 mb-4">
                Relative percentage contribution across inflow channels
              </p>
            </div>

            <div className="h-60 w-full flex items-center justify-center">
              {pieChartData.length === 0 ? (
                <div className="text-center p-6 text-xs text-slate-400">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                  No income transactions recorded for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`source-cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [`${currency} ${val.toLocaleString()}`, 'Amount']}
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderRadius: '12px',
                        border: 'none',
                        color: '#fff',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Top legend preview */}
            <div className="grid grid-cols-2 gap-2 mt-4 max-h-28 overflow-y-auto">
              {analysis.incomeBySource.slice(0, 6).map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-slate-700 dark:text-slate-300 font-medium">
                    {item.categoryName} ({item.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Sources Detail Table */}
          <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <h4 className="font-black text-slate-900 dark:text-white text-base mb-1">
              Source Portfolio Breakdown
            </h4>
            <p className="text-xs text-slate-400 mb-4">
              Individual channel totals, volume, and transaction frequency
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/80 text-slate-400 uppercase tracking-wider font-bold">
                    <th className="pb-3 pl-2">Channel / Category</th>
                    <th className="pb-3 text-right">Inflow Volume</th>
                    <th className="pb-3 text-right">Share</th>
                    <th className="pb-3 text-right">Count</th>
                    <th className="pb-3 text-right pr-2">Avg / Event</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {analysis.incomeBySource.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        No income channels identified yet.
                      </td>
                    </tr>
                  ) : (
                    analysis.incomeBySource.map((source) => (
                      <tr key={source.categoryId} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/50 transition">
                        <td className="py-3.5 pl-2 font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                          <span
                            className="w-3 h-3 rounded-md shrink-0 shadow-2xs"
                            style={{ backgroundColor: source.color }}
                          />
                          <span>{source.categoryName}</span>
                        </td>
                        <td className="py-3.5 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(source.totalAmount, currency)}
                        </td>
                        <td className="py-3.5 text-right font-semibold text-slate-600 dark:text-slate-300">
                          {source.percentage}%
                        </td>
                        <td className="py-3.5 text-right text-slate-500 dark:text-slate-400">
                          {source.transactionCount} txs
                        </td>
                        <td className="py-3.5 text-right pr-2 font-mono text-slate-600 dark:text-slate-300">
                          {formatCurrency(source.averageAmount, currency)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Monthly Trends & Income vs Expense */}
      {activeTab === 'trends' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-black text-slate-900 dark:text-white text-base">
                Multi-Month Income vs. Outflow Trajectory
              </h4>
              <p className="text-xs text-slate-400">
                Tracking inflow expansion, expense containment, and net cashflow surplus
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-3 h-3 rounded-md bg-emerald-500 inline-block" />
                <span>Income</span>
              </div>
              <div className="flex items-center gap-1.5 text-rose-500">
                <span className="w-3 h-3 rounded-md bg-rose-500 inline-block" />
                <span>Expenses</span>
              </div>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analysis.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="monthLabel" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val: number, name: string) => [
                    `${currency} ${val.toLocaleString()}`,
                    name === 'income' ? 'Income' : 'Expense',
                  ]}
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '12px',
                    border: 'none',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]} name="income" />
                <Bar dataKey="expense" fill="#EF4444" radius={[6, 6, 0, 0]} name="expense" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Month by month audit table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-700/80 text-slate-400 uppercase tracking-wider font-bold">
                  <th className="pb-2">Month</th>
                  <th className="pb-2 text-right">Income</th>
                  <th className="pb-2 text-right">Expenses</th>
                  <th className="pb-2 text-right">Net Cashflow</th>
                  <th className="pb-2 text-right">Savings Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {analysis.monthlyTrends.map((m) => (
                  <tr key={m.monthKey} className="hover:bg-slate-50/50 dark:hover:bg-slate-750/50 transition">
                    <td className="py-2.5 font-bold text-slate-900 dark:text-white">{m.monthLabel}</td>
                    <td className="py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(m.income, currency)}
                    </td>
                    <td className="py-2.5 text-right font-bold text-rose-500">
                      {formatCurrency(m.expense, currency)}
                    </td>
                    <td className={`py-2.5 text-right font-black ${m.netCashflow >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-500'}`}>
                      {m.netCashflow >= 0 ? '+' : ''}{formatCurrency(m.netCashflow, currency)}
                    </td>
                    <td className="py-2.5 text-right font-mono font-bold text-purple-600 dark:text-purple-400">
                      {m.savingsRate}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Recurring Income Streams */}
      {activeTab === 'recurring' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-black text-slate-900 dark:text-white text-base">
                Recurring Inflow Streams
              </h4>
              <p className="text-xs text-slate-400">
                Algorithmic detection of repeat salaries, leases, retainers, and subscriptions
              </p>
            </div>
            <div className="px-3 py-1 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 rounded-xl text-xs font-bold">
              Total: {formatCurrency(analysis.recurringTotalMonthly, currency)} / month
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {analysis.recurringIncomeStreams.length === 0 ? (
              <div className="col-span-full p-8 text-center bg-slate-50 dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <Repeat className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  No recurring streams detected yet
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Log repeat monthly salary or freelance contracts to activate recurring cashflow telemetry.
                </p>
              </div>
            ) : (
              analysis.recurringIncomeStreams.map((stream) => (
                <div
                  key={stream.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-start justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {stream.sourceName}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-[10px] font-black uppercase">
                        {stream.frequency}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Last: {stream.lastReceivedDate}
                      </span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                        {stream.confidence} confidence
                      </span>
                    </div>
                  </div>
                  <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(stream.estimatedMonthlyAmount, currency)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Simple Forecast Next Month */}
      {activeTab === 'forecast' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Predictive Cashflow Modeling
              </span>
            </div>
            <h4 className="font-black text-slate-900 dark:text-white text-base">
              Simple Next-Month Inflow Forecast
            </h4>
            <p className="text-xs text-slate-400">
              {analysis.simpleForecastNextMonth.methodDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Conservative Floor */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Conservative Floor
              </span>
              <p className="text-2xl font-black text-slate-700 dark:text-slate-300">
                {formatCurrency(analysis.simpleForecastNextMonth.baselineFloor, currency)}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Guaranteed recurring contracts & baseline minimum
              </p>
            </div>

            {/* Expected Projection */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30 border-2 border-teal-500/40 shadow-xs">
              <span className="text-xs font-black text-teal-800 dark:text-teal-300 uppercase tracking-wider block mb-1">
                Expected Inflow Target
              </span>
              <p className="text-3xl font-black text-teal-700 dark:text-teal-300">
                {formatCurrency(analysis.simpleForecastNextMonth.projectedAmount, currency)}
              </p>
              <p className="text-xs text-teal-800/80 dark:text-teal-200/80 mt-2 font-medium">
                Weighted combination of recurring base + 3-month velocity
              </p>
            </div>

            {/* Optimistic Ceiling */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Optimistic Upper Bound
              </span>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {formatCurrency(analysis.simpleForecastNextMonth.optimisticCeiling, currency)}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Assuming 20% acceleration in bonus / variable receipts
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
