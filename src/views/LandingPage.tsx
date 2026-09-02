import React from 'react';
import { useI18n } from '../lib/i18n';
import { LanguageSelector } from '../components/LanguageSelector';
import { CurrencySelector } from '../components/CurrencySelector';
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
  Star
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onDemoUser: () => void;
  onViewLegal: (type: 'privacy' | 'terms' | 'about') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onLogin,
  onDemoUser,
  onViewLegal,
}) => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-700 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-900/30">
            <Wallet className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <span className="font-black text-lg tracking-tight text-white flex items-center gap-1.5">
              HISHAB KHATA
              <span className="px-1.5 py-0.2 bg-teal-500/20 text-teal-300 text-[10px] font-extrabold rounded-md">
                SAAS
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block">
            <LanguageSelector />
          </div>

          <button
            type="button"
            onClick={onLogin}
            className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 rounded-xl transition cursor-pointer"
          >
            Sign In
          </button>

          <button
            type="button"
            onClick={onGetStarted}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold rounded-xl shadow-md shadow-teal-900/40 transition flex items-center gap-1 cursor-pointer"
          >
            <span>Get Started Free</span>
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
            <span>Next-Gen Personal Finance & Wealth OS</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white leading-[1.1] max-w-4xl mx-auto">
            Master Every Taka, Dollar, and Cent with Precision.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Hishab Khata empowers professionals, founders, and families worldwide to track multi-account cashflows, enforce budgets, eliminate debts, and receive real-time Gemini AI financial intelligence.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <button
              id="hero-get-started-btn"
              type="button"
              onClick={onGetStarted}
              className="w-full sm:w-auto px-8 py-3.5 bg-teal-600 hover:bg-teal-500 text-white font-black text-sm rounded-2xl shadow-xl shadow-teal-900/40 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Launch Free Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-instant-demo-btn"
              type="button"
              onClick={onDemoUser}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 font-extrabold text-sm rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Explore Instant Demo</span>
            </button>
          </div>

          {/* Social Proof */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-teal-400" /> Zero tracking or ads
            </span>
            <span className="flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-teal-400" /> 15+ World Languages & RTL
            </span>
            <span className="flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4 text-teal-400" /> Instant PDF & Excel Export
            </span>
          </div>
        </section>

        {/* Core Pillars Feature Grid */}
        <section className="px-4 sm:px-8 py-16 bg-slate-900/60 border-y border-slate-800/80">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Architected for Absolute Financial Sovereignty
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-2">
                Everything required to conquer debt, accumulate savings, and audit your personal wealth.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-white">Multi-Wallet & Bank Sync</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Track physical cash, bKash, Nagad, bank accounts, and credit cards with atomic inter-account transfer reconciliation.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-white">Gemini AI Wealth Coach</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Automated financial intelligence that scans spending velocities, identifies category leaks, and calculates emergency fund timelines.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                  <HandCoins className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-white">Loan & Debt Repayment</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Never forget a receivable or payable. Track installment histories, partial payments, and due dates effortlessly.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-white">Target Savings Vaults</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Define milestones for real estate, tuition, vacations, or hardware. Lock liquidity into dedicated virtual vaults.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <PieChart className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-white">Budget Guardrails</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Set dynamic monthly spending limits per category and receive high-priority alerts before overrunning allowances.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800/80 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-white">Tax & Audit Exports</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Download clean, formatted PDF financial statements and raw Excel (.xlsx) workbooks for accountants and loan applications.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Plan Preview */}
        <section className="px-4 sm:px-8 py-16 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Simple, Transparent Plans
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Start free forever or elevate to PRO for unlimited power.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free */}
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-6">
              <div>
                <h3 className="text-lg font-black text-white">Community Starter</h3>
                <p className="text-xs text-slate-400 mt-1">Essential personal ledger tools</p>
                <div className="mt-4 text-3xl font-black text-white">
                  $0 <span className="text-xs font-medium text-slate-400">/ forever</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400" /> Up to 3 Wallets & Accounts</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400" /> 100 Transactions/month</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400" /> 2 Savings Goals & Budgets</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-teal-400" /> CSV Ledger Exports</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onGetStarted}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Create Free Account
              </button>
            </div>

            {/* Pro */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-teal-900/60 to-slate-900 border-2 border-teal-500/50 flex flex-col justify-between space-y-6 relative shadow-2xl">
              <div className="absolute -top-3 right-6 px-3 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                Recommended
              </div>

              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <span>Hishab Khata PRO</span>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </h3>
                <p className="text-xs text-teal-200 mt-1">For serious wealth builders & entrepreneurs</p>
                <div className="mt-4 text-3xl font-black text-white">
                  $4.99 <span className="text-xs font-medium text-teal-200">/ month</span>
                </div>
                <ul className="mt-6 space-y-2.5 text-xs text-slate-200">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Unlimited Wallets & Bank Accounts</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Unlimited Transactions</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Unlimited Savings Goals & Budgets</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> Gemini AI Financial Advisor</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-amber-400" /> PDF & Excel Statements</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onGetStarted}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-teal-900/50 transition cursor-pointer"
              >
                Upgrade to PRO
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
            <span>• © 2026 All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => onViewLegal('privacy')}
              className="hover:text-slate-300 transition cursor-pointer"
            >
              Privacy Policy
            </button>
            <button
              type="button"
              onClick={() => onViewLegal('terms')}
              className="hover:text-slate-300 transition cursor-pointer"
            >
              Terms of Service
            </button>
            <button
              type="button"
              onClick={() => onViewLegal('about')}
              className="hover:text-slate-300 transition cursor-pointer"
            >
              About Platform
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
