import React from 'react';
import { ArrowLeft, ShieldCheck, FileText, Info } from 'lucide-react';

interface LegalViewProps {
  type: 'privacy' | 'terms' | 'about';
  onBack: () => void;
}

export const LegalViews: React.FC<LegalViewProps> = ({ type, onBack }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8 flex flex-col justify-between">
      <div className="max-w-3xl w-full mx-auto space-y-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        {type === 'privacy' && (
          <div className="p-8 rounded-3xl bg-slate-800/90 border border-slate-700 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-white">Privacy Policy</h1>
            </div>
            <p className="text-xs text-slate-400">Last updated: September 2026</p>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <p>
                At <strong>Hishab Khata</strong>, user privacy and financial confidentiality are our highest tenets. We do not sell your transactional data or share personal financial metrics with advertisers.
              </p>
              <h3 className="text-base font-bold text-white pt-2">1. Data Storage & Security</h3>
              <p>
                All account records, wallet configurations, transactions, and savings goals are stored securely using isolated multi-tenant architecture and authenticated JWT sessions.
              </p>
              <h3 className="text-base font-bold text-white pt-2">2. AI Processing</h3>
              <p>
                When using the Gemini AI Financial Advisor, only aggregated ledger velocity summaries are processed temporarily to compute advisory metrics. No permanent training on personal accounts is retained.
              </p>
              <h3 className="text-base font-bold text-white pt-2">3. User Rights</h3>
              <p>
                You retain complete sovereignty over your ledger. You may export full backups via PDF, Excel, or CSV at any time, or trigger complete data resets through account settings.
              </p>
            </div>
          </div>
        )}

        {type === 'terms' && (
          <div className="p-8 rounded-3xl bg-slate-800/90 border border-slate-700 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 text-blue-400 rounded-xl">
                <FileText className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-white">Terms of Service</h1>
            </div>
            <p className="text-xs text-slate-400">Last updated: September 2026</p>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <p>
                By using Hishab Khata, you agree to these Terms of Service.
              </p>
              <h3 className="text-base font-bold text-white pt-2">1. Scope of Service</h3>
              <p>
                Hishab Khata is an autonomous personal-finance bookkeeping and budgeting software application. It provides mathematical calculations, visualization charts, and algorithmic insights. It does not constitute certified tax advice or formal banking depository services.
              </p>
              <h3 className="text-base font-bold text-white pt-2">2. Subscription & Payments</h3>
              <p>
                PRO features are provided on recurring or lifetime tiers. Upgrades grant instant access to unlimited wallets and advanced AI features.
              </p>
            </div>
          </div>
        )}

        {type === 'about' && (
          <div className="p-8 rounded-3xl bg-slate-800/90 border border-slate-700 space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/20 text-purple-400 rounded-xl">
                <Info className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-white">About Hishab Khata</h1>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <p>
                <strong>Hishab Khata</strong> (হিসাব খাতা) translates directly to <em>"Ledger Book"</em> — the timeless tradition of financial clarity, reimagined as a modern, global, AI-augmented cloud software suite.
              </p>
              <p>
                Crafted to bridge localized everyday financial habits (such as mobile money wallets like bKash/Nagad and informal family loans) with world-class fintech ergonomics, multi-currency conversion, and Gemini AI coaching.
              </p>
            </div>
          </div>
        )}
      </div>

      <footer className="text-center text-xs text-slate-500 py-6">
        © 2026 Hishab Khata SaaS. All rights reserved.
      </footer>
    </div>
  );
};
