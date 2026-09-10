import { Transaction, BudgetProgress, Loan, Wallet, DashboardSummary } from '../types';
import { formatCurrency, convertCurrency } from './currencies';

export interface HealthPillar {
  name: string;
  score: number; // 0 to maxScore
  maxScore: number;
  rating: 'excellent' | 'good' | 'fair' | 'critical';
  summary: string;
  impactDescription: string;
}

export interface FinancialHealthRecommendation {
  id: string;
  category: 'savings' | 'budget' | 'debt' | 'emergency';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  actionLabel: string;
  actionView: string;
}

export interface FinancialHealthEvaluation {
  overallScore: number; // 0 to 100
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'N/A';
  status: 'excellent' | 'good' | 'fair' | 'needs_attention';
  statusLabel: string;
  headlineSummary: string;
  isInsufficientData?: boolean;
  pillars: {
    savings: HealthPillar;
    budget: HealthPillar;
    debt: HealthPillar;
    emergency: HealthPillar;
  };
  metrics: {
    savingsRate: number;
    emergencyMonthsRunway: number;
    budgetAdherencePercent: number;
    debtToAssetRatio: number;
    totalBalance: number;
    totalDebtOwed: number;
    monthlyBurnRate: number;
  };
  recommendations: FinancialHealthRecommendation[];
}

/**
 * Evaluates comprehensive financial health across 4 core pillars.
 * Uses strictly real transaction history and wallet balances.
 * Never invents income or expenses from wallet balance.
 */
export function evaluateFinancialHealth(
  wallets: Wallet[],
  transactions: Transaction[],
  budgets: BudgetProgress[],
  loans: Loan[],
  currency: string = 'BDT'
): FinancialHealthEvaluation {
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 1. Total liquid balance across wallets (safely handle numbers/strings)
  const totalBalance = (wallets || []).reduce((s, w) => s + convertCurrency(Number(w.balance) || 0, w.currency || 'BDT', currency), 0);

  // 2. Real Transaction Audit
  const incomeTxs = (transactions || []).filter((t) => t.type === 'income');
  const expenseTxs = (transactions || []).filter((t) => t.type === 'expense');

  const currentMonthIncomes = incomeTxs
    .filter((t) => t.date && t.date.startsWith(currentMonthStr))
    .reduce((s, t) => s + convertCurrency(Number(t.amount) || 0, t.currency || 'BDT', currency), 0);

  const currentMonthExpenses = expenseTxs
    .filter((t) => t.date && t.date.startsWith(currentMonthStr))
    .reduce((s, t) => s + convertCurrency(Number(t.amount) || 0, t.currency || 'BDT', currency), 0);

  const allIncomes = incomeTxs.reduce((s, t) => s + convertCurrency(Number(t.amount) || 0, t.currency || 'BDT', currency), 0);
  const allExpenses = expenseTxs.reduce((s, t) => s + convertCurrency(Number(t.amount) || 0, t.currency || 'BDT', currency), 0);

  const hasRealIncomeHistory = allIncomes > 0;
  const hasRealExpenseHistory = allExpenses > 0;
  const hasTransactionData = hasRealIncomeHistory || hasRealExpenseHistory;

  // 3. Debt Analysis: Loans user owes to others
  const totalDebtOwed = (loans || [])
    .filter((l) => l.type === 'i_owe' && l.status !== 'paid')
    .reduce((s, l) => s + convertCurrency(Math.max(0, (Number(l.amount) || 0) - (Number(l.paidAmount) || 0)), l.currency || 'BDT', currency), 0);

  const debtToAssetRatio = totalBalance > 0
    ? Math.round((totalDebtOwed / totalBalance) * 100)
    : (totalDebtOwed > 0 ? 100 : 0);

  // 4. Budget Adherence Analysis
  let budgetAdherencePercent = 100;
  let budgetsExceededCount = 0;
  let budgetsWarningCount = 0;

  if (budgets && budgets.length > 0) {
    budgets.forEach((b) => {
      let pct = Number((b as any).percentage);
      if (isNaN(pct) || typeof (b as any).percentage === 'undefined') {
        const budgetCatId = b.categoryId;
        const spent = expenseTxs
          .filter((t) => (!budgetCatId || t.categoryId === budgetCatId) && t.date && t.date.startsWith(currentMonthStr))
          .reduce((s, t) => s + (Number(t.amount) || 0), 0);
        pct = (Number(b.amount) || 0) > 0 ? Math.round((spent / Number(b.amount)) * 100) : 0;
      }
      if (pct > 100) budgetsExceededCount++;
      else if (pct >= 80) budgetsWarningCount++;
    });
    const onTrackBudgets = Math.max(0, budgets.length - budgetsExceededCount);
    budgetAdherencePercent = Math.round((onTrackBudgets / budgets.length) * 100);
  }

  // -------------------------------------------------------------
  // INSUFFICIENT DATA CASE: NEVER INVENT DATA FROM WALLET BALANCE
  // -------------------------------------------------------------
  if (!hasTransactionData) {
    return {
      overallScore: 0,
      grade: 'N/A',
      status: 'needs_attention',
      statusLabel: 'Insufficient Data',
      headlineSummary: 'Insufficient transaction history to evaluate financial health. Add your income and living expenses to calculate your Financial Health Score.',
      isInsufficientData: true,
      pillars: {
        savings: {
          name: 'Savings Performance',
          score: 0,
          maxScore: 30,
          rating: 'fair',
          summary: 'Insufficient data: No income or expense transactions recorded yet',
          impactDescription: 'Measures capital velocity and your ability to retain surplus earnings each month.',
        },
        budget: {
          name: 'Budget Discipline',
          score: (budgets || []).length > 0 ? 20 : 0,
          maxScore: 25,
          rating: 'fair',
          summary: (budgets || []).length > 0 ? `${budgets.length} budget(s) active, awaiting expense tracking` : 'No active category budgets configured',
          impactDescription: 'Assesses cost control and whether discretionary spending remains within your targets.',
        },
        debt: {
          name: 'Debt & Loan Burden',
          score: totalDebtOwed === 0 ? 25 : (debtToAssetRatio <= 25 ? 20 : 10),
          maxScore: 25,
          rating: totalDebtOwed === 0 ? 'excellent' : (debtToAssetRatio <= 25 ? 'good' : 'fair'),
          summary: totalDebtOwed === 0 ? 'Zero debt obligations (100% debt-free leverage)' : `Payable debt is ${debtToAssetRatio}% of current liquid balance`,
          impactDescription: 'Evaluates your exposure to borrowed capital and repayment solvency risks.',
        },
        emergency: {
          name: 'Emergency Buffer',
          score: 0,
          maxScore: 20,
          rating: 'fair',
          summary: 'Insufficient data: Record your living expenses to calculate monthly burn rate',
          impactDescription: 'Number of months your current balances can sustain living expenses with zero income.',
        },
      },
      metrics: {
        savingsRate: 0,
        emergencyMonthsRunway: 0,
        budgetAdherencePercent: (budgets || []).length > 0 ? 100 : 0,
        debtToAssetRatio,
        totalBalance,
        totalDebtOwed,
        monthlyBurnRate: 0,
      },
      recommendations: [
        {
          id: 'rec-log-transactions',
          category: 'savings',
          priority: 'high',
          title: 'Log Income & Expenses',
          description: 'Record your real transactions so Hishab Khata can calculate your true savings rate, monthly burn rate, and runway resilience.',
          actionLabel: 'Add Transaction',
          actionView: 'dashboard',
        },
        ...((budgets || []).length === 0 ? [{
          id: 'rec-set-budgets',
          category: 'budget' as const,
          priority: 'medium' as const,
          title: 'Establish Category Spending Limits',
          description: 'Track top expenses with monthly budget guardrails to prevent overspending.',
          actionLabel: 'Create Monthly Budget',
          actionView: 'budgets',
        }] : []),
      ],
    };
  }

  // -------------------------------------------------------------
  // REAL TRANSACTION CALCULATION (NO INVENTED DATA)
  // -------------------------------------------------------------
  const distinctIncomeMonths = new Set(
    incomeTxs.map((t) => (t.date || '').substring(0, 7)).filter(Boolean)
  ).size || 1;
  const distinctExpenseMonths = new Set(
    expenseTxs.map((t) => (t.date || '').substring(0, 7)).filter(Boolean)
  ).size || 1;

  const historicalMonthlyIncome = hasRealIncomeHistory ? Math.round(allIncomes / distinctIncomeMonths) : 0;
  const historicalMonthlyExpense = hasRealExpenseHistory ? Math.round(allExpenses / distinctExpenseMonths) : 0;

  // Use current month if active; otherwise fall back strictly to real historical averages
  const effectiveIncome = currentMonthIncomes > 0 ? currentMonthIncomes : historicalMonthlyIncome;
  const effectiveExpense = currentMonthExpenses > 0 ? currentMonthExpenses : historicalMonthlyExpense;

  // Monthly burn rate for runway calculation:
  // If user has multi-month history, prefer historical monthly expense to prevent early-month distortion.
  // If user only has this month, extrapolate by days elapsed in current month.
  let monthlyBurnRate = 0;
  if (distinctExpenseMonths > 1) {
    monthlyBurnRate = historicalMonthlyExpense;
  } else if (currentMonthExpenses > 0) {
    const daysElapsed = Math.max(1, now.getDate());
    const extrapolated = Math.round((currentMonthExpenses / daysElapsed) * 30);
    monthlyBurnRate = Math.max(currentMonthExpenses, extrapolated);
  } else if (hasRealExpenseHistory) {
    monthlyBurnRate = historicalMonthlyExpense;
  }

  // Real Savings Rate:
  // If active current month, compare current month income and expenses.
  // Otherwise use historical totals.
  let savingsRate = 0;
  if (currentMonthIncomes > 0) {
    savingsRate = Math.max(-100, Math.min(100, Math.round(((currentMonthIncomes - currentMonthExpenses) / currentMonthIncomes) * 100)));
  } else if (hasRealIncomeHistory && allIncomes > 0) {
    savingsRate = Math.max(-100, Math.min(100, Math.round(((allIncomes - allExpenses) / allIncomes) * 100)));
  } else if (effectiveExpense > 0) {
    savingsRate = -100; // Outflows without income = 100% cashflow deficit
  } else {
    savingsRate = 0;
  }

  const emergencyMonthsRunway = monthlyBurnRate > 0 && totalBalance > 0
    ? parseFloat((totalBalance / monthlyBurnRate).toFixed(1))
    : 0;

  // -------------------------------------------------------------
  // PILLAR 1: SAVINGS PERFORMANCE (Max 30 Points)
  // -------------------------------------------------------------
  let savingsScore = 15;
  let savingsRating: HealthPillar['rating'] = 'fair';
  let savingsSummary = '';

  if (effectiveIncome === 0 && effectiveExpense > 0) {
    savingsScore = 2;
    savingsRating = 'critical';
    savingsSummary = `Cashflow deficit: Outflows of ${formatCurrency(effectiveExpense, currency)} with no recorded income`;
  } else if (savingsRate >= 30) {
    savingsScore = 30;
    savingsRating = 'excellent';
    savingsSummary = `Saving ${savingsRate}% of income (Elite standard >30%)`;
  } else if (savingsRate >= 20) {
    savingsScore = 25;
    savingsRating = 'good';
    savingsSummary = `Saving ${savingsRate}% of income (Meets recommended 20% benchmark)`;
  } else if (savingsRate >= 10) {
    savingsScore = 18;
    savingsRating = 'fair';
    savingsSummary = `Saving ${savingsRate}% of income (Room to optimize toward 20%)`;
  } else if (savingsRate > 0) {
    savingsScore = 10;
    savingsRating = 'fair';
    savingsSummary = `Saving ${savingsRate}% of income (Low capital retention)`;
  } else {
    savingsScore = 2;
    savingsRating = 'critical';
    savingsSummary = `Cashflow deficit: Outflows exceed current income by ${Math.abs(savingsRate)}%`;
  }

  const savingsPillar: HealthPillar = {
    name: 'Savings Performance',
    score: savingsScore,
    maxScore: 30,
    rating: savingsRating,
    summary: savingsSummary,
    impactDescription: 'Measures capital velocity and your ability to retain surplus earnings each month.',
  };

  // -------------------------------------------------------------
  // PILLAR 2: BUDGET DISCIPLINE (Max 25 Points)
  // -------------------------------------------------------------
  let budgetScore = 20;
  let budgetRating: HealthPillar['rating'] = 'good';
  let budgetSummary = '';

  if (!budgets || budgets.length === 0) {
    budgetScore = 16;
    budgetRating = 'fair';
    budgetSummary = 'No active category budgets configured';
  } else if (budgetsExceededCount === 0 && budgetsWarningCount === 0) {
    budgetScore = 25;
    budgetRating = 'excellent';
    budgetSummary = `100% budget discipline (${budgets.length} budgets on track)`;
  } else if (budgetsExceededCount === 0) {
    budgetScore = 21;
    budgetRating = 'good';
    budgetSummary = `${budgetsWarningCount} budget(s) nearing capacity, none breached`;
  } else if (budgetsExceededCount === 1) {
    budgetScore = 14;
    budgetRating = 'fair';
    budgetSummary = `1 budget breached limit; rest on track`;
  } else {
    budgetScore = 6;
    budgetRating = 'critical';
    budgetSummary = `${budgetsExceededCount} budgets severely exceeded`;
  }

  const budgetPillar: HealthPillar = {
    name: 'Budget Discipline',
    score: budgetScore,
    maxScore: 25,
    rating: budgetRating,
    summary: budgetSummary,
    impactDescription: 'Assesses cost control and whether discretionary spending remains within your targets.',
  };

  // -------------------------------------------------------------
  // PILLAR 3: DEBT & LOAN IMPACT (Max 25 Points)
  // -------------------------------------------------------------
  let debtScore = 25;
  let debtRating: HealthPillar['rating'] = 'excellent';
  let debtSummary = '';

  if (totalDebtOwed === 0) {
    debtScore = 25;
    debtRating = 'excellent';
    debtSummary = 'Zero debt obligations (100% debt-free leverage)';
  } else if (debtToAssetRatio <= 15) {
    debtScore = 22;
    debtRating = 'good';
    debtSummary = `Debt is safely capped at ${debtToAssetRatio}% of total liquidity`;
  } else if (debtToAssetRatio <= 35) {
    debtScore = 17;
    debtRating = 'fair';
    debtSummary = `Moderate debt burden (${debtToAssetRatio}% of liquid assets)`;
  } else if (debtToAssetRatio <= 70) {
    debtScore = 10;
    debtRating = 'fair';
    debtSummary = `High debt exposure (${debtToAssetRatio}% of total capital)`;
  } else {
    debtScore = 4;
    debtRating = 'critical';
    debtSummary = `Debt obligations exceed available liquidity (${debtToAssetRatio}%)`;
  }

  const debtPillar: HealthPillar = {
    name: 'Debt & Loan Burden',
    score: debtScore,
    maxScore: 25,
    rating: debtRating,
    summary: debtSummary,
    impactDescription: 'Evaluates your exposure to borrowed capital and repayment solvency risks.',
  };

  // -------------------------------------------------------------
  // PILLAR 4: EMERGENCY RUNWAY & BUFFER (Max 20 Points)
  // -------------------------------------------------------------
  let emergencyScore = 12;
  let emergencyRating: HealthPillar['rating'] = 'fair';
  let emergencySummary = '';

  if (monthlyBurnRate === 0) {
    emergencyScore = totalBalance > 0 ? 14 : 4;
    emergencyRating = 'fair';
    emergencySummary = totalBalance > 0
      ? `Liquid reserve of ${formatCurrency(totalBalance, currency)} (No living expenses recorded yet to calculate burn rate)`
      : 'No liquid reserve or expense history recorded';
  } else if (emergencyMonthsRunway >= 6) {
    emergencyScore = 20;
    emergencyRating = 'excellent';
    emergencySummary = `${emergencyMonthsRunway} months of living expenses safely funded (Elite fortress)`;
  } else if (emergencyMonthsRunway >= 3) {
    emergencyScore = 16;
    emergencyRating = 'good';
    emergencySummary = `${emergencyMonthsRunway} months runway (Meets baseline 3-month safety standard)`;
  } else if (emergencyMonthsRunway >= 1) {
    emergencyScore = 10;
    emergencyRating = 'fair';
    emergencySummary = `${emergencyMonthsRunway} months runway (Vulnerable to sudden economic shocks)`;
  } else {
    emergencyScore = 4;
    emergencyRating = 'critical';
    emergencySummary = `Under 1 month liquid buffer (${emergencyMonthsRunway} mo)`;
  }

  const emergencyPillar: HealthPillar = {
    name: 'Emergency Buffer',
    score: emergencyScore,
    maxScore: 20,
    rating: emergencyRating,
    summary: emergencySummary,
    impactDescription: 'Number of months your current balances can sustain living expenses with zero income.',
  };

  // -------------------------------------------------------------
  // TOTAL SCORE & STATUS
  // -------------------------------------------------------------
  const overallScore = Math.min(100, Math.max(0, savingsScore + budgetScore + debtScore + emergencyScore));

  let grade: FinancialHealthEvaluation['grade'] = 'B';
  let status: FinancialHealthEvaluation['status'] = 'good';
  let statusLabel = 'Good Standing';
  let headlineSummary = 'Your financial profile is fundamentally solid with opportunities for acceleration.';

  if (overallScore >= 88) {
    grade = 'A+';
    status = 'excellent';
    statusLabel = 'Elite Financial Fortress';
    headlineSummary = 'Outstanding financial discipline! You maintain strong savings, healthy reserves, and minimal debt.';
  } else if (overallScore >= 75) {
    grade = 'A';
    status = 'excellent';
    statusLabel = 'Strong & Resilient';
    headlineSummary = 'Healthy capital velocity with robust budget control and strong cashflow buffers.';
  } else if (overallScore >= 60) {
    grade = 'B';
    status = 'good';
    statusLabel = 'Stable with Growth Potential';
    headlineSummary = 'Good financial foundation. Focus on expanding emergency reserves and tightening budget leaks.';
  } else if (overallScore >= 45) {
    grade = 'C';
    status = 'fair';
    statusLabel = 'Moderate Vulnerability';
    headlineSummary = 'Your cashflow or debt balance needs attention to guard against unexpected expense spikes.';
  } else {
    grade = 'D';
    status = 'needs_attention';
    statusLabel = 'Action Required';
    headlineSummary = 'Immediate budget realignment and debt restructuring recommended to prevent balance erosion.';
  }

  // -------------------------------------------------------------
  // SMART ACTIONABLE RECOMMENDATIONS
  // -------------------------------------------------------------
  const recommendations: FinancialHealthRecommendation[] = [];

  // Savings recommendation
  if (savingsRate < 20) {
    recommendations.push({
      id: 'rec-savings-boost',
      category: 'savings',
      priority: savingsRate < 0 ? 'high' : 'medium',
      title: savingsRate < 0 ? 'Halt Non-Essential Outflows' : 'Boost Savings Rate to 20%',
      description: savingsRate < 0
        ? 'Your monthly outflow currently exceeds income. Pause discretionary purchases to restore positive cashflow.'
        : `Aim to save at least 20% of your earnings. Setting up an automatic transfer on payday can bridge this ${20 - savingsRate}% gap.`,
      actionLabel: 'View Income Analysis',
      actionView: 'reports',
    });
  }

  // Emergency runway recommendation
  if (monthlyBurnRate > 0 && emergencyMonthsRunway < 3) {
    recommendations.push({
      id: 'rec-emergency-buffer',
      category: 'emergency',
      priority: emergencyMonthsRunway < 1 ? 'high' : 'medium',
      title: 'Build a 3-Month Emergency Reserve',
      description: `You currently have ${emergencyMonthsRunway} months of living reserves. Target at least 3 full months of burn rate in a dedicated savings wallet.`,
      actionLabel: 'Set Savings Goal',
      actionView: 'savings',
    });
  }

  // Budget recommendation
  if (!budgets || budgets.length === 0) {
    recommendations.push({
      id: 'rec-set-budgets',
      category: 'budget',
      priority: 'medium',
      title: 'Establish Category Spending Limits',
      description: 'You have no active monthly budgets. Tracking top expenses with budget guardrails prevents end-of-month surprises.',
      actionLabel: 'Create Monthly Budget',
      actionView: 'budgets',
    });
  } else if (budgetsExceededCount > 0) {
    recommendations.push({
      id: 'rec-budget-realign',
      category: 'budget',
      priority: 'high',
      title: 'Rebalance Over-Budget Categories',
      description: `${budgetsExceededCount} budget(s) have been breached. Reallocate funds or trim discretionary expenses for the remainder of the month.`,
      actionLabel: 'Review Budgets',
      actionView: 'budgets',
    });
  }

  // Debt recommendation
  if (totalDebtOwed > 0 && debtToAssetRatio > 25) {
    recommendations.push({
      id: 'rec-debt-repay',
      category: 'debt',
      priority: debtToAssetRatio > 50 ? 'high' : 'medium',
      title: 'Prioritize Active Debt Amortization',
      description: `Your payable debt equals ${debtToAssetRatio}% of liquid assets. Consider an accelerated payoff schedule to eliminate interest and liabilities.`,
      actionLabel: 'Manage Loans & Debts',
      actionView: 'loans',
    });
  }

  // Positive reinforcement recommendation if health is already great
  if (recommendations.length === 0) {
    recommendations.push({
      id: 'rec-wealth-accelerate',
      category: 'savings',
      priority: 'low',
      title: 'Accelerate Long-Term Investments',
      description: 'Your fundamentals are excellent across all pillars. Consider funneling additional surplus into longer-term wealth creation goals.',
      actionLabel: 'Explore AI Advice',
      actionView: 'insights',
    });
  }

  return {
    overallScore,
    grade,
    status,
    statusLabel,
    headlineSummary,
    pillars: {
      savings: savingsPillar,
      budget: budgetPillar,
      debt: debtPillar,
      emergency: emergencyPillar,
    },
    metrics: {
      savingsRate,
      emergencyMonthsRunway,
      budgetAdherencePercent,
      debtToAssetRatio,
      totalBalance,
      totalDebtOwed,
      monthlyBurnRate,
    },
    recommendations,
  };
}

