import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import confetti from 'canvas-confetti';
import {
  X,
  Crown,
  Check,
  Zap,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
  Sparkles,
  Infinity,
  CreditCard,
  Loader2
} from 'lucide-react';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useI18n();
  const { user, refreshUser } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isAlreadyPro = user?.plan === 'pro';

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.upgradePlan('pro');
      await refreshUser();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Upgrade failed');
    } finally {
      setLoading(false);
    }
  };

  const PRO_FEATURES = [
    { text: 'Unlimited Wallets & Bank Accounts (vs. 3 max on Free)', icon: Infinity },
    { text: 'Unlimited Monthly Transactions (vs. 100/mo on Free)', icon: Zap },
    { text: 'Unlimited Savings Milestones & Goal Trackers', icon: ShieldCheck },
    { text: 'Instant PDF Financial Statement Downloads', icon: FileText },
    { text: 'Excel (.XLSX) & CSV Ledger Exporting', icon: FileSpreadsheet },
    { text: 'Gemini AI Financial Coach & Predictive Advice', icon: Sparkles },
    { text: 'Multi-Currency Real-time Portfolio Aggregation', icon: Crown },
    { text: 'Priority 24/7 Global Support & Cloud Sync', icon: ShieldCheck },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Banner Header */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-br from-teal-800 via-teal-700 to-slate-900 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <div className="px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5" />
              <span>Hishab Khata PRO</span>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Unlock Unlimited Financial Freedom
          </h2>
          <p className="text-sm text-teal-100 mt-1 max-w-md">
            Everything you need to master your wealth, automate your accounts, and export full tax-ready statements.
          </p>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-3 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-200 dark:border-red-900/50">
              {error}
            </div>
          )}

          {/* Pricing Selector */}
          <div className="flex items-center justify-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl max-w-xs mx-auto">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                billingCycle === 'monthly'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Monthly ($4.99/mo)
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer relative ${
                billingCycle === 'yearly'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span>Yearly ($49.99/yr)</span>
              <span className="absolute -top-2 -right-1 px-1.5 py-0.2 bg-emerald-500 text-white text-[9px] rounded-full font-extrabold">Save 20%</span>
            </button>
          </div>

          {/* Feature List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRO_FEATURES.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div key={idx} className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                  <div className="w-5 h-5 rounded-md bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-snug">
                    {feat.text}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Action CTA */}
          <div className="pt-2">
            {isAlreadyPro ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center">
                <div className="inline-flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                  <Check className="w-5 h-5" />
                  <span>You are currently subscribed to Hishab Khata PRO</span>
                </div>
              </div>
            ) : (
              <button
                id="upgrade-confirm-btn"
                type="button"
                disabled={loading}
                onClick={handleUpgrade}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-700 via-teal-600 to-amber-600 hover:from-teal-800 hover:to-amber-700 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-teal-700/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    <span>Activate PRO Membership ({billingCycle === 'yearly' ? '$49.99/year' : '$4.99/month'})</span>
                  </>
                )}
              </button>
            )}

            <p className="text-center text-[11px] text-slate-400 mt-2.5">
              Instant activation • Cancel anytime with one click • 100% money-back guarantee within 14 days
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
