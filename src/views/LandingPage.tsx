import React from 'react';
import { useI18n } from '../lib/i18n';
import { LanguageSelector } from '../components/LanguageSelector';
import { CurrencySelector } from '../components/CurrencySelector';
import { AppLogo } from '../components/AppLogo';
import {
  Wallet,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  PieChart,
  Target,
  HandCoins,
  FileSpreadsheet,
  Globe,
  CheckCircle2,
  Lock,
  ChevronRight,
  Star,
  Download
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onGoogleSignIn?: () => void;
  onDemoUser: () => void;
  onViewLegal: (type: 'privacy' | 'terms' | 'about') => void;
  onOpenDownloadApp?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onLogin,
  onGoogleSignIn,
  onDemoUser,
  onViewLegal,
  onOpenDownloadApp,
}) => {
  const { t, language } = useI18n();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AppLogo variant="full" size="md" subtitle={t('app_tagline')} isDarkBg={true} />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:block">
            <LanguageSelector />
          </div>

          {onOpenDownloadApp && (
            <button
              id="landing-download-app-btn"
              type="button"
              onClick={onOpenDownloadApp}
              className="px-3.5 py-2 text-xs font-bold text-teal-300 bg-teal-950/60 hover:bg-teal-900/60 border border-teal-800/80 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">{t('landing_nav_download')}</span>
              <span className="sm:hidden">{t('landing_nav_download')}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onLogin}
            className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition cursor-pointer"
          >
            {t('hero_cta_signin')}
          </button>

          <button
            type="button"
            onClick={onGetStarted}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-teal-900/40 transition flex items-center gap-1 cursor-pointer"
          >
            <span>{t('hero_cta_primary')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative px-4 sm:px-8 py-16 sm:py-24 max-w-6xl mx-auto text-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-950/80 border border-teal-800/60 text-teal-300 text-xs font-extrabold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{t('hero_badge')}</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1] max-w-4xl mx-auto">
            {t('hero_title')}
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {t('hero_subtitle')}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-xl mx-auto">
            {onGoogleSignIn && (
              <button
                id="hero-google-btn"
                type="button"
                onClick={onGoogleSignIn}
                className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-800 font-black text-sm rounded-2xl shadow-xl transition flex items-center justify-center gap-2.5 cursor-pointer border border-slate-200"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>{t('hero_cta_google')}</span>
              </button>
            )}

            <button
              id="hero-get-started-btn"
              type="button"
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-teal-900/40 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{t('hero_cta_primary')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-signin-btn"
              type="button"
              onClick={onLogin}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 font-extrabold text-sm rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-teal-400" />
              <span>{t('hero_cta_signin')}</span>
            </button>
          </div>

          {onOpenDownloadApp && (
            <div className="mt-4">
              <button
                id="hero-download-pwa-btn"
                type="button"
                onClick={onOpenDownloadApp}
                className="inline-flex items-center gap-2 text-xs font-bold text-teal-400 hover:text-teal-300 transition cursor-pointer px-3 py-1.5 rounded-full bg-teal-950/40 hover:bg-teal-950/80 border border-teal-800/60"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('hero_cta_download_pwa')}</span>
              </button>
            </div>
          )}

          {/* Social Proof */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" /> {t('hero_proof_tracking')}
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-teal-400" /> {t('hero_proof_languages')}
            </span>
            <span className="flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-teal-400" /> {t('hero_proof_export')}
            </span>
          </div>
        </section>

        {/* Core Pillars Feature Grid */}
        <section className="px-4 sm:px-8 py-16 bg-slate-900/60 border-y border-slate-800/80">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {t('feat_heading')}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                {t('feat_subheading')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-white">{t('feat_wallets_title')}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('feat_wallets_desc')}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-white">{t('feat_ai_title')}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('feat_ai_desc')}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <HandCoins className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-white">{t('feat_loans_title')}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('feat_loans_desc')}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-white">{t('feat_vaults_title')}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('feat_vaults_desc')}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <PieChart className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-white">{t('feat_budgets_title')}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('feat_budgets_desc')}
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-white">{t('feat_exports_title')}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {t('feat_exports_desc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Plan Preview */}
        <section className="px-4 sm:px-8 py-16 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {t('pricing_heading')}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              {t('pricing_subheading')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-lg font-black text-white">{t('pricing_starter_name')}</h3>
                <p className="text-xs text-slate-400 mt-1">{t('pricing_starter_desc')}</p>
                <div className="mt-4 text-3xl font-black text-white">
                  {t('pricing_starter_price')} <span className="text-xs font-medium text-slate-400">{t('pricing_starter_period')}</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400" /> {t('pricing_starter_f1')}</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400" /> {t('pricing_starter_f2')}</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400" /> {t('pricing_starter_f3')}</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400" /> {t('pricing_starter_f4')}</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onGetStarted}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                {t('pricing_starter_cta')}
              </button>
            </div>

            {/* Pro */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-teal-900/60 to-slate-900 border-2 border-teal-500/50 flex flex-col justify-between space-y-6 relative shadow-2xl">
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                {t('pricing_pro_recommended')}
              </div>

              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>{t('pricing_pro_name')}</span>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </h3>
                <p className="text-xs text-teal-200 mt-1">{t('pricing_pro_desc')}</p>
                <div className="mt-4 text-3xl font-black text-white">
                  {t('pricing_pro_price')} <span className="text-xs font-medium text-teal-200">{t('pricing_pro_period')}</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-200">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> {t('pricing_pro_f1')}</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> {t('pricing_pro_f2')}</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> {t('pricing_pro_f3')}</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> {t('pricing_pro_f4')}</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> {t('pricing_pro_f5')}</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onGetStarted}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-teal-900/50 transition cursor-pointer"
              >
                {t('pricing_pro_cta')}
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 px-4 sm:px-8 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">Hishab Khata SaaS</span>
            <span>• {t('landing_footer_rights')}</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onViewLegal('privacy')}
              className="hover:text-slate-300 transition cursor-pointer"
            >
              {language === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
            </button>
            <button
              type="button"
              onClick={() => onViewLegal('terms')}
              className="hover:text-slate-300 transition cursor-pointer"
            >
              {language === 'bn' ? 'সেবার শর্তাবলী' : 'Terms of Service'}
            </button>
            <button
              type="button"
              onClick={() => onViewLegal('about')}
              className="hover:text-slate-300 transition cursor-pointer"
            >
              {language === 'bn' ? 'প্ল্যাটফর্ম পরিচিতি' : 'About Platform'}
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
