import { safeStorage } from './storage';
import {
  User,
  Wallet,
  Transaction,
  BudgetProgress,
  SavingsGoal,
  Loan,
  AppNotification,
  DashboardSummary,
  AdminStats,
  AdminLog,
  LanguageInfo,
  SystemPlanLimits,
  SubscriptionPayment,
  AdminPaymentConfig,
  UserPresence,
  LiveUserActivity,
  EmailLogEntry,
  SuggestionSuperChat
} from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return safeStorage.getItem('hk_auth_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    safeStorage.setItem('hk_auth_token', token);
  } else {
    safeStorage.removeItem('hk_auth_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const cachedUser = safeStorage.getItem('hk_user');
    if (cachedUser) {
      const u = JSON.parse(cachedUser);
      if (u?.id) headers['x-user-id'] = u.id;
      if (u?.email) headers['x-user-email'] = u.email;
    }
  } catch {}

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (networkError: any) {
    throw new Error('Unable to connect to the server. Please check your network connection.');
  }

  if (!response.ok) {
    let errorMsg = '';
    try {
      const data = await response.json();
      if (data) {
        if (typeof data.error === 'string') {
          errorMsg = data.error;
        } else if (data.error && typeof data.error === 'object') {
          errorMsg = data.error.message || data.error.code || JSON.stringify(data.error);
        } else if (typeof data.message === 'string') {
          errorMsg = data.message;
        } else if (data.message && typeof data.message === 'object') {
          errorMsg = data.message.message || JSON.stringify(data.message);
        }
      }
    } catch {
      // Non-JSON response
    }

    if (!errorMsg || errorMsg === '[object Object]') {
      if (response.status === 401) {
        errorMsg = 'Invalid email or password. Please verify and try again.';
      } else if (response.status === 400) {
        errorMsg = 'Invalid request. Please check all provided input fields.';
      } else if (response.status === 403) {
        errorMsg = 'Access forbidden or account deactivated.';
      } else if (response.status === 404) {
        errorMsg = 'Service endpoint not reachable or resource not found. Please try again.';
      } else if (response.status >= 500) {
        errorMsg = 'Server error occurred. Please try again shortly.';
      } else {
        errorMsg = `Request failed with status ${response.status}`;
      }
    }

    throw new Error(String(errorMsg));
  }

  try {
    return (await response.json()) as T;
  } catch (err) {
    throw new Error('Invalid response format from server.');
  }
}

export const api = {
  // Auth
  register: (data: any) => request<{ user: User; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data: any) => request<{ user: User; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  syncUser: (data: { user: Partial<User>; passwordHash?: string; password?: string }) =>
    request<{ user: User; token: string }>('/auth/sync-user', { method: 'POST', body: JSON.stringify(data) }),
  loginWithGoogle: (data: { email: string; name?: string; avatarUrl?: string; firebaseUid?: string; idToken?: string }) =>
    request<{ user: User; token: string }>('/auth/firebase-google', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request<{ user: User }>('/auth/me'),
  updateProfile: (data: any) => request<{ user: User }>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  changePassword: (dataOrOld: any, newPass?: string) => {
    const body = typeof dataOrOld === 'string' ? { currentPassword: dataOrOld, newPassword: newPass } : dataOrOld;
    return request<{ message: string }>('/auth/password', { method: 'PUT', body: JSON.stringify(body) });
  },
  upgradePlan: (plan: string = 'pro') => request<{ user: User; message: string }>('/auth/upgrade-plan', { method: 'POST', body: JSON.stringify({ plan }) }),

  // Dashboard
  getDashboardSummary: () => request<DashboardSummary>('/dashboard/summary'),

  // Wallets
  getWallets: () => request<Wallet[]>('/wallets'),
  createWallet: (data: Partial<Wallet>) => request<Wallet>('/wallets', { method: 'POST', body: JSON.stringify(data) }),
  updateWallet: (id: string, data: Partial<Wallet>) => request<Wallet>(`/wallets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteWallet: (id: string) => request<{ message: string }>(`/wallets/${id}`, { method: 'DELETE' }),

  // Transactions
  getTransactions: (params: Record<string, string> = {}) => {
    const query = new URLSearchParams(params).toString();
    return request<Transaction[]>(`/transactions${query ? `?${query}` : ''}`);
  },
  createTransaction: (data: any) => request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  updateTransaction: (id: string, data: any) => request<Transaction>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTransaction: (id: string) => request<{ message: string }>(`/transactions/${id}`, { method: 'DELETE' }),
  clearMonthTransactions: (month: string, type?: 'all' | 'income' | 'expense') =>
    request<{ success: boolean; message: string; deletedCount: number; month: string }>('/transactions/clear-month', {
      method: 'POST',
      body: JSON.stringify({ month, type }),
    }),
  resetAllWallets: (targetBalance: number = 0) =>
    request<{ success: boolean; message: string; wallets: any[] }>('/wallets/reset-all', {
      method: 'POST',
      body: JSON.stringify({ targetBalance }),
    }),

  // Categories
  getCategories: () => request<any[]>('/categories'),
  createCategory: (data: any) => request<any>('/categories', { method: 'POST', body: JSON.stringify(data) }),

  // Budgets
  getBudgets: (month?: string) => request<BudgetProgress[]>(`/budgets${month ? `?month=${month}` : ''}`),
  createBudget: (data: any) => request<any>('/budgets', { method: 'POST', body: JSON.stringify(data) }),
  deleteBudget: (id: string) => request<{ message: string }>(`/budgets/${id}`, { method: 'DELETE' }),

  // Savings Goals
  getSavingsGoals: () => request<SavingsGoal[]>('/savings-goals'),
  createSavingsGoal: (data: any) => request<SavingsGoal>('/savings-goals', { method: 'POST', body: JSON.stringify(data) }),
  contributeToGoal: (id: string, data: any) => request<{ goal: SavingsGoal; wallet: Wallet }>(`/savings-goals/${id}/contribute`, { method: 'POST', body: JSON.stringify(data) }),
  contributeSavingsGoal: (id: string, amount: number, walletId: string, note?: string) => request<{ goal: SavingsGoal; wallet: Wallet }>(`/savings-goals/${id}/contribute`, { method: 'POST', body: JSON.stringify({ amount, walletId, note }) }),
  deleteSavingsGoal: (id: string) => request<{ message: string }>(`/savings-goals/${id}`, { method: 'DELETE' }),

  // Loans
  getLoans: () => request<Loan[]>('/loans'),
  createLoan: (data: any) => request<Loan>('/loans', { method: 'POST', body: JSON.stringify(data) }),
  recordLoanPayment: (id: string, amountOrData: any, walletId?: string, note?: string) => {
    const body = typeof amountOrData === 'number' ? { amount: amountOrData, walletId, note } : amountOrData;
    return request<{ loan: Loan; wallet: Wallet }>(`/loans/${id}/payments`, { method: 'POST', body: JSON.stringify(body) });
  },
  deleteLoan: (id: string) => request<{ message: string }>(`/loans/${id}`, { method: 'DELETE' }),

  // AI & Smart Advisor
  askAiAdvisor: (question: string) => request<{ advice: string; metrics: any }>('/ai/advisor', { method: 'POST', body: JSON.stringify({ question }) }),

  // Notifications
  getNotifications: () => request<AppNotification[]>('/notifications'),
  pollNotifications: (since?: string) => request<{ notifications: AppNotification[]; unreadCount: number; serverTime: string }>(`/notifications/poll${since ? `?since=${encodeURIComponent(since)}` : ''}`),
  markNotificationRead: (id: string) => request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request<{ success: boolean }>('/notifications/read-all', { method: 'PUT' }),
  deleteNotification: (id: string) => request<{ success: boolean }>(`/notifications/${id}`, { method: 'DELETE' }),
  clearAllNotifications: () => request<{ success: boolean }>('/notifications/clear-all', { method: 'DELETE' }),

  // Languages & Translations
  getLanguages: () => request<LanguageInfo[]>('/languages'),

  // Heartbeat & Presence
  sendHeartbeat: (data: { currentView?: string; deviceType?: string; browser?: string; lastAction?: string }) =>
    request<{ success: boolean; serverTime: string }>('/presence/heartbeat', { method: 'POST', body: JSON.stringify(data) }),
  getAdminPresences: () => request<UserPresence[]>('/admin/presences'),
  getLiveActivities: () => request<LiveUserActivity[]>('/admin/live-activities'),
  getEmailLogs: () => request<EmailLogEntry[]>('/admin/email-logs'),

  // Subscription Payments & Config
  getSubscriptionConfig: () => request<AdminPaymentConfig>('/subscriptions/config'),
  updateAdminPaymentConfig: (data: Partial<AdminPaymentConfig>) =>
    request<AdminPaymentConfig>('/admin/payment-config', { method: 'PUT', body: JSON.stringify(data) }),
  submitSubscriptionPayment: (data: {
    billingCycle: 'monthly' | 'yearly' | 'lifetime';
    paymentMethod: string;
    senderNumberOrAccount: string;
    transactionId: string;
    userEmail?: string;
    amount?: number;
    currency?: string;
    notes?: string;
  }) => request<{ success: boolean; payment: SubscriptionPayment }>('/subscriptions/submit-payment', { method: 'POST', body: JSON.stringify(data) }),
  getMySubscriptionPayments: () => request<SubscriptionPayment[]>('/subscriptions/my-payments'),
  getAdminSubscriptionPayments: () => request<SubscriptionPayment[]>('/admin/subscription-payments'),
  approveSubscriptionPayment: (id: string) => request<{ success: boolean; payment: SubscriptionPayment; user: User }>(`/admin/subscription-payments/${id}/approve`, { method: 'PUT' }),
  rejectSubscriptionPayment: (id: string, adminNotes?: string) =>
    request<{ success: boolean; payment: SubscriptionPayment }>(`/admin/subscription-payments/${id}/reject`, { method: 'PUT', body: JSON.stringify({ adminNotes }) }),

  // Direct Admin User Notifications
  sendDirectNotification: (data: { targetUserId: string; title: string; message: string; type?: string }) =>
    request<{ success: boolean; notification: AppNotification }>('/admin/notify-user', { method: 'POST', body: JSON.stringify(data) }),

  // Admin
  getAdminStats: () => request<AdminStats>('/admin/stats'),
  getAdminUsers: () => request<any[]>('/admin/users'),
  updateUserStatus: (id: string, status: string) => request<any>(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  updateUserPlan: (id: string, plan: string) => request<any>(`/admin/users/${id}/plan`, { method: 'PUT', body: JSON.stringify({ plan }) }),
  updateUserRole: (id: string, role: string) => request<any>(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }),
  updateAdminUser: (id: string, data: any) => {
    if (data.status) return request<any>(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: data.status }) });
    if (data.plan) return request<any>(`/admin/users/${id}/plan`, { method: 'PUT', body: JSON.stringify({ plan: data.plan }) });
    if (data.role) return request<any>(`/admin/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role: data.role }) });
    return Promise.resolve({ success: true });
  },
  deleteAdminUser: (id: string) => request<{ success: boolean; message: string }>(`/admin/users/${id}`, { method: 'DELETE' }),
  purgeNonAdminUsers: () => request<{ success: boolean; deletedCount: number; message: string }>('/admin/users/purge-non-admin', { method: 'POST' }),
  getAdminLanguages: () => request<LanguageInfo[]>('/admin/languages'),
  createAdminLanguage: (data: any) => request<LanguageInfo>('/admin/languages', { method: 'POST', body: JSON.stringify(data) }),
  updateAdminLanguage: (code: string, data: any) => request<LanguageInfo>(`/admin/languages/${code}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateTranslationKey: (code: string, key: string, value: string) => request<any>(`/admin/translations/${code}`, { method: 'PUT', body: JSON.stringify({ key, value }) }),
  broadcastAnnouncement: (title: string, message: string) => request<any>('/admin/announcements', { method: 'POST', body: JSON.stringify({ title, message }) }),
  broadcastNotification: (title: string, message: string, type?: string) => request<any>('/admin/announcements', { method: 'POST', body: JSON.stringify({ title, message, type }) }),
  getAdminLogs: () => request<AdminLog[]>('/admin/logs'),
  getSystemLimits: () => request<SystemPlanLimits>('/admin/system-limits'),
  updateSystemLimits: (data: Partial<SystemPlanLimits>) => request<SystemPlanLimits>('/admin/system-limits', { method: 'PUT', body: JSON.stringify(data) }),
  resetDemoData: () => request<{ message: string }>('/admin/system-limits', { method: 'GET' }), // Safe no-op or reload

  // Suggestions & SuperChat
  getSuggestions: () => request<SuggestionSuperChat[]>('/suggestions'),
  submitSuggestion: (data: Partial<SuggestionSuperChat> & { walletId?: string }) =>
    request<SuggestionSuperChat>('/suggestions', { method: 'POST', body: JSON.stringify(data) }),
  upvoteSuggestion: (id: string) => request<{ upvotes: number; hasUpvoted: boolean }>(`/suggestions/${id}/upvote`, { method: 'POST' }),
  getAdminSuggestions: () => request<{ suggestions: SuggestionSuperChat[]; stats: any }>('/admin/suggestions'),
  updateAdminSuggestion: (id: string, data: { status?: string; adminReply?: string; isSuperChatVerified?: boolean }) =>
    request<SuggestionSuperChat>(`/admin/suggestions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAdminSuggestion: (id: string) => request<{ message: string }>(`/admin/suggestions/${id}`, { method: 'DELETE' }),
};
