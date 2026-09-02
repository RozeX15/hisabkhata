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
  SystemPlanLimits
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
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'hishab_khata.json');

let inMemoryDb: DatabaseSchema | null = null;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
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
  const demoAdminId = 'admin-demo-001';

  const defaultPasswordHash = bcrypt.hashSync('password123', 10);
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);

  const users: User[] = [
    {
      id: demoUserId,
      name: 'Rahim Chowdhury',
      email: 'user@hishabkhata.com',
      role: 'user',
      preferredLanguage: 'bn',
      preferredCurrency: 'BDT',
      plan: 'pro',
      status: 'active',
      emailVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: demoAdminId,
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
  ];

  const passwordHashes: Record<string, string> = {
    [demoUserId]: defaultPasswordHash,
    [demoAdminId]: adminPasswordHash,
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
  const savingsGoals: SavingsGoal[] = [];
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
