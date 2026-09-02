import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getDb, saveDb } from './db';
import { authMiddleware, adminOnly, generateToken, AuthRequest } from './auth';
import {
  User,
  Wallet,
  Transaction,
  Budget,
  SavingsGoal,
  Loan,
  AppNotification,
  BudgetProgress,
  DashboardSummary,
  AdminLog,
  SubscriptionPayment,
  AdminPaymentConfig,
  UserPresence,
  LiveUserActivity,
  EmailLogEntry
} from '../types';
import { generateSmartInsights } from '../lib/insights';
import { GoogleGenAI } from '@google/genai';
import {
  sendAdminSubscriptionNotification,
  sendUserApprovalNotification,
  sendUserRejectionNotification
} from './emailService';

const router = Router();

// Helper to log admin actions
function logAdmin(req: AuthRequest, action: string, targetType: string, targetId: string, details: string) {
  if (!req.user) return;
  const db = getDb();
  const log: AdminLog = {
    id: `log-${Date.now()}`,
    adminId: req.user.id,
    adminEmail: req.user.email,
    action,
    targetType,
    targetId,
    details,
    createdAt: new Date().toISOString(),
  };
  db.adminLogs.unshift(log);
  saveDb();
}

// Helper to log real-time user activities for live admin monitoring
export function logUserActivity(
  user: { id: string; name: string; email: string; avatarUrl?: string },
  action: string,
  category: 'NAVIGATION' | 'TRANSACTION' | 'WALLET' | 'BUDGET' | 'SAVINGS' | 'LOAN' | 'SUBSCRIPTION' | 'SETTINGS' | 'AUTH',
  details: string,
  extra?: { currentView?: string; deviceType?: 'desktop' | 'mobile' | 'tablet' }
) {
  const db = getDb();
  if (!db.liveActivities) db.liveActivities = [];
  const now = new Date().toISOString();
  const activity: LiveUserActivity = {
    id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    avatarUrl: user.avatarUrl,
    action,
    category,
    details,
    currentView: extra?.currentView || 'dashboard',
    deviceType: extra?.deviceType || 'desktop',
    timestamp: now,
  };
  db.liveActivities.unshift(activity);
  if (db.liveActivities.length > 500) {
    db.liveActivities = db.liveActivities.slice(0, 500);
  }

  // Update presence radar
  if (!db.userPresences) db.userPresences = {};
  if (db.userPresences[user.id]) {
    db.userPresences[user.id].lastAction = details;
    db.userPresences[user.id].lastActiveAt = now;
  }
}

// -------------------------------------------------------------
// 1. AUTHENTICATION & PROFILE
// -------------------------------------------------------------

router.post('/auth/register', (req, res) => {
  const { name, email, password, preferredLanguage = 'en', preferredCurrency = 'BDT' } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const db = getDb();
  const existing = db.users.find(u => u.email.trim().toLowerCase() === cleanEmail);
  if (existing) {
    res.status(400).json({ error: 'An account with this email already exists. Please sign in instead.' });
    return;
  }

  const now = new Date().toISOString();
  const userId = `usr-${Date.now()}`;
  const passwordHash = bcrypt.hashSync(String(password), 10);

  const newUser: User = {
    id: userId,
    name: String(name).trim(),
    email: cleanEmail,
    role: 'user',
    preferredLanguage,
    preferredCurrency,
    plan: 'free',
    status: 'active',
    emailVerified: true,
    createdAt: now,
    updatedAt: now,
  };

  db.users.push(newUser);
  db.passwordHashes[userId] = passwordHash;

  // Create default starter wallets
  const defaultCashWallet: Wallet = {
    id: `w-cash-${Date.now()}`,
    userId,
    name: 'Cash Wallet',
    type: 'cash',
    balance: 0,
    currency: preferredCurrency,
    color: '#10B981',
    isDefault: true,
    createdAt: now,
    updatedAt: now,
  };

  const defaultBankWallet: Wallet = {
    id: `w-bank-${Date.now()}`,
    userId,
    name: 'Main Bank Account',
    type: 'bank',
    balance: 0,
    currency: preferredCurrency,
    color: '#0F766E',
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  };

  db.wallets.push(defaultCashWallet, defaultBankWallet);

  // Welcome notification
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId,
    type: 'system',
    titleKey: 'Welcome to Hishab Khata!',
    messageKey: 'Your financial workspace is ready. Add your first income or expense to get started.',
    isRead: false,
    createdAt: now,
  });

  saveDb();

  const token = generateToken(newUser);
  res.status(201).json({ user: newUser, token });
});

router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const db = getDb();
  const user = db.users.find(u => u.email.trim().toLowerCase() === cleanEmail);

  if (!user) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  if (user.status === 'deactivated') {
    res.status(403).json({ error: 'Account has been deactivated. Please contact administrator.' });
    return;
  }

  const hash = db.passwordHashes[user.id];
  const isMatch = bcrypt.compareSync(String(password), hash || '');

  if (!isMatch) {
    res.status(401).json({ error: 'Invalid email or password' });
    return;
  }

  const token = generateToken(user);
  res.json({ user, token });
});

router.post('/auth/firebase-google', (req, res) => {
  const { email, name, avatarUrl, firebaseUid, preferredLanguage = 'en', preferredCurrency = 'BDT' } = req.body;

  if (!email) {
    res.status(400).json({ error: 'Google account email is required' });
    return;
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const db = getDb();
  let user = db.users.find(u => u.email.trim().toLowerCase() === cleanEmail);
  const now = new Date().toISOString();

  if (user) {
    if (user.status === 'deactivated') {
      res.status(403).json({ error: 'Account has been deactivated. Please contact administrator.' });
      return;
    }
    // Update user avatar and firebaseUid if needed
    if (avatarUrl && !user.avatarUrl) {
      user.avatarUrl = avatarUrl;
    }
    if (firebaseUid) {
      user.firebaseUid = firebaseUid;
    }
    user.updatedAt = now;
  } else {
    // Register new user via Google
    const userId = `usr-g-${Date.now()}`;
    const displayName = (name && String(name).trim()) || cleanEmail.split('@')[0] || 'Google User';

    user = {
      id: userId,
      name: displayName,
      email: cleanEmail,
      role: 'user',
      preferredLanguage,
      preferredCurrency,
      plan: 'free',
      status: 'active',
      emailVerified: true,
      avatarUrl: avatarUrl || undefined,
      firebaseUid: firebaseUid || undefined,
      createdAt: now,
      updatedAt: now,
    };

    db.users.push(user);

    // Create starter wallets for new Google user
    const defaultCashWallet: Wallet = {
      id: `w-cash-${Date.now()}`,
      userId,
      name: 'Cash Wallet',
      type: 'cash',
      balance: 0,
      currency: preferredCurrency,
      color: '#10B981',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    };

    const defaultBankWallet: Wallet = {
      id: `w-bank-${Date.now()}`,
      userId,
      name: 'Main Bank Account',
      type: 'bank',
      balance: 0,
      currency: preferredCurrency,
      color: '#0F766E',
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    };

    db.wallets.push(defaultCashWallet, defaultBankWallet);

    // Welcome notification
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId,
      type: 'system',
      titleKey: 'Welcome to Hishab Khata!',
      messageKey: 'Signed in with Google. Your smart multi-wallet financial ledger is active.',
      isRead: false,
      createdAt: now,
    });
  }

  saveDb();
  const token = generateToken(user);
  res.json({ user, token });
});

router.get('/auth/me', authMiddleware, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

router.put('/auth/profile', authMiddleware, (req: AuthRequest, res) => {
  const { name, preferredLanguage, preferredCurrency, avatarUrl } = req.body;
  const db = getDb();
  const user = db.users.find(u => u.id === req.user!.id);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (name) user.name = name;
  if (preferredLanguage) user.preferredLanguage = preferredLanguage;
  if (preferredCurrency) user.preferredCurrency = preferredCurrency;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;
  user.updatedAt = new Date().toISOString();

  saveDb();
  res.json({ user });
});

router.put('/auth/password', authMiddleware, (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: 'Current password and new password are required' });
    return;
  }

  const db = getDb();
  const hash = db.passwordHashes[req.user!.id];
  if (!bcrypt.compareSync(currentPassword, hash || '')) {
    res.status(400).json({ error: 'Current password is incorrect' });
    return;
  }

  db.passwordHashes[req.user!.id] = bcrypt.hashSync(newPassword, 10);
  saveDb();
  res.json({ message: 'Password updated successfully' });
});

router.post('/auth/upgrade-plan', authMiddleware, (req: AuthRequest, res) => {
  const { plan = 'pro' } = req.body;
  const db = getDb();
  const user = db.users.find(u => u.id === req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  user.plan = plan;
  user.updatedAt = new Date().toISOString();

  // Record notification
  db.notifications.push({
    id: `notif-${Date.now()}`,
    userId: user.id,
    type: 'system',
    titleKey: 'Subscription Upgraded',
    messageKey: 'Congratulations! You now have full access to Hishab Khata PRO features and unlimited exports.',
    isRead: false,
    createdAt: new Date().toISOString(),
  });

  saveDb();
  res.json({ user, message: 'Plan upgraded successfully' });
});

// -------------------------------------------------------------
// 2. DASHBOARD SUMMARY & ANALYTICS
// -------------------------------------------------------------

router.get('/dashboard/summary', authMiddleware, (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const db = getDb();
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStr = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

  const userWallets = db.wallets.filter(w => w.userId === userId);
  const userTransactions = db.transactions.filter(t => t.userId === userId);
  const userBudgets = db.budgets.filter(b => b.userId === userId);
  const userGoals = db.savingsGoals.filter(g => g.userId === userId);
  const userLoans = db.loans.filter(l => l.userId === userId);
  const allCategories = [...db.categories, ...db.categories.filter(c => c.userId === userId)];

  // Total balance in all user wallets
  const totalBalance = userWallets.reduce((sum, w) => sum + (Number(w.balance) || 0), 0);

  // Income & Expenses this month
  const thisMonthIncome = userTransactions
    .filter(t => t.type === 'income' && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);

  const thisMonthExpenses = userTransactions
    .filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);

  const prevMonthIncome = userTransactions
    .filter(t => t.type === 'income' && t.date.startsWith(prevMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);

  const prevMonthExpenses = userTransactions
    .filter(t => t.type === 'expense' && t.date.startsWith(prevMonthStr))
    .reduce((sum, t) => sum + t.amount, 0);

  const incomeChangePercent = prevMonthIncome > 0
    ? Math.round(((thisMonthIncome - prevMonthIncome) / prevMonthIncome) * 100)
    : 0;

  const expenseChangePercent = prevMonthExpenses > 0
    ? Math.round(((thisMonthExpenses - prevMonthExpenses) / prevMonthExpenses) * 100)
    : 0;

  const totalSavings = userGoals.reduce((sum, g) => sum + (Number(g.currentAmount) || 0), 0);
  const netSavingsThisMonth = thisMonthIncome - thisMonthExpenses;

  // Top expense categories this month
  const categorySpendingMap: Record<string, number> = {};
  userTransactions
    .filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr))
    .forEach(t => {
      categorySpendingMap[t.categoryId] = (categorySpendingMap[t.categoryId] || 0) + t.amount;
    });

  const topExpenseCategories = Object.entries(categorySpendingMap).map(([catId, amount]) => {
    const cat = allCategories.find(c => c.id === catId);
    return {
      categoryId: catId,
      name: cat ? (cat.customName || cat.nameKey) : catId,
      amount,
      percentage: thisMonthExpenses > 0 ? Math.round((amount / thisMonthExpenses) * 100) : 0,
      color: cat?.color || '#0F766E',
    };
  }).sort((a, b) => b.amount - a.amount);

  // Budget summaries with progress calculation
  const budgetSummaries: BudgetProgress[] = userBudgets.map(b => {
    const spent = userTransactions
      .filter(t => t.type === 'expense' && (!b.categoryId || t.categoryId === b.categoryId) && t.date.startsWith(currentMonthStr))
      .reduce((sum, t) => sum + t.amount, 0);

    const remaining = Math.max(0, b.amount - spent);
    const percentage = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
    const status = percentage >= 100 ? 'over_budget' : percentage >= 80 ? 'warning' : 'normal';

    const cat = allCategories.find(c => c.id === b.categoryId);

    return {
      ...b,
      spent,
      remaining,
      percentage,
      status,
      categoryName: cat ? (cat.customName || cat.nameKey) : 'Overall Budget',
      categoryColor: cat?.color || '#0F766E',
    };
  });

  // Recent 10 transactions
  const recentTransactions = [...userTransactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  // 6-Month historical spending trend
  const monthlySpendingTrend: { month: string; income: number; expense: number; savings: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const mName = d.toLocaleString('en-US', { month: 'short' });

    const inc = userTransactions.filter(t => t.type === 'income' && t.date.startsWith(mStr)).reduce((s, t) => s + t.amount, 0);
    const exp = userTransactions.filter(t => t.type === 'expense' && t.date.startsWith(mStr)).reduce((s, t) => s + t.amount, 0);
    monthlySpendingTrend.push({
      month: mName,
      income: inc,
      expense: exp,
      savings: Math.max(0, inc - exp),
    });
  }

  // Generate rule-based smart insights
  const smartInsights = generateSmartInsights(
    userTransactions,
    budgetSummaries,
    userGoals,
    req.user!.preferredCurrency || 'BDT'
  );

  // Upcoming due loans
  const upcomingLoans = userLoans.filter(l => l.status !== 'paid');

  const summary: DashboardSummary = {
    totalBalance,
    totalIncomeThisMonth: thisMonthIncome,
    totalExpensesThisMonth: thisMonthExpenses,
    totalSavings,
    netSavingsThisMonth,
    incomeChangePercent,
    expenseChangePercent,
    recentTransactions,
    topExpenseCategories,
    budgetSummaries,
    savingsGoals: userGoals,
    smartInsights,
    upcomingLoans,
    monthlySpendingTrend,
  };

  res.json(summary);
});

// -------------------------------------------------------------
// 3. WALLETS API
// -------------------------------------------------------------

router.get('/wallets', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  let wallets = db.wallets.filter(w => w.userId === req.user!.id);
  if (wallets.length === 0) {
    const now = new Date().toISOString();
    const defaultCashWallet: Wallet = {
      id: `w-cash-${Date.now()}`,
      userId: req.user!.id,
      name: 'Cash / Main Balance (নগদ হিসাব)',
      type: 'cash',
      balance: 0,
      currency: req.user!.preferredCurrency || 'BDT',
      color: '#10B981',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    };
    db.wallets.push(defaultCashWallet);
    saveDb();
    wallets = [defaultCashWallet];
  }
  res.json(wallets);
});

router.post('/wallets', authMiddleware, (req: AuthRequest, res) => {
  const { name, type = 'cash', balance = 0, currency, color = '#0F766E', isDefault = false, accountNumber } = req.body;
  const db = getDb();
  const userWallets = db.wallets.filter(w => w.userId === req.user!.id);

  // Check free plan limits
  if (req.user!.plan === 'free' && userWallets.length >= db.systemLimits.freeMaxWallets) {
    res.status(403).json({ error: `Free starter plan is limited to ${db.systemLimits.freeMaxWallets} wallets. Please upgrade to PRO for unlimited wallets.` });
    return;
  }

  const now = new Date().toISOString();
  if (isDefault) {
    userWallets.forEach(w => { w.isDefault = false; });
  }

  const newWallet: Wallet = {
    id: `w-${Date.now()}`,
    userId: req.user!.id,
    name: name || 'New Account',
    type,
    balance: Number(balance) || 0,
    currency: currency || req.user!.preferredCurrency || 'BDT',
    color,
    isDefault: isDefault || userWallets.length === 0,
    accountNumber,
    createdAt: now,
    updatedAt: now,
  };

  db.wallets.push(newWallet);
  saveDb();
  res.status(201).json(newWallet);
});

router.put('/wallets/:id', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const wallet = db.wallets.find(w => w.id === req.params.id && w.userId === req.user!.id);
  if (!wallet) {
    res.status(404).json({ error: 'Wallet not found' });
    return;
  }

  const { name, type, balance, currency, color, isDefault, accountNumber } = req.body;

  if (isDefault) {
    db.wallets.filter(w => w.userId === req.user!.id).forEach(w => { w.isDefault = false; });
  }

  if (name !== undefined) wallet.name = name;
  if (type !== undefined) wallet.type = type;
  if (balance !== undefined) wallet.balance = Number(balance);
  if (currency !== undefined) wallet.currency = currency;
  if (color !== undefined) wallet.color = color;
  if (isDefault !== undefined) wallet.isDefault = isDefault;
  if (accountNumber !== undefined) wallet.accountNumber = accountNumber;
  wallet.updatedAt = new Date().toISOString();

  saveDb();
  res.json(wallet);
});

router.delete('/wallets/:id', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const index = db.wallets.findIndex(w => w.id === req.params.id && w.userId === req.user!.id);
  if (index === -1) {
    res.status(404).json({ error: 'Wallet not found' });
    return;
  }

  const userWallets = db.wallets.filter(w => w.userId === req.user!.id);
  if (userWallets.length <= 1) {
    res.status(400).json({ error: 'You must maintain at least one active wallet.' });
    return;
  }

  const deleted = db.wallets.splice(index, 1)[0];
  if (deleted.isDefault) {
    const remaining = db.wallets.find(w => w.userId === req.user!.id);
    if (remaining) remaining.isDefault = true;
  }

  saveDb();
  res.json({ message: 'Wallet deleted successfully' });
});

// -------------------------------------------------------------
// 4. TRANSACTIONS API (ACID Wallet Updates)
// -------------------------------------------------------------

router.get('/transactions', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  let userTx = db.transactions.filter(t => t.userId === req.user!.id);

  const { walletId, categoryId, type, search, startDate, endDate, sort = 'desc' } = req.query;

  if (walletId) userTx = userTx.filter(t => t.walletId === walletId || t.toWalletId === walletId);
  if (categoryId) userTx = userTx.filter(t => t.categoryId === categoryId);
  if (type && type !== 'all') userTx = userTx.filter(t => t.type === type);
  if (startDate) userTx = userTx.filter(t => t.date >= String(startDate));
  if (endDate) userTx = userTx.filter(t => t.date <= String(endDate));
  if (search) {
    const q = String(search).toLowerCase();
    userTx = userTx.filter(t => 
      t.description.toLowerCase().includes(q) || 
      (t.note && t.note.toLowerCase().includes(q))
    );
  }

  userTx.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sort === 'asc' ? dateA - dateB : dateB - dateA;
  });

  res.json(userTx);
});

router.post('/transactions', authMiddleware, (req: AuthRequest, res) => {
  let { walletId, toWalletId, type, amount, currency, categoryId, date, description, note, isRecurring } = req.body;
  const numAmount = Number(amount);

  if (!type || !numAmount || numAmount <= 0) {
    res.status(400).json({ error: 'Transaction type and valid positive amount are required' });
    return;
  }

  const db = getDb();
  const now = new Date().toISOString();

  // Auto-resolve or create user wallet if none exists or none provided
  let userWallets = db.wallets.filter(w => w.userId === req.user!.id);
  if (userWallets.length === 0) {
    const defaultCashWallet: Wallet = {
      id: `w-cash-${Date.now()}`,
      userId: req.user!.id,
      name: 'Cash / Main Balance (নগদ হিসাব)',
      type: 'cash',
      balance: 0,
      currency: currency || req.user!.preferredCurrency || 'BDT',
      color: '#10B981',
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    };
    db.wallets.push(defaultCashWallet);
    userWallets = [defaultCashWallet];
  }

  let sourceWallet = db.wallets.find(w => w.id === walletId && w.userId === req.user!.id);
  if (!sourceWallet) {
    sourceWallet = userWallets.find(w => w.isDefault) || userWallets[0];
    walletId = sourceWallet.id;
  }

  // Check plan limits
  if (req.user!.plan === 'free') {
    const nowDate = new Date();
    const currentMonthStr = `${nowDate.getFullYear()}-${String(nowDate.getMonth() + 1).padStart(2, '0')}`;
    const monthlyCount = db.transactions.filter(t => t.userId === req.user!.id && t.date.startsWith(currentMonthStr)).length;
    if (monthlyCount >= db.systemLimits.freeMaxTransactionsPerMonth) {
      res.status(403).json({ error: `Monthly transaction limit (${db.systemLimits.freeMaxTransactionsPerMonth}) reached on Free plan. Upgrade to PRO for unlimited transactions.` });
      return;
    }
  }

  const txId = `tx-${Date.now()}`;

  // Atomic balance modification
  if (type === 'income') {
    sourceWallet.balance += numAmount;
  } else if (type === 'expense') {
    sourceWallet.balance -= numAmount;
  } else if (type === 'transfer') {
    if (!toWalletId) {
      res.status(400).json({ error: 'Destination wallet is required for transfers' });
      return;
    }
    const destWallet = db.wallets.find(w => w.id === toWalletId && w.userId === req.user!.id);
    if (!destWallet) {
      res.status(404).json({ error: 'Destination wallet not found' });
      return;
    }
    sourceWallet.balance -= numAmount;
    destWallet.balance += numAmount;
    destWallet.updatedAt = now;
  }

  sourceWallet.updatedAt = now;

  const newTx: Transaction = {
    id: txId,
    userId: req.user!.id,
    walletId,
    toWalletId: type === 'transfer' ? toWalletId : null,
    type,
    amount: numAmount,
    currency: currency || sourceWallet.currency || 'BDT',
    categoryId: categoryId || (type === 'income' ? 'cat-oin' : 'cat-oex'),
    date: date || new Date().toISOString().split('T')[0],
    description: description || (type === 'income' ? 'Income' : type === 'expense' ? 'Expense' : 'Transfer'),
    note,
    isRecurring: Boolean(isRecurring),
    createdAt: now,
    updatedAt: now,
  };

  db.transactions.unshift(newTx);
  saveDb();
  res.status(201).json(newTx);
});

router.put('/transactions/:id', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const tx = db.transactions.find(t => t.id === req.params.id && t.userId === req.user!.id);
  if (!tx) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }

  const { walletId, toWalletId, type, amount, currency, categoryId, date, description, note, isRecurring } = req.body;
  const newAmount = Number(amount);

  // 1. Rollback previous balance effect
  const oldWallet = db.wallets.find(w => w.id === tx.walletId);
  if (oldWallet) {
    if (tx.type === 'income') oldWallet.balance -= tx.amount;
    else if (tx.type === 'expense') oldWallet.balance += tx.amount;
    else if (tx.type === 'transfer' && tx.toWalletId) {
      oldWallet.balance += tx.amount;
      const oldDest = db.wallets.find(w => w.id === tx.toWalletId);
      if (oldDest) oldDest.balance -= tx.amount;
    }
  }

  // 2. Apply new balance effect
  const targetWallet = db.wallets.find(w => w.id === (walletId || tx.walletId) && w.userId === req.user!.id);
  if (!targetWallet) {
    res.status(404).json({ error: 'Target wallet not found' });
    return;
  }

  const finalType = type || tx.type;
  const finalAmount = newAmount > 0 ? newAmount : tx.amount;
  const finalToWalletId = finalType === 'transfer' ? (toWalletId || tx.toWalletId) : null;

  if (finalType === 'income') {
    targetWallet.balance += finalAmount;
  } else if (finalType === 'expense') {
    targetWallet.balance -= finalAmount;
  } else if (finalType === 'transfer') {
    if (!finalToWalletId) {
      res.status(400).json({ error: 'Destination wallet is required for transfer' });
      return;
    }
    const dest = db.wallets.find(w => w.id === finalToWalletId && w.userId === req.user!.id);
    if (!dest) {
      res.status(404).json({ error: 'Destination wallet not found' });
      return;
    }
    targetWallet.balance -= finalAmount;
    dest.balance += finalAmount;
  }

  tx.walletId = targetWallet.id;
  tx.toWalletId = finalToWalletId;
  tx.type = finalType;
  tx.amount = finalAmount;
  if (currency) tx.currency = currency;
  if (categoryId) tx.categoryId = categoryId;
  if (date) tx.date = date;
  if (description !== undefined) tx.description = description;
  if (note !== undefined) tx.note = note;
  if (isRecurring !== undefined) tx.isRecurring = isRecurring;
  tx.updatedAt = new Date().toISOString();

  saveDb();
  res.json(tx);
});

router.delete('/transactions/:id', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const index = db.transactions.findIndex(t => t.id === req.params.id && t.userId === req.user!.id);
  if (index === -1) {
    res.status(404).json({ error: 'Transaction not found' });
    return;
  }

  const tx = db.transactions[index];

  // Revert balance
  const wallet = db.wallets.find(w => w.id === tx.walletId);
  if (wallet) {
    if (tx.type === 'income') wallet.balance -= tx.amount;
    else if (tx.type === 'expense') wallet.balance += tx.amount;
    else if (tx.type === 'transfer' && tx.toWalletId) {
      wallet.balance += tx.amount;
      const dest = db.wallets.find(w => w.id === tx.toWalletId);
      if (dest) dest.balance -= tx.amount;
    }
  }

  db.transactions.splice(index, 1);
  saveDb();
  res.json({ message: 'Transaction deleted successfully' });
});

// -------------------------------------------------------------
// 5. CATEGORIES API
// -------------------------------------------------------------

router.get('/categories', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const systemCats = db.categories.filter(c => c.isSystem);
  const userCats = db.categories.filter(c => c.userId === req.user!.id);
  res.json([...systemCats, ...userCats]);
});

router.post('/categories', authMiddleware, (req: AuthRequest, res) => {
  const { customName, type, icon = 'Tag', color = '#0F766E' } = req.body;
  if (!customName || !type) {
    res.status(400).json({ error: 'Category name and type are required' });
    return;
  }

  const db = getDb();
  const newCat = {
    id: `cat-custom-${Date.now()}`,
    userId: req.user!.id,
    nameKey: 'custom',
    customName,
    type,
    icon,
    color,
    isSystem: false,
    createdAt: new Date().toISOString(),
  };

  db.categories.push(newCat);
  saveDb();
  res.status(201).json(newCat);
});

// -------------------------------------------------------------
// 6. BUDGETS API
// -------------------------------------------------------------

router.get('/budgets', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const month = (req.query.month as string) || currentMonthStr;

  const userBudgets = db.budgets.filter(b => b.userId === req.user!.id && b.month === month);
  const userTx = db.transactions.filter(t => t.userId === req.user!.id && t.date.startsWith(month));
  const allCategories = db.categories;

  const budgetsWithProgress: BudgetProgress[] = userBudgets.map(b => {
    const spent = userTx
      .filter(t => t.type === 'expense' && (!b.categoryId || t.categoryId === b.categoryId))
      .reduce((sum, t) => sum + t.amount, 0);

    const remaining = Math.max(0, b.amount - spent);
    const percentage = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
    const status = percentage >= 100 ? 'over_budget' : percentage >= 80 ? 'warning' : 'normal';
    const cat = allCategories.find(c => c.id === b.categoryId);

    return {
      ...b,
      spent,
      remaining,
      percentage,
      status,
      categoryName: cat ? (cat.customName || cat.nameKey) : 'Overall Budget',
      categoryColor: cat?.color || '#0F766E',
    };
  });

  res.json(budgetsWithProgress);
});

router.post('/budgets', authMiddleware, (req: AuthRequest, res) => {
  const { categoryId, amount, period = 'monthly', month } = req.body;
  const numAmount = Number(amount);

  if (!numAmount || numAmount <= 0) {
    res.status(400).json({ error: 'Valid budget amount is required' });
    return;
  }

  const db = getDb();
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const budgetMonth = month || currentMonthStr;

  // Check if budget for this category and month exists
  const existing = db.budgets.find(b => b.userId === req.user!.id && b.categoryId === (categoryId || null) && b.month === budgetMonth);
  if (existing) {
    existing.amount = numAmount;
    existing.updatedAt = new Date().toISOString();
    saveDb();
    res.json(existing);
    return;
  }

  const newBudget: Budget = {
    id: `b-${Date.now()}`,
    userId: req.user!.id,
    categoryId: categoryId || null,
    amount: numAmount,
    period,
    month: budgetMonth,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.budgets.push(newBudget);
  saveDb();
  res.status(201).json(newBudget);
});

router.delete('/budgets/:id', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const index = db.budgets.findIndex(b => b.id === req.params.id && b.userId === req.user!.id);
  if (index === -1) {
    res.status(404).json({ error: 'Budget not found' });
    return;
  }

  db.budgets.splice(index, 1);
  saveDb();
  res.json({ message: 'Budget deleted successfully' });
});

// -------------------------------------------------------------
// 7. SAVINGS GOALS API
// -------------------------------------------------------------

router.get('/savings-goals', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const goals = db.savingsGoals.filter(g => g.userId === req.user!.id);
  res.json(goals);
});

router.post('/savings-goals', authMiddleware, (req: AuthRequest, res) => {
  const { name, targetAmount, currentAmount = 0, targetDate, description, color = '#0F766E', icon = 'Target' } = req.body;
  const numTarget = Number(targetAmount);

  if (!name || !numTarget || numTarget <= 0) {
    res.status(400).json({ error: 'Goal name and positive target amount are required' });
    return;
  }

  const db = getDb();
  const userGoals = db.savingsGoals.filter(g => g.userId === req.user!.id);

  if (req.user!.plan === 'free' && userGoals.length >= db.systemLimits.freeMaxSavingsGoals) {
    res.status(403).json({ error: `Free plan is limited to ${db.systemLimits.freeMaxSavingsGoals} goals. Upgrade to PRO for unlimited goals.` });
    return;
  }

  const now = new Date().toISOString();
  const newGoal: SavingsGoal = {
    id: `sg-${Date.now()}`,
    userId: req.user!.id,
    name,
    targetAmount: numTarget,
    currentAmount: Number(currentAmount) || 0,
    targetDate: targetDate || '2026-12-31',
    description,
    color,
    icon,
    status: Number(currentAmount) >= numTarget ? 'completed' : 'in_progress',
    createdAt: now,
    updatedAt: now,
  };

  db.savingsGoals.push(newGoal);
  saveDb();
  res.status(201).json(newGoal);
});

router.post('/savings-goals/:id/contribute', authMiddleware, (req: AuthRequest, res) => {
  const { amount, walletId, note } = req.body;
  const numAmount = Number(amount);

  if (!numAmount || numAmount <= 0 || !walletId) {
    res.status(400).json({ error: 'Valid contribution amount and source wallet are required' });
    return;
  }

  const db = getDb();
  const goal = db.savingsGoals.find(g => g.id === req.params.id && g.userId === req.user!.id);
  if (!goal) {
    res.status(404).json({ error: 'Savings goal not found' });
    return;
  }

  const wallet = db.wallets.find(w => w.id === walletId && w.userId === req.user!.id);
  if (!wallet) {
    res.status(404).json({ error: 'Source wallet not found' });
    return;
  }

  const now = new Date().toISOString();

  // Deduct from wallet and add to goal
  wallet.balance -= numAmount;
  wallet.updatedAt = now;

  goal.currentAmount += numAmount;
  if (goal.currentAmount >= goal.targetAmount) {
    goal.status = 'completed';
    // Send congratulations notification
    db.notifications.push({
      id: `notif-${Date.now()}`,
      userId: req.user!.id,
      type: 'savings_reminder',
      titleKey: 'goal_completed',
      messageKey: `Congratulations! You have reached your goal '${goal.name}'!`,
      isRead: false,
      createdAt: now,
    });
  }
  goal.updatedAt = now;

  // Record contribution log
  db.goalContributions.push({
    id: `gc-${Date.now()}`,
    goalId: goal.id,
    userId: req.user!.id,
    amount: numAmount,
    walletId,
    note,
    date: now.split('T')[0],
    createdAt: now,
  });

  // Record savings expense transaction
  db.transactions.unshift({
    id: `tx-goal-${Date.now()}`,
    userId: req.user!.id,
    walletId,
    type: 'expense',
    amount: numAmount,
    currency: wallet.currency,
    categoryId: 'cat-oin',
    date: now.split('T')[0],
    description: `Savings Contribution: ${goal.name}`,
    note,
    createdAt: now,
    updatedAt: now,
  });

  saveDb();
  res.json({ goal, wallet });
});

router.delete('/savings-goals/:id', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const index = db.savingsGoals.findIndex(g => g.id === req.params.id && g.userId === req.user!.id);
  if (index === -1) {
    res.status(404).json({ error: 'Goal not found' });
    return;
  }

  db.savingsGoals.splice(index, 1);
  saveDb();
  res.json({ message: 'Savings goal deleted' });
});

// -------------------------------------------------------------
// 8. LOANS & DEBTS API
// -------------------------------------------------------------

router.get('/loans', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const loans = db.loans.filter(l => l.userId === req.user!.id);
  res.json(loans);
});

router.post('/loans', authMiddleware, (req: AuthRequest, res) => {
  const { type, personName, personContact, amount, dueDate, description } = req.body;
  const numAmount = Number(amount);

  if (!type || !personName || !numAmount || numAmount <= 0) {
    res.status(400).json({ error: 'Type (owe_me/i_owe), person name, and positive amount are required' });
    return;
  }

  const db = getDb();
  const now = new Date().toISOString();

  const newLoan: Loan = {
    id: `loan-${Date.now()}`,
    userId: req.user!.id,
    type,
    personName,
    personContact,
    amount: numAmount,
    paidAmount: 0,
    dueDate: dueDate || '2026-12-31',
    description,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };

  db.loans.push(newLoan);
  saveDb();
  res.status(201).json(newLoan);
});

router.post('/loans/:id/payments', authMiddleware, (req: AuthRequest, res) => {
  const { amount, walletId, note } = req.body;
  const numAmount = Number(amount);

  if (!numAmount || numAmount <= 0 || !walletId) {
    res.status(400).json({ error: 'Payment amount and wallet are required' });
    return;
  }

  const db = getDb();
  const loan = db.loans.find(l => l.id === req.params.id && l.userId === req.user!.id);
  if (!loan) {
    res.status(404).json({ error: 'Loan record not found' });
    return;
  }

  const wallet = db.wallets.find(w => w.id === walletId && w.userId === req.user!.id);
  if (!wallet) {
    res.status(404).json({ error: 'Wallet not found' });
    return;
  }

  const now = new Date().toISOString();

  // If "i_owe" (I am paying back loan) -> debit wallet
  // If "owe_me" (Friend is paying me back) -> credit wallet
  if (loan.type === 'i_owe') {
    wallet.balance -= numAmount;
    db.transactions.unshift({
      id: `tx-loan-${Date.now()}`,
      userId: req.user!.id,
      walletId,
      type: 'expense',
      amount: numAmount,
      currency: wallet.currency,
      categoryId: 'cat-bil',
      date: now.split('T')[0],
      description: `Loan Repayment to: ${loan.personName}`,
      note,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    wallet.balance += numAmount;
    db.transactions.unshift({
      id: `tx-loan-${Date.now()}`,
      userId: req.user!.id,
      walletId,
      type: 'income',
      amount: numAmount,
      currency: wallet.currency,
      categoryId: 'cat-oin',
      date: now.split('T')[0],
      description: `Loan Collection from: ${loan.personName}`,
      note,
      createdAt: now,
      updatedAt: now,
    });
  }

  wallet.updatedAt = now;

  loan.paidAmount += numAmount;
  if (loan.paidAmount >= loan.amount) {
    loan.status = 'paid';
  } else if (loan.paidAmount > 0) {
    loan.status = 'partially_paid';
  }
  loan.updatedAt = now;

  db.loanPayments.push({
    id: `lp-${Date.now()}`,
    loanId: loan.id,
    userId: req.user!.id,
    amount: numAmount,
    walletId,
    paymentDate: now.split('T')[0],
    note,
    createdAt: now,
  });

  saveDb();
  res.json({ loan, wallet });
});

router.delete('/loans/:id', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const index = db.loans.findIndex(l => l.id === req.params.id && l.userId === req.user!.id);
  if (index === -1) {
    res.status(404).json({ error: 'Loan not found' });
    return;
  }

  db.loans.splice(index, 1);
  saveDb();
  res.json({ message: 'Loan deleted' });
});

// -------------------------------------------------------------
// 9. SMART AI ADVISOR (Gemini API Integration)
// -------------------------------------------------------------

router.post('/ai/advisor', authMiddleware, async (req: AuthRequest, res) => {
  const { question } = req.body;
  const db = getDb();
  const userId = req.user!.id;

  const userTransactions = db.transactions.filter(t => t.userId === userId);
  const userWallets = db.wallets.filter(w => w.userId === userId);
  const userBudgets = db.budgets.filter(b => b.userId === userId);
  const userGoals = db.savingsGoals.filter(g => g.userId === userId);

  const totalBalance = userWallets.reduce((s, w) => s + w.balance, 0);
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  const thisMonthIncome = userTransactions
    .filter(t => t.type === 'income' && t.date.startsWith(currentMonthStr))
    .reduce((s, t) => s + t.amount, 0);

  const thisMonthExpenses = userTransactions
    .filter(t => t.type === 'expense' && t.date.startsWith(currentMonthStr))
    .reduce((s, t) => s + t.amount, 0);

  const preferredCurrency = req.user!.preferredCurrency || 'BDT';

  // Build financial context summary
  const summaryPrompt = `
You are Hishab Khata's Senior Financial Advisor and Wealth Coach.
Analyze the user's real financial portfolio in their preferred language (${req.user!.preferredLanguage}) and currency (${preferredCurrency}):
- Total Current Balance: ${preferredCurrency} ${totalBalance}
- This Month's Total Income: ${preferredCurrency} ${thisMonthIncome}
- This Month's Total Expenses: ${preferredCurrency} ${thisMonthExpenses}
- Active Wallets: ${userWallets.map(w => `${w.name} (${preferredCurrency} ${w.balance})`).join(', ')}
- Savings Goals: ${userGoals.map(g => `${g.name} (${preferredCurrency} ${g.currentAmount} / ${preferredCurrency} ${g.targetAmount})`).join(', ')}
- Budgets: ${userBudgets.map(b => `Category Limit ${preferredCurrency} ${b.amount}`).join(', ')}

User's Question: "${question || 'Please analyze my financial health and give me 3 actionable steps to save more money this month.'}"

Provide an empowering, highly practical, fintech-grade response with bullet points and concrete math.
`;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: summaryPrompt,
      });

      res.json({
        advice: response.text,
        metrics: { totalBalance, thisMonthIncome, thisMonthExpenses },
      });
      return;
    }
  } catch (err) {
    console.warn('Gemini API call failed, falling back to heuristic engine:', err);
  }

  // Heuristic rule-based fallback advice
  const savingsRate = thisMonthIncome > 0 ? Math.round(((thisMonthIncome - thisMonthExpenses) / thisMonthIncome) * 100) : 0;
  const fallbackAdvice = `
### 📊 Financial Health Overview
- **Savings Rate**: ${savingsRate}% of monthly income.
- **Current Net Cashflow**: ${preferredCurrency} ${thisMonthIncome - thisMonthExpenses}.

### 💡 3 Smart Recommendations for You:
1. **Optimize High-Velocity Categories**: Allocate at least 15% of your income directly into your primary savings goal right on salary day.
2. **Buffer Strategy**: Maintain at least 3 months of essential expenses in your '${userWallets[0]?.name || 'Bank Wallet'}' as an emergency fund.
3. **Budget Guardrail**: Check category limits regularly. Setting daily spending caps will prevent end-of-month budget shocks.
  `;

  res.json({
    advice: fallbackAdvice,
    metrics: { totalBalance, thisMonthIncome, thisMonthExpenses },
  });
});

// -------------------------------------------------------------
// 10. NOTIFICATIONS API (Strict User Isolation & Read/Delete Handlers)
// -------------------------------------------------------------

router.get('/notifications', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const userId = req.user!.id;
  
  // Strictly filter notifications: Only the authenticated user's notifications or active global broadcasts
  const notifs = db.notifications.filter(n => {
    const isOwner = n.userId === userId;
    const isGlobal = n.userId === null;
    if (!isOwner && !isGlobal) return false;
    // Exclude if dismissed/deleted by this user
    if (n.deletedBy && n.deletedBy.includes(userId)) return false;
    return true;
  });
  
  const formatted = notifs.map(n => {
    const isGlobal = n.userId === null;
    const isRead = isGlobal ? Boolean(n.readBy && n.readBy.includes(userId)) : Boolean(n.isRead);
    return {
      ...n,
      isRead,
    };
  });

  res.json(formatted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

router.get('/notifications/poll', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const userId = req.user!.id;
  const since = req.query.since as string | undefined;

  const userNotifs = db.notifications.filter(n => {
    const isOwner = n.userId === userId;
    const isGlobal = n.userId === null;
    if (!isOwner && !isGlobal) return false;
    if (n.deletedBy && n.deletedBy.includes(userId)) return false;
    
    if (since) {
      return new Date(n.createdAt).getTime() > new Date(since).getTime();
    }
    return true;
  });

  const formatted = userNotifs.map(n => {
    const isGlobal = n.userId === null;
    const isRead = isGlobal ? Boolean(n.readBy && n.readBy.includes(userId)) : Boolean(n.isRead);
    return {
      ...n,
      isRead,
    };
  });

  const unreadCount = formatted.filter(n => !n.isRead).length;

  res.json({
    notifications: formatted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    unreadCount,
    serverTime: new Date().toISOString(),
  });
});

router.put('/notifications/:id/read', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const userId = req.user!.id;
  const notif = db.notifications.find(n => n.id === req.params.id);
  if (notif) {
    if (notif.userId === null) {
      if (!notif.readBy) notif.readBy = [];
      if (!notif.readBy.includes(userId)) {
        notif.readBy.push(userId);
      }
    } else if (notif.userId === userId) {
      notif.isRead = true;
    }
    saveDb();
  }
  res.json({ success: true });
});

router.put('/notifications/read-all', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const userId = req.user!.id;
  db.notifications.forEach(n => {
    if (n.userId === null) {
      if (!n.readBy) n.readBy = [];
      if (!n.readBy.includes(userId)) {
        n.readBy.push(userId);
      }
    } else if (n.userId === userId) {
      n.isRead = true;
    }
  });
  saveDb();
  res.json({ success: true });
});

router.delete('/notifications/:id', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const userId = req.user!.id;
  const notifIndex = db.notifications.findIndex(n => n.id === req.params.id);
  
  if (notifIndex !== -1) {
    const notif = db.notifications[notifIndex];
    if (notif.userId === userId) {
      // User's own notification: remove completely
      db.notifications.splice(notifIndex, 1);
    } else if (notif.userId === null) {
      // Global notification: mark as deleted for this specific user
      if (!notif.deletedBy) notif.deletedBy = [];
      if (!notif.deletedBy.includes(userId)) {
        notif.deletedBy.push(userId);
      }
    }
    saveDb();
  }
  res.json({ success: true });
});

router.delete('/notifications/clear-all', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const userId = req.user!.id;
  
  // Remove user-specific notifications and mark global ones as deleted for this user
  db.notifications = db.notifications.filter(n => {
    if (n.userId === userId) {
      return false; // delete
    }
    if (n.userId === null) {
      if (!n.deletedBy) n.deletedBy = [];
      if (!n.deletedBy.includes(userId)) {
        n.deletedBy.push(userId);
      }
      return true;
    }
    return true;
  });

  saveDb();
  res.json({ success: true });
});

// -------------------------------------------------------------
// 11. LANGUAGES & TRANSLATIONS API
// -------------------------------------------------------------

router.get('/languages', (req, res) => {
  const db = getDb();
  res.json(db.languages.filter(l => l.isEnabled));
});

router.get('/translations/:lang', (req, res) => {
  const db = getDb();
  const lang = req.params.lang;
  const dictionary = db.translations[lang] || db.translations['en'] || {};
  res.json(dictionary);
});

// -------------------------------------------------------------
// 12. ADMIN APIS (Full Management Suite)
// -------------------------------------------------------------

router.get('/admin/stats', adminOnly, (req: AuthRequest, res) => {
  const db = getDb();
  const totalUsers = db.users.length;
  const activeUsers = db.users.filter(u => u.status === 'active').length;
  const freeUsers = db.users.filter(u => u.plan === 'free').length;
  const proUsers = db.users.filter(u => u.plan === 'pro').length;
  const totalTransactions = db.transactions.length;
  const totalWallets = db.wallets.length;

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const newUsersThisMonth = db.users.filter(u => u.createdAt.startsWith(currentMonthStr)).length;

  const revenueMRR = proUsers * db.systemLimits.proMonthlyPriceUSD;
  const totalVolumeUSD = db.transactions.reduce((sum, t) => sum + (t.amount * 0.0084), 0);

  res.json({
    totalUsers,
    activeUsers,
    newUsersThisMonth,
    freeUsers,
    proUsers,
    totalTransactions,
    totalWallets,
    revenueMRR,
    totalVolumeUSD: Math.round(totalVolumeUSD),
  });
});

router.get('/admin/users', adminOnly, (req: AuthRequest, res) => {
  const db = getDb();
  res.json(db.users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    plan: u.plan,
    status: u.status,
    preferredLanguage: u.preferredLanguage,
    preferredCurrency: u.preferredCurrency,
    createdAt: u.createdAt,
    transactionCount: db.transactions.filter(t => t.userId === u.id).length,
    walletCount: db.wallets.filter(w => w.userId === u.id).length,
  })));
});

router.put('/admin/users/:id/status', adminOnly, (req: AuthRequest, res) => {
  const { status } = req.body;
  const db = getDb();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  user.status = status;
  user.updatedAt = new Date().toISOString();
  logAdmin(req, 'USER_STATUS_CHANGE', 'USER', user.id, `Changed user ${user.email} status to ${status}`);
  saveDb();
  res.json(user);
});

router.put('/admin/users/:id/plan', adminOnly, (req: AuthRequest, res) => {
  const { plan } = req.body;
  const db = getDb();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  user.plan = plan;
  user.updatedAt = new Date().toISOString();
  logAdmin(req, 'USER_PLAN_CHANGE', 'USER', user.id, `Changed user ${user.email} plan to ${plan}`);
  saveDb();
  res.json(user);
});

router.put('/admin/users/:id/role', adminOnly, (req: AuthRequest, res) => {
  const { role } = req.body;
  if (role !== 'admin' && role !== 'user') {
    res.status(400).json({ error: 'Role must be admin or user' });
    return;
  }
  const db = getDb();
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  user.role = role;
  user.updatedAt = new Date().toISOString();
  logAdmin(req, 'USER_ROLE_CHANGE', 'USER', user.id, `Changed user ${user.email} role to ${role}`);
  saveDb();
  res.json(user);
});

// -------------------------------------------------------------
// USER PRESENCE & LIVE ACTIVITY HEARTBEAT
// -------------------------------------------------------------

router.post('/presence/heartbeat', authMiddleware, (req: AuthRequest, res) => {
  const { currentView = 'dashboard', deviceType = 'desktop', browser = 'Browser', lastAction } = req.body;
  const db = getDb();
  const user = req.user!;
  const now = new Date().toISOString();

  if (!db.userPresences) {
    db.userPresences = {};
  }

  const previous = db.userPresences[user.id];
  const viewChanged = !previous || previous.currentView !== currentView;

  db.userPresences[user.id] = {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    avatarUrl: user.avatarUrl,
    plan: user.plan,
    role: user.role,
    isOnline: true,
    currentView: String(currentView),
    lastActiveAt: now,
    deviceType: deviceType || 'desktop',
    browser: String(browser),
    lastAction: lastAction ? String(lastAction) : `Active in ${currentView}`,
  };

  // If view changed, append to liveActivities feed
  if (viewChanged) {
    logUserActivity(
      user,
      'NAVIGATE',
      'NAVIGATION',
      `Switched view to ${currentView.toUpperCase()}`,
      { currentView, deviceType }
    );
  }

  saveDb();
  res.json({ success: true, serverTime: now });
});

router.get('/admin/presences', adminOnly, (req: AuthRequest, res) => {
  const db = getDb();
  if (!db.userPresences) {
    db.userPresences = {};
  }

  const nowMs = Date.now();
  const presenceList = Object.values(db.userPresences).map(p => {
    const lastActiveMs = new Date(p.lastActiveAt).getTime();
    // User is considered online if active within last 45 seconds
    const isActuallyOnline = (nowMs - lastActiveMs) < 45000;
    return {
      ...p,
      isOnline: isActuallyOnline,
    };
  });

  // Sort: online first, then by last active timestamp
  presenceList.sort((a, b) => {
    if (a.isOnline === b.isOnline) {
      return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
    }
    return a.isOnline ? -1 : 1;
  });

  res.json(presenceList);
});

// -------------------------------------------------------------
// SUBSCRIPTION PAYMENT & MOBILE/BANKING TRANSACTIONS
// -------------------------------------------------------------

router.get('/subscriptions/config', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  res.json(db.adminPaymentConfig);
});

router.put('/admin/payment-config', adminOnly, (req: AuthRequest, res) => {
  const db = getDb();
  const body = req.body || {};
  
  db.adminPaymentConfig = {
    ...db.adminPaymentConfig,
    bkashNumber: body.bkashNumber !== undefined ? String(body.bkashNumber) : db.adminPaymentConfig.bkashNumber,
    bkashType: body.bkashType === 'merchant' ? 'merchant' : 'personal',
    nagadNumber: body.nagadNumber !== undefined ? String(body.nagadNumber) : db.adminPaymentConfig.nagadNumber,
    nagadType: body.nagadType === 'merchant' ? 'merchant' : 'personal',
    rocketNumber: body.rocketNumber !== undefined ? String(body.rocketNumber) : db.adminPaymentConfig.rocketNumber,
    bankName: body.bankName !== undefined ? String(body.bankName) : db.adminPaymentConfig.bankName,
    bankAccountName: body.bankAccountName !== undefined ? String(body.bankAccountName) : db.adminPaymentConfig.bankAccountName,
    bankAccountNumber: body.bankAccountNumber !== undefined ? String(body.bankAccountNumber) : db.adminPaymentConfig.bankAccountNumber,
    bankBranch: body.bankBranch !== undefined ? String(body.bankBranch) : db.adminPaymentConfig.bankBranch,
    bankRoutingNumber: body.bankRoutingNumber !== undefined ? String(body.bankRoutingNumber) : db.adminPaymentConfig.bankRoutingNumber,
    proMonthlyPriceBDT: Number(body.proMonthlyPriceBDT) > 0 ? Number(body.proMonthlyPriceBDT) : db.adminPaymentConfig.proMonthlyPriceBDT,
    proYearlyPriceBDT: Number(body.proYearlyPriceBDT) > 0 ? Number(body.proYearlyPriceBDT) : db.adminPaymentConfig.proYearlyPriceBDT,
    proLifetimePriceBDT: Number(body.proLifetimePriceBDT) > 0 ? Number(body.proLifetimePriceBDT) : (db.adminPaymentConfig.proLifetimePriceBDT || 9999),
    proMonthlyPriceUSD: Number(body.proMonthlyPriceUSD) > 0 ? Number(body.proMonthlyPriceUSD) : db.adminPaymentConfig.proMonthlyPriceUSD,
    proYearlyPriceUSD: Number(body.proYearlyPriceUSD) > 0 ? Number(body.proYearlyPriceUSD) : db.adminPaymentConfig.proYearlyPriceUSD,
    proLifetimePriceUSD: Number(body.proLifetimePriceUSD) > 0 ? Number(body.proLifetimePriceUSD) : (db.adminPaymentConfig.proLifetimePriceUSD || 99.99),
    yearlyDiscountPercent: Number(body.yearlyDiscountPercent) >= 0 ? Number(body.yearlyDiscountPercent) : (db.adminPaymentConfig.yearlyDiscountPercent ?? 20),
    instructionsBn: body.instructionsBn !== undefined ? String(body.instructionsBn) : db.adminPaymentConfig.instructionsBn,
    instructionsEn: body.instructionsEn !== undefined ? String(body.instructionsEn) : db.adminPaymentConfig.instructionsEn,
  };
  
  logAdmin(req, 'UPDATE_PAYMENT_CONFIG', 'PAYMENT', 'ADMIN_CONFIG', `Updated subscription pricing and payment details: Monthly ${db.adminPaymentConfig.proMonthlyPriceBDT} BDT / $${db.adminPaymentConfig.proMonthlyPriceUSD}, Yearly ${db.adminPaymentConfig.proYearlyPriceBDT} BDT / $${db.adminPaymentConfig.proYearlyPriceUSD}`);
  saveDb();
  res.json(db.adminPaymentConfig);
});

router.post('/subscriptions/submit-payment', authMiddleware, (req: AuthRequest, res) => {
  const {
    billingCycle = 'yearly',
    paymentMethod = 'bkash',
    senderNumberOrAccount,
    transactionId,
    amount,
    currency = 'BDT',
    notes,
  } = req.body;

  if (!senderNumberOrAccount || !transactionId) {
    res.status(400).json({ error: 'Sender mobile/account number and Transaction ID (TrxID) are required' });
    return;
  }

  const db = getDb();
  const user = req.user!;
  const now = new Date().toISOString();

  let targetAmount = Number(amount);
  if (!targetAmount || targetAmount <= 0) {
    if (currency === 'USD') {
      if (billingCycle === 'monthly') targetAmount = db.adminPaymentConfig.proMonthlyPriceUSD;
      else if (billingCycle === 'lifetime') targetAmount = db.adminPaymentConfig.proLifetimePriceUSD || 99.99;
      else targetAmount = db.adminPaymentConfig.proYearlyPriceUSD;
    } else {
      if (billingCycle === 'monthly') targetAmount = db.adminPaymentConfig.proMonthlyPriceBDT;
      else if (billingCycle === 'lifetime') targetAmount = db.adminPaymentConfig.proLifetimePriceBDT || 9999;
      else targetAmount = db.adminPaymentConfig.proYearlyPriceBDT;
    }
  }

  const newPayment: SubscriptionPayment = {
    id: `pay-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    plan: 'pro',
    billingCycle: billingCycle || 'yearly',
    amount: targetAmount,
    currency: currency || 'BDT',
    paymentMethod: paymentMethod || 'bkash',
    senderNumberOrAccount: String(senderNumberOrAccount).trim(),
    transactionId: String(transactionId).trim(),
    notes: notes ? String(notes).trim() : undefined,
    status: 'pending',
    createdAt: now,
  };

  if (!db.subscriptionPayments) db.subscriptionPayments = [];
  db.subscriptionPayments.unshift(newPayment);

  // 1. Send in-app confirmation notification to user
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: user.id,
    type: 'system',
    titleKey: 'Subscription Payment Submitted',
    messageKey: `We received your payment request (${newPayment.amount} ${newPayment.currency} via ${newPayment.paymentMethod.toUpperCase()}, TrxID: ${newPayment.transactionId}). Admin will verify and activate your PRO subscription shortly.`,
    isRead: false,
    createdAt: now,
  });

  // 2. Alert all Admins via In-App High Priority Notification
  const adminUsers = db.users.filter(u => u.role === 'admin');
  adminUsers.forEach(adm => {
    db.notifications.unshift({
      id: `notif-adm-${Date.now()}-${adm.id}`,
      userId: adm.id,
      type: 'system',
      titleKey: '🔔 New PRO Upgrade Payment Submitted',
      messageKey: `${user.name} (${user.email}) submitted ${newPayment.amount} ${newPayment.currency} via ${newPayment.paymentMethod.toUpperCase()} (TrxID: ${newPayment.transactionId}). Please verify and approve.`,
      isRead: false,
      createdAt: now,
    });
  });

  // 3. Dispatch Email Alert to Admin(s) and store in emailLogs
  const adminEmails = adminUsers.map(a => a.email);
  const emailLogsGenerated = sendAdminSubscriptionNotification(adminEmails, {
    userName: user.name,
    userEmail: user.email,
    plan: 'PRO',
    billingCycle: newPayment.billingCycle,
    amount: newPayment.amount,
    currency: newPayment.currency,
    paymentMethod: newPayment.paymentMethod,
    senderNumberOrAccount: newPayment.senderNumberOrAccount,
    transactionId: newPayment.transactionId,
    notes: newPayment.notes,
  });

  if (!db.emailLogs) db.emailLogs = [];
  db.emailLogs.unshift(...emailLogsGenerated);

  // 4. Log User Live Activity
  logUserActivity(
    user,
    'SUBMIT_SUBSCRIPTION',
    'SUBSCRIPTION',
    `Applied for PRO (${newPayment.billingCycle}) via ${newPayment.paymentMethod.toUpperCase()} (${newPayment.amount} ${newPayment.currency}), TrxID: ${newPayment.transactionId}`,
    { currentView: 'upgrade' }
  );

  saveDb();
  res.status(201).json({ success: true, payment: newPayment });
});

router.get('/subscriptions/my-payments', authMiddleware, (req: AuthRequest, res) => {
  const db = getDb();
  const userPayments = (db.subscriptionPayments || []).filter(p => p.userId === req.user!.id);
  res.json(userPayments);
});

router.get('/admin/subscription-payments', adminOnly, (req: AuthRequest, res) => {
  const db = getDb();
  res.json(db.subscriptionPayments || []);
});

router.put('/admin/subscription-payments/:id/approve', adminOnly, (req: AuthRequest, res) => {
  const db = getDb();
  const payment = (db.subscriptionPayments || []).find(p => p.id === req.params.id);
  if (!payment) {
    res.status(404).json({ error: 'Subscription payment record not found' });
    return;
  }

  const now = new Date().toISOString();
  payment.status = 'approved';
  payment.reviewedAt = now;
  payment.reviewedBy = req.user!.email;

  // Elevate user to PRO plan
  const user = db.users.find(u => u.id === payment.userId);
  if (user) {
    user.plan = 'pro';
    user.updatedAt = now;

    // Send congratulatory in-app notification to user
    db.notifications.unshift({
      id: `notif-${Date.now()}`,
      userId: user.id,
      type: 'system',
      titleKey: '🎉 PRO Subscription Activated!',
      messageKey: `Your ${payment.paymentMethod.toUpperCase()} payment of ${payment.amount} ${payment.currency} (TrxID: ${payment.transactionId}) has been verified and approved by Admin. Enjoy unlimited wallets, full Gemini 3.7 AI intelligence, and premium exports!`,
      isRead: false,
      createdAt: now,
    });

    // Dispatch Official Approval Receipt Email
    const approvalEmail = sendUserApprovalNotification(user, {
      amount: payment.amount,
      currency: payment.currency,
      billingCycle: payment.billingCycle,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
    });

    if (!db.emailLogs) db.emailLogs = [];
    db.emailLogs.unshift(approvalEmail);

    // Log live activity
    logUserActivity(
      user,
      'SUBSCRIPTION_UPGRADED',
      'SUBSCRIPTION',
      `PRO Subscription verified & activated by Admin (${payment.amount} ${payment.currency})`
    );
  }

  logAdmin(req, 'APPROVE_SUBSCRIPTION_PAYMENT', 'PAYMENT', payment.id, `Approved PRO payment for ${payment.userEmail} (${payment.amount} ${payment.currency})`);
  saveDb();
  res.json({ success: true, payment, user });
});

router.put('/admin/subscription-payments/:id/reject', adminOnly, (req: AuthRequest, res) => {
  const { adminNotes } = req.body;
  const db = getDb();
  const payment = (db.subscriptionPayments || []).find(p => p.id === req.params.id);
  if (!payment) {
    res.status(404).json({ error: 'Subscription payment record not found' });
    return;
  }

  const now = new Date().toISOString();
  payment.status = 'rejected';
  payment.adminNotes = adminNotes ? String(adminNotes).trim() : 'Transaction could not be verified.';
  payment.reviewedAt = now;
  payment.reviewedBy = req.user!.email;

  const targetUser = db.users.find(u => u.id === payment.userId);

  // Send rejection in-app notification
  db.notifications.unshift({
    id: `notif-${Date.now()}`,
    userId: payment.userId,
    type: 'system',
    titleKey: '⚠️ Payment Verification Issue',
    messageKey: `Your subscription payment (TrxID: ${payment.transactionId}) could not be verified. Note from Admin: ${payment.adminNotes}. Please check your TrxID and re-submit or contact support.`,
    isRead: false,
    createdAt: now,
  });

  if (targetUser) {
    // Dispatch Rejection Email
    const rejectionEmail = sendUserRejectionNotification(targetUser, {
      amount: payment.amount,
      currency: payment.currency,
      paymentMethod: payment.paymentMethod,
      transactionId: payment.transactionId,
      adminNotes: payment.adminNotes,
    });
    if (!db.emailLogs) db.emailLogs = [];
    db.emailLogs.unshift(rejectionEmail);
  }

  logAdmin(req, 'REJECT_SUBSCRIPTION_PAYMENT', 'PAYMENT', payment.id, `Rejected payment for ${payment.userEmail}: ${payment.adminNotes}`);
  saveDb();
  res.json({ success: true, payment });
});

router.get('/admin/live-activities', adminOnly, (req: AuthRequest, res) => {
  const db = getDb();
  res.json((db.liveActivities || []).slice(0, 100));
});

router.get('/admin/email-logs', adminOnly, (req: AuthRequest, res) => {
  const db = getDb();
  res.json((db.emailLogs || []).slice(0, 100));
});

// -------------------------------------------------------------
// DIRECT USER NOTIFICATION / MESSAGING API
// -------------------------------------------------------------

router.post('/admin/notify-user', adminOnly, (req: AuthRequest, res) => {
  const { targetUserId, title, message, type = 'announcement' } = req.body;
  if (!title || !message) {
    res.status(400).json({ error: 'Notification title and message are required' });
    return;
  }

  const db = getDb();
  const now = new Date().toISOString();

  const isBroadcast = !targetUserId || targetUserId === 'all';
  const targetUser = !isBroadcast ? db.users.find(u => u.id === targetUserId) : null;

  if (!isBroadcast && !targetUser) {
    res.status(404).json({ error: 'Target user not found' });
    return;
  }

  const notif: AppNotification = {
    id: `notif-${Date.now()}`,
    userId: isBroadcast ? null : targetUserId,
    type: (type as any) || 'announcement',
    titleKey: String(title).trim(),
    messageKey: String(message).trim(),
    isRead: false,
    readBy: [],
    createdAt: now,
  };

  db.notifications.unshift(notif);
  logAdmin(
    req,
    'SEND_NOTIFICATION',
    'NOTIFICATION',
    notif.id,
    isBroadcast ? `Broadcasted: ${title}` : `Direct message to ${targetUser?.email}: ${title}`
  );
  saveDb();
  res.status(201).json({ success: true, notification: notif });
});

router.get('/admin/languages', adminOnly, (req: AuthRequest, res) => {
  const db = getDb();
  res.json(db.languages);
});

router.post('/admin/languages', adminOnly, (req: AuthRequest, res) => {
  const { code, name, nativeName, isRtl, isEnabled = true } = req.body;
  if (!code || !name) {
    res.status(400).json({ error: 'Language code and name are required' });
    return;
  }

  const db = getDb();
  const existing = db.languages.find(l => l.code === code);
  if (existing) {
    res.status(400).json({ error: 'Language with this code already exists' });
    return;
  }

  const newLang = {
    code,
    name,
    nativeName: nativeName || name,
    isRtl: Boolean(isRtl),
    isEnabled: Boolean(isEnabled),
    isDefault: false,
    completionPercent: 50,
  };

  db.languages.push(newLang);
  if (!db.translations[code]) {
    db.translations[code] = { ...db.translations['en'] };
  }

  logAdmin(req, 'ADD_LANGUAGE', 'LANGUAGE', code, `Added language ${name} (${code})`);
  saveDb();
  res.status(201).json(newLang);
});

router.put('/admin/languages/:code', adminOnly, (req: AuthRequest, res) => {
  const { isEnabled, isDefault, isRtl, name, nativeName } = req.body;
  const db = getDb();
  const lang = db.languages.find(l => l.code === req.params.code);
  if (!lang) {
    res.status(404).json({ error: 'Language not found' });
    return;
  }

  if (isDefault) {
    db.languages.forEach(l => { l.isDefault = false; });
    lang.isDefault = true;
  }

  if (isEnabled !== undefined) lang.isEnabled = Boolean(isEnabled);
  if (isRtl !== undefined) lang.isRtl = Boolean(isRtl);
  if (name !== undefined) lang.name = name;
  if (nativeName !== undefined) lang.nativeName = nativeName;

  logAdmin(req, 'UPDATE_LANGUAGE', 'LANGUAGE', lang.code, `Updated language settings for ${lang.code}`);
  saveDb();
  res.json(lang);
});

router.put('/admin/translations/:code', adminOnly, (req: AuthRequest, res) => {
  const { key, value } = req.body;
  if (!key || value === undefined) {
    res.status(400).json({ error: 'Key and value are required' });
    return;
  }

  const db = getDb();
  const code = req.params.code;
  if (!db.translations[code]) {
    db.translations[code] = {};
  }

  db.translations[code][key] = value;
  logAdmin(req, 'UPDATE_TRANSLATION_KEY', 'TRANSLATION', `${code}:${key}`, `Updated translation key`);
  saveDb();
  res.json({ code, key, value });
});

router.post('/admin/announcements', adminOnly, (req: AuthRequest, res) => {
  const { title, message, type = 'announcement' } = req.body;
  if (!title || !message) {
    res.status(400).json({ error: 'Title and message are required' });
    return;
  }

  const db = getDb();
  const notif: AppNotification = {
    id: `notif-${Date.now()}`,
    userId: null, // Broadcast to all
    type: (type as any) || 'announcement',
    titleKey: String(title).trim(),
    messageKey: String(message).trim(),
    isRead: false,
    readBy: [],
    createdAt: new Date().toISOString(),
  };

  db.notifications.unshift(notif);
  logAdmin(req, 'BROADCAST_ANNOUNCEMENT', 'NOTIFICATION', notif.id, `Broadcasted: ${title}`);
  saveDb();
  res.status(201).json(notif);
});

router.get('/admin/logs', adminOnly, (req: AuthRequest, res) => {
  const db = getDb();
  res.json(db.adminLogs.slice(0, 50));
});

router.get('/admin/system-limits', adminOnly, (req: AuthRequest, res) => {
  const db = getDb();
  res.json(db.systemLimits);
});

router.put('/admin/system-limits', adminOnly, (req: AuthRequest, res) => {
  const db = getDb();
  db.systemLimits = { ...db.systemLimits, ...req.body };
  logAdmin(req, 'UPDATE_SYSTEM_LIMITS', 'SETTINGS', 'GLOBAL', 'Updated platform tiers and quotas');
  saveDb();
  res.json(db.systemLimits);
});

export default router;
