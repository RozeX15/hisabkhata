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

// Resolve durable writable data directory (handles Netlify Functions, AWS Lambda, Cloud Run, and local)
function resolveWritableDataDir(): string {
  if (process.env.DATA_DIR) {
    try {
      if (!fs.existsSync(process.env.DATA_DIR)) {
        fs.mkdirSync(process.env.DATA_DIR, { recursive: true });
      }
      return process.env.DATA_DIR;
    } catch {
      // Fallback
    }
  }

  // Detect serverless or read-only execution environments
  const isServerless = Boolean(
    process.env.NETLIFY ||
    process.env.LAMBDA_TASK_ROOT ||
    process.env.AWS_EXECUTION_ENV ||
    process.env.VERCEL
  );

  if (isServerless) {
    const tmpDataDir = path.join('/tmp', 'hishab_khata_data');
    try {
      if (!fs.existsSync(tmpDataDir)) {
        fs.mkdirSync(tmpDataDir, { recursive: true });
      }
      return tmpDataDir;
    } catch {
      return '/tmp';
    }
  }

  const standardDataDir = path.join(process.cwd(), 'data');
  try {
    if (!fs.existsSync(standardDataDir)) {
      fs.mkdirSync(standardDataDir, { recursive: true });
    }
    // Verify write permissions
    const probeFile = path.join(standardDataDir, '.write_probe');
    fs.writeFileSync(probeFile, '1');
    fs.unlinkSync(probeFile);
    return standardDataDir;
  } catch {
    // If standard path is read-only, fallback to /tmp
    const tmpFallback = path.join('/tmp', 'hishab_khata_data');
    try {
      if (!fs.existsSync(tmpFallback)) {
        fs.mkdirSync(tmpFallback, { recursive: true });
      }
      return tmpFallback;
    } catch {
      return '/tmp';
    }
  }
}

const DATA_DIR = resolveWritableDataDir();
const DB_FILE = path.join(DATA_DIR, 'hishab_khata.json');
const USERS_REGISTRY_FILE = path.join(DATA_DIR, 'users_registry.json');
const BUNDLED_DB_FILE = path.join(process.cwd(), 'data', 'hishab_khata.json');

let inMemoryDb: DatabaseSchema | null = null;

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  } catch (err) {
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

  const defaultPasswordHash = bcrypt.hashSync('password123', 10);
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);

  const users: User[] = [
    {
      id: 'admin-sultan-001',
      name: 'Nowroze',
      email: 'sultanitbangladesh@gmail.com',
      role: 'admin',
      preferredLanguage: 'en',
      preferredCurrency: 'BDT',
      plan: 'pro',
      status: 'active',
      emailVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-09-03T06:43:20.562Z',
      updatedAt: '2026-09-06T10:10:46.430Z',
    },
    {
      id: 'admin-system-002',
      name: 'admin',
      email: 'admin@hishabkhata.com',
      role: 'admin',
      preferredLanguage: 'en',
      preferredCurrency: 'BDT',
      plan: 'pro',
      status: 'active',
      emailVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-09-09T02:00:18.097Z',
      updatedAt: '2026-09-09T02:00:18.097Z',
    },
    {
      id: 'usr-1788594159081',
      name: 'Numerical',
      email: 'nw@yixin.com',
      role: 'user',
      preferredLanguage: 'en',
      preferredCurrency: 'BDT',
      plan: 'free',
      status: 'active',
      emailVerified: true,
      createdAt: '2026-09-05T07:42:39.081Z',
      updatedAt: '2026-09-05T07:42:39.081Z',
    },
    {
      id: 'usr-1788599633823',
      name: 'Test User',
      email: 'testuser@gmail.com',
      role: 'user',
      preferredLanguage: 'en',
      preferredCurrency: 'BDT',
      plan: 'free',
      status: 'active',
      emailVerified: true,
      createdAt: '2026-09-05T09:13:53.823Z',
      updatedAt: '2026-09-05T09:13:53.823Z',
    },
    {
      id: 'usr-1788600863223',
      name: 'Ahmed',
      email: 'ahmed@ahmed.com',
      role: 'user',
      preferredLanguage: 'en',
      preferredCurrency: 'BDT',
      plan: 'free',
      status: 'active',
      emailVerified: true,
      createdAt: '2026-09-05T09:34:23.223Z',
      updatedAt: '2026-09-05T09:34:23.223Z',
    },
    {
      id: 'usr-1788601476086',
      name: 'New Test User',
      email: 'newuser_2026@test.com',
      role: 'user',
      preferredLanguage: 'en',
      preferredCurrency: 'BDT',
      plan: 'free',
      status: 'active',
      emailVerified: true,
      createdAt: '2026-09-05T09:44:36.086Z',
      updatedAt: '2026-09-05T09:44:36.086Z',
    },
    {
      id: 'usr-1788601482138',
      name: 'Rahim Mobile',
      email: '01812345678@mobile.hishabkhata.com',
      phone: '01812345678',
      role: 'user',
      preferredLanguage: 'en',
      preferredCurrency: 'BDT',
      plan: 'free',
      status: 'active',
      emailVerified: true,
      createdAt: '2026-09-05T09:44:42.138Z',
      updatedAt: '2026-09-05T09:44:42.138Z',
    },
    {
      id: 'usr-1788601870750',
      name: 'reza',
      email: 'reza14@gmail.com',
      role: 'user',
      preferredLanguage: 'en',
      preferredCurrency: 'BDT',
      plan: 'free',
      status: 'active',
      emailVerified: true,
      createdAt: '2026-09-05T09:51:10.750Z',
      updatedAt: '2026-09-06T07:50:02.069Z',
    },
    {
      id: 'usr-1788689700190',
      name: 'Test User',
      email: 'user_test_1788689700112@gmail.com',
      role: 'user',
      preferredLanguage: 'en',
      preferredCurrency: 'BDT',
      plan: 'free',
      status: 'active',
      emailVerified: true,
      createdAt: '2026-09-06T10:15:00.190Z',
      updatedAt: '2026-09-06T10:15:00.190Z',
    },
    {
      id: 'usr-1788918044261',
      name: 'Rahim Test',
      email: 'rahimtest1788918044171@gmail.com',
      role: 'user',
      preferredLanguage: 'en',
      preferredCurrency: 'BDT',
      plan: 'free',
      status: 'active',
      emailVerified: true,
      createdAt: '2026-09-09T01:40:44.261Z',
      updatedAt: '2026-09-09T01:40:44.261Z',
    },
    {
      id: 'usr-1788918378314',
      name: 'Flow Tester',
      email: 'test_flow_1788918378229@test.com',
      role: 'user',
      preferredLanguage: 'en',
      preferredCurrency: 'BDT',
      plan: 'free',
      status: 'active',
      emailVerified: true,
      createdAt: '2026-09-09T01:46:18.314Z',
      updatedAt: '2026-09-09T01:46:18.314Z',
    },
    {
      id: 'usr-1788918901773',
      name: 'Flow Tester',
      email: 'flowtest_1788918901687@example.com',
      role: 'user',
      preferredLanguage: 'en',
      preferredCurrency: 'BDT',
      plan: 'free',
      status: 'active',
      emailVerified: true,
      createdAt: '2026-09-09T01:55:01.773Z',
      updatedAt: '2026-09-09T01:55:01.773Z',
    },
    {
      id: 'usr-toxic-001',
      name: 'Toxic',
      email: 'tesi@tesi.com',
      phone: '01711122233',
      role: 'user',
      preferredLanguage: 'en',
      preferredCurrency: 'BDT',
      plan: 'free',
      status: 'active',
      emailVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      createdAt: '2026-09-09T01:50:00.000Z',
      updatedAt: '2026-09-09T02:30:00.000Z',
    },
  ];

  const passwordHashes: Record<string, string> = {
    'usr-toxic-001': '$2b$10$hr95veiEYdDaL4nXtALyf.Hp240EJ3pm/WevQBf3qlyehykA3dhQm',
    'admin-sultan-001': '$2b$10$0L03uYW3cB1rLXrR7RAmi.BsahqpSC21Gd2i6r7Sw1g/CHmxeXD8e',
    'admin-system-002': '$2b$10$sfL.7zo0urI1UUnlB0//8e8HY1xG9i6lLg9dzhqgr6x7BqGDRrc/y',
    'usr-1788594159081': '$2b$10$W5FlHuSN8XKNNCu13fllseSEFYCfXRFVTjmYB.C41m4bx7NjvuMlu',
    'usr-1788599633823': '$2b$10$Encq1V3DZ.zt6Oc2ph0VC.lf54LdSDWBrL1rK9rTWZYsNCRJ4j/XO',
    'usr-1788600863223': '$2b$10$mB2gCRzzZ/XBr.O5XokTXulaEyDSsH4LAwAZZ.2H2wHf6FCI0q63a',
    'usr-1788601476086': '$2b$10$F.pToGsEMvlYJZqFy8pFTeDLbhbRzMatHcKOcUDkN19n4f.X3Ykf.',
    'usr-1788601482138': '$2b$10$ogJbECLVjDlUeUFMCkqcJ.9eJBv0l22923Xu1p490kbDR.jPxBQ3O',
    'usr-1788601870750': '$2b$10$2OVYb8qJtxa./c4qs9uQae.8WRC29KkTZplwv5mIngU9TyMbHmmAW',
    'usr-1788689700190': '$2b$10$UFUMV23BGlNQOxEVi.Ijb.Net7bugqV9yoro0Tv5KNJMrV6vHzqPm',
    'usr-1788918044261': '$2b$10$TBpoIkj1WVDliTu7yHIOV.cTqK8/7Xc4YxWdFMwUuaD64lf4a1E42',
    'usr-1788918378314': '$2b$10$S4.X7dgYaKRtSOnrX80itOvK3QqhN5Fj75ChZIp51K9HK06NQzmUm',
    'usr-1788918901773': '$2b$10$hr95veiEYdDaL4nXtALyf.Hp240EJ3pm/WevQBf3qlyehykA3dhQm',
  };

  const adminId = 'admin-sultan-001';

  const wallets: Wallet[] = [
    {
      id: 'w-cash-01',
      userId: adminId,
      name: 'Cash Wallet',
      type: 'cash',
      balance: 0,
      currency: 'BDT',
      color: '#10B981',
      isDefault: true,
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

  const notifications: AppNotification[] = [];

  const adminLogs: AdminLog[] = [];

  const systemLimits: SystemPlanLimits = {
    freeMaxWallets: 10,
    freeMaxTransactionsPerMonth: 500,
    freeMaxSavingsGoals: 10,
    freeAllowPdfExport: true,
    freeAllowExcelExport: true,
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
  const liveActivities: LiveUserActivity[] = [];
  const emailLogs: EmailLogEntry[] = [];
  const suggestions: SuggestionSuperChat[] = [];

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

  // Helper to load and merge user registry if present
  const loadUserRegistry = (targetDb: DatabaseSchema) => {
    try {
      if (fs.existsSync(USERS_REGISTRY_FILE)) {
        const raw = fs.readFileSync(USERS_REGISTRY_FILE, 'utf-8');
        const reg = JSON.parse(raw);
        if (reg && Array.isArray(reg.users)) {
          for (const regUser of reg.users) {
            const exists = targetDb.users.some(u => u.id === regUser.id || (u.email && u.email.toLowerCase() === (regUser.email || '').toLowerCase()));
            if (!exists) {
              targetDb.users.push(regUser);
            }
          }
        }
        if (reg && reg.passwordHashes && typeof reg.passwordHashes === 'object') {
          targetDb.passwordHashes = { ...targetDb.passwordHashes, ...reg.passwordHashes };
        }
      }
    } catch (e) {
      console.warn('Could not load user registry:', e);
    }
  };

  // 1. Try reading from active writable DB_FILE
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      inMemoryDb = JSON.parse(data);
    } catch (err) {
      console.error('Error reading active database file:', err);
    }
  }

  // 2. If not found or empty, try reading from BUNDLED_DB_FILE
  if (!inMemoryDb && fs.existsSync(BUNDLED_DB_FILE)) {
    try {
      const data = fs.readFileSync(BUNDLED_DB_FILE, 'utf-8');
      inMemoryDb = JSON.parse(data);
      // Immediately write a copy to the writable DB_FILE
      if (inMemoryDb) {
        saveDb();
      }
    } catch (err) {
      console.error('Error reading bundled database file:', err);
    }
  }

  // 3. If still not available, use getSeedData()
  if (!inMemoryDb) {
    inMemoryDb = getSeedData();
    saveDb();
  }

  // Ensure all necessary collections exist
  if (!inMemoryDb.users) inMemoryDb.users = [];
  if (!inMemoryDb.passwordHashes) inMemoryDb.passwordHashes = {};
  if (!inMemoryDb.wallets) inMemoryDb.wallets = [];
  if (!inMemoryDb.transactions) inMemoryDb.transactions = [];
  if (!inMemoryDb.categories) inMemoryDb.categories = getDefaultCategories();
  if (!inMemoryDb.budgets) inMemoryDb.budgets = [];
  if (!inMemoryDb.savingsGoals) inMemoryDb.savingsGoals = [];
  if (!inMemoryDb.loans) inMemoryDb.loans = [];
  if (!inMemoryDb.notifications) inMemoryDb.notifications = [];
  if (!inMemoryDb.subscriptionPayments) inMemoryDb.subscriptionPayments = [];
  if (!inMemoryDb.userPresences) inMemoryDb.userPresences = {};
  if (!inMemoryDb.liveActivities) inMemoryDb.liveActivities = [];
  if (!inMemoryDb.emailLogs) inMemoryDb.emailLogs = [];
  if (!inMemoryDb.suggestions) inMemoryDb.suggestions = [];

  if (!inMemoryDb.systemLimits) {
    inMemoryDb.systemLimits = {
      freeMaxWallets: 5,
      freeMaxTransactionsPerMonth: 500,
      freeMaxSavingsGoals: 10,
      freeAllowPdfExport: true,
      freeAllowExcelExport: true,
      proMonthlyPriceUSD: 4.99,
      proYearlyPriceUSD: 49.99,
    };
  }

  if (!inMemoryDb.adminPaymentConfig) {
    inMemoryDb.adminPaymentConfig = {
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

  // Merge any saved user accounts from the persistent registry
  loadUserRegistry(inMemoryDb);

  // Automatically purge legacy demo accounts (user@hishabkhata.com, admin@hishabkhata.com, admin@hishabkhata.io, demo@hishabkhata.io)
  const legacyDemoEmails = new Set([
    'user@hishabkhata.com',
    'admin@hishabkhata.com',
    'admin@hishabkhata.io',
    'demo@hishabkhata.io',
  ]);
  const initialLength = inMemoryDb.users.length;
  inMemoryDb.users = inMemoryDb.users.filter(u => !legacyDemoEmails.has((u.email || '').toLowerCase().trim()));
  
  // Guarantee Owner Admin display name is strictly Nowroze
  const ownerAccount = inMemoryDb.users.find(u => (u.email || '').toLowerCase().trim() === 'sultanitbangladesh@gmail.com');
  if (ownerAccount) {
    ownerAccount.name = 'Nowroze';
  }

  if (inMemoryDb.users.length !== initialLength) {
    saveDb();
  }

  return inMemoryDb;
}

export function deleteUserFromDb(userId: string): boolean {
  const db = getDb();
  const user = db.users.find(u => u.id === userId);
  if (!user) return false;
  const userEmail = (user.email || '').toLowerCase().trim();
  if (
    userEmail === 'sultanitbangladesh@gmail.com' ||
    userEmail === 'admin@hishabkhata.com' ||
    user.role === 'admin'
  ) {
    return false; // Protect owner & dedicated admin accounts
  }

  db.users = db.users.filter(u => u.id !== userId);
  delete db.passwordHashes[userId];
  db.wallets = db.wallets.filter(w => w.userId !== userId);
  db.transactions = db.transactions.filter(t => t.userId !== userId);
  db.budgets = db.budgets.filter(b => b.userId !== userId);
  db.savingsGoals = db.savingsGoals.filter(s => s.userId !== userId);
  db.loans = db.loans.filter(l => l.userId !== userId);
  db.notifications = db.notifications.filter(n => n.userId !== userId);
  delete db.userPresences[userId];
  db.liveActivities = db.liveActivities.filter(a => a.userId !== userId);
  saveDb();
  return true;
}

export function purgeNonAdminUsersFromDb(): { deletedCount: number } {
  const db = getDb();
  const beforeCount = db.users.length;
  
  // Keep dedicated admin accounts
  db.users = db.users.filter(u => {
    const em = (u.email || '').toLowerCase().trim();
    return em === 'sultanitbangladesh@gmail.com' || em === 'admin@hishabkhata.com' || u.role === 'admin';
  });
  const allowedUserIds = new Set(db.users.map(u => u.id));

  for (const id of Object.keys(db.passwordHashes)) {
    if (!allowedUserIds.has(id)) {
      delete db.passwordHashes[id];
    }
  }

  db.wallets = db.wallets.filter(w => allowedUserIds.has(w.userId));
  db.transactions = db.transactions.filter(t => allowedUserIds.has(t.userId));
  db.budgets = db.budgets.filter(b => allowedUserIds.has(b.userId));
  db.savingsGoals = db.savingsGoals.filter(s => allowedUserIds.has(s.userId));
  db.loans = db.loans.filter(l => allowedUserIds.has(l.userId));
  db.notifications = db.notifications.filter(n => allowedUserIds.has(n.userId));
  for (const id of Object.keys(db.userPresences)) {
    if (!allowedUserIds.has(id)) {
      delete db.userPresences[id];
    }
  }
  db.liveActivities = db.liveActivities.filter(a => allowedUserIds.has(a.userId));
  saveDb();

  return { deletedCount: beforeCount - db.users.length };
}

let saveDbTimeout: NodeJS.Timeout | null = null;

function executeSaveDb(): void {
  if (!inMemoryDb) return;
  ensureDataDir();
  try {
    const tempFile = `${DB_FILE}.tmp`;
    const jsonStr = JSON.stringify(inMemoryDb, null, 2);
    fs.writeFileSync(tempFile, jsonStr, 'utf-8');
    fs.renameSync(tempFile, DB_FILE);

    // Also persist durable user registry backup asynchronously
    try {
      const regData = {
        users: inMemoryDb.users,
        passwordHashes: inMemoryDb.passwordHashes,
        updatedAt: new Date().toISOString(),
      };
      const tempReg = `${USERS_REGISTRY_FILE}.tmp`;
      fs.writeFileSync(tempReg, JSON.stringify(regData, null, 2), 'utf-8');
      fs.renameSync(tempReg, USERS_REGISTRY_FILE);
    } catch {
      // Non-blocking
    }

    // In local/container environments, keep bundled DB file in sync as well
    try {
      if (BUNDLED_DB_FILE && DB_FILE !== BUNDLED_DB_FILE && fs.existsSync(path.dirname(BUNDLED_DB_FILE))) {
        fs.writeFileSync(BUNDLED_DB_FILE, jsonStr, 'utf-8');
      }
    } catch {
      // Non-blocking in serverless read-only contexts
    }
  } catch (err) {
    console.error('Failed to persist database file:', err);
  }
}

export function saveDb(immediate = true): void {
  if (saveDbTimeout) {
    clearTimeout(saveDbTimeout);
    saveDbTimeout = null;
  }
  executeSaveDb();
}

export function registerOrSyncUser(user: User, passwordHash?: string): void {
  const db = getDb();
  const existingIdx = db.users.findIndex(u => u.id === user.id || (u.email && u.email.toLowerCase() === (user.email || '').toLowerCase()));
  if (existingIdx >= 0) {
    db.users[existingIdx] = { ...db.users[existingIdx], ...user };
  } else {
    db.users.push(user);
  }

  if (passwordHash) {
    db.passwordHashes[user.id] = passwordHash;
  }

  saveDb();
}
