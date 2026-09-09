import React, { useState } from 'react';
import { Transaction, Category } from '../types';
import { analyzeUserExpenses } from '../lib/expenseAnalysis';
import { formatCurrency } from '../lib/currencies';
import {
  TrendingDown,
  TrendingUp,
  Calendar,
  Layers,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CircleDollarSign,
  AlertTriangle,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Sliders,
  Compass,
  ArrowRight,
  DollarSign
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
  AreaChart,
  Area
} from 'recharts';

interface AdvancedExpenseAnalysisProps {
  transactions: Transaction[];
  categories: Category[];
  currency: string;
  onOpenAddExpense?: () => void;
}

export const AdvancedExpenseAnalysis: React.FC<AdvancedExpenseAnalysisProps> = ({
  transactions,
  categories,
  currency,
  onOpenAddExpense,
}) => {
  const [period, setPeriod] = useState<'all' | '30days' | '90days' | '180days' | '365days'>('all');
  const [activeTab, setActiveTab] = useState<'categories' | 'trends' | 'behavior' | 'outliers' | 'forecast'>('categories');

  const analysis = analyzeUserExpenses(transactions, categories, period);

  const getMomBadge = () => {
    if (analysis.momDirection === 'no_prior_data') {
      return {
        text: 'First Recorded Month',
        color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        icon: Clock,
      };
    }
    if (analysis.momGrowthPercent > 0) {
      return {
        text: `+${analysis.momGrowthPercent}% vs Last Month`,
        color: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
        icon: ArrowUpRight,
      };
    }
    if (analysis.momGrowthPercent < 0) {
      return {
        text: `${analysis.momGrowthPercent}% vs Last Month`,
        color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
        icon: ArrowDownRight,
      };
    }
    return {
      text: 'Unchanged vs Last Month',
      color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      icon: Clock,
    };
  };

  const momBadge = getMomBadge();
  const MomIcon = momBadge.icon;

  const pieChartData = analysis.topCategories.map((c) => ({
    name: c.categoryName,
    value: c.totalAmount,
    color: c.color,
  }));

  const dayOfWeekChartData = analysis.dailySpending.dayOfWeekDistribution.map((d) => ({
    name: d.shortName,
    amount: d.totalAmount,
    percentage: d.percentage,
    count: d.transactionCount,
  }));

  return (
    <div className="space-y-6">
      {/* Control Bar & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Advanced Expense Analytics
            </span>
            <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 text-[10px] font-black uppercase tracking-wider">
              Spending Behavior
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Outflow Architecture & Behavior Modeling
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time multi-category distribution, daily burn rates, fixed vs variable obligations & outlier audits
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
                  ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Insufficient Data Full Banner */}
      {analysis.isInsufficientData ? (
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
            <HelpCircle className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="text-lg font-black text-slate-900 dark:text-white">
              Insufficient Expense Data
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              {analysis.insufficientDataReason} We never fabricate synthetic metrics. Once you log transactions, this dashboard will illuminate your top outflow channels, daily burn rate, and behavioral patterns.
            </p>
          </div>
          {onOpenAddExpense && (
            <button
              type="button"
              onClick={onOpenAddExpense}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <TrendingDown className="w-4 h-4" />
              <span>Record an Expense</span>
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Top KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Expenses */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Total Outflow
                </span>
                <div className="w-7 h-7 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center justify-center">
                  <TrendingDown className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {formatCurrency(analysis.totalExpense, currency)}
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  {analysis.expenseTransactionCount} transactions
                </span>
                <span>• Avg {formatCurrency(analysis.averagePerTransaction, currency)}</span>
              </div>
            </div>

            {/* Daily Burn Rate */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Daily Burn Rate
                </span>
                <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {formatCurrency(analysis.dailySpending.currentMonthDailyAverage, currency)}
                <span className="text-xs font-normal text-slate-400">/day</span>
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span>Month-to-date ({analysis.dailySpending.daysElapsedInMonth} days)</span>
              </div>
            </div>

            {/* Month-over-Month Velocity */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  MoM Expense Change
                </span>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${momBadge.color}`}>
                  <MomIcon className="w-4 h-4" />
                </div>
              </div>
              <p className={`text-2xl font-black ${
                analysis.momGrowthPercent > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : analysis.momGrowthPercent < 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-900 dark:text-white'
              }`}>
                {analysis.momDirection === 'no_prior_data'
                  ? 'Base Month'
                  : analysis.momGrowthPercent > 0
                  ? `+${analysis.momGrowthPercent}%`
                  : `${analysis.momGrowthPercent}%`}
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 dark:text-slate-400">
                {analysis.previousMonthExpense > 0 ? (
                  <span>
                    Prev: {formatCurrency(analysis.previousMonthExpense, currency)} ({analysis.momDelta >= 0 ? '+' : ''}{formatCurrency(analysis.momDelta, currency)})
                  </span>
                ) : (
                  <span>No prior month data recorded</span>
                )}
              </div>
            </div>

            {/* Fixed vs Variable Structure */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Fixed vs Variable
                </span>
                <div className="w-7 h-7 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
                {analysis.fixedVsVariable.fixedPercentage}% Fixed
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {analysis.fixedVsVariable.variablePercentage}% Variable
                </span>
                <span className="text-[11px] truncate">{analysis.fixedVsVariable.fixedRatioLabel}</span>
              </div>
            </div>
          </div>

          {/* “WHERE IS MY MONEY GOING?” EXECUTIVE HERO BANNER */}
          <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-md space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Compass className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                    “Where Is My Money Going?” Summary
                  </span>
                </div>
                <h4 className="text-base font-black text-white">
                  {analysis.whereIsMoneyGoing.headline}
                </h4>
              </div>

              {analysis.whereIsMoneyGoing.primaryCategory && (
                <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-700 shrink-0">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: analysis.whereIsMoneyGoing.primaryCategory.color }}
                  />
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-400 block">
                      #1 Outflow Channel
                    </span>
                    <span className="text-sm font-black text-white">
                      {analysis.whereIsMoneyGoing.primaryCategory.categoryName} ({analysis.whereIsMoneyGoing.primaryCategory.percentage}%)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Needs vs Wants Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400 inline-block" />
                  Needs & Essentials: {formatCurrency(analysis.whereIsMoneyGoing.needsVsWants.needsTotal, currency)} ({analysis.whereIsMoneyGoing.needsVsWants.needsPercentage}%)
                </span>
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                  Wants & Discretionary: {formatCurrency(analysis.whereIsMoneyGoing.needsVsWants.wantsTotal, currency)} ({analysis.whereIsMoneyGoing.needsVsWants.wantsPercentage}%)
                </span>
              </div>

              <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  className="bg-teal-500 h-full transition-all duration-500"
                  style={{ width: `${analysis.whereIsMoneyGoing.needsVsWants.needsPercentage}%` }}
                />
                <div
                  className="bg-rose-500 h-full transition-all duration-500"
                  style={{ width: `${analysis.whereIsMoneyGoing.needsVsWants.wantsPercentage}%` }}
                />
              </div>

              <p className="text-[11px] text-slate-400 italic">
                {analysis.whereIsMoneyGoing.needsVsWants.compliance503020Note}
              </p>
            </div>

            {/* Key Takeaways Bullets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-xs text-slate-300">
              {analysis.whereIsMoneyGoing.keyTakeaways.map((point, idx) => (
                <div key={idx} className="flex items-start gap-2 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sub-Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 overflow-x-auto pb-1">
            <button
              id="expense-tab-categories"
              type="button"
              onClick={() => setActiveTab('categories')}
              className={`px-4 py-2.5 text-xs font-black rounded-xl transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'categories'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <PieChartIcon className="w-4 h-4" />
              <span>Top Categories ({analysis.topCategories.length})</span>
            </button>

            <button
              id="expense-tab-trends"
              type="button"
              onClick={() => setActiveTab('trends')}
              className={`px-4 py-2.5 text-xs font-black rounded-xl transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'trends'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Monthly Trends & MoM</span>
            </button>

            <button
              id="expense-tab-behavior"
              type="button"
              onClick={() => setActiveTab('behavior')}
              className={`px-4 py-2.5 text-xs font-black rounded-xl transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'behavior'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Daily & Weekly Behavior</span>
            </button>

            <button
              id="expense-tab-outliers"
              type="button"
              onClick={() => setActiveTab('outliers')}
              className={`px-4 py-2.5 text-xs font-black rounded-xl transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'outliers'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              <span>High Spikes & Outliers</span>
              {analysis.unusualSpikes.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                  {analysis.unusualSpikes.length}
                </span>
              )}
            </button>

            <button
              id="expense-tab-forecast"
              type="button"
              onClick={() => setActiveTab('forecast')}
              className={`px-4 py-2.5 text-xs font-black rounded-xl transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === 'forecast'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Lightbulb className="w-4 h-4" />
              <span>Forecast & Insights</span>
            </button>
          </div>

          {/* TAB 1: TOP CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Donut Chart */}
              <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
                <div>
                  <h4 className="font-black text-slate-900 dark:text-white text-base">
                    Category Distribution
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Proportion of total outflows absorbed by each sector
                  </p>
                </div>

                <div className="h-64 w-full my-4">
                  {pieChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={65}
                          outerRadius={95}
                          paddingAngle={3}
                        >
                          {pieChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => [formatCurrency(Number(value) || 0, currency), 'Amount']}
                          contentStyle={{
                            backgroundColor: '#0F172A',
                            borderColor: '#334155',
                            borderRadius: '12px',
                            color: '#FFFFFF',
                            fontSize: '12px',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                      No category records available
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="text-slate-400 block mb-1">Top 3 Concentration:</span>
                  <span className="font-black text-slate-900 dark:text-white">
                    {analysis.whereIsMoneyGoing.top3CategoriesShare}% of total outflows are concentrated in{' '}
                    {analysis.whereIsMoneyGoing.top3CategoriesList.join(', ')}
                  </span>
                </div>
              </div>

              {/* Detailed Category Ranking List */}
              <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-base">
                      Ranked Outflow Channels
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Sorted by total expenditure volume with average spend per event
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {analysis.topCategories.length} categories
                  </span>
                </div>

                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {analysis.topCategories.map((cat) => (
                    <div
                      key={cat.categoryId}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-5 h-5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-black flex items-center justify-center shrink-0">
                            #{cat.rank}
                          </span>
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <div>
                            <span className="text-xs font-black text-slate-900 dark:text-white block">
                              {cat.categoryName}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {cat.transactionCount} transactions • Avg {formatCurrency(cat.averageAmount, currency)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-black text-rose-600 dark:text-rose-400 block">
                            {formatCurrency(cat.totalAmount, currency)}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                            {cat.percentage}% of total
                          </span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${cat.percentage}%`,
                            backgroundColor: cat.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MONTHLY TRENDS & MOM */}
          {activeTab === 'trends' && (
            <div className="space-y-6">
              {/* Monthly Trend Chart */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-base">
                      6-Month Expense Velocity Trend
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Comparison of monthly outflows alongside income and net balance impact
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1 text-rose-500 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                      Expenses
                    </span>
                    <span className="flex items-center gap-1 text-emerald-500 font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                      Income
                    </span>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                      <XAxis dataKey="monthLabel" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis
                        stroke="#94A3B8"
                        fontSize={11}
                        tickLine={false}
                        tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                      />
                      <Tooltip
                        formatter={(val: any, name: any) => [
                          formatCurrency(Number(val) || 0, currency),
                          name === 'expense' ? 'Expenses' : 'Income',
                        ]}
                        contentStyle={{
                          backgroundColor: '#0F172A',
                          borderColor: '#334155',
                          borderRadius: '12px',
                          color: '#FFFFFF',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="expense" fill="#EF4444" radius={[6, 6, 0, 0]} maxBarSize={36} />
                      <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Month-by-Month Audit Table */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                <h4 className="font-black text-slate-900 dark:text-white text-base mb-4">
                  Month-by-Month Expenditure Audit
                </h4>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-bold uppercase tracking-wider">
                        <th className="pb-3 font-semibold">Month</th>
                        <th className="pb-3 font-semibold">Total Expenses</th>
                        <th className="pb-3 font-semibold">Total Income</th>
                        <th className="pb-3 font-semibold">Net Cashflow</th>
                        <th className="pb-3 font-semibold">MoM Expense Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {analysis.monthlyTrends.map((m) => (
                        <tr key={m.monthKey} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/60 transition">
                          <td className="py-3.5 font-black text-slate-900 dark:text-white">
                            {m.monthLabel}
                            {m.monthKey === analysis.currentMonthKey && (
                              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 font-bold">
                                Current
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 font-extrabold text-rose-600 dark:text-rose-400">
                            {formatCurrency(m.expense, currency)}
                          </td>
                          <td className="py-3.5 font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(m.income, currency)}
                          </td>
                          <td className="py-3.5 font-bold">
                            <span className={m.netCashflow >= 0 ? 'text-teal-600 dark:text-teal-400' : 'text-rose-500'}>
                              {m.netCashflow >= 0 ? '+' : ''}{formatCurrency(m.netCashflow, currency)}
                            </span>
                          </td>
                          <td className="py-3.5">
                            {m.momChangePercent === null ? (
                              <span className="text-slate-400">--</span>
                            ) : (
                              <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                                m.momChangePercent > 0
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                  : m.momChangePercent < 0
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}>
                                {m.momChangePercent > 0 ? `+${m.momChangePercent}%` : `${m.momChangePercent}%`}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SPENDING BEHAVIOR & TIMING */}
          {activeTab === 'behavior' && (
            <div className="space-y-6">
              {/* Daily & Day of Week Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Day of Week Chart */}
                <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-black text-slate-900 dark:text-white text-base">
                        Weekly Outflow Distribution
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Total capital spent across days of the week
                      </p>
                    </div>
                    {analysis.dailySpending.busiestDayOfWeek && (
                      <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 text-xs font-bold">
                        Busiest: {analysis.dailySpending.busiestDayOfWeek.dayName}
                      </span>
                    )}
                  </div>

                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dayOfWeekChartData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.15} vertical={false} />
                        <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                        <YAxis
                          stroke="#94A3B8"
                          fontSize={11}
                          tickLine={false}
                          tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                        />
                        <Tooltip
                          formatter={(val: any) => [formatCurrency(Number(val) || 0, currency), 'Spent']}
                          contentStyle={{
                            backgroundColor: '#0F172A',
                            borderColor: '#334155',
                            borderRadius: '12px',
                            color: '#FFFFFF',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="amount" fill="#F59E0B" radius={[6, 6, 0, 0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Timing Behavioral Metrics */}
                <div className="lg:col-span-5 space-y-4">
                  {/* Weekend vs Weekday Card */}
                  <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <h5 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                        Weekend vs Weekday Velocity
                      </h5>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Weekday Average
                        </span>
                        <span className="text-base font-black text-slate-900 dark:text-white">
                          {formatCurrency(analysis.dailySpending.weekdayDailyAverage, currency)}/day
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40">
                        <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase block">
                          Weekend Average
                        </span>
                        <span className="text-base font-black text-purple-700 dark:text-purple-300">
                          {formatCurrency(analysis.dailySpending.weekendDailyAverage, currency)}/day
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Weekend spending runs at{' '}
                      <strong className="text-slate-900 dark:text-white font-bold">
                        {analysis.dailySpending.weekendVsWeekdayRatio}x
                      </strong>{' '}
                      the rate of standard weekdays.
                    </p>
                  </div>

                  {/* Peak Spending Day Card */}
                  {analysis.dailySpending.peakSpendingDay && (
                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Peak Spending Day
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                          {analysis.dailySpending.peakSpendingDay.transactionCount} transactions
                        </span>
                      </div>
                      <p className="text-xl font-black text-rose-600 dark:text-rose-400">
                        {formatCurrency(analysis.dailySpending.peakSpendingDay.amount, currency)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Recorded on <strong className="text-slate-800 dark:text-slate-200">{analysis.dailySpending.peakSpendingDay.date}</strong>{' '}
                        (Key item: &quot;{analysis.dailySpending.peakSpendingDay.primaryDescription}&quot;)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed vs Variable Detailed Section */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-base">
                      Fixed Obligations vs Variable Flexibility
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {analysis.fixedVsVariable.reliabilityNote}
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 w-fit">
                    {analysis.fixedVsVariable.fixedRatioLabel}
                  </span>
                </div>

                {/* Fixed items list */}
                {analysis.fixedVsVariable.fixedItems.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    {analysis.fixedVsVariable.fixedItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-black text-slate-900 dark:text-white truncate max-w-[140px]">
                            {item.name}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">
                            {item.frequency}
                          </span>
                        </div>
                        <p className="text-sm font-black text-purple-600 dark:text-purple-400">
                          {formatCurrency(item.monthlyAmount, currency)}
                        </p>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          {item.categoryName}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                    No recurring bills or fixed commitments tagged yet. Marking transactions as recurring or using categories like Rent and Bills will populate this view.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: HIGH SPIKES & OUTLIERS */}
          {activeTab === 'outliers' && (
            <div className="space-y-4">
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  <h4 className="font-black text-slate-900 dark:text-white text-base">
                    Unusual & High-Spending Detection
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Transactions that exceed 2.3x your typical category baseline or represent disproportionate single outflows
                </p>

                {analysis.unusualSpikes.length > 0 ? (
                  <div className="space-y-3 mt-6">
                    {analysis.unusualSpikes.map((spike) => (
                      <div
                        key={spike.id}
                        className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-900 dark:text-white">
                              {spike.description}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300">
                              {spike.multiplier}x Category Avg
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {spike.date} • {spike.categoryName} (Category baseline: {formatCurrency(spike.categoryAverage, currency)})
                          </p>
                          <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                            {spike.reason}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-lg font-black text-rose-600 dark:text-rose-400 block">
                            {formatCurrency(spike.amount, currency)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-center my-6 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      No High Spending Outliers Detected
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      All your expenses sit comfortably within expected category tolerances with no erratic single spikes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: FORECAST & INSIGHTS */}
          {activeTab === 'forecast' && (
            <div className="space-y-6">
              {/* Next Month Expense Estimate Card */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-md bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 text-[10px] font-black uppercase tracking-wider">
                        Estimate
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10px] font-bold">
                        Confidence: {analysis.nextMonthEstimate.confidenceLevel.toUpperCase()}
                      </span>
                    </div>
                    <h4 className="font-black text-slate-900 dark:text-white text-base">
                      Next-Month Outflow Projection (Statistical Estimate)
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {analysis.nextMonthEstimate.methodDescription}
                    </p>
                  </div>
                </div>

                {analysis.nextMonthEstimate.hasSufficientData ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                    {/* Baseline Floor */}
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Conservative Floor (Estimate)
                      </span>
                      <p className="text-2xl font-black text-slate-700 dark:text-slate-300">
                        {formatCurrency(analysis.nextMonthEstimate.baselineFloor, currency)}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        Essential fixed obligations floor
                      </p>
                    </div>

                    {/* Expected Projection */}
                    <div className="p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border-2 border-rose-500/40 shadow-xs">
                      <span className="text-xs font-black text-rose-800 dark:text-rose-300 uppercase tracking-wider block mb-1">
                        Expected Outflow (Estimated Target)
                      </span>
                      <p className="text-3xl font-black text-rose-600 dark:text-rose-400">
                        {formatCurrency(analysis.nextMonthEstimate.projectedExpense, currency)}
                      </p>
                      <p className="text-xs text-rose-800/80 dark:text-rose-200/80 mt-2 font-medium">
                        Weighted trailing 3-month velocity + recurring load
                      </p>
                    </div>

                    {/* Upper Ceiling */}
                    <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Upper Bound (+15% Volatility)
                      </span>
                      <p className="text-2xl font-black text-slate-700 dark:text-slate-300">
                        {formatCurrency(analysis.nextMonthEstimate.upperCeiling, currency)}
                      </p>
                      <p className="text-xs text-slate-400 mt-2">
                        Safe ceiling with contingency buffer
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
                    {analysis.nextMonthEstimate.insufficientReason}
                  </div>
                )}
              </div>

              {/* Actionable Spending Insights Feed */}
              <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" />
                  <h4 className="font-black text-slate-900 dark:text-white text-base">
                    Actionable Spending Insights
                  </h4>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data-grounded observations generated directly from your verified ledger transactions
                </p>

                <div className="space-y-3 pt-2">
                  {analysis.insights.map((insight) => (
                    <div
                      key={insight.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {insight.title}
                        </span>
                        {insight.metricBadge && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {insight.metricBadge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {insight.description}
                      </p>
                      {insight.actionableTip && (
                        <div className="flex items-start gap-1.5 text-[11px] text-teal-700 dark:text-teal-400 font-semibold pt-1">
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span>Tip: {insight.actionableTip}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
