import React from 'react';
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
  Download
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
  theme?: 'light' | 'dark';
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onToggleDarkMode?: () => void;
  title?: string;
  subtitle?: string;
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
  theme,
  isDarkMode,
  onToggleTheme,
  onToggleDarkMode,
  title = 'Hishab Khata',
  subtitle,
}) => {
  const { t, currency, setCurrency } = useI18n();
  const { user } = useAuth();

  const effectiveCurrency = currentCurrency || currency;
  const effectiveCurrencyChange = onCurrencyChange || setCurrency;
  const effectiveUnread = unreadNotificationsCount ?? propUnread ?? 0;
  const effectiveIsDark = isDarkMode ?? (theme === 'dark');
  const effectiveToggleDark = onToggleDarkMode || onToggleTheme || (() => {});

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      {/* View Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="lg:hidden shrink-0">
          <AppLogoMark size={32} />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm sm:text-lg lg:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none truncate">
            {title}
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
      </div>
    </header>
  );
};

