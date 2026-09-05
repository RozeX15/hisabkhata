import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { I18nProvider, useI18n } from './lib/i18n';
import { api } from './lib/api';
import { safeStorage } from './lib/storage';
import { playNotificationChime, triggerNativePushNotification } from './lib/pushNotifications';
import {
  Wallet,
  Category,
  Transaction,
  BudgetProgress,
  SavingsGoal,
  Loan,
  DashboardSummary,
  AppNotification
} from './types';

// Layout & Components
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { MobileNav } from './components/MobileNav';
import { TransactionModal } from './components/TransactionModal';
import { WalletModal } from './components/WalletModal';
import { BudgetModal } from './components/BudgetModal';
import { SavingsGoalModal, SavingsContributeModal } from './components/SavingsGoalModal';
import { LoanModal, LoanPaymentModal } from './components/LoanModal';
import { UpgradeModal } from './components/UpgradeModal';
import { AiAdvisorModal } from './components/AiAdvisorModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { DownloadAppModal } from './components/DownloadAppModal';
import { OnboardingTutorialModal } from './components/OnboardingTutorialModal';
import { LiveNotificationToast } from './components/LiveNotificationToast';
import { ActionConfirmationPopup } from './components/ActionConfirmationPopup';
import { AppFooter } from './components/AppFooter';
import { usePWAInstall } from './lib/usePWAInstall';
import { recordActionConfirmation } from './lib/actionNotifications';
import { usePresenceTracker } from './lib/usePresenceTracker';
import { DEFAULT_CATEGORIES } from './constants/categories';
import { Download, Sparkles, X, ArrowUp } from 'lucide-react';

// Views
import { LandingPage } from './views/LandingPage';
import { AuthView } from './views/AuthView';
import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { WalletsView } from './views/WalletsView';
import { BudgetsView } from './views/BudgetsView';
import { SavingsGoalsView } from './views/SavingsGoalsView';
import { LoansView } from './views/LoansView';
import { SmartInsightsView } from './views/SmartInsightsView';
import { ReportsView } from './views/ReportsView';
import { NotificationsView } from './views/NotificationsView';
import { SettingsView } from './views/SettingsView';
import { AdminView } from './views/AdminView';
import { SuggestionsView } from './views/SuggestionsView';
import { LegalViews } from './views/LegalViews';

const MainAppContent: React.FC = () => {
  const { user, token, logout, loginWithGoogle, loginSultanAdmin } = useAuth();
  const { isRTL, currency, setCurrency } = useI18n();

  // Clean stale reload locks once React mounts cleanly
  useEffect(() => {
    try {
      sessionStorage.removeItem('hk_chunk_reload_lock');
    } catch {
      /* ignore */
    }
  }, []);

  // Navigation State
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [lastNonLegalView, setLastNonLegalView] = useState<string>('dashboard');
  const [legalType, setLegalType] = useState<'privacy' | 'terms' | 'about'>('about');
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return safeStorage.getItem('hishab_dark_mode') === 'true';
  });

  const scrollToTop = () => {
    const scrollContainer =
      document.getElementById('main-scroll-container') ||
      document.querySelector('div.overflow-y-auto') ||
      document.querySelector('main');
    if (scrollContainer) {
      try {
        scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        scrollContainer.scrollTop = 0;
      }
    }
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      window.scrollTo(0, 0);
    }
    try {
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      document.documentElement.scrollTop = 0;
    }
  };

  const handleNavigate = (view: string) => {
    if (view !== 'legal') {
      setLastNonLegalView(view);
    }
    setActiveView(view);
    scrollToTop();
  };

  const handleOpenLegal = (type: 'privacy' | 'terms' | 'about') => {
    setLegalType(type);
    if (activeView !== 'legal') {
      setLastNonLegalView(activeView);
    }
    setActiveView('legal');
    scrollToTop();
  };

  // Listen to scroll events on main canvas container to toggle floating Back to Top
  useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container');
    if (!scrollContainer) return;

    const onScroll = () => {
      if (scrollContainer.scrollTop > 260) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    scrollContainer.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', onScroll);
  }, [user, token, activeView]);

  // Realtime Live Presence Tracker
  usePresenceTracker(user, token, activeView);

  // Data States
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetProgress[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadNotifsCount, setUnreadNotifsCount] = useState<number>(0);
  const [liveToastNotification, setLiveToastNotification] = useState<AppNotification | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(false);
  const knownNotificationIds = useRef<Set<string>>(new Set());

  // Modals
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalInitialType, setTxModalInitialType] = useState<'income' | 'expense' | 'transfer'>('expense');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<SavingsGoal | null>(null);

  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [paymentLoan, setPaymentLoan] = useState<Loan | null>(null);

  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);

  // PWA One-Tap Install integration
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [installBannerDismissed, setInstallBannerDismissed] = useState(() => {
    return safeStorage.getItem('hk_install_banner_dismissed') === 'true';
  });

  const handleOpenDownloadApp = useCallback(async () => {
    // If native 1-tap browser prompt is ready, trigger it directly!
    if (isInstallable) {
      const accepted = await install();
      if (accepted) return;
    }
    // Otherwise open the download modal with platform guides and launcher download
    setIsDownloadModalOpen(true);
  }, [isInstallable, install]);

  // Auto-launch Onboarding Tutorial for new accounts or first-time users
  useEffect(() => {
    if (user?.id) {
      const userTutorialKey = `hk_onboarding_${user.id}`;
      const hasSeenUser = safeStorage.getItem(userTutorialKey);
      const hasSeenGlobal = safeStorage.getItem('hk_onboarding_completed');
      if (!hasSeenUser && !hasSeenGlobal) {
        // Automatically display the tutorial
        const timer = setTimeout(() => {
          setIsOnboardingModalOpen(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [user?.id]);

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    safeStorage.setItem('hishab_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  // Load All User Financial Data
  const loadAllData = useCallback(async () => {
    if (!token) return;
    setLoadingData(true);
    try {
      const [
        summaryRes,
        walletsRes,
        categoriesRes,
        txRes,
        budgetsRes,
        goalsRes,
        loansRes,
        notifsRes,
      ] = await Promise.allSettled([
        api.getDashboardSummary(),
        api.getWallets(),
        api.getCategories(),
        api.getTransactions(),
        api.getBudgets(),
        api.getSavingsGoals(),
        api.getLoans(),
        api.getNotifications(),
      ]);

      if (summaryRes.status === 'fulfilled') {
        const val = summaryRes.value;
        setSummary((val as any)?.summary || val);
      }
      if (walletsRes.status === 'fulfilled') {
        const val = walletsRes.value;
        const loadedWallets = (val as any)?.wallets || val || [];
        if (Array.isArray(loadedWallets) && loadedWallets.length > 0) {
          setWallets(loadedWallets);
        } else {
          setWallets(prev => prev.length > 0 ? prev : [{
            id: 'w-cash-default',
            userId: user?.id || '',
            name: 'Cash / Main Account (নগদ হিসাব)',
            type: 'cash',
            balance: 0,
            currency: currency || 'BDT',
            color: '#10B981',
            isDefault: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }]);
        }
      }
      if (categoriesRes.status === 'fulfilled') {
        const val = categoriesRes.value;
        const loadedCats = (val as any)?.categories || val || [];
        setCategories(Array.isArray(loadedCats) && loadedCats.length > 0 ? loadedCats : DEFAULT_CATEGORIES);
      } else {
        setCategories(prev => prev.length > 0 ? prev : DEFAULT_CATEGORIES);
      }
      if (txRes.status === 'fulfilled') {
        const val = txRes.value;
        setTransactions((val as any)?.transactions || val || []);
      }
      if (budgetsRes.status === 'fulfilled') {
        const val = budgetsRes.value;
        setBudgets((val as any)?.budgets || val || []);
      }
      if (goalsRes.status === 'fulfilled') {
        const val = goalsRes.value;
        setSavingsGoals((val as any)?.savingsGoals || val || []);
      }
      if (loansRes.status === 'fulfilled') {
        const val = loansRes.value;
        setLoans((val as any)?.loans || val || []);
      }
      if (notifsRes.status === 'fulfilled') {
        const val = notifsRes.value;
        const notifsList: AppNotification[] = (val as any)?.notifications || val || [];
        setNotifications(notifsList);
        setUnreadNotifsCount(notifsList.filter((n: any) => !n.isRead).length);
        notifsList.forEach(n => knownNotificationIds.current.add(n.id));
      }
    } catch (err: any) {
      console.error('Failed to load application data:', err);
    } finally {
      setLoadingData(false);
    }
  }, [token]);

  useEffect(() => {
    if (user && token) {
      loadAllData();
      const userCurr = user.preferredCurrency || (user as any).defaultCurrency;
      if (userCurr && userCurr !== currency) {
        setCurrency(userCurr);
      }
    }
  }, [user, token, loadAllData]);

  // Background Push Notification Polling (Realtime Sync)
  useEffect(() => {
    if (!user || !token) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await api.pollNotifications();
        if (res && res.notifications) {
          const freshList = res.notifications;
          setNotifications(freshList);
          setUnreadNotifsCount(res.unreadCount);

          // Find newly arrived unread notifications not known yet
          const brandNew = freshList.find(
            n => !n.isRead && !knownNotificationIds.current.has(n.id)
          );

          if (brandNew) {
            setLiveToastNotification(brandNew);
            playNotificationChime();
            triggerNativePushNotification(
              brandNew.userId === null ? `📢 ${brandNew.titleKey}` : `🔔 ${brandNew.titleKey}`,
              brandNew.messageKey
            );
          }

          freshList.forEach(n => knownNotificationIds.current.add(n.id));
        }
      } catch (err) {
        // Silent polling error catch
      }
    }, 10000);

    return () => clearInterval(pollInterval);
  }, [user, token]);

  // Auto-dismiss live toast after 6s
  useEffect(() => {
    if (!liveToastNotification) return;
    const timer = setTimeout(() => {
      setLiveToastNotification(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [liveToastNotification]);

  // Public Landing / Auth Views
  if (!user || !token) {
    if (activeView === 'legal') {
      return (
        <LegalViews
          type={legalType}
          isAuthenticated={false}
          onBack={() => setActiveView('landing')}
          onSelectType={(t) => setLegalType(t)}
        />
      );
    }

    if (activeView === 'auth' || activeView === 'login' || activeView === 'register') {
      return (
        <AuthView
          onBackToLanding={() => setActiveView('landing')}
          onViewLegal={handleOpenLegal}
          onSuccess={(loggedInUser) => {
            if (loggedInUser?.role === 'admin' || loggedInUser?.email === 'sultanitbangladesh@gmail.com') {
              setActiveView('admin');
            } else {
              setActiveView('dashboard');
            }
            loadAllData();
          }}
        />
      );
    }

    return (
      <>
        <LandingPage
          onGetStarted={() => setActiveView('auth')}
          onLogin={() => setActiveView('auth')}
          onGoogleSignIn={async () => {
            try {
              const loggedIn = await loginWithGoogle();
              if (loggedIn?.role === 'admin' || loggedIn?.email === 'sultanitbangladesh@gmail.com') {
                setActiveView('admin');
              } else {
                setActiveView('dashboard');
              }
              loadAllData();
            } catch {
              setActiveView('auth');
            }
          }}
          onViewLegal={handleOpenLegal}
          onOpenDownloadApp={handleOpenDownloadApp}
        />
        <DownloadAppModal
          isOpen={isDownloadModalOpen}
          onClose={() => setIsDownloadModalOpen(false)}
        />
      </>
    );
  }

  // Handlers for Transactions
  const handleSaveTransaction = async (data: any) => {
    const numAmount = Number(data.amount) || 0;
    const nowIso = new Date().toISOString();
    let apiSuccess = false;

    try {
      if (editingTx) {
        await api.updateTransaction(editingTx.id, data);
      } else {
        await api.createTransaction(data);
      }
      apiSuccess = true;
    } catch (apiErr) {
      console.warn('Backend API unreachable or slow, applying resilient local ledger write:', apiErr);

      // Resilient local state update
      if (editingTx) {
        setTransactions(prev => prev.map(t => t.id === editingTx.id ? { ...t, ...data, amount: numAmount, updatedAt: nowIso } : t));
      } else {
        const localTx: Transaction = {
          id: `tx-loc-${Date.now()}`,
          userId: user?.id || 'usr-local',
          walletId: data.walletId,
          toWalletId: data.toWalletId || null,
          type: data.type,
          amount: numAmount,
          currency: data.currency || currency,
          categoryId: data.categoryId,
          date: data.date || nowIso.split('T')[0],
          description: data.description || (data.type === 'income' ? 'Income' : data.type === 'expense' ? 'Expense' : 'Transfer'),
          note: data.note || '',
          isRecurring: Boolean(data.isRecurring),
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        setTransactions(prev => [localTx, ...prev]);

        // Optimistically update wallet balance
        setWallets(prev => prev.map(w => {
          if (w.id === data.walletId) {
            const currentBal = Number(w.balance) || 0;
            const delta = data.type === 'income' ? numAmount : -numAmount;
            return { ...w, balance: currentBal + delta, updatedAt: nowIso };
          }
          if (data.type === 'transfer' && w.id === data.toWalletId) {
            const currentBal = Number(w.balance) || 0;
            return { ...w, balance: currentBal + numAmount, updatedAt: nowIso };
          }
          return w;
        }));
      }
    }

    recordActionConfirmation({
      type: editingTx ? 'transaction_update' : 'transaction_add',
      category: 'TRANSACTION',
      title: editingTx
        ? 'Transaction Updated'
        : (data.type === 'income' ? 'Income Added!' : data.type === 'transfer' ? 'Transfer Recorded!' : 'Expense Recorded!'),
      message: `Successfully recorded "${data.description || 'Transaction'}"`,
      details: `Amount: ৳${numAmount.toLocaleString()} • Type: ${data.type?.toUpperCase()} • Date: ${data.date}`,
      amount: numAmount,
      currency: data.currency || currency,
      status: 'confirmed',
    });

    if (apiSuccess) {
      try {
        await loadAllData();
      } catch {}
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction? Wallet balances will be recalculated.')) {
      const target = transactions.find(t => t.id === id);
      try {
        await api.deleteTransaction(id);
      } catch (err) {
        console.warn('API delete failed, applying local removal:', err);
      }

      // Local state update
      setTransactions(prev => prev.filter(t => t.id !== id));
      if (target) {
        const numAmount = Number(target.amount) || 0;
        setWallets(prev => prev.map(w => {
          if (w.id === target.walletId) {
            const currentBal = Number(w.balance) || 0;
            const delta = target.type === 'income' ? -numAmount : numAmount;
            return { ...w, balance: currentBal + delta };
          }
          if (target.type === 'transfer' && w.id === target.toWalletId) {
            const currentBal = Number(w.balance) || 0;
            return { ...w, balance: currentBal - numAmount };
          }
          return w;
        }));
      }

      recordActionConfirmation({
        type: 'transaction_delete',
        category: 'TRANSACTION',
        title: 'Transaction Deleted',
        message: `Removed "${target?.description || 'Transaction'}"`,
        details: 'Wallet balances and budget metrics have been automatically recalculated.',
        amount: target?.amount,
        currency: target?.currency || currency,
        status: 'deleted',
      });

      try {
        await loadAllData();
      } catch {}
    }
  };

  // Handlers for Wallets
  const handleSaveWallet = async (data: any) => {
    const nowIso = new Date().toISOString();
    try {
      if (editingWallet) {
        await api.updateWallet(editingWallet.id, data);
      } else {
        await api.createWallet(data);
      }
    } catch (err) {
      console.warn('API wallet write failed, updating local state:', err);
      if (editingWallet) {
        setWallets(prev => prev.map(w => w.id === editingWallet.id ? { ...w, ...data, updatedAt: nowIso } : w));
      } else {
        const newW: Wallet = {
          id: `w-loc-${Date.now()}`,
          userId: user?.id || 'usr-local',
          name: data.name,
          type: data.type || 'cash',
          balance: Number(data.balance) || 0,
          currency: data.currency || currency,
          color: data.color || '#10B981',
          isDefault: Boolean(data.isDefault),
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        setWallets(prev => [...prev, newW]);
      }
    }

    recordActionConfirmation({
      type: editingWallet ? 'wallet_update' : 'wallet_add',
      category: 'WALLET',
      title: editingWallet ? 'Wallet Updated' : 'New Wallet Created!',
      message: `Successfully saved wallet "${data.name}"`,
      details: `Type: ${data.type?.toUpperCase()} • Balance: ৳${Number(data.balance || 0).toLocaleString()}`,
      amount: data.balance,
      currency: data.currency || currency,
      status: 'confirmed',
    });

    try {
      await loadAllData();
    } catch {}
  };

  const handleDeleteWallet = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this wallet?')) {
      const target = wallets.find(w => w.id === id);
      await api.deleteWallet(id);
      recordActionConfirmation({
        type: 'wallet_delete',
        category: 'WALLET',
        title: 'Wallet Removed',
        message: `Deleted wallet "${target?.name || 'Account'}"`,
        details: 'Associated accounts and ledger relations adjusted.',
        amount: target?.balance,
        currency: target?.currency || currency,
        status: 'deleted',
      });
      await loadAllData();
    }
  };

  // Handlers for Budgets
  const handleSaveBudget = async (data: any) => {
    await api.createBudget(data);
    recordActionConfirmation({
      type: 'budget_add',
      category: 'BUDGET',
      title: 'Budget Limit Set!',
      message: `Monthly limit established for category.`,
      details: `Month: ${data.month} • Cap: ${data.amount} ${currency}`,
      amount: data.amount,
      currency: currency,
      status: 'confirmed',
    });
    await loadAllData();
  };

  const handleDeleteBudget = async (id: string) => {
    if (window.confirm('Delete this budget limit?')) {
      await api.deleteBudget(id);
      recordActionConfirmation({
        type: 'budget_delete',
        category: 'BUDGET',
        title: 'Budget Limit Deleted',
        message: 'Category budget restriction removed.',
        status: 'deleted',
      });
      await loadAllData();
    }
  };

  // Handlers for Savings Goals
  const handleSaveSavingsGoal = async (data: any) => {
    await api.createSavingsGoal(data);
    recordActionConfirmation({
      type: 'goal_add',
      category: 'SAVINGS',
      title: 'Savings Goal Created!',
      message: `Goal established for "${data.name}"`,
      details: `Target: ${data.targetAmount} ${data.currency || currency}`,
      amount: data.targetAmount,
      currency: data.currency || currency,
      status: 'confirmed',
    });
    await loadAllData();
  };

  const handleContributeSavingsGoal = async (goalId: string, amount: number, walletId: string) => {
    await api.contributeSavingsGoal(goalId, amount, walletId);
    const targetGoal = savingsGoals.find(g => g.id === goalId);
    recordActionConfirmation({
      type: 'goal_contribute',
      category: 'SAVINGS',
      title: 'Savings Deposit Saved!',
      message: `Added funds towards "${targetGoal?.name || 'Goal'}"`,
      details: `Deposited: ${amount} ${currency}`,
      amount,
      currency,
      status: 'confirmed',
    });
    await loadAllData();
  };

  const handleDeleteSavingsGoal = async (id: string) => {
    if (window.confirm('Delete this savings goal?')) {
      const targetGoal = savingsGoals.find(g => g.id === id);
      await api.deleteSavingsGoal(id);
      recordActionConfirmation({
        type: 'goal_delete',
        category: 'SAVINGS',
        title: 'Savings Goal Deleted',
        message: `Removed savings milestone "${targetGoal?.name || 'Goal'}"`,
        status: 'deleted',
      });
      await loadAllData();
    }
  };

  // Handlers for Loans
  const handleSaveLoan = async (data: any) => {
    await api.createLoan(data);
    recordActionConfirmation({
      type: 'loan_add',
      category: 'LOAN',
      title: 'Loan Entry Recorded!',
      message: `${data.type === 'borrowed' ? 'Borrowed loan' : 'Lent funds'} with ${data.personName}`,
      details: `Principal: ${data.amount} ${data.currency || currency}`,
      amount: data.amount,
      currency: data.currency || currency,
      status: 'confirmed',
    });
    await loadAllData();
  };

  const handleRecordLoanPayment = async (loanId: string, amount: number, walletId: string, note?: string) => {
    await api.recordLoanPayment(loanId, amount, walletId, note);
    const targetLoan = loans.find(l => l.id === loanId);
    recordActionConfirmation({
      type: 'loan_payment',
      category: 'LOAN',
      title: 'Loan Repayment Saved!',
      message: `Payment of ${amount} ${currency} recorded for ${targetLoan?.personName || 'Loan'}`,
      details: note || 'Ledger and wallet balance updated.',
      amount,
      currency,
      status: 'confirmed',
    });
    await loadAllData();
  };

  const handleDeleteLoan = async (id: string) => {
    if (window.confirm('Delete this loan entry?')) {
      const targetLoan = loans.find(l => l.id === id);
      await api.deleteLoan(id);
      recordActionConfirmation({
        type: 'loan_delete',
        category: 'LOAN',
        title: 'Loan Record Deleted',
        message: `Removed loan with "${targetLoan?.personName || 'Record'}"`,
        status: 'deleted',
      });
      await loadAllData();
    }
  };

  // Handlers for Notifications
  const handleMarkNotifRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadNotifsCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllNotifsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadNotifsCount(0);
  };

  const handleDeleteNotif = async (id: string) => {
    try {
      await api.deleteNotification(id);
      setNotifications((prev) => {
        const target = prev.find(n => n.id === id);
        if (target && !target.isRead) {
          setUnreadNotifsCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleClearAllNotifs = async () => {
    try {
      await api.clearAllNotifications();
      setNotifications([]);
      setUnreadNotifsCount(0);
    } catch (err) {
      console.error('Failed to clear notifications:', err);
    }
  };

  // Reset Demo Data
  const handleResetData = async () => {
    await api.resetDemoData();
    await loadAllData();
  };

  return (
    <div className={`min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Desktop Sidebar */}
      <Sidebar
        activeView={activeView}
        onNavigate={handleNavigate}
        unreadNotifsCount={unreadNotifsCount}
        onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
        onOpenDownloadApp={handleOpenDownloadApp}
        onOpenTutorial={() => setIsOnboardingModalOpen(true)}
      />

      {/* Main App Canvas */}
      <div id="main-scroll-container" className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto relative scroll-smooth">
        <Topbar
          onOpenAddTransaction={() => {
            setEditingTx(null);
            setTxModalInitialType('expense');
            setIsTxModalOpen(true);
          }}
          onOpenAiAdvisor={() => setIsAiModalOpen(true)}
          onOpenNotifications={() => setIsNotifDrawerOpen(true)}
          unreadNotificationsCount={unreadNotifsCount}
          isDarkMode={isDarkMode}
          onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
          onOpenDownloadApp={handleOpenDownloadApp}
          onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
          onOpenTutorial={() => setIsOnboardingModalOpen(true)}
          activeView={activeView}
          onNavigate={handleNavigate}
        />

        {/* Quick One-Tap Install Banner when not in standalone mode */}
        {!isInstalled && !installBannerDismissed && (
          <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white px-3 sm:px-6 py-2 flex items-center justify-between gap-2 border-b border-teal-700/60 shadow-xs text-xs shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
                <Download className="w-4 h-4 animate-bounce" />
              </div>
              <p className="truncate font-medium text-slate-100">
                <span className="font-bold text-amber-300">ইনস্টল করুন:</span> হোম স্ক্রিনে ১-ট্যাপে সরাসরি হিসাব খাতা অ্যাপ যোগ করুন
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                id="quick-install-banner-btn"
                type="button"
                onClick={handleOpenDownloadApp}
                className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-lg transition cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Install Now</span>
              </button>
              <button
                id="dismiss-install-banner-btn"
                type="button"
                onClick={() => {
                  setInstallBannerDismissed(true);
                  safeStorage.setItem('hk_install_banner_dismissed', 'true');
                }}
                className="p-1 text-teal-300 hover:text-white rounded-md transition cursor-pointer"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Dynamic View Switcher */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-8 transition-all">
          {activeView === 'dashboard' && (
            <DashboardView
              summary={summary}
              wallets={wallets}
              categories={categories}
              currency={currency}
              transactions={transactions}
              baseCurrency={user?.preferredCurrency || 'BDT'}
              onOpenAddTransaction={(type) => {
                setEditingTx(null);
                setTxModalInitialType(type || 'expense');
                setIsTxModalOpen(true);
              }}
              onOpenAddGoal={() => setIsGoalModalOpen(true)}
              onOpenContributeGoal={(goal) => setContributeGoal(goal)}
              onOpenAddBudget={() => setIsBudgetModalOpen(true)}
              onOpenAiAdvisor={() => setIsAiModalOpen(true)}
              onNavigate={(v) => setActiveView(v)}
              onRefreshData={loadAllData}
            />
          )}

          {activeView === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              wallets={wallets}
              categories={categories}
              currency={currency}
              userName={user.name}
              onOpenAddTransaction={() => {
                setEditingTx(null);
                setTxModalInitialType('expense');
                setIsTxModalOpen(true);
              }}
              onEditTransaction={(tx) => {
                setEditingTx(tx);
                setIsTxModalOpen(true);
              }}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeView === 'wallets' && (
            <WalletsView
              wallets={wallets}
              currency={currency}
              userPlan={user.plan}
              onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
              onOpenAddWallet={() => {
                setEditingWallet(null);
                setIsWalletModalOpen(true);
              }}
              onEditWallet={(w) => {
                setEditingWallet(w);
                setIsWalletModalOpen(true);
              }}
              onDeleteWallet={handleDeleteWallet}
              onOpenTransfer={() => {
                setEditingTx(null);
                setTxModalInitialType('transfer');
                setIsTxModalOpen(true);
              }}
            />
          )}

          {activeView === 'budgets' && (
            <BudgetsView
              budgets={budgets}
              currency={currency}
              onOpenAddBudget={() => setIsBudgetModalOpen(true)}
              onDeleteBudget={handleDeleteBudget}
            />
          )}

          {(activeView === 'savings' || activeView === 'savings_goals') && (
            <SavingsGoalsView
              goals={savingsGoals}
              currency={currency}
              onOpenAddGoal={() => setIsGoalModalOpen(true)}
              onOpenContribute={(g) => setContributeGoal(g)}
              onDeleteGoal={handleDeleteSavingsGoal}
            />
          )}

          {activeView === 'loans' && (
            <LoansView
              loans={loans}
              currency={currency}
              onOpenAddLoan={() => setIsLoanModalOpen(true)}
              onOpenPayment={(loan) => setPaymentLoan(loan)}
              onDeleteLoan={handleDeleteLoan}
            />
          )}

          {activeView === 'insights' && (
            <SmartInsightsView
              insights={summary?.smartInsights || []}
              currency={currency}
              transactions={transactions}
              onOpenAddTransaction={() => {
                setEditingTx(null);
                setTxModalInitialType('expense');
                setIsTxModalOpen(true);
              }}
              onOpenAiAdvisor={() => setIsAiModalOpen(true)}
            />
          )}

          {activeView === 'reports' && (
            <ReportsView
              summary={summary}
              transactions={transactions}
              wallets={wallets}
              categories={categories}
              currency={currency}
              userName={user.name}
              userPlan={user.plan}
              onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
            />
          )}

          {activeView === 'notifications' && (
            <NotificationsView
              notifications={notifications}
              onMarkRead={handleMarkNotifRead}
              onMarkAllRead={handleMarkAllNotifsRead}
              onDelete={handleDeleteNotif}
              onClearAll={handleClearAllNotifs}
              onNavigate={(view) => setActiveView(view)}
            />
          )}

          {activeView === 'settings' && (
            <SettingsView
              onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
              onDataReset={handleResetData}
              isDarkMode={isDarkMode}
              onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
              onOpenDownloadApp={handleOpenDownloadApp}
              onNavigate={(v) => setActiveView(v)}
            />
          )}

          {activeView === 'suggestions' && (
            <SuggestionsView
              currency={currency}
              wallets={wallets}
              onNavigate={(v) => setActiveView(v)}
              onRefreshWallets={loadAllData}
            />
          )}

          {activeView === 'admin' && user.role === 'admin' && (
            <AdminView onNavigate={handleNavigate} />
          )}

          {activeView === 'legal' && (
            <LegalViews
              type={legalType}
              isAuthenticated={true}
              onBack={() => handleNavigate(lastNonLegalView || 'dashboard')}
              onSelectType={(t) => setLegalType(t)}
            />
          )}

          {/* Unified App Footer for both user and admin view */}
          <AppFooter
            activeView={activeView}
            isAdminView={activeView === 'admin'}
            onNavigate={handleNavigate}
            onViewLegal={handleOpenLegal}
            onOpenDownloadApp={handleOpenDownloadApp}
            userEmail={user?.email}
            userRole={user?.role}
          />
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav
          activeView={activeView}
          isAdmin={user.role === 'admin'}
          onNavigate={handleNavigate}
          onOpenAddTransaction={() => {
            setEditingTx(null);
            setTxModalInitialType('expense');
            setIsTxModalOpen(true);
          }}
          onOpenDownloadApp={handleOpenDownloadApp}
        />

        {/* Floating Quick Scroll to Top Button */}
        {showScrollTop && (
          <button
            id="floating-back-to-top-btn"
            type="button"
            onClick={scrollToTop}
            className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-40 p-3 rounded-full bg-teal-700 hover:bg-teal-800 text-white shadow-xl shadow-teal-950/30 hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center border border-teal-600/50"
            title="Scroll to top"
            aria-label="Scroll to top"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Modals Container */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        onSave={handleSaveTransaction}
        wallets={wallets}
        categories={categories}
        defaultCurrency={currency}
        initialType={txModalInitialType}
        transaction={editingTx}
      />

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => {
          setIsWalletModalOpen(false);
          setEditingWallet(null);
        }}
        onSave={handleSaveWallet}
        wallet={editingWallet}
        defaultCurrency={currency}
        onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onSave={handleSaveBudget}
        categories={categories}
        defaultCurrency={currency}
      />

      <SavingsGoalModal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        onSave={handleSaveSavingsGoal}
        defaultCurrency={currency}
      />

      <SavingsContributeModal
        isOpen={!!contributeGoal}
        onClose={() => setContributeGoal(null)}
        goal={contributeGoal}
        wallets={wallets}
        onContribute={handleContributeSavingsGoal}
        defaultCurrency={currency}
      />

      <LoanModal
        isOpen={isLoanModalOpen}
        onClose={() => setIsLoanModalOpen(false)}
        onSave={handleSaveLoan}
        defaultCurrency={currency}
      />

      <LoanPaymentModal
        isOpen={!!paymentLoan}
        onClose={() => setPaymentLoan(null)}
        loan={paymentLoan}
        wallets={wallets}
        onRecordPayment={handleRecordLoanPayment}
        defaultCurrency={currency}
      />

      <UpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onSuccess={loadAllData}
      />

      {/* New User Interactive Guided Tutorial */}
      <OnboardingTutorialModal
        isOpen={isOnboardingModalOpen}
        onClose={() => setIsOnboardingModalOpen(false)}
        onOpenUpgrade={() => {
          setIsOnboardingModalOpen(false);
          setIsUpgradeModalOpen(true);
        }}
        userId={user?.id}
      />

      <AiAdvisorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        defaultCurrency={currency}
      />

      <NotificationDrawer
        isOpen={isNotifDrawerOpen}
        onClose={() => setIsNotifDrawerOpen(false)}
        notifications={notifications}
        onMarkRead={handleMarkNotifRead}
        onMarkAllRead={handleMarkAllNotifsRead}
        onDelete={handleDeleteNotif}
        onClearAll={handleClearAllNotifs}
        onNavigate={(v) => setActiveView(v)}
      />

      <DownloadAppModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      <LiveNotificationToast
        notification={liveToastNotification}
        onClose={() => setLiveToastNotification(null)}
        onClick={() => {
          if (liveToastNotification) {
            handleMarkNotifRead(liveToastNotification.id);
          }
          setLiveToastNotification(null);
          setIsNotifDrawerOpen(true);
        }}
      />

      {/* Confirmation Notification Pop-up on current window */}
      <ActionConfirmationPopup
        onViewDashboardLog={() => {
          setActiveView('dashboard');
          setTimeout(() => {
            const widget = document.getElementById('dashboard-activity-log-widget');
            if (widget) {
              widget.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 120);
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <MainAppContent />
      </I18nProvider>
    </AuthProvider>
  );
}
