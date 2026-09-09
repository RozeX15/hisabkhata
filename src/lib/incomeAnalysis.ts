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

  // 5. Conservative Recurring Income Detection
  // Rule 1: Never classify an income stream as recurring just because it appears twice.
  // Rule 2: Explicitly marked isRecurring is honored with priority.
  // Rule 3: For unmarked transactions, require >= 3 occurrences, consistent intervals (e.g. weekly, bi-weekly, monthly),
  //         similar transaction amounts (<= 20% variance), and spans across multiple time periods.
  const recurringStreams: RecurringIncomeStream[] = [];

  interface TxGroup {
    key: string;
    sourceName: string;
    catId: string;
    txs: Transaction[];
  }
  const sourceGroups: Record<string, TxGroup> = {};

  incomeTxs.forEach((tx) => {
    const rawDesc = (tx.description || '').trim();
    // Normalize key to group similar stream descriptions or categories
    const normalizedKey = rawDesc.length >= 3
      ? rawDesc.toLowerCase()
      : (tx.categoryId || 'other-income');

    if (!sourceGroups[normalizedKey]) {
      const cat = categoryMap.get(tx.categoryId);
      const catName = cat?.customName || cat?.nameKey || 'Income';
      const cleanName = rawDesc.length >= 3 ? rawDesc : catName;
      sourceGroups[normalizedKey] = {
        key: normalizedKey,
        sourceName: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
        catId: tx.categoryId,
        txs: [],
      };
    }
    sourceGroups[normalizedKey].txs.push(tx);
  });

  let streamIndex = 0;
  for (const group of Object.values(sourceGroups)) {
    const txList = group.txs;
    const explicitRecurringTxs = txList.filter((t) => t.isRecurring === true);
    const hasExplicitRecurring = explicitRecurringTxs.length > 0;

    // Path A: Explicitly tagged isRecurring by user
    if (hasExplicitRecurring) {
      const relevantTxs = explicitRecurringTxs;
      const amounts = relevantTxs.map((t) => Number(t.amount) || 0).filter((a) => a > 0);
      const avgAmount = amounts.length > 0 ? Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length) : 0;

      const sortedTxs = [...relevantTxs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const lastDate = sortedTxs[sortedTxs.length - 1].date;

      let freq: 'monthly' | 'bi-weekly' | 'weekly' | 'irregular' = 'monthly';
      if (sortedTxs.length >= 2) {
        const intervals: number[] = [];
        for (let i = 1; i < sortedTxs.length; i++) {
          const diffDays = Math.round(
            (new Date(sortedTxs[i].date).getTime() - new Date(sortedTxs[i - 1].date).getTime()) / (1000 * 3600 * 24)
          );
          if (diffDays > 0) intervals.push(diffDays);
        }
        if (intervals.length > 0) {
          const avgInterval = intervals.reduce((s, i) => s + i, 0) / intervals.length;
          if (avgInterval >= 5 && avgInterval <= 10) freq = 'weekly';
          else if (avgInterval >= 11 && avgInterval <= 18) freq = 'bi-weekly';
          else if (avgInterval >= 22 && avgInterval <= 38) freq = 'monthly';
        }
      }

      const estimatedMonthlyAmount = freq === 'weekly'
        ? Math.round(avgAmount * 4.33)
        : freq === 'bi-weekly'
        ? Math.round(avgAmount * 2.16)
        : avgAmount;

      if (estimatedMonthlyAmount > 0) {
        recurringStreams.push({
          id: `recurring-inc-${streamIndex++}`,
          sourceName: group.sourceName,
          estimatedMonthlyAmount,
          frequency: freq,
          lastReceivedDate: lastDate,
          confidence: 'high',
        });
      }
      continue;
    }

    // Path B: Conservative Heuristic Recurring Detection
    // Strict requirement: Never classify as recurring just because it appears twice. Must have >= 3 transactions.
    if (txList.length < 3) {
      continue;
    }

    const amounts = txList.map((t) => Number(t.amount) || 0).filter((a) => a > 0);
    if (amounts.length < 3) continue;

    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const minAmount = Math.min(...amounts);
    const maxAmount = Math.max(...amounts);

    // Similar amounts requirement: deviation from mean must be within 20%
    const maxDeviation = Math.max(Math.abs(maxAmount - avgAmount), Math.abs(avgAmount - minAmount));
    const amountVariationRatio = avgAmount > 0 ? maxDeviation / avgAmount : 1;
    if (amountVariationRatio > 0.20) {
      continue;
    }

    // Transaction dates & frequency consistency check
    const sortedTxs = [...txList].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const intervals: number[] = [];
    for (let i = 1; i < sortedTxs.length; i++) {
      const diffDays = Math.round(
        (new Date(sortedTxs[i].date).getTime() - new Date(sortedTxs[i - 1].date).getTime()) / (1000 * 3600 * 24)
      );
      if (diffDays > 0) intervals.push(diffDays);
    }

    // Must have at least 2 distinct interval gaps (3 transactions)
    if (intervals.length < 2) {
      continue;
    }

    const avgInterval = intervals.reduce((s, i) => s + i, 0) / intervals.length;

    // Interval consistency: no individual interval may deviate wildly (>40% from avg or >8 days)
    const isIntervalConsistent = intervals.every(
      (inv) => Math.abs(inv - avgInterval) <= Math.max(7, avgInterval * 0.40)
    );
    if (!isIntervalConsistent) {
      continue;
    }

    let detectedFreq: 'monthly' | 'bi-weekly' | 'weekly' | null = null;
    if (avgInterval >= 5 && avgInterval <= 10) {
      detectedFreq = 'weekly';
    } else if (avgInterval >= 11 && avgInterval <= 18) {
      detectedFreq = 'bi-weekly';
    } else if (avgInterval >= 24 && avgInterval <= 38) {
      detectedFreq = 'monthly';
    }

    if (!detectedFreq) {
      continue;
    }

    // Ensure transactions span across at least 2 distinct calendar months for monthly,
    // or at least 2 distinct weeks for weekly/bi-weekly
    const distinctMonths = new Set(sortedTxs.map((t) => (t.date || '').substring(0, 7)).filter(Boolean));
    if (detectedFreq === 'monthly' && distinctMonths.size < 2) {
      continue;
    }

    const estimatedMonthlyAmount = detectedFreq === 'weekly'
      ? Math.round(avgAmount * 4.33)
      : detectedFreq === 'bi-weekly'
      ? Math.round(avgAmount * 2.16)
      : Math.round(avgAmount);

    const isSalaryOrContract = /salary|payroll|rent|retainer|মাসিক|বেতন/i.test(group.sourceName);
    const confidence: 'high' | 'medium' = (txList.length >= 4 && amountVariationRatio <= 0.10) || (isSalaryOrContract && txList.length >= 3)
      ? 'high'
      : 'medium';

    if (estimatedMonthlyAmount > 0) {
      recurringStreams.push({
        id: `recurring-inc-${streamIndex++}`,
        sourceName: group.sourceName,
        estimatedMonthlyAmount,
        frequency: detectedFreq,
        lastReceivedDate: sortedTxs[sortedTxs.length - 1].date,
        confidence,
      });
    }
  }

  const recurringTotalMonthly = recurringStreams.reduce((s, r) => s + r.estimatedMonthlyAmount, 0);
  const recurringPercentage = totalIncome > 0
    ? Math.min(100, Math.round((recurringTotalMonthly / Math.max(1, monthlyAverageIncome || totalIncome)) * 100))
    : 0;

  // 6. Reliable Income Forecast for Next Month (Estimate)
  // Must NOT depend on incorrectly detected recurring income
  // Uses validated recurring baseline + historical 3-month trailing velocity
  const last3Months = monthlyTrends.slice(-3);
  const last3Avg = last3Months.length > 0
    ? Math.round(last3Months.reduce((s, m) => s + m.income, 0) / last3Months.length)
    : monthlyAverageIncome;

  let projectedAmount = 0;
  let baselineFloor = 0;
  let optimisticCeiling = 0;
  let methodDescription = '';

  if (recurringTotalMonthly > 0) {
    // Validated conservative recurring income exists
    const variableAverage = Math.max(0, last3Avg - recurringTotalMonthly);
    // Estimated projection = guaranteed recurring base + conservative 80% variable velocity
    projectedAmount = Math.round(recurringTotalMonthly + variableAverage * 0.80);
    // Conservative floor is at least the confirmed recurring baseline
    baselineFloor = Math.round(recurringTotalMonthly);
    // Optimistic ceiling accounts for variable acceleration
    optimisticCeiling = Math.round(recurringTotalMonthly + Math.max(variableAverage * 1.25, recurringTotalMonthly * 0.15));
    methodDescription = `Estimate based on validated recurring baseline (${recurringStreams.length} stream${recurringStreams.length > 1 ? 's' : ''}) + 3-month variable income history`;
  } else if (last3Avg > 0) {
    // No recurring contracts: estimate based strictly on rolling 3-month moving average
    projectedAmount = Math.round(last3Avg);
    baselineFloor = Math.round(last3Avg * 0.75); // 25% conservative haircut
    optimisticCeiling = Math.round(last3Avg * 1.20); // 20% upside scenario
    methodDescription = 'Estimate based on 3-month rolling income moving average (No verified recurring streams detected)';
  } else if (totalIncome > 0) {
    // Limited history
    projectedAmount = Math.round(monthlyAverageIncome || totalIncome);
    baselineFloor = Math.round(projectedAmount * 0.70);
    optimisticCeiling = Math.round(projectedAmount * 1.25);
    methodDescription = 'Preliminary estimate based on available historical inflow (Limited sample size)';
  } else {
    projectedAmount = 0;
    baselineFloor = 0;
    optimisticCeiling = 0;
    methodDescription = 'Insufficient income history to generate forecast estimate';
  }

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
      methodDescription,
    },
  };
}
