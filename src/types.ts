export type UserRole = 'user' | 'admin';
export type SubscriptionPlan = 'free' | 'pro';
export type UserStatus = 'active' | 'deactivated';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  preferredLanguage: string;
  preferredCurrency: string;
  plan: SubscriptionPlan;
  status: UserStatus;
  emailVerified: boolean;
  avatarUrl?: string;
  firebaseUid?: string;
  createdAt: string;
  updatedAt: string;
}

export type WalletType = 'cash' | 'bank' | 'card' | 'bkash' | 'nagad' | 'savings' | 'custom';

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  type: WalletType;
  balance: number;
  currency: string;
  color: string;
  isDefault: boolean;
  accountNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  userId: string;
  walletId: string;
  toWalletId?: string | null;
  type: TransactionType;
  amount: number;
  currency: string;
  categoryId: string;
  category?: string;
  date: string; // ISO date string YYYY-MM-DD
  description: string;
  note?: string;
  isRecurring?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  userId?: string | null; // null for system default
  nameKey: string;
  customName?: string | null;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isSystem: boolean;
  createdAt: string;
}

export type BudgetPeriod = 'monthly' | 'yearly';
export type BudgetStatus = 'normal' | 'warning' | 'over_budget';

export interface Budget {
  id: string;
  userId: string;
  categoryId: string | null; // null for overall monthly budget
  category?: string;
  amount: number;
  period: BudgetPeriod;
  month: string; // YYYY-MM
  createdAt: string;
  updatedAt: string;
}

export interface BudgetProgress extends Budget {
  spent: number;
  remaining: number;
  percentage: number;
  status: BudgetStatus;
  categoryName?: string;
  categoryColor?: string;
}

export type GoalStatus = 'in_progress' | 'completed';

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency?: string;
  targetDate: string; // YYYY-MM-DD
  deadline?: string;
  description?: string;
  color: string;
  icon: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  userId: string;
  amount: number;
  walletId: string;
  note?: string;
  date: string;
  createdAt: string;
}

export type LoanType = 'owe_me' | 'i_owe'; // owe_me = Receivable, i_owe = Payable
export type LoanStatus = 'pending' | 'partially_paid' | 'paid' | 'overdue';

export interface Loan {
  id: string;
  userId: string;
  type: LoanType;
  personName: string;
  personContact?: string;
  amount: number;
  paidAmount: number;
  dueDate: string; // YYYY-MM-DD
  description?: string;
  status: LoanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  userId: string;
  amount: number;
  walletId: string;
  paymentDate: string;
  note?: string;
  createdAt: string;
}

export type NotificationType = 
  | 'budget_warning' 
  | 'budget_exceeded' 
  | 'loan_due' 
  | 'savings_reminder' 
  | 'monthly_summary' 
  | 'announcement' 
  | 'system';

export interface AppNotification {
  id: string;
  userId: string | null; // null = global announcement
  type: NotificationType;
  titleKey: string;
  messageKey: string;
  params?: Record<string, any>;
  isRead: boolean;
  readBy?: string[]; // user IDs who have read this global notification
  deletedBy?: string[]; // user IDs who have dismissed/deleted this notification
  createdAt: string;
}

export interface LanguageInfo {
  code: string;
  name: string;
  nativeName: string;
  isRtl: boolean;
  isEnabled: boolean;
  isDefault: boolean;
  completionPercent: number;
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  exchangeRateToUSD: number;
  decimalPlaces: number;
  symbolPlacement: 'before' | 'after';
}

export interface SmartInsight {
  id: string;
  type: 'spending_spike' | 'highest_category' | 'budget_alert' | 'savings_forecast' | 'positive_habit' | 'cashflow_forecast';
  severity: 'info' | 'warning' | 'danger' | 'success';
  titleKey: string;
  descriptionKey: string;
  params?: Record<string, any>;
  actionTextKey?: string;
  actionUrl?: string;
}

export interface DashboardSummary {
  totalBalance: number;
  totalIncomeThisMonth: number;
  totalExpensesThisMonth: number;
  totalSavings: number;
  netSavingsThisMonth: number;
  incomeChangePercent: number;
  expenseChangePercent: number;
  recentTransactions: Transaction[];
  topExpenseCategories: { categoryId: string; name: string; amount: number; percentage: number; color: string }[];
  budgetSummaries: BudgetProgress[];
  savingsGoals: SavingsGoal[];
  smartInsights: SmartInsight[];
  upcomingLoans: Loan[];
  monthlySpendingTrend: { month: string; income: number; expense: number; savings: number }[];
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  freeUsers: number;
  proUsers: number;
  totalTransactions: number;
  totalVolumeUSD: number;
  totalWallets: number;
  revenueMRR: number;
}

export interface AdminLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  details: string;
  createdAt: string;
}

export interface SystemPlanLimits {
  freeMaxWallets: number;
  freeMaxTransactionsPerMonth: number;
  freeMaxSavingsGoals: number;
  freeAllowPdfExport: boolean;
  freeAllowExcelExport: boolean;
  proMonthlyPriceUSD: number;
  proYearlyPriceUSD: number;
}

export type PaymentMethodType = 'bkash' | 'nagad' | 'rocket' | 'bank_transfer' | 'card';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface SubscriptionPayment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  plan: 'pro';
  billingCycle: 'monthly' | 'yearly' | 'lifetime';
  amount: number;
  currency: string;
  paymentMethod: PaymentMethodType;
  senderNumberOrAccount: string;
  transactionId: string;
  notes?: string;
  status: PaymentStatus;
  adminNotes?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface AdminPaymentConfig {
  bkashNumber: string;
  bkashType: 'personal' | 'merchant';
  nagadNumber: string;
  nagadType: 'personal' | 'merchant';
  rocketNumber: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankBranch: string;
  bankRoutingNumber: string;
  proMonthlyPriceBDT: number;
  proYearlyPriceBDT: number;
  proLifetimePriceBDT?: number;
  proMonthlyPriceUSD: number;
  proYearlyPriceUSD: number;
  proLifetimePriceUSD?: number;
  yearlyDiscountPercent?: number;
  instructionsBn?: string;
  instructionsEn?: string;
}

export interface UserPresence {
  userId: string;
  userName: string;
  userEmail: string;
  avatarUrl?: string;
  plan: SubscriptionPlan;
  role: UserRole;
  isOnline: boolean;
  currentView: string;
  lastActiveAt: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  browser: string;
  lastAction?: string;
}

export interface LiveUserActivity {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  avatarUrl?: string;
  action: string;
  category: 'NAVIGATION' | 'TRANSACTION' | 'WALLET' | 'BUDGET' | 'SAVINGS' | 'LOAN' | 'SUBSCRIPTION' | 'SETTINGS' | 'AUTH';
  details: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  currentView?: string;
  timestamp: string;
}

export interface EmailLogEntry {
  id: string;
  to: string;
  from: string;
  subject: string;
  type: 'admin_subscription_alert' | 'user_subscription_approved' | 'user_subscription_rejected' | 'security_alert';
  preview: string;
  htmlContent?: string;
  status: 'sent' | 'queued' | 'delivered';
  metadata?: Record<string, any>;
  sentAt: string;
}

export type SuggestionCategory = 'feature' | 'improvement' | 'ui_ux' | 'bug' | 'performance' | 'other';
export type SuggestionStatus = 'pending' | 'reviewed' | 'planned' | 'in_progress' | 'completed' | 'declined';
export type SuperChatTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface SuggestionSuperChat {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  category: SuggestionCategory;
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high' | 'critical';
  status: SuggestionStatus;
  adminReply?: string;
  adminRepliedAt?: string;

  // SuperChat contribution fields
  hasSuperChat: boolean;
  superChatAmount?: number;
  superChatCurrency?: string;
  superChatTier?: SuperChatTier;
  superChatMessage?: string;
  paymentMethod?: 'bkash' | 'nagad' | 'rocket' | 'bank' | 'wallet_balance' | 'card';
  paymentTrxId?: string;
  senderNumber?: string;
  isSuperChatVerified?: boolean;

  upvotes?: number;
  upvotedUserIds?: string[];
  createdAt: string;
  updatedAt: string;
}


