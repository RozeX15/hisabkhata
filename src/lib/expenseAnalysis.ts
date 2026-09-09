import { Transaction, Category } from '../types';

export interface ExpenseByCategory {
  categoryId: string;
  categoryName: string;
  color: string;
  icon?: string;
  totalAmount: number;
  percentage: number;
  transactionCount: number;
  averageAmount: number;
  rank: number;
}

export interface MonthlyExpenseTrend {
  monthKey: string; // YYYY-MM
  monthLabel: string; // e.g. 'Jan 26'
  expense: number;
  income: number;
  netCashflow: number;
  savingsRate: number;
  momChangePercent: number | null; // vs previous month in the trend array
}

export interface FixedExpenseItem {
  id: string;
  name: string;
  categoryName: string;
  monthlyAmount: number;
  isExplicitRecurring: boolean;
  frequency: 'monthly' | 'bi-weekly' | 'weekly' | 'estimated';
  confidence: 'high' | 'medium';
}

export interface FixedVsVariableAnalysis {
  isReliable: boolean;
  reliabilityNote: string;
  fixedTotal: number;
  fixedPercentage: number;
  variableTotal: number;
  variablePercentage: number;
  fixedRatioStatus: 'optimal' | 'moderate' | 'high_fixed' | 'flexible';
  fixedRatioLabel: string;
  fixedItems: FixedExpenseItem[];
}

export interface DayOfWeekMetric {
  dayIndex: number; // 0 = Sun, 1 = Mon ...
  dayName: string;
  shortName: string;
  totalAmount: number;
  percentage: number;
  transactionCount: number;
}

export interface DailySpendingMetric {
  currentMonthDailyAverage: number;
  daysElapsedInMonth: number;
  selectedPeriodDailyAverage: number;
  totalDaysInPeriod: number;
  peakSpendingDay: {
    date: string;
    amount: number;
    transactionCount: number;
    primaryDescription: string;
  } | null;
  busiestDayOfWeek: DayOfWeekMetric | null;
  dayOfWeekDistribution: DayOfWeekMetric[];
  weekdayDailyAverage: number;
  weekendDailyAverage: number;
  weekendVsWeekdayRatio: number; // e.g. 1.35x
}

export interface UnusualSpendingOutlier {
  id: string;
  transactionId: string;
  date: string;
  amount: number;
  description: string;
  categoryName: string;
  categoryAverage: number;
  multiplier: number; // e.g., 2.8x higher than average
  reason: string;
}

export interface WhereIsMoneyGoingSummary {
  headline: string;
  primaryCategory: ExpenseByCategory | null;
  top3CategoriesShare: number;
  top3CategoriesList: string[];
  needsVsWants: {
    needsTotal: number;
    wantsTotal: number;
    needsPercentage: number;
    wantsPercentage: number;
    compliance503020Note: string;
  };
  keyTakeaways: string[];
}

export interface NextMonthExpenseEstimate {
  isEstimate: true;
  projectedExpense: number;
  baselineFloor: number;
  upperCeiling: number;
  confidenceLevel: 'high' | 'moderate' | 'low';
  methodDescription: string;
  hasSufficientData: boolean;
  insufficientReason?: string;
}

export interface SpendingInsight {
  id: string;
  type: 'alert' | 'positive' | 'tip' | 'neutral';
  title: string;
  description: string;
  metricBadge?: string;
  impact?: string;
  actionableTip?: string;
}

export interface ExpenseAnalysisResult {
  isInsufficientData: boolean;
  insufficientDataReason: string;
  totalExpense: number;
  totalIncome: number;
  netCashflow: number;
  expenseTransactionCount: number;
  averagePerTransaction: number;
  
  // MoM Comparison
  currentMonthExpense: number;
  previousMonthExpense: number;
  momGrowthPercent: number; // e.g. +14 or -8
  momDirection: 'increased' | 'decreased' | 'unchanged' | 'no_prior_data';
  momDelta: number; // absolute difference
  currentMonthKey: string;
  previousMonthKey: string;

  // Monthly Average
  monthlyAverageExpense: number;

  // Deep Breakdowns
  topCategories: ExpenseByCategory[];
  monthlyTrends: MonthlyExpenseTrend[];
  fixedVsVariable: FixedVsVariableAnalysis;
  dailySpending: DailySpendingMetric;
  unusualSpikes: UnusualSpendingOutlier[];
  whereIsMoneyGoing: WhereIsMoneyGoingSummary;
  nextMonthEstimate: NextMonthExpenseEstimate;
  insights: SpendingInsight[];
}

/**
 * Checks if a category corresponds to fixed/essential non-discretionary commitments
 */
function isEssentialOrFixedCategory(catId: string, catName: string, nameKey?: string): boolean {
  const normalized = `${catId} ${catName} ${nameKey || ''}`.toLowerCase();
  return (
    normalized.includes('ren') ||
    normalized.includes('rent') ||
    normalized.includes('basha') ||
    normalized.includes('bil') ||
    normalized.includes('bill') ||
    normalized.includes('utilit') ||
    normalized.includes('electric') ||
    normalized.includes('gas') ||
    normalized.includes('water') ||
    normalized.includes('wifi') ||
    normalized.includes('internet') ||
    normalized.includes('edu') ||
    normalized.includes('school') ||
    normalized.includes('tuition') ||
    normalized.includes('hea') ||
    normalized.includes('health') ||
    normalized.includes('med') ||
    normalized.includes('doctor') ||
    normalized.includes('loan') ||
    normalized.includes('emi')
  );
}

/**
 * Check if a category represents needs (Essentials) vs wants (Discretionary)
 */
function isNeedCategory(catId: string, catName: string, nameKey?: string): boolean {
  const normalized = `${catId} ${catName} ${nameKey || ''}`.toLowerCase();
  // Fixed essentials + groceries/basic food + transport
  return (
    isEssentialOrFixedCategory(catId, catName, nameKey) ||
    normalized.includes('foo') ||
    normalized.includes('food') ||
    normalized.includes('groc') ||
    normalized.includes('tra') ||
    normalized.includes('transport') ||
    normalized.includes('commute') ||
    normalized.includes('fam') ||
    normalized.includes('family')
  );
}

/**
 * Perform comprehensive Expense Analysis and Spending Behavior modeling on user transactions.
 */
export function analyzeUserExpenses(
  transactions: Transaction[],
  categories: Category[],
  selectedPeriod: 'all' | '30days' | '90days' | '180days' | '365days' = 'all'
): ExpenseAnalysisResult {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthKey = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

  // Period filtering
  const filteredTxs = transactions.filter((tx) => {
    if (!tx.date) return false;
    if (selectedPeriod === 'all') return true;
    const txDate = new Date(tx.date);
    if (isNaN(txDate.getTime())) return false;
    const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
    if (selectedPeriod === '30days') return diffDays <= 30;
    if (selectedPeriod === '90days') return diffDays <= 90;
    if (selectedPeriod === '180days') return diffDays <= 180;
    if (selectedPeriod === '365days') return diffDays <= 365;
    return true;
  });

  const allExpenseTxs = transactions.filter((t) => t.type === 'expense' && t.date);
  const filteredExpenseTxs = filteredTxs.filter((t) => t.type === 'expense');
  const filteredIncomeTxs = filteredTxs.filter((t) => t.type === 'income');

  const totalExpense = filteredExpenseTxs.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalIncome = filteredIncomeTxs.reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const netCashflow = totalIncome - totalExpense;

  const isInsufficientData = filteredExpenseTxs.length === 0 || totalExpense <= 0;
  const insufficientDataReason = isInsufficientData
    ? 'No expense transactions recorded in the selected timeframe. Log your daily purchases to unlock spending behavior analytics.'
    : '';

  // Category Map helper
  const categoryMap = new Map<string, Category>();
  categories.forEach((c) => categoryMap.set(c.id, c));

  const resolveCategoryName = (catId: string): string => {
    const cat = categoryMap.get(catId);
    if (cat?.customName) return cat.customName;
    if (cat?.nameKey) {
      // Map standard keys to human-friendly labels
      const map: Record<string, string> = {
        cat_food: 'Food & Dining',
        cat_transport: 'Transport & Travel',
        cat_shopping: 'Shopping',
        cat_bills: 'Bills & Utilities',
        cat_education: 'Education',
        cat_entertainment: 'Entertainment',
        cat_health: 'Health & Medical',
        cat_rent: 'Rent & Housing',
        cat_family: 'Family & Home',
        cat_other_expense: 'Other Expense',
      };
      return map[cat.nameKey] || cat.nameKey.replace('cat_', '').replace(/_/g, ' ');
    }
    return catId === 'uncategorized' || !catId ? 'General Expenses' : catId;
  };

  const resolveCategoryColor = (catId: string, index: number): string => {
    const cat = categoryMap.get(catId);
    if (cat?.color) return cat.color;
    const fallbackPalette = [
      '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
      '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#64748B'
    ];
    return fallbackPalette[index % fallbackPalette.length];
  };

  // 1. TOP SPENDING CATEGORIES
  const categoryTotals: Record<string, { total: number; count: number }> = {};
  filteredExpenseTxs.forEach((tx) => {
    const cid = tx.categoryId || 'uncategorized';
    if (!categoryTotals[cid]) {
      categoryTotals[cid] = { total: 0, count: 0 };
    }
    categoryTotals[cid].total += Number(tx.amount) || 0;
    categoryTotals[cid].count += 1;
  });

  const topCategories: ExpenseByCategory[] = Object.entries(categoryTotals)
    .map(([catId, data], index) => {
      const cat = categoryMap.get(catId);
      const catName = resolveCategoryName(catId);
      const pct = totalExpense > 0 ? Math.round((data.total / totalExpense) * 100) : 0;
      const avg = data.count > 0 ? Math.round(data.total / data.count) : 0;
      return {
        categoryId: catId,
        categoryName: catName,
        color: resolveCategoryColor(catId, index),
        icon: cat?.icon || 'Tag',
        totalAmount: data.total,
        percentage: pct,
        transactionCount: data.count,
        averageAmount: avg,
        rank: 0,
      };
    })
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .map((item, idx) => ({ ...item, rank: idx + 1 }));

  // 2. MONTHLY EXPENSE TRENDS (Last 6 distinct months)
  const monthMap = new Map<string, { expense: number; income: number; date: Date }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap.set(key, { expense: 0, income: 0, date: d });
  }

  // Populate from all recorded transactions for true 6-month historical view
  transactions.forEach((tx) => {
    if (!tx.date) return;
    const mKey = tx.date.substring(0, 7);
    if (monthMap.has(mKey)) {
      const entry = monthMap.get(mKey)!;
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'expense') entry.expense += amt;
      if (tx.type === 'income') entry.income += amt;
    }
  });

  const trendEntries = Array.from(monthMap.entries());
  const monthlyTrends: MonthlyExpenseTrend[] = trendEntries.map(([mKey, val], idx) => {
    const monthLabel = val.date.toLocaleString('en-US', { month: 'short', year: '2-digit' });
    const net = val.income - val.expense;
    const rate = val.income > 0 ? Math.round((net / val.income) * 100) : 0;
    
    let momChangePercent: number | null = null;
    if (idx > 0) {
      const prevVal = trendEntries[idx - 1][1].expense;
      if (prevVal > 0) {
        momChangePercent = Math.round(((val.expense - prevVal) / prevVal) * 100);
      } else if (val.expense > 0) {
        momChangePercent = 100;
      } else {
        momChangePercent = 0;
      }
    }

    return {
      monthKey: mKey,
      monthLabel,
      expense: val.expense,
      income: val.income,
      netCashflow: net,
      savingsRate: rate,
      momChangePercent,
    };
  });

  // 3. MONTH-OVER-MONTH PREVIOUS MONTH COMPARISON
  const currentMonthExpense = monthMap.get(currentMonthKey)?.expense || 0;
  const previousMonthExpense = monthMap.get(previousMonthKey)?.expense || 0;
  const momDelta = currentMonthExpense - previousMonthExpense;

  let momGrowthPercent = 0;
  let momDirection: ExpenseAnalysisResult['momDirection'] = 'unchanged';

  if (previousMonthExpense > 0) {
    momGrowthPercent = Math.round(((currentMonthExpense - previousMonthExpense) / previousMonthExpense) * 100);
    if (momGrowthPercent > 0) momDirection = 'increased';
    else if (momGrowthPercent < 0) momDirection = 'decreased';
    else momDirection = 'unchanged';
  } else if (currentMonthExpense > 0) {
    momGrowthPercent = 100;
    momDirection = 'no_prior_data';
  } else {
    momDirection = 'no_prior_data';
  }

  // Monthly average expense calculation
  const monthsWithExpenses = monthlyTrends.filter((m) => m.expense > 0);
  const monthlyAverageExpense = monthsWithExpenses.length > 0
    ? Math.round(monthsWithExpenses.reduce((s, m) => s + m.expense, 0) / monthsWithExpenses.length)
    : Math.round(totalExpense / (selectedPeriod === '30days' ? 1 : selectedPeriod === '90days' ? 3 : 6));

  const averagePerTransaction = filteredExpenseTxs.length > 0
    ? Math.round(totalExpense / filteredExpenseTxs.length)
    : 0;

  // 4. FIXED VS VARIABLE EXPENSE ANALYSIS
  const fixedItems: FixedExpenseItem[] = [];
  let fixedTotal = 0;
  let variableTotal = 0;

  // Group recurring candidate expenses by description & category
  const recurringCandidateMap: Record<string, { count: number; total: number; latestDate: string; isExplicit: boolean; catId: string }> = {};

  filteredExpenseTxs.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    const cat = categoryMap.get(tx.categoryId);
    const catName = resolveCategoryName(tx.categoryId);
    const isCatEssential = isEssentialOrFixedCategory(tx.categoryId, catName, cat?.nameKey);

    const descKey = (tx.description || catName).trim().toLowerCase();
    if (!recurringCandidateMap[descKey]) {
      recurringCandidateMap[descKey] = {
        count: 0,
        total: 0,
        latestDate: tx.date,
        isExplicit: false,
        catId: tx.categoryId,
      };
    }
    recurringCandidateMap[descKey].count += 1;
    recurringCandidateMap[descKey].total += amt;
    if (tx.isRecurring) {
      recurringCandidateMap[descKey].isExplicit = true;
    }
    if (tx.date > recurringCandidateMap[descKey].latestDate) {
      recurringCandidateMap[descKey].latestDate = tx.date;
    }

    if (tx.isRecurring || isCatEssential) {
      fixedTotal += amt;
    } else {
      variableTotal += amt;
    }
  });

  // Extract identified fixed commitments
  Object.entries(recurringCandidateMap).forEach(([descKey, meta]) => {
    const cat = categoryMap.get(meta.catId);
    const catName = resolveCategoryName(meta.catId);
    const isCatEssential = isEssentialOrFixedCategory(meta.catId, catName, cat?.nameKey);

    if (meta.isExplicit || isCatEssential || (meta.count >= 2 && meta.total >= 1000)) {
      const avgAmt = Math.round(meta.total / Math.max(1, meta.count));
      fixedItems.push({
        id: `fixed-${descKey}`,
        name: descKey.charAt(0).toUpperCase() + descKey.slice(1),
        categoryName: catName,
        monthlyAmount: avgAmt,
        isExplicitRecurring: meta.isExplicit,
        frequency: meta.count >= 3 ? 'monthly' : 'estimated',
        confidence: meta.isExplicit || isCatEssential ? 'high' : 'medium',
      });
    }
  });

  const fixedPercentage = totalExpense > 0 ? Math.round((fixedTotal / totalExpense) * 100) : 0;
  const variablePercentage = totalExpense > 0 ? 100 - fixedPercentage : 0;

  let fixedRatioStatus: FixedVsVariableAnalysis['fixedRatioStatus'] = 'optimal';
  let fixedRatioLabel = 'Balanced Structure (30% - 50% Fixed)';

  if (fixedPercentage > 65) {
    fixedRatioStatus = 'high_fixed';
    fixedRatioLabel = 'High Fixed Overhead (>65%)';
  } else if (fixedPercentage < 25) {
    fixedRatioStatus = 'flexible';
    fixedRatioLabel = 'High Agility (<25% Fixed)';
  } else if (fixedPercentage >= 25 && fixedPercentage <= 55) {
    fixedRatioStatus = 'optimal';
    fixedRatioLabel = 'Optimal Baseline (25% - 55% Fixed)';
  } else {
    fixedRatioStatus = 'moderate';
    fixedRatioLabel = 'Moderate Structural Load (55% - 65% Fixed)';
  }

  const isFixedReliable = filteredExpenseTxs.length >= 3 && totalExpense > 0;
  const fixedVsVariable: FixedVsVariableAnalysis = {
    isReliable: isFixedReliable,
    reliabilityNote: isFixedReliable
      ? 'Classified based on essential category designations, recurring subscriptions, and repeating outflow patterns.'
      : 'Insufficient expense volume to reliably separate fixed commitments from discretionary variable spending.',
    fixedTotal,
    fixedPercentage,
    variableTotal,
    variablePercentage,
    fixedRatioStatus,
    fixedRatioLabel,
    fixedItems: fixedItems.slice(0, 6),
  };

  // 5. DAILY AVERAGE SPENDING & DAY OF WEEK ANALYSIS
  const daysElapsedInMonth = Math.max(1, now.getDate());
  const currentMonthDailyAverage = Math.round(currentMonthExpense / daysElapsedInMonth);

  let totalDaysInPeriod = 30;
  if (selectedPeriod === '90days') totalDaysInPeriod = 90;
  else if (selectedPeriod === '180days') totalDaysInPeriod = 180;
  else if (selectedPeriod === '365days') totalDaysInPeriod = 365;
  else if (selectedPeriod === 'all') {
    if (filteredExpenseTxs.length > 0) {
      const dates = filteredExpenseTxs.map((t) => new Date(t.date).getTime()).filter((t) => !isNaN(t));
      if (dates.length > 1) {
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        totalDaysInPeriod = Math.max(1, Math.round((maxDate - minDate) / (1000 * 3600 * 24)) + 1);
      } else {
        totalDaysInPeriod = 1;
      }
    } else {
      totalDaysInPeriod = 1;
    }
  }

  const selectedPeriodDailyAverage = Math.round(totalExpense / Math.max(1, totalDaysInPeriod));

  // Daily totals map
  const daySpendMap: Record<string, { total: number; count: number; topDesc: string; maxSingle: number }> = {};
  const dayOfWeekTotals: number[] = [0, 0, 0, 0, 0, 0, 0];
  const dayOfWeekCounts: number[] = [0, 0, 0, 0, 0, 0, 0];

  filteredExpenseTxs.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    const dStr = tx.date;
    if (!daySpendMap[dStr]) {
      daySpendMap[dStr] = { total: 0, count: 0, topDesc: tx.description || 'Expense', maxSingle: 0 };
    }
    daySpendMap[dStr].total += amt;
    daySpendMap[dStr].count += 1;
    if (amt > daySpendMap[dStr].maxSingle) {
      daySpendMap[dStr].maxSingle = amt;
      daySpendMap[dStr].topDesc = tx.description || 'Expense';
    }

    const txDate = new Date(tx.date);
    if (!isNaN(txDate.getTime())) {
      const dayIdx = txDate.getDay(); // 0 = Sun
      dayOfWeekTotals[dayIdx] += amt;
      dayOfWeekCounts[dayIdx] += 1;
    }
  });

  // Identify peak spending day
  let peakSpendingDay: DailySpendingMetric['peakSpendingDay'] = null;
  let maxDaySpend = 0;
  Object.entries(daySpendMap).forEach(([date, val]) => {
    if (val.total > maxDaySpend) {
      maxDaySpend = val.total;
      peakSpendingDay = {
        date,
        amount: val.total,
        transactionCount: val.count,
        primaryDescription: val.topDesc,
      };
    }
  });

  // Day of week metrics
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const dayOfWeekDistribution: DayOfWeekMetric[] = dayNames.map((name, idx) => {
    const amt = dayOfWeekTotals[idx];
    const pct = totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0;
    return {
      dayIndex: idx,
      dayName: name,
      shortName: dayShort[idx],
      totalAmount: amt,
      percentage: pct,
      transactionCount: dayOfWeekCounts[idx],
    };
  });

  const sortedDayDistribution = [...dayOfWeekDistribution].sort((a, b) => b.totalAmount - a.totalAmount);
  const busiestDayOfWeek = sortedDayDistribution[0]?.totalAmount > 0 ? sortedDayDistribution[0] : null;

  // Weekend vs weekday (Friday & Saturday are weekends in Bangladesh/Middle East, or Saturday & Sunday globally)
  // We compute weekend as Fri + Sat (standard local context for BD/Hishab Khata)
  const weekendSpend = dayOfWeekTotals[5] + dayOfWeekTotals[6]; // Fri + Sat
  const weekdaySpend = dayOfWeekTotals[0] + dayOfWeekTotals[1] + dayOfWeekTotals[2] + dayOfWeekTotals[3] + dayOfWeekTotals[4];
  const weekendDailyAverage = Math.round(weekendSpend / 2);
  const weekdayDailyAverage = Math.round(weekdaySpend / 5);
  const weekendVsWeekdayRatio = weekdayDailyAverage > 0
    ? Math.round((weekendDailyAverage / weekdayDailyAverage) * 100) / 100
    : 1;

  const dailySpending: DailySpendingMetric = {
    currentMonthDailyAverage,
    daysElapsedInMonth,
    selectedPeriodDailyAverage,
    totalDaysInPeriod,
    peakSpendingDay,
    busiestDayOfWeek,
    dayOfWeekDistribution,
    weekdayDailyAverage,
    weekendDailyAverage,
    weekendVsWeekdayRatio,
  };

  // 6. UNUSUAL / HIGH-SPENDING DETECTION
  const unusualSpikes: UnusualSpendingOutlier[] = [];
  filteredExpenseTxs.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    const catId = tx.categoryId || 'uncategorized';
    const catData = categoryTotals[catId];
    if (!catData || catData.count < 3) return;

    const catAvg = catData.total / catData.count;
    // An outlier is > 2.3x the category average and at least 1,200 (or > 30% of total spend)
    if (amt >= catAvg * 2.3 && (amt >= 1200 || (totalExpense > 0 && amt / totalExpense >= 0.25))) {
      const multiplier = Math.round((amt / Math.max(1, catAvg)) * 10) / 10;
      unusualSpikes.push({
        id: `outlier-${tx.id}`,
        transactionId: tx.id,
        date: tx.date,
        amount: amt,
        description: tx.description || 'High Value Purchase',
        categoryName: resolveCategoryName(catId),
        categoryAverage: Math.round(catAvg),
        multiplier,
        reason: `${multiplier}x larger than your typical ${resolveCategoryName(catId)} expense (${Math.round(catAvg).toLocaleString()})`,
      });
    }
  });

  // Sort outliers by amount descending
  unusualSpikes.sort((a, b) => b.amount - a.amount);

  // 7. “WHERE IS MY MONEY GOING?” SUMMARY
  const primaryCategory = topCategories[0] || null;
  const top3Categories = topCategories.slice(0, 3);
  const top3CategoriesShare = top3Categories.reduce((s, c) => s + c.percentage, 0);
  const top3CategoriesList = top3Categories.map((c) => c.categoryName);

  let needsTotal = 0;
  let wantsTotal = 0;
  filteredExpenseTxs.forEach((tx) => {
    const amt = Number(tx.amount) || 0;
    const cat = categoryMap.get(tx.categoryId);
    const catName = resolveCategoryName(tx.categoryId);
    if (isNeedCategory(tx.categoryId, catName, cat?.nameKey)) {
      needsTotal += amt;
    } else {
      wantsTotal += amt;
    }
  });

  const needsPercentage = totalExpense > 0 ? Math.round((needsTotal / totalExpense) * 100) : 0;
  const wantsPercentage = totalExpense > 0 ? 100 - needsPercentage : 0;

  let compliance503020Note = 'Your spending aligns well with the 50/30/20 financial rule.';
  if (wantsPercentage > 45) {
    compliance503020Note = `Discretionary lifestyle spend is ${wantsPercentage}%, above the recommended 30% ceiling. Trimming variable wants can free up surplus.`;
  } else if (needsPercentage > 75) {
    compliance503020Note = `Essential living costs consume ${needsPercentage}% of outflows, indicating high overhead and limited discretionary leeway.`;
  }

  const keyTakeaways: string[] = [];
  if (primaryCategory) {
    keyTakeaways.push(
      `Your biggest expense driver is ${primaryCategory.categoryName}, commanding ${primaryCategory.percentage}% of total outflows (${primaryCategory.totalAmount.toLocaleString()}).`
    );
  }
  if (top3Categories.length >= 2) {
    keyTakeaways.push(
      `Top ${top3Categories.length} categories (${top3CategoriesList.join(', ')}) absorb ${top3CategoriesShare}% of every taka/dollar spent.`
    );
  }
  keyTakeaways.push(
    `You spend an average of ${currentMonthDailyAverage > 0 ? currentMonthDailyAverage.toLocaleString() : selectedPeriodDailyAverage.toLocaleString()} per day.`
  );
  if (fixedPercentage > 0) {
    keyTakeaways.push(
      `${fixedPercentage}% of outflows are fixed/essential commitments, while ${variablePercentage}% are variable and flexible.`
    );
  }

  const whereIsMoneyGoing: WhereIsMoneyGoingSummary = {
    headline: primaryCategory
      ? `${primaryCategory.categoryName} represents your largest single financial outflow (${primaryCategory.percentage}% of all expenditures).`
      : 'Track your daily expenses to see an executive breakdown of where your money goes.',
    primaryCategory,
    top3CategoriesShare,
    top3CategoriesList,
    needsVsWants: {
      needsTotal,
      wantsTotal,
      needsPercentage,
      wantsPercentage,
      compliance503020Note,
    },
    keyTakeaways,
  };

  // 8. NEXT MONTH EXPENSE ESTIMATE (Strictly labeled as an estimate)
  const hasSufficientDataForEstimate = allExpenseTxs.length >= 3 && totalExpense > 0;
  let projectedExpense = 0;
  let baselineFloor = 0;
  let upperCeiling = 0;
  let confidenceLevel: NextMonthExpenseEstimate['confidenceLevel'] = 'moderate';

  if (!hasSufficientDataForEstimate) {
    baselineFloor = 0;
    projectedExpense = 0;
    upperCeiling = 0;
  } else {
    // 3-month trailing velocity
    const recent3Months = monthlyTrends.slice(-3).map((m) => m.expense).filter((e) => e > 0);
    const trailingVelocity = recent3Months.length > 0
      ? recent3Months.reduce((a, b) => a + b, 0) / recent3Months.length
      : totalExpense;

    // Floor is verified fixed obligations or 60% of monthly average
    baselineFloor = fixedTotal > 0
      ? Math.max(Math.round(fixedTotal), Math.round(trailingVelocity * 0.5))
      : Math.round(trailingVelocity * 0.5);

    // Projected expense combines 60% of trailing velocity + 40% of fixed recurring base
    projectedExpense = Math.round(trailingVelocity * 0.7 + (fixedTotal > 0 ? fixedTotal * 0.3 : trailingVelocity * 0.3));

    // Upper ceiling has 15% buffer
    upperCeiling = Math.round(projectedExpense * 1.15);

    if (recent3Months.length >= 3) confidenceLevel = 'high';
    else if (recent3Months.length === 2) confidenceLevel = 'moderate';
    else confidenceLevel = 'low';
  }

  const nextMonthEstimate: NextMonthExpenseEstimate = {
    isEstimate: true,
    projectedExpense,
    baselineFloor,
    upperCeiling,
    confidenceLevel,
    methodDescription: hasSufficientDataForEstimate
      ? 'Statistical projection combining your verified recurring obligations, current month run-rate, and 3-month trailing outflow velocity.'
      : 'Insufficient transaction records to build a mathematical projection.',
    hasSufficientData: hasSufficientDataForEstimate,
    insufficientReason: hasSufficientDataForEstimate
      ? undefined
      : 'At least 3 expense transactions across your ledger are needed to produce an estimate.',
  };

  // 9. ACTIONABLE SPENDING INSIGHTS
  const insights: SpendingInsight[] = [];

  // Insight 1: MoM Velocity
  if (previousMonthExpense > 0 && Math.abs(momGrowthPercent) >= 10) {
    if (momGrowthPercent > 0) {
      insights.push({
        id: 'insight-exp-spike',
        type: 'alert',
        title: 'Monthly Spending Acceleration',
        description: `Current month outflows are up ${momGrowthPercent}% (+${momDelta.toLocaleString()}) compared to last month.`,
        metricBadge: `+${momGrowthPercent}% MoM`,
        impact: 'Accelerated outflows compress your net savings margin.',
        actionableTip: 'Review non-essential discretionary purchases in recent transactions to restore baseline pace.',
      });
    } else {
      insights.push({
        id: 'insight-exp-reduction',
        type: 'positive',
        title: 'Disciplined Spending Deceleration',
        description: `Your monthly expenditures dropped by ${Math.abs(momGrowthPercent)}% (-${Math.abs(momDelta).toLocaleString()}) vs last month.`,
        metricBadge: `${momGrowthPercent}% MoM`,
        impact: 'Lower expense burn expands your free capital for savings goals.',
        actionableTip: 'Redirect the saved surplus into an active savings goal or emergency buffer.',
      });
    }
  }

  // Insight 2: Category Concentration
  if (primaryCategory && primaryCategory.percentage >= 45) {
    insights.push({
      id: 'insight-cat-concentration',
      type: 'tip',
      title: `High Concentration in ${primaryCategory.categoryName}`,
      description: `${primaryCategory.categoryName} accounts for ${primaryCategory.percentage}% of all outflows. A single category commanding nearly half your spending creates financial rigidity.`,
      metricBadge: `${primaryCategory.percentage}% of Total`,
      impact: 'High single-category concentration leaves less room for savings.',
      actionableTip: `Set a dedicated monthly budget limit for ${primaryCategory.categoryName} to cap unchecked growth.`,
    });
  }

  // Insight 3: Weekend Velocity
  if (weekendVsWeekdayRatio >= 1.4 && weekendSpend >= 1000) {
    insights.push({
      id: 'insight-weekend-velocity',
      type: 'tip',
      title: 'Elevated Weekend Outflow Velocity',
      description: `Daily spending on weekends averages ${weekendDailyAverage.toLocaleString()}, which is ${Math.round((weekendVsWeekdayRatio - 1) * 100)}% higher than typical weekdays (${weekdayDailyAverage.toLocaleString()}).`,
      metricBadge: `${weekendVsWeekdayRatio}x Weekdays`,
      impact: 'Social dining and recreational shopping cluster heavily on weekends.',
      actionableTip: 'Establish a weekend leisure allowance to avoid exceeding your overall monthly budget.',
    });
  }

  // Insight 4: Outliers detected
  if (unusualSpikes.length > 0) {
    insights.push({
      id: 'insight-outlier-detected',
      type: 'alert',
      title: `${unusualSpikes.length} Unusual Outflow Spikes Flagged`,
      description: `Detected single transactions significantly exceeding normal category thresholds, including "${unusualSpikes[0].description}" for ${unusualSpikes[0].amount.toLocaleString()}.`,
      metricBadge: `${unusualSpikes[0].multiplier}x Typical`,
      impact: 'Unplanned large single purchases are the primary trigger for end-of-month cashflow deficits.',
      actionableTip: 'Verify if these were one-time planned investments or recurring leaks.',
    });
  }

  // Insight 5: Fixed vs Variable health
  if (isFixedReliable) {
    if (fixedPercentage > 60) {
      insights.push({
        id: 'insight-high-fixed',
        type: 'neutral',
        title: 'High Structural Commitment Ratio',
        description: `Fixed overhead represents ${fixedPercentage}% of your outflows. High structural expenses reduce flexibility during unexpected income dips.`,
        metricBadge: `${fixedPercentage}% Fixed`,
        impact: 'Reduces capital agility.',
        actionableTip: 'Audit utility bills, recurring subscriptions, and negotiable overheads.',
      });
    } else {
      insights.push({
        id: 'insight-healthy-structure',
        type: 'positive',
        title: 'Agile Expense Structure',
        description: `${variablePercentage}% of your spending is variable and controllable. You have high flexibility to cut costs whenever necessary.`,
        metricBadge: `${variablePercentage}% Controllable`,
        impact: 'High resilience against income volatility.',
      });
    }
  }

  return {
    isInsufficientData,
    insufficientDataReason,
    totalExpense,
    totalIncome,
    netCashflow,
    expenseTransactionCount: filteredExpenseTxs.length,
    averagePerTransaction,
    currentMonthExpense,
    previousMonthExpense,
    momGrowthPercent,
    momDirection,
    momDelta,
    currentMonthKey,
    previousMonthKey,
    monthlyAverageExpense,
    topCategories,
    monthlyTrends,
    fixedVsVariable,
    dailySpending,
    unusualSpikes,
    whereIsMoneyGoing,
    nextMonthEstimate,
    insights,
  };
}
