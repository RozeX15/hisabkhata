import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { LanguageSelector } from './LanguageSelector';
import { CurrencySelector } from './CurrencySelector';
import { AppLogoMark } from './AppLogo';
import {
  Bell,
  Plus,
  Sparkles,
  Sun,
  Moon,
  ShieldAlert,
  Wallet as WalletIcon,
  Crown,
  Download,
  LogOut,
  LayoutDashboard,
  User as UserIcon,
  ChevronDown,
  Settings,
  HelpCircle
} from 'lucide-react';

interface TopbarProps {
  currentCurrency?: string;
  onCurrencyChange?: (curr: string) => void;
  unreadNotifsCount?: number;
  unreadNotificationsCount?: number;
  onOpenNotifications: () => void;
  onOpenAddTransaction: () => void;
  onOpenAiAdvisor: () => void;
  onOpenUpgrade?: () => void;
  onOpenDownloadApp?: () => void;
  onOpenTutorial?: () => void;
  theme?: 'light' | 'dark';
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onToggleDarkMode?: () => void;
  title?: string;
  subtitle?: string;
  activeView?: string;
  onNavigate?: (view: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentCurrency,
  onCurrencyChange,
  unreadNotifsCount: propUnread,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenAddTransaction,
  onOpenAiAdvisor,
  onOpenUpgrade = () => {},
  onOpenDownloadApp,
  onOpenTutorial,
  theme,
  isDarkMode,
  onToggleTheme,
  onToggleDarkMode,
  title,
  subtitle,
  activeView = 'dashboard',
  onNavigate,
}) => {
  const { t, currency, setCurrency } = useI18n();
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const effectiveCurrency = currentCurrency || currency;
  const effectiveCurrencyChange = onCurrencyChange || setCurrency;
  const effectiveUnread = unreadNotificationsCount ?? propUnread ?? 0;
  const effectiveIsDark = isDarkMode ?? (theme === 'dark');
  const effectiveToggleDark = onToggleDarkMode || onToggleTheme || (() => {});

  const displayTitle = React.useMemo(() => {
    if (activeView === 'suggestions') return t('nav_suggestions');
    if (activeView === 'savings_goals' || activeView === 'savings') return t('nav_savings_goals');
    if (activeView === 'admin') return t('nav_admin');
    const navKey = `nav_${activeView}`;
    const translated = t(navKey);
    if (translated && translated !== navKey) return translated;
    return title || 'Hishab Khata';
  }, [activeView, t, title]);

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      {/* View Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="lg:hidden shrink-0">
          <AppLogoMark size={32} />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm sm:text-lg lg:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none truncate">
            {displayTitle}
          </h1>
          {subtitle && (
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Install / Download App Button */}
        {onOpenDownloadApp && (
          <button
            id="topbar-download-app-btn"
            type="button"
            onClick={onOpenDownloadApp}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            title="Download & Install App"
          >
            <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="hidden md:inline">Download App</span>
            <span className="md:hidden">App</span>
          </button>
        )}

        {/* Plan Pill */}
        {user && (
          <button
            id="plan-badge-btn"
            type="button"
            onClick={onOpenUpgrade}
            className={`hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full cursor-pointer transition ${
              user.plan === 'pro'
                ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300/40'
                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
            }`}
          >
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>{user.plan === 'pro' ? 'PRO Plan' : 'Free Plan'}</span>
          </button>
        )}

        {/* Currency Switcher */}
        <CurrencySelector
          currentCurrency={effectiveCurrency}
          onSelect={effectiveCurrencyChange}
        />

        {/* Language Switcher */}
        <LanguageSelector variant="dropdown" />

        {/* Admin Navigation Button (if admin) */}
        {user?.role === 'admin' && onNavigate && (
          activeView === 'admin' ? (
            <button
              id="topbar-return-dashboard-btn"
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
              title="Return to User App / Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="text-[11px] sm:text-xs">App</span>
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          ) : (
            <button
              id="topbar-admin-panel-btn"
              type="button"
              onClick={() => onNavigate('admin')}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
              title="Open SuperAdmin Panel"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-[11px] sm:text-xs">Admin</span>
              <span className="hidden sm:inline">Panel</span>
            </button>
          )
        )}

        {/* Suggest & SuperChat Button */}
        {onNavigate && (
          <button
            id="topbar-suggest-superchat-btn"
            type="button"
            onClick={() => onNavigate('suggestions')}
            className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shadow-xs ${
              activeView === 'suggestions'
                ? 'bg-amber-500 text-slate-950 font-black'
                : 'bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/60'
            }`}
            title="Suggest features or send SuperChat to Sultan Admin"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>SuperChat</span>
          </button>
        )}

        {/* AI Advisor Button */}
        <button
          id="topbar-ai-btn"
          type="button"
          onClick={onOpenAiAdvisor}
          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-800 hover:to-teal-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
          title="Open AI Coach"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden md:inline">AI Coach</span>
        </button>

        {/* Quick Add Transaction */}
        <button
          id="topbar-add-tx-btn"
          type="button"
          onClick={onOpenAddTransaction}
          className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold rounded-lg shadow-md shadow-teal-700/20 transition cursor-pointer"
          title={t('add')}
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t('add')}</span>
        </button>

        {/* Notification Bell */}
        <button
          id="topbar-notifications-btn"
          type="button"
          onClick={onOpenNotifications}
          className="relative p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title={t('nav_notifications')}
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {effectiveUnread > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          )}
        </button>

        {/* Dark/Light Theme Toggle */}
        <button
          id="topbar-theme-toggle-btn"
          type="button"
          onClick={effectiveToggleDark}
          className="p-1.5 sm:p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title={effectiveIsDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {effectiveIsDark ? (
            <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-600 dark:text-slate-300" />
          )}
        </button>

        {/* Tutorial / Help Guide */}
        {onOpenTutorial && (
          <button
            id="topbar-tutorial-btn"
            type="button"
            onClick={onOpenTutorial}
            className="p-1.5 sm:p-2 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 rounded-lg hover:bg-teal-50 dark:hover:bg-teal-950/40 transition cursor-pointer"
            title="App Tutorial & User Guide / অ্যাপ গাইড"
          >
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}

        {/* User Profile Avatar & Dropdown Menu */}
        {user && (
          <div className="relative" ref={profileMenuRef}>
            <button
              id="topbar-profile-menu-btn"
              type="button"
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-1.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title={`${user.name} (${user.role})`}
            >
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs font-black text-white shadow-xs ${
                  user.role === 'admin'
                    ? 'bg-purple-700 ring-2 ring-purple-400/60'
                    : 'bg-teal-700 ring-2 ring-teal-500/40'
                }`}
              >
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {/* Dropdown Card */}
            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-64 p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 z-50 animate-in fade-in zoom-in-95 space-y-2.5">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    {user.role === 'admin' && (
                      <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-black uppercase">
                        SuperAdmin
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase">
                      {user.plan === 'pro' ? 'PRO Plan' : 'Free Plan'}
                    </span>
                  </div>
                </div>

                <div className="space-y-1 text-xs">
                  {user.role === 'admin' && onNavigate && (
                    <button
                      id="topbar-menu-admin-btn"
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onNavigate(activeView === 'admin' ? 'dashboard' : 'admin');
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 font-bold transition cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>{activeView === 'admin' ? 'Return to User App' : 'SuperAdmin Panel'}</span>
                    </button>
                  )}

                  {onNavigate && (
                    <button
                      id="topbar-menu-suggest-btn"
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onNavigate('suggestions');
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-bold transition cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>{t('nav_suggestions')}</span>
                    </button>
                  )}

                  {onNavigate && (
                    <button
                      id="topbar-menu-settings-btn"
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onNavigate('settings');
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold transition cursor-pointer"
                    >
                      <Settings className="w-4 h-4 text-slate-400 shrink-0" />
                      <span>{t('nav_settings')}</span>
                    </button>
                  )}

                  {onOpenTutorial && (
                    <button
                      id="topbar-menu-tutorial-btn"
                      type="button"
                      onClick={() => {
                        setIsProfileOpen(false);
                        onOpenTutorial();
                      }}
                      className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-teal-700 dark:text-teal-300 hover:bg-teal-50 dark:hover:bg-teal-950/40 font-bold transition cursor-pointer"
                    >
                      <HelpCircle className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                      <span>App Guide & Tutorial (টিউটোরিয়াল)</span>
                    </button>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    id="topbar-menu-logout-btn"
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/60 text-red-700 dark:text-red-300 font-bold text-xs transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('nav_logout')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Direct One-Click Logout Icon Button */}
        {user && (
          <button
            id="topbar-quick-logout-btn"
            type="button"
            onClick={logout}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
            title={t('nav_logout')}
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>
    </header>
  );
};

