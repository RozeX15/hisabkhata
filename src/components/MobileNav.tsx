import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Plus,
  Target,
  Settings,
  ShieldAlert,
  LogOut,
  Menu,
  X,
  Wallet as WalletIcon,
  PieChart,
  HandCoins,
  Sparkles,
  BarChart3,
  Bell,
  ChevronRight,
  User as UserIcon,
  Crown
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
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Check if admin by prop, auth state, role, or Sultan admin email
  const isSuperAdmin =
    propIsAdmin ||
    authIsAdmin ||
    user?.role === 'admin' ||
    user?.email === 'sultanitbangladesh@gmail.com';

  const handleNav = (view: string) => {
    onNavigate(view);
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    setIsMenuOpen(false);
    logout();
  };

  return (
    <>
      {/* Bottom Sticky Mobile Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 px-2 py-1 flex items-center justify-around shadow-lg">
        {/* Dashboard */}
        <button
          id="mobile-nav-dashboard"
          type="button"
          onClick={() => handleNav('dashboard')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            currentView === 'dashboard'
              ? 'text-teal-700 dark:text-teal-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t('nav_dashboard')}</span>
        </button>

        {/* Transactions */}
        <button
          id="mobile-nav-transactions"
          type="button"
          onClick={() => handleNav('transactions')}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            currentView === 'transactions'
              ? 'text-teal-700 dark:text-teal-400 font-bold'
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
          className="-mt-5 w-12 h-12 rounded-full bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center shadow-lg shadow-teal-700/40 border-4 border-white dark:border-slate-900 transition active:scale-95 cursor-pointer"
          title={t('add')}
        >
          <Plus className="w-6 h-6" />
        </button>

        {/* Admin Button (Always visible if Admin) OR Suggest & SuperChat (if regular user) */}
        {isSuperAdmin ? (
          <button
            id="mobile-nav-admin"
            type="button"
            onClick={() => handleNav('admin')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-xs font-bold relative transition cursor-pointer ${
              currentView === 'admin'
                ? 'text-purple-600 dark:text-purple-400 font-black'
                : 'text-purple-700 dark:text-purple-400 hover:text-purple-900'
            }`}
          >
            <div className="relative">
              <ShieldAlert className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-purple-500 ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            </div>
            <span className="text-[10px] mt-0.5">Admin</span>
          </button>
        ) : (
          <button
            id="mobile-nav-suggest"
            type="button"
            onClick={() => handleNav('suggestions')}
            className={`flex flex-col items-center py-1 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
              currentView === 'suggestions'
                ? 'text-amber-600 dark:text-amber-400 font-bold'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Suggest</span>
          </button>
        )}

        {/* Mobile Menu / Drawer Button */}
        <button
          id="mobile-nav-more-menu"
          type="button"
          onClick={() => setIsMenuOpen(true)}
          className={`flex flex-col items-center py-1 px-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            isMenuOpen
              ? 'text-teal-700 dark:text-teal-400 font-bold'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Menu</span>
        </button>
      </nav>

      {/* Full Mobile Slide-Over Drawer with All Options & Prominent Logout */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto flex flex-col p-5 space-y-4 animate-in slide-in-from-bottom duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-700 text-white font-black flex items-center justify-center text-sm shadow-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                    {user?.name || 'User'}
                  </h3>
                  <p className="text-xs text-slate-400 truncate max-w-[200px]">
                    {user?.email}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {isSuperAdmin && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[9px] font-black uppercase">
                        SuperAdmin
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[9px] font-black uppercase">
                      {user?.plan === 'pro' ? 'PRO Plan' : 'Free Plan'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Prominent Quick Logout Button at TOP of Drawer */}
            <button
              id="mobile-drawer-top-logout-btn"
              type="button"
              onClick={handleLogout}
              className="w-full py-2.5 px-4 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70 text-red-600 dark:text-red-300 font-bold text-xs rounded-xl border border-red-200 dark:border-red-900/60 flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <LogOut className="w-4 h-4" />
              <span>{t('nav_logout')} / লগআউট করুন</span>
            </button>

            {/* Navigation Grid / List */}
            <div className="space-y-1 text-sm font-semibold">
              {/* Admin Panel Direct Link */}
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={() => handleNav('admin')}
                  className="w-full flex items-center justify-between p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 text-purple-600" />
                    <span className="font-black">SuperAdmin Suite (Control Panel)</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}

              {/* Suggestions & SuperChat Link */}
              <button
                type="button"
                onClick={() => handleNav('suggestions')}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                  <span className="font-black">Suggest Features & SuperChat</span>
                </div>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => handleNav('wallets')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <WalletIcon className="w-4.5 h-4.5 text-teal-600" />
                  <span>{t('nav_wallets')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => handleNav('budgets')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <PieChart className="w-4.5 h-4.5 text-teal-600" />
                  <span>{t('nav_budgets')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => handleNav('savings_goals')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Target className="w-4.5 h-4.5 text-teal-600" />
                  <span>{t('nav_savings_goals')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => handleNav('loans')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <HandCoins className="w-4.5 h-4.5 text-teal-600" />
                  <span>{t('nav_loans')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => handleNav('reports')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-4.5 h-4.5 text-teal-600" />
                  <span>{t('nav_reports')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                type="button"
                onClick={() => handleNav('settings')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4.5 h-4.5 text-teal-600" />
                  <span>{t('nav_settings')}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Bottom Logout Button */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                id="mobile-drawer-bottom-logout-btn"
                type="button"
                onClick={handleLogout}
                className="w-full py-3 px-4 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md shadow-red-600/30 cursor-pointer transition active:scale-98"
              >
                <LogOut className="w-4 h-4" />
                <span>{t('nav_logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
