import React from 'react';
import { useI18n } from '../lib/i18n';
import {
  ShieldAlert,
  ArrowUp,
  Lock,
  Cloud,
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  PieChart,
  Target,
  HandCoins,
  BarChart3,
  Sparkles,
  Settings,
  Download,
  CheckCircle2,
  Database
} from 'lucide-react';
import { AppLogoMark } from './AppLogo';

interface AppFooterProps {
  activeView: string;
  isAdminView?: boolean;
  onNavigate: (view: string) => void;
  onViewLegal?: (type: 'privacy' | 'terms' | 'about') => void;
  onOpenDownloadApp?: () => void;
  userEmail?: string;
  userRole?: string;
}

export const AppFooter: React.FC<AppFooterProps> = ({
  activeView,
  isAdminView = false,
  onNavigate,
  onViewLegal,
  onOpenDownloadApp,
  userEmail,
  userRole,
}) => {
  const { t, language } = useI18n();

  const scrollToTop = () => {
    // Scroll the window or main container
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // -------------------------------------------------------------
  // ADMIN FOOTER VIEW
  // -------------------------------------------------------------
  if (isAdminView) {
    return (
      <footer
        id="admin-console-footer"
        className="mt-12 mb-20 lg:mb-4 pt-8 pb-6 border-t border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-700 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-700/20">
              <ShieldAlert className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white tracking-tight">
                  Hishab Khata SuperAdmin Console
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Cloud Sync
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Owner Access: <span className="font-semibold text-slate-700 dark:text-slate-200">{userEmail || 'sultanitbangladesh@gmail.com'}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              id="admin-footer-return-app"
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Return to User App</span>
            </button>
            <button
              id="admin-footer-scroll-top"
              type="button"
              onClick={scrollToTop}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
              title="Scroll to Top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px]">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3 text-amber-500" />
              Firestore Primary Database
            </span>
            <span className="flex items-center gap-1">
              <Lock className="w-3 h-3 text-teal-600" />
              Role-Based Access Control (RBAC)
            </span>
            <span>Version 2026.4.2 Enterprise</span>
          </div>
          <p className="text-slate-400 text-[10px]">
            © 2026 Hishab Khata. Confidential Administrative Operations.
          </p>
        </div>
      </footer>
    );
  }

  // -------------------------------------------------------------
  // USER APP FOOTER VIEW
  // -------------------------------------------------------------
  return (
    <footer
      id="user-app-footer"
      className="mt-14 mb-20 lg:mb-4 pt-10 pb-6 border-t border-slate-200/80 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 transition-colors"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-8 border-b border-slate-100 dark:border-slate-800/60">
        {/* Col 1: Brand & Bio */}
        <div className="space-y-3 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-2.5">
            <AppLogoMark size={32} />
            <div>
              <span className="font-black text-base text-slate-900 dark:text-white tracking-tight leading-none block">
                {language === 'bn' ? 'হিসাব খাতা' : 'Hishab Khata'}
              </span>
              <span className="text-[10px] text-teal-700 dark:text-teal-400 font-bold tracking-wider uppercase mt-0.5 block">
                Personal & Business OS
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pr-2">
            {language === 'bn'
              ? 'দৈনন্দিন আয়-ব্যয়, ওয়ালেট ব্যালেন্স, দেনা-পাওনা ও ব্যবসার স্মার্ট হিসাব রাখার বিশ্বস্ত প্ল্যাটফর্ম।'
              : 'Smart personal and business finance manager. Track daily transactions, wallets, debts, and budgets seamlessly.'}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-[10px] font-bold border border-teal-200/60 dark:border-teal-800/40">
              <Cloud className="w-3 h-3" />
              Live Cloud Sync
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold border border-slate-200 dark:border-slate-700">
              <Lock className="w-3 h-3 text-amber-500" />
              256-bit Encrypted
            </span>
          </div>
        </div>

        {/* Col 2: Core Ledgers */}
        <div className="space-y-2.5">
          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
            {language === 'bn' ? 'মূল ফিচারসমূহ' : 'Financial Ledgers'}
          </h4>
          <ul className="space-y-1.5 text-xs">
            <li>
              <button
                type="button"
                onClick={() => onNavigate('dashboard')}
                className={`hover:text-teal-700 dark:hover:text-teal-400 transition flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'dashboard' ? 'font-bold text-teal-700 dark:text-teal-400' : ''
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('nav_dashboard')}</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('transactions')}
                className={`hover:text-teal-700 dark:hover:text-teal-400 transition flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'transactions' ? 'font-bold text-teal-700 dark:text-teal-400' : ''
                }`}
              >
                <ArrowLeftRight className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('nav_transactions')}</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('wallets')}
                className={`hover:text-teal-700 dark:hover:text-teal-400 transition flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'wallets' ? 'font-bold text-teal-700 dark:text-teal-400' : ''
                }`}
              >
                <Wallet className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('nav_wallets')}</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('budgets')}
                className={`hover:text-teal-700 dark:hover:text-teal-400 transition flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'budgets' ? 'font-bold text-teal-700 dark:text-teal-400' : ''
                }`}
              >
                <PieChart className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('nav_budgets')}</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('loans')}
                className={`hover:text-teal-700 dark:hover:text-teal-400 transition flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'loans' ? 'font-bold text-teal-700 dark:text-teal-400' : ''
                }`}
              >
                <HandCoins className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('nav_loans')}</span>
              </button>
            </li>
          </ul>
        </div>

        {/* Col 3: Smart Tools & Insights */}
        <div className="space-y-2.5">
          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
            {language === 'bn' ? 'স্মার্ট টুলস' : 'Tools & Services'}
          </h4>
          <ul className="space-y-1.5 text-xs">
            <li>
              <button
                type="button"
                onClick={() => onNavigate('savings_goals')}
                className={`hover:text-teal-700 dark:hover:text-teal-400 transition flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'savings_goals' ? 'font-bold text-teal-700 dark:text-teal-400' : ''
                }`}
              >
                <Target className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('nav_savings_goals')}</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('reports')}
                className={`hover:text-teal-700 dark:hover:text-teal-400 transition flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'reports' ? 'font-bold text-teal-700 dark:text-teal-400' : ''
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('nav_reports')}</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('suggestions')}
                className={`hover:text-amber-600 dark:hover:text-amber-400 transition flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'suggestions' ? 'font-bold text-amber-600 dark:text-amber-400' : ''
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>SuperChat & Suggestions</span>
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onNavigate('settings')}
                className={`hover:text-teal-700 dark:hover:text-teal-400 transition flex items-center gap-1.5 cursor-pointer ${
                  activeView === 'settings' ? 'font-bold text-teal-700 dark:text-teal-400' : ''
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-slate-400" />
                <span>{t('nav_settings')}</span>
              </button>
            </li>
            {onOpenDownloadApp && (
              <li>
                <button
                  type="button"
                  onClick={onOpenDownloadApp}
                  className="hover:text-teal-700 dark:hover:text-teal-400 transition flex items-center gap-1.5 cursor-pointer text-teal-700 dark:text-teal-400 font-semibold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download / Install App</span>
                </button>
              </li>
            )}
          </ul>
        </div>

        {/* Col 4: Trust, Security & Legal */}
        <div className="space-y-2.5">
          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
            {language === 'bn' ? 'পলিসি ও নিরাপত্তা' : 'Privacy & Trust'}
          </h4>
          <ul className="space-y-1.5 text-xs">
            {onViewLegal && (
              <>
                <li>
                  <button
                    type="button"
                    onClick={() => onViewLegal('privacy')}
                    className="hover:text-teal-700 dark:hover:text-teal-400 transition cursor-pointer"
                  >
                    {language === 'bn' ? 'গোপনীয়তা নীতি (Privacy Policy)' : 'Privacy Policy'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onViewLegal('terms')}
                    className="hover:text-teal-700 dark:hover:text-teal-400 transition cursor-pointer"
                  >
                    {language === 'bn' ? 'ব্যবহারের শর্তাবলি (Terms of Service)' : 'Terms of Service'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onViewLegal('about')}
                    className="hover:text-teal-700 dark:hover:text-teal-400 transition cursor-pointer"
                  >
                    {language === 'bn' ? 'আমাদের সম্পর্কে (About Us)' : 'About Hishab Khata'}
                  </button>
                </li>
              </>
            )}
            <li className="pt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{language === 'bn' ? 'শতভাগ ডাটা ব্যাকআপ নিশ্চিত' : '100% Secure Cloud Storage'}</span>
            </li>
          </ul>

          {userRole === 'admin' && (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-bold border border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-purple-200"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>SuperAdmin Suite</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subfooter Bar */}
      <div className="pt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px]">
        <p className="text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} Hishab Khata (হিসাব খাতা). All rights reserved. Crafted for precision and security.
        </p>
        <button
          id="user-footer-scroll-top"
          type="button"
          onClick={scrollToTop}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer self-start sm:self-auto font-medium"
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span>{language === 'bn' ? 'উপরে যান' : 'Back to Top'}</span>
        </button>
      </div>
    </footer>
  );
};
