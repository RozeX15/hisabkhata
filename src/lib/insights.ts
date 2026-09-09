import { Transaction, BudgetProgress, SavingsGoal, SmartInsight } from '../types';

export function generateSmartInsights(
  transactions: Transaction[],
  budgets: BudgetProgress[],
  goals: SavingsGoal[],
  currency: string = 'BDT'
): SmartInsight[] {
  const insights: SmartInsight[] = [];
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Previous month
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  // Only consider valid historical transactions up to today
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();
  const historicalTx = transactions.filter(t => {
    if (!t.date) return false;
    const time = new Date(t.date).getTime();
    return !isNaN(time) && time <= endOfToday;
  });

  // 1. Current month vs Prev month spending by category
  const currExpenses = historicalTx.filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr));
  const prevExpenses = historicalTx.filter(t => t.type === 'expense' && t.date.startsWith(prevMonthStr));

  const currTotalExp = currExpenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const prevTotalExp = prevExpenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const currIncome = historicalTx
    .filter(t => t.type === 'income' && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const prevIncome = historicalTx
    .filter(t => t.type === 'income' && t.date.startsWith(prevMonthStr))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Group by category
  const currCatTotals: Record<string, number> = {};
  const currCatCounts: Record<string, number> = {};
  currExpenses.forEach(t => {
    const amt = Number(t.amount) || 0;
    currCatTotals[t.categoryId] = (currCatTotals[t.categoryId] || 0) + amt;
    currCatCounts[t.categoryId] = (currCatCounts[t.categoryId] || 0) + 1;
  });

  const prevCatTotals: Record<string, number> = {};
  prevExpenses.forEach(t => {
    const amt = Number(t.amount) || 0;
    prevCatTotals[t.categoryId] = (prevCatTotals[t.categoryId] || 0) + amt;
  });

  // Check top expense category
  let topCatId = '';
  let topCatAmount = 0;
  Object.entries(currCatTotals).forEach(([catId, amount]) => {
    if (amount > topCatAmount) {
      topCatAmount = amount;
      topCatId = catId;
    }
  });

  if (topCatId && currTotalExp > 0) {
    const percent = Math.round((topCatAmount / currTotalExp) * 100);
    insights.push({
      id: 'insight-top-category',
      type: 'highest_category',
      severity: 'info',
      titleKey: 'insight_highest_cat_title',
      descriptionKey: `Top spending category accounts for ${percent}% of your total monthly expenses.`,
      params: { percent, amount: topCatAmount },
      actionTextKey: 'Review category spending',
    });
  }

  // Check category spending spikes vs previous month
  Object.entries(currCatTotals).forEach(([catId, amount]) => {
    const prevAmount = prevCatTotals[catId];
    if (prevAmount && prevAmount > 0) {
      const increase = ((amount - prevAmount) / prevAmount) * 100;
      if (increase >= 15 && amount > 1000) {
        insights.push({
          id: `insight-spike-${catId}`,
          type: 'spending_spike',
          severity: 'warning',
          titleKey: 'insight_spike_title',
          descriptionKey: `You spent ${Math.round(increase)}% more in this category compared to last month.`,
          params: { percent: Math.round(increase) },
          actionTextKey: 'Set monthly budget limit',
        });
      }
    }
  });

  // 2. UNUSUAL SPENDING DETECTION (Outlier single transactions)
  currExpenses.forEach((tx) => {
    const count = currCatCounts[tx.categoryId] || 1;
    const catTotal = currCatTotals[tx.categoryId] || (Number(tx.amount) || 0);
    const catAvg = catTotal / Math.max(1, count);
    const txAmount = Number(tx.amount) || 0;

    // If single purchase is more than 2.5x the average for this category and is at least 1500
    if (count >= 3 && txAmount >= catAvg * 2.5 && txAmount >= 1500) {
      insights.push({
        id: `insight-outlier-${tx.id}`,
        type: 'spending_spike',
        severity: 'warning',
        titleKey: 'Unusual Large Expense Detected',
        descriptionKey: `Single outflow of ${currency} ${txAmount.toLocaleString()} (${tx.description || tx.categoryId}) is 2.5x higher than your typical category average.`,
        params: { amount: txAmount },
        actionTextKey: 'Audit transaction details',
      });
    }
  });

  // 3. INCOME CHANGES DETECTION (MoM Drop or Surge)
  if (prevIncome > 0 && currIncome > 0) {
    const incomeDeltaPercent = Math.round(((currIncome - prevIncome) / prevIncome) * 100);
    if (incomeDeltaPercent <= -15) {
      insights.push({
        id: 'insight-income-drop',
        type: 'spending_spike',
        severity: 'danger',
        titleKey: 'Monthly Inflow Contraction Detected',
        descriptionKey: `Your recorded income this month is ${Math.abs(incomeDeltaPercent)}% lower than last month (${currency} ${currIncome.toLocaleString()} vs ${currency} ${prevIncome.toLocaleString()}).`,
        params: { delta: Math.abs(incomeDeltaPercent) },
        actionTextKey: 'Inspect income sources',
      });
    } else if (incomeDeltaPercent >= 20) {
      insights.push({
        id: 'insight-income-surge',
        type: 'positive_habit',
        severity: 'success',
        titleKey: 'Strong Income Growth Milestone',
        descriptionKey: `Great news! Inflow increased by +${incomeDeltaPercent}% over last month. Consider allocating a portion to savings goals.`,
        params: { delta: incomeDeltaPercent },
        actionTextKey: 'Allocate surplus to goals',
      });
    }
  }

  // 4. Budget Alerts
  budgets.forEach(b => {
    const pct = Number(b.percentage) || 0;
    if (pct >= 100) {
      insights.push({
        id: `insight-budget-over-${b.id}`,
        type: 'budget_alert',
        severity: 'danger',
        titleKey: 'insight_budget_alert_title',
        descriptionKey: `Budget exceeded by ${Math.round(pct - 100)}%! Immediate attention recommended.`,
        params: { percent: Math.round(pct) },
        actionTextKey: 'Adjust or rebalance budget',
      });
    } else if (pct >= 80) {
      insights.push({
        id: `insight-budget-warn-${b.id}`,
        type: 'budget_alert',
        severity: 'warning',
        titleKey: 'insight_budget_alert_title',
        descriptionKey: `You have used ${Math.round(pct)}% of your allocated budget for this period.`,
        params: { percent: Math.round(pct) },
        actionTextKey: 'Slow down discretionary spend',
      });
    }
  });

  // 5. Savings Goal Projections
  goals.filter(g => g.status === 'in_progress').forEach(g => {
    const target = Number(g.targetAmount) || 0;
    const current = Number(g.currentAmount) || 0;
    const remaining = Math.max(0, target - current);
    if (remaining > 0) {
      const dailySave100 = 100;
      const daysNeeded = Math.ceil(remaining / dailySave100);
      const monthsNeeded = (daysNeeded / 30).toFixed(1);
      insights.push({
        id: `insight-goal-${g.id}`,
        type: 'savings_forecast',
        severity: 'success',
        titleKey: 'insight_savings_tip_title',
        descriptionKey: `If you save ${currency} 100 every day, you will reach '${g.name}' in approx. ${monthsNeeded} months.`,
        params: { goalName: g.name, months: monthsNeeded },
        actionTextKey: 'Contribute to goal now',
      });
    }
  });

  // 6. Financial Health score & cashflow
  if (currIncome > 0) {
    const savingsRatio = ((currIncome - currTotalExp) / currIncome) * 100;
    if (savingsRatio >= 25) {
      insights.push({
        id: 'insight-health-positive',
        type: 'positive_habit',
        severity: 'success',
        titleKey: 'insight_healthy_title',
        descriptionKey: `Excellent financial health! You are saving ${Math.round(savingsRatio)}% of your monthly income.`,
        params: { percent: Math.round(savingsRatio) },
        actionTextKey: 'Maintain 50/30/20 momentum',
      });
    } else if (savingsRatio < 0) {
      insights.push({
        id: 'insight-health-deficit',
        type: 'spending_spike',
        severity: 'danger',
        titleKey: 'insight_budget_alert_title',
        descriptionKey: `Cash flow deficit alert: Expenses exceed income by ${Math.abs(Math.round(savingsRatio))}%.`,
        params: { percent: Math.abs(Math.round(savingsRatio)) },
        actionTextKey: 'Freeze non-essential outlays',
      });
    }
  } else if (currTotalExp > 0) {
    insights.push({
      id: 'insight-health-deficit-no-income',
      type: 'spending_spike',
      severity: 'danger',
      titleKey: 'insight_budget_alert_title',
      descriptionKey: `Cash flow deficit alert: Outflows of ${currency} ${currTotalExp.toLocaleString()} recorded with zero registered income this month.`,
      params: { percent: 100 },
      actionTextKey: 'Record monthly income or pause outflows',
    });
  }

  return insights;
}
