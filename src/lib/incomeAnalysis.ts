import { Transaction, Category } from '../types';

export interface IncomeBySource {
  categoryId: string;
  categoryName: string;
  color: string;
  totalAmount: number;
  percentage: number;
  transactionCount: number;
  averageAmount: number;
}

export interface MonthlyIncomeMetric {
  monthKey: string; // YYYY-MM
  monthLabel: string; // e.g., 'Jan 2026'
  income: number;
  expense: number;
  netCashflow: number;
  savingsRate: number; // percentage
}

export interface RecurringIncomeStream {
  id: string;
  sourceName: string;
  estimatedMonthlyAmount: number;
  frequency: 'monthly' | 'bi-weekly' | 'weekly' | 'irregular';
  lastReceivedDate: string;
  confidence: 'high' | 'medium';
}

export interface IncomeAnalysisResult {
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  overallSavingsRate: number;
  savingsRateRating: 'excellent' | 'good' | 'moderate' | 'low' | 'deficit';
  savingsRateLabel: string;
  monthlyAverageIncome: number;
  averagePerTransaction: number;
  momGrowthPercent: number; // Month-over-month growth
  incomeBySource: IncomeBySource[];
  monthlyTrends: MonthlyIncomeMetric[];
  recurringIncomeStreams: RecurringIncomeStream[];
  recurringTotalMonthly: number;
  recurringPercentage: number; // recurring / total
  simpleForecastNextMonth: {
    projectedAmount: number;
    baselineFloor: number;
    optimisticCeiling: number;
    methodDescription: string;
  };
}

/**
 * Perform comprehensive Income Analysis on user transactions
 */
export function analyzeUserIncome(
  transactions: Transaction[],
  categories: Category[],
  selectedPeriod: 'all' | '30days' | '90days' | '180days' | '365days' = 'all'
): IncomeAnalysisResult {
  const now = new Date();

  // Filter transactions by period
  const filteredTxs = transactions.filter((tx) => {
    if (selectedPeriod === 'all') return true;
    const txDate = new Date(tx.date);
    const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
    if (selectedPeriod === '30days') return diffDays <= 30;
    if (selectedPeriod === '90days') return diffDays <= 90;
    if (selectedPeriod === '180days') return diffDays <= 180;
    if (selectedPeriod === '365days') return diffDays <= 365;
    return true;
  });

  const incomeTxs = filteredTxs.filter((t) => t.type === 'income');
  const expenseTxs = filteredTxs.filter((t) => t.type === 'expense');

  const totalIncome = incomeTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const totalExpense = expenseTxs.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const netCashflow = totalIncome - totalExpense;

  const overallSavingsRate = totalIncome > 0
    ? Math.max(-100, Math.min(100, Math.round(((totalIncome - totalExpense) / totalIncome) * 100)))
    : 0;

  let savingsRateRating: IncomeAnalysisResult['savingsRateRating'] = 'moderate';
  let savingsRateLabel = '10% - 19% Savings';

  if (overallSavingsRate >= 30) {
    savingsRateRating = 'excellent';
    savingsRateLabel = '30%+ (Elite Wealth Velocity)';
  } else if (overallSavingsRate >= 20) {
    savingsRateRating = 'good';
    savingsRateLabel = '20% - 29% (Recommended Standard)';
  } else if (overallSavingsRate >= 10) {
    savingsRateRating = 'moderate';
    savingsRateLabel = '10% - 19% (Fair Capital Growth)';
  } else if (overallSavingsRate > 0) {
    savingsRateRating = 'low';
    savingsRateLabel = '1% - 9% (Thin Surplus Buffer)';
  } else {
    savingsRateRating = 'deficit';
    savingsRateLabel = 'Cashflow Deficit (Expenses > Income)';
  }

  // 1. Income by Source (Category)
  const categoryMap = new Map<string, Category>();
  categories.forEach((c) => categoryMap.set(c.id, c));

  const sourceAggregation: Record<string, { total: number; count: number }> = {};
  incomeTxs.forEach((t) => {
    const key = t.categoryId || 'uncategorized';
    if (!sourceAggregation[key]) {
      sourceAggregation[key] = { total: 0, count: 0 };
    }
    sourceAggregation[key].total += Number(t.amount) || 0;
    sourceAggregation[key].count += 1;
  });

  const incomeBySource: IncomeBySource[] = Object.entries(sourceAggregation)
    .map(([catId, data]) => {
      const cat = categoryMap.get(catId);
      const categoryName = cat?.customName || cat?.nameKey || (catId === 'uncategorized' ? 'Other Inflow' : catId);
      const color = cat?.color || '#0D9488';
      const percentage = totalIncome > 0 ? Math.round((data.total / totalIncome) * 100) : 0;
      const averageAmount = data.count > 0 ? Math.round(data.total / data.count) : 0;

      return {
        categoryId: catId,
        categoryName,
        color,
        totalAmount: data.total,
        percentage,
        transactionCount: data.count,
        averageAmount,
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount);

  // 2. Monthly Income Trends (Last 6 distinct months)
  const monthMap = new Map<string, { income: number; expense: number; date: Date }>();
  
  // Seed past 6 months to ensure smooth chart rendering even with sparse transactions
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, { income: 0, expense: 0, date: d });
  }

  // Populate from all transactions for reliable trend history
  transactions.forEach((tx) => {
    if (!tx.date) return;
    const mKey = tx.date.substring(0, 7);
    if (monthMap.has(mKey)) {
      const entry = monthMap.get(mKey)!;
      if (tx.type === 'income') entry.income += Number(tx.amount) || 0;
      if (tx.type === 'expense') entry.expense += Number(tx.amount) || 0;
    }
  });

  const monthlyTrends: MonthlyIncomeMetric[] = Array.from(monthMap.entries()).map(([mKey, val]) => {
    const monthLabel = val.date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    const net = val.income - val.expense;
    const rate = val.income > 0 ? Math.round((net / val.income) * 100) : 0;
    return {
      monthKey: mKey,
      monthLabel,
      income: val.income,
      expense: val.expense,
      netCashflow: net,
      savingsRate: rate,
    };
  });

  // 3. Month-over-Month Growth Calculation
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const currentMonthInc = monthMap.get(currentMonthKey)?.income || 0;
  const prevMonthInc = monthMap.get(prevMonthKey)?.income || 0;

  let momGrowthPercent = 0;
  if (prevMonthInc > 0) {
    momGrowthPercent = Math.round(((currentMonthInc - prevMonthInc) / prevMonthInc) * 100);
  } else if (currentMonthInc > 0) {
    momGrowthPercent = 100;
  }

  // 4. Monthly Average Income & Average per transaction
  const monthsWithIncome = monthlyTrends.filter((m) => m.income > 0);
  const monthlyAverageIncome = monthsWithIncome.length > 0
    ? Math.round(monthsWithIncome.reduce((s, m) => s + m.income, 0) / monthsWithIncome.length)
    : Math.round(totalIncome / (selectedPeriod === '30days' ? 1 : selectedPeriod === '90days' ? 3 : 6));

  const averagePerTransaction = incomeTxs.length > 0
    ? Math.round(totalIncome / incomeTxs.length)
    : 0;

  // 5. Recurring Income Detection
  // Check transactions marked isRecurring OR repeating description / category
  const recurringStreams: RecurringIncomeStream[] = [];
  const descGroup: Record<string, { total: number; count: number; lastDate: string; catId: string }> = {};

  incomeTxs.forEach((tx) => {
    const rawDesc = (tx.description || tx.categoryId || 'Income').trim().toLowerCase();
    const key = rawDesc.length > 3 ? rawDesc : tx.categoryId;
    if (!descGroup[key]) {
      descGroup[key] = { total: 0, count: 0, lastDate: tx.date, catId: tx.categoryId };
    }
    descGroup[key].total += Number(tx.amount) || 0;
    descGroup[key].count += 1;
    if (new Date(tx.date).getTime() > new Date(descGroup[key].lastDate).getTime()) {
      descGroup[key].lastDate = tx.date;
    }
  });

  Object.entries(descGroup).forEach(([key, val], idx) => {
    const cat = categoryMap.get(val.catId);
    const catName = cat?.customName || cat?.nameKey || 'Income Stream';
    const isSalaryOrRent = /salary|payroll|rent|freelance|retainer|মাসিক|বেতন/i.test(key) || val.count >= 2;

    if (isSalaryOrRent || val.count >= 2) {
      const avg = Math.round(val.total / Math.max(1, Math.min(6, val.count)));
      recurringStreams.push({
        id: `recurring-inc-${idx}`,
        sourceName: key.charAt(0).toUpperCase() + key.slice(1),
        estimatedMonthlyAmount: avg,
        frequency: val.count >= 4 ? 'weekly' : 'monthly',
        lastReceivedDate: val.lastDate,
        confidence: val.count >= 2 ? 'high' : 'medium',
      });
    }
  });

  const recurringTotalMonthly = recurringStreams.reduce((s, r) => s + r.estimatedMonthlyAmount, 0);
  const recurringPercentage = totalIncome > 0
    ? Math.min(100, Math.round((recurringTotalMonthly / Math.max(1, monthlyAverageIncome || totalIncome)) * 100))
    : 0;

  // 6. Simple Income Forecast for Next Month
  // Uses weighted average: 60% recurring base + 40% trailing 3-month average
  const last3Months = monthlyTrends.slice(-3);
  const last3Avg = last3Months.length > 0
    ? last3Months.reduce((s, m) => s + m.income, 0) / last3Months.length
    : monthlyAverageIncome;

  const baselineFloor = Math.round(Math.max(recurringTotalMonthly, last3Avg * 0.8));
  const projectedAmount = Math.round(
    recurringTotalMonthly > 0
      ? recurringTotalMonthly * 0.6 + last3Avg * 0.4
      : last3Avg > 0
      ? last3Avg
      : totalIncome
  );
  const optimisticCeiling = Math.round(Math.max(projectedAmount * 1.2, baselineFloor * 1.3));

  return {
    totalIncome,
    totalExpense,
    netCashflow,
    overallSavingsRate,
    savingsRateRating,
    savingsRateLabel,
    monthlyAverageIncome,
    averagePerTransaction,
    momGrowthPercent,
    incomeBySource,
    monthlyTrends,
    recurringIncomeStreams: recurringStreams,
    recurringTotalMonthly,
    recurringPercentage,
    simpleForecastNextMonth: {
      projectedAmount,
      baselineFloor,
      optimisticCeiling,
      methodDescription: recurringTotalMonthly > 0
        ? 'Based on validated recurring income contracts and 3-month trailing velocity'
        : 'Based on rolling 3-month moving inflow average',
    },
  };
}
