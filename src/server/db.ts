import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  User,
  Wallet,
  Category,
  Transaction,
  Budget,
  SavingsGoal,
  GoalContribution,
  Loan,
  LoanPayment,
  AppNotification,
  LanguageInfo,
  AdminLog,
  SystemPlanLimits,
  SubscriptionPayment,
  AdminPaymentConfig,
  UserPresence,
  LiveUserActivity,
  EmailLogEntry,
  SuggestionSuperChat
} from '../types';
import { defaultLanguages, baseTranslations } from '../lib/translations';

export interface DatabaseSchema {
  users: User[];
  passwordHashes: Record<string, string>;
  wallets: Wallet[];
  categories: Category[];
  transactions: Transaction[];
  budgets: Budget[];
  savingsGoals: SavingsGoal[];
  goalContributions: GoalContribution[];
  loans: Loan[];
  loanPayments: LoanPayment[];
  notifications: AppNotification[];
  languages: LanguageInfo[];
  translations: Record<string, Record<string, string>>;
  adminLogs: AdminLog[];
  systemLimits: SystemPlanLimits;
  subscriptionPayments: SubscriptionPayment[];
  adminPaymentConfig: AdminPaymentConfig;
  userPresences: Record<string, UserPresence>;
  liveActivities: LiveUserActivity[];
  emailLogs: EmailLogEntry[];
  suggestions: SuggestionSuperChat[];
}

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'hishab_khata.json');

let inMemoryDb: DatabaseSchema | null = null;

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
    // In read-only or serverless environments (e.g. Netlify/Lambda), fallback gracefully
    console.warn('Could not create data directory, running with memory store:', err);
  }
}

export function getDefaultCategories(): Category[] {
  const now = new Date().toISOString();
  return [
    // Income Categories
    { id: 'cat-sal', nameKey: 'cat_salary', type: 'income', icon: 'Briefcase', color: '#10B981', isSystem: true, createdAt: now },
    { id: 'cat-fre', nameKey: 'cat_freelance', type: 'income', icon: 'Laptop', color: '#06B6D4', isSystem: true, createdAt: now },
    { id: 'cat-bus', nameKey: 'cat_business', type: 'income', icon: 'Building2', color: '#8B5CF6', isSystem: true, createdAt: now },
    { id: 'cat-gif', nameKey: 'cat_gift', type: 'income', icon: 'Gift', color: '#EC4899', isSystem: true, createdAt: now },
    { id: 'cat-oin', nameKey: 'cat_other_income', type: 'income', icon: 'Coins', color: '#14B8A6', isSystem: true, createdAt: now },

    // Expense Categories
    { id: 'cat-foo', nameKey: 'cat_food', type: 'expense', icon: 'Utensils', color: '#F59E0B', isSystem: true, createdAt: now },
    { id: 'cat-tra', nameKey: 'cat_transport', type: 'expense', icon: 'Car', color: '#3B82F6', isSystem: true, createdAt: now },
    { id: 'cat-sho', nameKey: 'cat_shopping', type: 'expense', icon: 'ShoppingBag', color: '#EC4899', isSystem: true, createdAt: now },
    { id: 'cat-bil', nameKey: 'cat_bills', type: 'expense', icon: 'Zap', color: '#EAB308', isSystem: true, createdAt: now },
    { id: 'cat-edu', nameKey: 'cat_education', type: 'expense', icon: 'GraduationCap', color: '#6366F1', isSystem: true, createdAt: now },
    { id: 'cat-ent', nameKey: 'cat_entertainment', type: 'expense', icon: 'Film', color: '#A855F7', isSystem: true, createdAt: now },
    { id: 'cat-hea', nameKey: 'cat_health', type: 'expense', icon: 'HeartPulse', color: '#EF4444', isSystem: true, createdAt: now },
    { id: 'cat-ren', nameKey: 'cat_rent', type: 'expense', icon: 'Home', color: '#0F766E', isSystem: true, createdAt: now },
    { id: 'cat-fam', nameKey: 'cat_family', type: 'expense', icon: 'Users', color: '#F97316', isSystem: true, createdAt: now },
    { id: 'cat-oex', nameKey: 'cat_other_expense', type: 'expense', icon: 'MoreHorizontal', color: '#64748B', isSystem: true, createdAt: now },
  ];
}

function getSeedData(): DatabaseSchema {
  const now = new Date();
  const nowIso = now.toISOString();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  
  // Date helper
  const dateDaysAgo = (days: number) => {
    const d = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const demoUserId = 'user-demo-001';
  const demoUserId2 = 'user-demo-002';
  const demoAdminId = 'admin-demo-001';
  const demoAdminId2 = 'admin-demo-002';

  const defaultPasswordHash = bcrypt.hashSync('password123', 10);
  const demoPasswordHash = bcrypt.hashSync('demo123', 10);
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);

  const users: User[] = [
    {
      id: demoUserId,
      name: 'User Account',
      email: 'user@hishabkhata.com',
      role: 'user',
      preferredLanguage: 'en',
      preferredCurrency: 'BDT',
      plan: 'free',
      status: 'active',
      emailVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: demoUserId2,
      name: 'User Account 2',
      email: 'demo@hishabkhata.io',
      role: 'user',
      preferredLanguage: 'bn',
      preferredCurrency: 'BDT',
      plan: 'free',
      status: 'active',
      emailVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: demoAdminId,
      name: 'System SuperAdmin',
      email: 'admin@hishabkhata.io',
      role: 'admin',
      preferredLanguage: 'en',
      preferredCurrency: 'USD',
      plan: 'pro',
      status: 'active',
      emailVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: demoAdminId2,
      name: 'Sultan Admin',
      email: 'admin@hishabkhata.com',
      role: 'admin',
      preferredLanguage: 'en',
      preferredCurrency: 'USD',
      plan: 'pro',
      status: 'active',
      emailVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'admin-sultan-001',
      name: 'Sultan (Owner Admin)',
      email: 'sultanitbangladesh@gmail.com',
      role: 'admin',
      preferredLanguage: 'en',
      preferredCurrency: 'BDT',
      plan: 'pro',
      status: 'active',
      emailVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const passwordHashes: Record<string, string> = {
    [demoUserId]: defaultPasswordHash,
    [demoUserId2]: demoPasswordHash,
    [demoAdminId]: adminPasswordHash,
    [demoAdminId2]: adminPasswordHash,
    'admin-sultan-001': adminPasswordHash,
  };

  const wallets: Wallet[] = [
    {
      id: 'w-cash-01',
      userId: demoUserId,
      name: 'Cash Wallet',
      type: 'cash',
      balance: 0,
      currency: 'BDT',
      color: '#10B981',
      isDefault: true,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'w-bank-01',
      userId: demoUserId,
      name: 'Main Bank Account',
      type: 'bank',
      balance: 0,
      currency: 'BDT',
      color: '#0F766E',
      isDefault: false,
      accountNumber: '**** 8842',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'w-bkash-01',
      userId: demoUserId,
      name: 'bKash Personal',
      type: 'bkash',
      balance: 0,
      currency: 'BDT',
      color: '#E2136E',
      isDefault: false,
      accountNumber: '01712-***456',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];

  const transactions: Transaction[] = [];
  const budgets: Budget[] = [];
  const savingsGoals: SavingsGoal[] = [
    {
      id: 'goal-seed-01',
      userId: demoUserId,
      name: 'Emergency Reserve Fund',
      targetAmount: 150000,
      currentAmount: 65000,
      targetDate: '2026-12-31',
      deadline: '2026-12-31',
      icon: 'ShieldCheck',
      color: '#0F766E',
      status: 'in_progress',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'goal-seed-02',
      userId: demoUserId,
      name: 'Hardware & Tech Upgrade',
      targetAmount: 85000,
      currentAmount: 42000,
      targetDate: '2026-11-15',
      deadline: '2026-11-15',
      icon: 'Laptop',
      color: '#2563EB',
      status: 'in_progress',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 'goal-seed-03',
      userId: 'admin-sultan-001',
      name: 'Emergency Fund (6 Months)',
      targetAmount: 300000,
      currentAmount: 120000,
      targetDate: '2026-12-31',
      deadline: '2026-12-31',
      icon: 'ShieldCheck',
      color: '#0F766E',
      status: 'in_progress',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
  ];
  const goalContributions: GoalContribution[] = [];
  const loans: Loan[] = [];
  const loanPayments: LoanPayment[] = [];

  const notifications: AppNotification[] = [
    {
      id: 'notif-001',
      userId: demoUserId,
      type: 'system',
      titleKey: 'Welcome to Hishab Khata!',
      messageKey: 'Your personal financial accounting workspace is ready. Add your first income, expense, or budget to get started.',
      isRead: false,
      createdAt: nowIso,
    },
  ];

  const adminLogs: AdminLog[] = [
    {
      id: 'log-001',
      adminId: demoAdminId,
      adminEmail: 'admin@hishabkhata.com',
      action: 'SYSTEM_BOOTSTRAP',
      targetType: 'SYSTEM',
      targetId: 'GLOBAL',
      details: 'Initialized global multi-currency database with 15 language packs',
      createdAt: nowIso,
    },
  ];

  const systemLimits: SystemPlanLimits = {
    freeMaxWallets: 3,
    freeMaxTransactionsPerMonth: 100,
    freeMaxSavingsGoals: 2,
    freeAllowPdfExport: false,
    freeAllowExcelExport: false,
    proMonthlyPriceUSD: 4.99,
    proYearlyPriceUSD: 49.99,
  };

  const adminPaymentConfig: AdminPaymentConfig = {
    bkashNumber: '01711-234567',
    bkashType: 'personal',
    nagadNumber: '01811-234567',
    nagadType: 'personal',
    rocketNumber: '01911-234567-8',
    bankName: 'Islami Bank Bangladesh PLC / City Bank',
    bankAccountName: 'Hishab Khata SaaS Admin',
    bankAccountNumber: '2050112020345678',
    bankBranch: 'Dhanmondi Branch, Dhaka',
    bankRoutingNumber: '125272847',
    proMonthlyPriceBDT: 499,
    proYearlyPriceBDT: 4999,
    proLifetimePriceBDT: 9999,
    proMonthlyPriceUSD: 4.99,
    proYearlyPriceUSD: 49.99,
    proLifetimePriceUSD: 99.99,
    yearlyDiscountPercent: 20,
    instructionsBn: 'বিকাশ বা নগদ অ্যাপ থেকে "Send Money" বা "Payment" করুন। পেমেন্ট সফল হলে প্রাপ্ত TrxID এবং আপনার মোবাইল নম্বর সাবমিট করুন। অ্যাডমিন ৫-১০ মিনিটের মধ্যে ভেরিফাই করে PRO একাউন্ট একটিভ করে দিবে।',
    instructionsEn: 'Send the exact subscription fee to the bKash, Nagad or Bank Account above. Enter your Sender Number/Account and the Transaction ID (TrxID) below. Admin verifies and activates PRO within minutes.'
  };

  const subscriptionPayments: SubscriptionPayment[] = [];
  const userPresences: Record<string, UserPresence> = {};
  const liveActivities: LiveUserActivity[] = [
    {
      id: 'act-001',
      userId: demoUserId,
      userName: 'User Account',
      userEmail: 'user@hishabkhata.com',
      action: 'SYSTEM_JOIN',
      category: 'AUTH',
      details: 'Logged into Hishab Khata Financial Dashboard',
      deviceType: 'desktop',
      currentView: 'dashboard',
      timestamp: nowIso,
    }
  ];
  const emailLogs: EmailLogEntry[] = [];

  const suggestions: SuggestionSuperChat[] = [
    {
      id: 'sug-001',
      userId: demoUserId,
      userName: 'User Account',
      userEmail: 'user@hishabkhata.com',
      userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      category: 'feature',
      title: 'SMS Automatic Transaction Parsing for bKash & Nagad',
      description: 'It would be amazing if the mobile PWA can auto-read or paste bKash/Nagad cash in & out transaction SMS to record entries automatically with 1 click!',
      impact: 'high',
      status: 'planned',
      adminReply: 'Great idea! We are actively implementing smart SMS parser regex for all Bangladeshi MFS in the next update. Thank you!',
      adminRepliedAt: nowIso,
      hasSuperChat: true,
      superChatAmount: 500,
      superChatCurrency: 'BDT',
      superChatTier: 'gold',
      superChatMessage: 'Keep up the extraordinary work Sultan bhai! Love this SaaS so much!',
      paymentMethod: 'bkash',
      paymentTrxId: '9K28X1M90P',
      senderNumber: '01712-889900',
      isSuperChatVerified: true,
      upvotes: 14,
      upvotedUserIds: [demoUserId, 'user-farhan-002'],
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: nowIso,
    },
    {
      id: 'sug-002',
      userId: 'user-farhan-002',
      userName: 'Farhan Ahmed',
      userEmail: 'farhan@smartfintech.bd',
      category: 'improvement',
      title: 'Export Monthly Statement Directly to WhatsApp & Telegram',
      description: 'Allow 1-click sharing of generated monthly PDF summaries directly to WhatsApp contact or Telegram chat for family budgeting.',
      impact: 'medium',
      status: 'in_progress',
      adminReply: 'In progress! We are adding Web Share API integration so you can share directly to WhatsApp, Telegram, or Email.',
      adminRepliedAt: nowIso,
      hasSuperChat: true,
      superChatAmount: 250,
      superChatCurrency: 'BDT',
      superChatTier: 'silver',
      superChatMessage: 'Small tip for the development team. Hishab Khata is a lifesaver!',
      paymentMethod: 'nagad',
      paymentTrxId: '7B34Y902KL',
      senderNumber: '01819-334455',
      isSuperChatVerified: true,
      upvotes: 9,
      upvotedUserIds: ['user-farhan-002'],
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: nowIso,
    }
  ];

  return {
    users,
    passwordHashes,
    wallets,
    categories: getDefaultCategories(),
    transactions,
    budgets,
    savingsGoals,
    goalContributions,
    loans,
    loanPayments,
    notifications,
    languages: defaultLanguages,
    translations: baseTranslations,
    adminLogs,
    systemLimits,
    subscriptionPayments,
    adminPaymentConfig,
    userPresences,
    liveActivities,
    emailLogs,
    suggestions,
  };
}

export function getDb(): DatabaseSchema {
  if (inMemoryDb) {
    return inMemoryDb;
  }

  ensureDataDir();

  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      inMemoryDb = JSON.parse(data);
      if (!inMemoryDb!.subscriptionPayments) inMemoryDb!.subscriptionPayments = [];
      if (!inMemoryDb!.adminPaymentConfig) {
        inMemoryDb!.adminPaymentConfig = {
          bkashNumber: '01711-234567',
          bkashType: 'personal',
          nagadNumber: '01811-234567',
          nagadType: 'personal',
          rocketNumber: '01911-234567-8',
          bankName: 'Islami Bank Bangladesh PLC / City Bank',
          bankAccountName: 'Hishab Khata SaaS Admin',
          bankAccountNumber: '2050112020345678',
          bankBranch: 'Dhanmondi Branch, Dhaka',
          bankRoutingNumber: '125272847',
          proMonthlyPriceBDT: 499,
          proYearlyPriceBDT: 4999,
          proLifetimePriceBDT: 9999,
          proMonthlyPriceUSD: 4.99,
          proYearlyPriceUSD: 49.99,
          proLifetimePriceUSD: 99.99,
          yearlyDiscountPercent: 20,
          instructionsBn: 'বিকাশ বা নগদ অ্যাপ থেকে "Send Money" বা "Payment" করুন। পেমেন্ট সফল হলে প্রাপ্ত TrxID এবং আপনার মোবাইল নম্বর সাবমিট করুন। অ্যাডমিন ৫-১০ মিনিটের মধ্যে ভেরিফাই করে PRO একাউন্ট একটিভ করে দিবে।',
          instructionsEn: 'Send the exact subscription fee to the bKash, Nagad or Bank Account above. Enter your Sender Number/Account and the Transaction ID (TrxID) below. Admin verifies and activates PRO within minutes.'
        };
      }
      if (!inMemoryDb!.userPresences) inMemoryDb!.userPresences = {};
      if (!inMemoryDb!.liveActivities) inMemoryDb!.liveActivities = [];
      if (!inMemoryDb!.emailLogs) inMemoryDb!.emailLogs = [];
      if (!inMemoryDb!.suggestions) {
        inMemoryDb!.suggestions = [
          {
            id: 'sug-001',
            userId: 'user-regular-001',
            userName: 'User Account',
            userEmail: 'user@hishabkhata.com',
            userAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
            category: 'feature',
            title: 'SMS Automatic Transaction Parsing for bKash & Nagad',
            description: 'It would be amazing if the mobile PWA can auto-read or paste bKash/Nagad cash in & out transaction SMS to record entries automatically with 1 click!',
            impact: 'high',
            status: 'planned',
            adminReply: 'Great idea! We are actively implementing smart SMS parser regex for all Bangladeshi MFS in the next update. Thank you!',
            adminRepliedAt: new Date().toISOString(),
            hasSuperChat: true,
            superChatAmount: 500,
            superChatCurrency: 'BDT',
            superChatTier: 'gold',
            superChatMessage: 'Keep up the extraordinary work Sultan bhai! Love this SaaS so much!',
            paymentMethod: 'bkash',
            paymentTrxId: '9K28X1M90P',
            senderNumber: '01712-889900',
            isSuperChatVerified: true,
            upvotes: 14,
            upvotedUserIds: ['user-regular-001', 'user-farhan-002'],
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            updatedAt: new Date().toISOString(),
          }
        ];
      }
      return inMemoryDb!;
    } catch (err) {
      console.error('Error reading database file, reseeding:', err);
    }
  }

  inMemoryDb = getSeedData();
  saveDb();
  return inMemoryDb;
}

export function saveDb(): void {
  if (!inMemoryDb) return;
  ensureDataDir();
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(inMemoryDb, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (err) {
    console.error('Failed to persist database file:', err);
  }
}
