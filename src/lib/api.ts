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
  SystemPlanLimits
} from '../types';

const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('hk_auth_token');
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem('hk_auth_token', token);
  } else {
    localStorage.removeItem('hk_auth_token');
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
      errorMsg = data.error || data.message || '';
    } catch {
      // Non-JSON response
    }

    if (!errorMsg) {
      if (response.status === 401) {
        errorMsg = 'Invalid email or password. Please verify and try again.';
      } else if (response.status === 400) {
        errorMsg = 'Invalid request. Please check all provided input fields.';
      } else if (response.status === 403) {
        errorMsg = 'Access forbidden or account deactivated.';
      } else if (response.status === 404) {
        errorMsg = 'Requested resource was not found.';
      } else if (response.status >= 500) {
        errorMsg = 'Server error occurred. Please try again shortly.';
      } else {
        errorMsg = `Request failed with status ${response.status}`;
      }
    }

    throw new Error(errorMsg);
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
  markNotificationRead: (id: string) => request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request<{ success: boolean }>('/notifications/read-all', { method: 'PUT' }),

  // Languages & Translations
  getLanguages: () => request<LanguageInfo[]>('/languages'),

  // Admin
  getAdminStats: () => request<AdminStats>('/admin/stats'),
  getAdminUsers: () => request<any[]>('/admin/users'),
  updateUserStatus: (id: string, status: string) => request<any>(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  updateUserPlan: (id: string, plan: string) => request<any>(`/admin/users/${id}/plan`, { method: 'PUT', body: JSON.stringify({ plan }) }),
  updateAdminUser: (id: string, data: any) => {
    if (data.status) return request<any>(`/admin/users/${id}/status`, { method: 'PUT', body: JSON.stringify({ status: data.status }) });
    if (data.plan) return request<any>(`/admin/users/${id}/plan`, { method: 'PUT', body: JSON.stringify({ plan: data.plan }) });
    return Promise.resolve({ success: true });
  },
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
};
