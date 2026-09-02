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

  // 1. Current month vs Prev month spending by category
  const currExpenses = transactions.filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr));
  const prevExpenses = transactions.filter(t => t.type === 'expense' && t.date.startsWith(prevMonthStr));

  const currTotalExp = currExpenses.reduce((sum, t) => sum + t.amount, 0);
  const prevTotalExp = prevExpenses.reduce((sum, t) => sum + t.amount, 0);

  const currIncome = transactions.filter(t => t.type === 'income' && t.date.startsWith(currentMonthStr)).reduce((sum, t) => sum + t.amount, 0);

  // Group by category
  const currCatTotals: Record<string, number> = {};
  currExpenses.forEach(t => {
    currCatTotals[t.categoryId] = (currCatTotals[t.categoryId] || 0) + t.amount;
  });

  const prevCatTotals: Record<string, number> = {};
  prevExpenses.forEach(t => {
    prevCatTotals[t.categoryId] = (prevCatTotals[t.categoryId] || 0) + t.amount;
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
        });
      }
    }
  });

  // 2. Budget Alerts
  budgets.forEach(b => {
    if (b.percentage >= 100) {
      insights.push({
        id: `insight-budget-over-${b.id}`,
        type: 'budget_alert',
        severity: 'danger',
        titleKey: 'insight_budget_alert_title',
        descriptionKey: `Budget exceeded by ${Math.round(b.percentage - 100)}%! Immediate attention recommended.`,
        params: { percent: Math.round(b.percentage) },
      });
    } else if (b.percentage >= 80) {
      insights.push({
        id: `insight-budget-warn-${b.id}`,
        type: 'budget_alert',
        severity: 'warning',
        titleKey: 'insight_budget_alert_title',
        descriptionKey: `You have used ${Math.round(b.percentage)}% of your allocated budget for this period.`,
        params: { percent: Math.round(b.percentage) },
      });
    }
  });

  // 3. Savings Goal Projections
  goals.filter(g => g.status === 'in_progress').forEach(g => {
    const remaining = Math.max(0, g.targetAmount - g.currentAmount);
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
      });
    }
  });

  // 4. Financial Health score
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
      });
    } else if (savingsRatio < 0) {
      insights.push({
        id: 'insight-health-deficit',
        type: 'spending_spike',
        severity: 'danger',
        titleKey: 'insight_budget_alert_title',
        descriptionKey: `Cash flow deficit alert: Expenses exceed income by ${Math.abs(Math.round(savingsRatio))}%.`,
        params: { percent: Math.abs(Math.round(savingsRatio)) },
      });
    }
  }

  return insights;
}
