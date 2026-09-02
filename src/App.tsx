import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './lib/auth';
import { I18nProvider, useI18n } from './lib/i18n';
import { api } from './lib/api';
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
import { LiveNotificationToast } from './components/LiveNotificationToast';
import { usePresenceTracker } from './lib/usePresenceTracker';

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
import { SettingsView } from './views/SettingsView';
import { AdminView } from './views/AdminView';
import { LegalViews } from './views/LegalViews';

const MainAppContent: React.FC = () => {
  const { user, token, logout, loginDemoUser, loginWithGoogle } = useAuth();
  const { isRTL, currency, setCurrency } = useI18n();

  // Navigation State
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [legalType, setLegalType] = useState<'privacy' | 'terms' | 'about'>('about');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('hishab_dark_mode') === 'true';
  });

  // Realtime Live Presence Tracker
  usePresenceTracker(user, token, activeView);

  // Data States
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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

  // Sync dark mode class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('hishab_dark_mode', String(isDarkMode));
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
      ] = await Promise.all([
        api.getDashboardSummary(),
        api.getWallets(),
        api.getCategories(),
        api.getTransactions(),
        api.getBudgets(),
        api.getSavingsGoals(),
        api.getLoans(),
        api.getNotifications(),
      ]);

      setSummary((summaryRes as any).summary || summaryRes);
      setWallets((walletsRes as any).wallets || walletsRes || []);
      setCategories((categoriesRes as any).categories || categoriesRes || []);
      setTransactions((txRes as any).transactions || txRes || []);
      setBudgets((budgetsRes as any).budgets || budgetsRes || []);
      setSavingsGoals((goalsRes as any).savingsGoals || goalsRes || []);
      setLoans((loansRes as any).loans || loansRes || []);
      const notifsList: AppNotification[] = (notifsRes as any).notifications || notifsRes || [];
      setNotifications(notifsList);
      setUnreadNotifsCount(notifsList.filter((n: any) => !n.isRead).length);
      notifsList.forEach(n => knownNotificationIds.current.add(n.id));
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
      return <LegalViews type={legalType} onBack={() => setActiveView('landing')} />;
    }

    if (activeView === 'auth' || activeView === 'login' || activeView === 'register') {
      return (
        <AuthView
          onSuccess={() => {
            setActiveView('dashboard');
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
              await loginWithGoogle();
              setActiveView('dashboard');
              loadAllData();
            } catch {
              setActiveView('auth');
            }
          }}
          onDemoUser={async () => {
            await loginDemoUser();
            setActiveView('dashboard');
            loadAllData();
          }}
          onViewLegal={(type) => {
            setLegalType(type);
            setActiveView('legal');
          }}
          onOpenDownloadApp={() => setIsDownloadModalOpen(true)}
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
    if (editingTx) {
      await api.updateTransaction(editingTx.id, data);
    } else {
      await api.createTransaction(data);
    }
    await loadAllData();
  };

  const handleDeleteTransaction = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction? Wallet balances will be recalculated.')) {
      await api.deleteTransaction(id);
      await loadAllData();
    }
  };

  // Handlers for Wallets
  const handleSaveWallet = async (data: any) => {
    if (editingWallet) {
      await api.updateWallet(editingWallet.id, data);
    } else {
      await api.createWallet(data);
    }
    await loadAllData();
  };

  const handleDeleteWallet = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this wallet?')) {
      await api.deleteWallet(id);
      await loadAllData();
    }
  };

  // Handlers for Budgets
  const handleSaveBudget = async (data: any) => {
    await api.createBudget(data);
    await loadAllData();
  };

  const handleDeleteBudget = async (id: string) => {
    if (window.confirm('Delete this budget limit?')) {
      await api.deleteBudget(id);
      await loadAllData();
    }
  };

  // Handlers for Savings Goals
  const handleSaveSavingsGoal = async (data: any) => {
    await api.createSavingsGoal(data);
    await loadAllData();
  };

  const handleContributeSavingsGoal = async (goalId: string, amount: number, walletId: string) => {
    await api.contributeSavingsGoal(goalId, amount, walletId);
    await loadAllData();
  };

  const handleDeleteSavingsGoal = async (id: string) => {
    if (window.confirm('Delete this savings goal?')) {
      await api.deleteSavingsGoal(id);
      await loadAllData();
    }
  };

  // Handlers for Loans
  const handleSaveLoan = async (data: any) => {
    await api.createLoan(data);
    await loadAllData();
  };

  const handleRecordLoanPayment = async (loanId: string, amount: number, walletId: string, note?: string) => {
    await api.recordLoanPayment(loanId, amount, walletId, note);
    await loadAllData();
  };

  const handleDeleteLoan = async (id: string) => {
    if (window.confirm('Delete this loan entry?')) {
      await api.deleteLoan(id);
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
        onNavigate={(v) => setActiveView(v)}
        onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
        onOpenDownloadApp={() => setIsDownloadModalOpen(true)}
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
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
          onOpenDownloadApp={() => setIsDownloadModalOpen(true)}
        />

        {/* Dynamic View Switcher */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeView === 'dashboard' && (
            <DashboardView
              summary={summary}
              wallets={wallets}
              categories={categories}
              currency={currency}
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

          {activeView === 'savings' && (
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
            />
          )}

          {activeView === 'settings' && (
            <SettingsView
              onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
              onDataReset={handleResetData}
              isDarkMode={isDarkMode}
              onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
              onOpenDownloadApp={() => setIsDownloadModalOpen(true)}
            />
          )}

          {activeView === 'admin' && user.role === 'admin' && (
            <AdminView />
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileNav
          activeView={activeView}
          onNavigate={(v) => setActiveView(v)}
          onOpenAddTransaction={() => {
            setEditingTx(null);
            setTxModalInitialType('expense');
            setIsTxModalOpen(true);
          }}
        />
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
