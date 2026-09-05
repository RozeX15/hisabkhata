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
    'admin-sultan-001': adminPasswordHash,
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
  if (inMemoryDb.users.length !== initialLength) {
    saveDb();
  }

  return inMemoryDb;
}

export function deleteUserFromDb(userId: string): boolean {
  const db = getDb();
  const user = db.users.find(u => u.id === userId);
  if (!user) return false;
  if ((user.email || '').toLowerCase().trim() === 'sultanitbangladesh@gmail.com') {
    return false; // Protect owner admin account
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
  
  // Keep only the owner admin
  db.users = db.users.filter(u => (u.email || '').toLowerCase().trim() === 'sultanitbangladesh@gmail.com');
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

export function saveDb(): void {
  if (!inMemoryDb) return;
  ensureDataDir();
  try {
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(inMemoryDb, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);

    // Also persist durable user registry backup
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
        fs.writeFileSync(BUNDLED_DB_FILE, JSON.stringify(inMemoryDb, null, 2), 'utf-8');
      }
    } catch {
      // Non-blocking in serverless read-only contexts
    }
  } catch (err) {
    console.error('Failed to persist database file:', err);
  }
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
