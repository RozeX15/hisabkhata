import React from 'react';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { AppLogo } from './AppLogo';
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet as WalletIcon,
  PieChart,
  Target,
  HandCoins,
  Sparkles,
  BarChart3,
  Bell,
  Settings,
  ShieldAlert,
  LogOut,
  Zap,
  ChevronRight,
  Download
} from 'lucide-react';

interface SidebarProps {
  currentView?: string;
  activeView?: string;
  onNavigate: (view: string) => void;
  unreadNotifsCount?: number;
  onOpenUpgrade: () => void;
  onOpenDownloadApp?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView: propCurrent,
  activeView: propActive,
  onNavigate,
  unreadNotifsCount = 0,
  onOpenUpgrade,
  onOpenDownloadApp,
}) => {
  const currentView = propActive || propCurrent || 'dashboard';
  const { t } = useI18n();
  const { user, isAdmin, logout } = useAuth();

  const mainNavItems = [
    { id: 'dashboard', label: t('nav_dashboard'), icon: LayoutDashboard },
    { id: 'transactions', label: t('nav_transactions'), icon: ArrowLeftRight },
    { id: 'wallets', label: t('nav_wallets'), icon: WalletIcon },
    { id: 'budgets', label: t('nav_budgets'), icon: PieChart },
    { id: 'savings_goals', label: t('nav_savings_goals'), icon: Target },
    { id: 'loans', label: t('nav_loans'), icon: HandCoins },
    { id: 'insights', label: t('nav_insights'), icon: Sparkles, badge: 'AI' },
    { id: 'reports', label: t('nav_reports'), icon: BarChart3 },
    { id: 'notifications', label: t('nav_notifications'), icon: Bell, count: unreadNotifsCount },
    { id: 'settings', label: t('nav_settings'), icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 h-screen sticky top-0 shrink-0 select-none">
      {/* Brand Header */}
      <div className="flex items-center px-5 h-18 border-b border-slate-100 dark:border-slate-800/80">
        <AppLogo variant="full" size="md" />
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Personal Finance
        </div>
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            currentView === item.id ||
            (item.id === 'savings_goals' && currentView === 'savings') ||
            (item.id === 'savings' && currentView === 'savings_goals');
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id}`}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-700/20 font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-bold uppercase ${
                    isActive ? 'bg-white/20 text-white' : 'bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && item.count > 0 && (
                  <span className="px-1.5 py-0.5 text-[11px] bg-amber-500 text-white rounded-full font-bold">
                    {item.count}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {/* Install App Quick Action */}
        {onOpenDownloadApp && (
          <div className="pt-2">
            <button
              id="sidebar-download-app-btn"
              type="button"
              onClick={onOpenDownloadApp}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80 transition cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Download className="w-4.5 h-4.5 text-teal-600 dark:text-teal-400" />
                <span>Download App</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-teal-600 text-white font-bold uppercase">
                PWA
              </span>
            </button>
          </div>
        )}

        {/* Admin Navigation */}
        {isAdmin && (
          <div className="pt-4">
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Management
            </div>
            <button
              id="nav-item-admin"
              type="button"
              onClick={() => onNavigate('admin')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                currentView === 'admin'
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-700/20 font-bold'
                  : 'text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/30'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldAlert className="w-4.5 h-4.5" />
                <span>{t('nav_admin')}</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>
          </div>
        )}
      </div>

      {/* Pro Plan Upgrade Card (if user is Free) */}
      {user?.plan === 'free' && (
        <div className="px-3 pb-3">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-teal-500/10 border border-amber-500/20 dark:border-amber-500/15">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span className="text-xs font-bold text-slate-900 dark:text-white">Upgrade to PRO</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5 leading-snug">
              Unlimited wallets, PDF/Excel export, and smart AI financial insights.
            </p>
            <button
              id="sidebar-upgrade-btn"
              type="button"
              onClick={onOpenUpgrade}
              className="w-full py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition shadow-xs cursor-pointer flex items-center justify-center gap-1"
            >
              <span>{t('upgrade')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* User Profile Bar */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-teal-700 text-white font-bold flex items-center justify-center text-xs shrink-0">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.name || 'User'}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">
                {user?.email}
              </span>
            </div>
          </div>
          <button
            id="sidebar-logout-btn"
            type="button"
            onClick={logout}
            title={t('nav_logout')}
            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-200/60 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
