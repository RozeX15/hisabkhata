import React from 'react';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Plus,
  Target,
  Settings,
  ShieldAlert,
  LogOut
} from 'lucide-react';

interface MobileNavProps {
  currentView?: string;
  activeView?: string;
  onNavigate: (view: string) => void;
  onOpenAddTransaction: () => void;
  isAdmin?: boolean;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  currentView: propCurrent,
  activeView: propActive,
  onNavigate,
  onOpenAddTransaction,
  isAdmin: propIsAdmin,
}) => {
  const currentView = propActive || propCurrent || 'dashboard';
  const { t } = useI18n();
  const { user, isAdmin: authIsAdmin, logout } = useAuth();
  const isAdmin = propIsAdmin ?? (authIsAdmin || user?.role === 'admin');

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 flex items-center justify-around shadow-lg">
      <button
        id="mobile-nav-dashboard"
        type="button"
        onClick={() => onNavigate('dashboard')}
        className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-semibold transition ${
          currentView === 'dashboard'
            ? 'text-teal-700 dark:text-teal-400'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">{t('nav_dashboard')}</span>
      </button>

      <button
        id="mobile-nav-transactions"
        type="button"
        onClick={() => onNavigate('transactions')}
        className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-semibold transition ${
          currentView === 'transactions'
            ? 'text-teal-700 dark:text-teal-400'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <ArrowLeftRight className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">{t('nav_transactions')}</span>
      </button>

      {/* Floating Add Center Button */}
      <button
        id="mobile-nav-add-btn"
        type="button"
        onClick={onOpenAddTransaction}
        className="-mt-5 w-12 h-12 rounded-full bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center shadow-lg shadow-teal-700/40 border-4 border-white dark:border-slate-900 transition active:scale-95"
        title={t('add')}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Admin Panel Option for Admins OR Savings Goals for Non-Admins */}
      {isAdmin ? (
        <button
          id="mobile-nav-admin"
          type="button"
          onClick={() => onNavigate('admin')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-semibold relative transition ${
            currentView === 'admin'
              ? 'text-purple-600 dark:text-purple-400 font-black'
              : 'text-purple-700/80 dark:text-purple-400/80 hover:text-purple-900'
          }`}
        >
          <div className="relative">
            <ShieldAlert className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          </div>
          <span className="text-[10px] mt-0.5 font-bold">Admin</span>
        </button>
      ) : (
        <button
          id="mobile-nav-goals"
          type="button"
          onClick={() => onNavigate('savings_goals')}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-semibold transition ${
            currentView === 'savings_goals' || currentView === 'savings'
              ? 'text-teal-700 dark:text-teal-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Target className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t('nav_savings_goals')}</span>
        </button>
      )}

      <button
        id="mobile-nav-settings"
        type="button"
        onClick={() => onNavigate('settings')}
        className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-semibold transition ${
          currentView === 'settings'
            ? 'text-teal-700 dark:text-teal-400'
            : 'text-slate-500 dark:text-slate-400'
        }`}
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">{t('nav_settings')}</span>
      </button>
    </nav>
  );
};
