import React from 'react';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { LanguageSelector } from './LanguageSelector';
import { CurrencySelector } from './CurrencySelector';
import {
  Bell,
  Plus,
  Sparkles,
  Sun,
  Moon,
  ShieldAlert,
  Wallet as WalletIcon,
  Crown
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
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 py-3 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
      {/* View Title */}
      <div className="flex items-center gap-3">
        <div className="lg:hidden w-8 h-8 rounded-lg bg-teal-700 flex items-center justify-center text-white font-bold">
          <WalletIcon className="w-4 h-4" />
        </div>
        <div>
          <h1 className="text-base sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
            {title}
          </h1>
          {subtitle && (
            <p className="hidden sm:block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Plan Pill */}
        {user && (
          <button
            id="plan-badge-btn"
            type="button"
            onClick={onOpenUpgrade}
            className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full cursor-pointer transition ${
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
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-teal-700 to-teal-600 hover:from-teal-800 hover:to-teal-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>AI Coach</span>
        </button>

        {/* Quick Add Transaction */}
        <button
          id="topbar-add-tx-btn"
          type="button"
          onClick={onOpenAddTransaction}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold rounded-lg shadow-md shadow-teal-700/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t('add')}</span>
        </button>

        {/* Notification Bell */}
        <button
          id="topbar-notifications-btn"
          type="button"
          onClick={onOpenNotifications}
          className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title={t('nav_notifications')}
        >
          <Bell className="w-5 h-5" />
          {effectiveUnread > 0 && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
          )}
        </button>

        {/* Dark/Light Theme Toggle */}
        <button
          id="topbar-theme-toggle-btn"
          type="button"
          onClick={effectiveToggleDark}
          className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          title="Toggle Theme"
        >
          {effectiveIsDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>
      </div>
    </header>
  );
};
