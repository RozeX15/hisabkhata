import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  Info,
  Lock,
  Database,
  Sparkles,
  Download,
  AlertTriangle,
  Heart,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface LegalViewProps {
  type: 'privacy' | 'terms' | 'about';
  onBack: () => void;
  onSelectType?: (type: 'privacy' | 'terms' | 'about') => void;
  isAuthenticated?: boolean;
}

export const LegalViews: React.FC<LegalViewProps> = ({
  type: initialType,
  onBack,
  onSelectType,
  isAuthenticated = false,
}) => {
  const { language } = useI18n();
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'about'>(initialType || 'privacy');

  const handleTabChange = (tab: 'privacy' | 'terms' | 'about') => {
    setActiveTab(tab);
    if (onSelectType) onSelectType(tab);
  };

  const isBn = language === 'bn';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto space-y-6">
        {/* Navigation & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold border border-slate-200 dark:border-slate-800 shadow-xs transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>
              {isAuthenticated
                ? isBn
                  ? 'অ্যাপে ফিরে যান'
                  : 'Return to App'
                : isBn
                ? 'মূল পাতায় ফিরে যান'
                : 'Back to Home'}
            </span>
          </button>

          {/* Quick Tab Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-200/80 dark:bg-slate-900 border border-slate-300/60 dark:border-slate-800">
            <button
              type="button"
              onClick={() => handleTabChange('privacy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'privacy'
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{isBn ? 'গোপনীয়তা' : 'Privacy'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('terms')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'terms'
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isBn ? 'শর্তাবলি' : 'Terms'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('about')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'about'
                  ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>{isBn ? 'পরিচিতি' : 'About'}</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* 1. PRIVACY POLICY */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'privacy' && (
          <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center shadow-xs">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {isBn ? 'গোপনীয়তা নীতি (Privacy Policy)' : 'Privacy Policy & Data Protection'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isBn ? 'সর্বশেষ হালনাগাদ: সেপ্টেম্বর ২০২৬' : 'Last updated: September 2026 • Version 2.4'}
                </p>
              </div>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <p className="font-medium text-slate-700 dark:text-slate-200">
                {isBn
                  ? 'হিসাব খাতা (Hishab Khata)-তে আপনার ব্যক্তিগত আর্থিক তথ্য এবং হিসাবের গোপনীয়তা রক্ষা করা আমাদের প্রধান অঙ্গীকার। আমরা ব্যবহারকারীদের কোনো ধরনের আর্থিক লেনদেন বা ব্যক্তিগত তথ্য কোনো বিজ্ঞাপনদাতা কিংবা তৃতীয় পক্ষের কাছে বিক্রয় করি না।'
                  : 'At Hishab Khata, your financial confidentiality and personal data security are our highest tenets. We do not sell, rent, or monetize your transactional ledger or sensitive financial metrics to any third-party advertisers.'}
              </p>

              <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-teal-900 dark:text-teal-200 text-xs sm:text-sm">
                  <Lock className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>{isBn ? 'কঠোর নিরাপত্তা নীতিসমূহ' : 'Our Strict Privacy Commitments'}</span>
                </div>
                <ul className="list-disc list-inside text-xs space-y-1 text-teal-800 dark:text-teal-300">
                  <li>{isBn ? 'কোনো বিজ্ঞাপন বা ট্র্যাকিং স্ক্রিপ্ট নেই' : 'Zero third-party advertising or commercial ad-trackers'}</li>
                  <li>{isBn ? 'জেডাব্লুটি (JWT) ও বি-ক্রিপ্ট (Bcrypt) এনক্রিপশন' : 'Industry standard JWT authentication & Bcrypt hashed passwords'}</li>
                  <li>{isBn ? 'বিকাশ, নগদ বা ব্যাংক একাউন্ট নম্বর সুরক্ষিত' : 'Mobile wallet accounts (bKash/Nagad) securely stored'}</li>
                  <li>{isBn ? 'যেকোনো সময় এক ক্লিকে সম্পূর্ণ ডাটা এক্সপোর্ট ও ডিলিট' : 'Permanent account deletion and full Excel/CSV/PDF backup anytime'}</li>
                </ul>
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                  <Database className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <span>{isBn ? '১. ডাটা সংরক্ষণ ও সার্ভার অবকাঠামো' : '1. Data Storage & Infrastructure'}</span>
                </h2>
                <p>
                  {isBn
                    ? 'আপনার সমস্ত ওয়ালেট ব্যালেন্স, লেনদেনের ইতিহাস, ক্যাটাগরি এবং বাজেট পরিকল্পনা ক্লাউড ফায়ারস্টোর (Cloud Firestore) ও সিকিউর স্যান্ডবক্সে সংরক্ষিত হয়। প্রতি ব্যবহারকারীর ডাটা সম্পূর্ণ আইসোলেটেড।'
                    : 'All ledger documents, transactions, category tags, and budgets are securely stored using isolated multi-tenant records in Cloud Firestore. Cross-user data leakage is prevented via strict server-side authorization.'}
                </p>
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>{isBn ? '২. এআই এডভাইজার (Gemini AI) ডাটা প্রসেসিং' : '2. AI Financial Advisor (Gemini AI)'}</span>
                </h2>
                <p>
                  {isBn
                    ? 'স্মার্ট ফাইন্যান্সিয়াল এডভাইজারে ব্যবহৃত জেমিনি এআই আপনার সামগ্রিক খরচের প্যাটার্ন তাৎক্ষণিক বিশ্লেষণের জন্য ব্যবহার করে। আপনার হিসাব খাতার কোনো ডাটা দিয়ে পাবলিক এআই মডেলের ট্রেনিং করানো হয় না।'
                    : 'When you invoke the Gemini AI Financial Advisor, aggregated ledger velocities are analyzed transiently in memory to calculate smart budgeting recommendations. Your proprietary financial ledgers are never retained for model training.'}
                </p>
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1.5 flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  <span>{isBn ? '৩. সুপারচ্যাট ও সাজেশনের স্বচ্ছতা' : '3. Suggestions & SuperChat Transparency'}</span>
                </h2>
                <p>
                  {isBn
                    ? 'আপনি যখন অ্যাপের উন্নয়নে পরামর্শ বা সুপারচ্যাট প্রদান করেন, তখন শুধুমাত্র আপনার নাম, সাজেশনের শিরোনাম ও অনুদান ব্যাজ প্রকাশ্যে প্রদর্শন করা হয়। আপনার ব্যক্তিগত আর্থিক লেনদেনের কোনো তথ্য এতে প্রকাশিত হয় না।'
                    : 'Community suggestions and donor SuperChat tiers display only your public display name, suggestion summary, and donor badge. Your private ledger, wallets, and debts remain completely confidential.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 2. TERMS OF SERVICE */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'terms' && (
          <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center shadow-xs">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {isBn ? 'ব্যবহারের শর্তাবলি (Terms of Service)' : 'Terms of Service'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isBn ? 'সর্বশেষ হালনাগাদ: সেপ্টেম্বর ২০২৬' : 'Last updated: September 2026 • Official Platform Rules'}
                </p>
              </div>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <p className="font-medium text-slate-700 dark:text-slate-200">
                {isBn
                  ? 'হিসাব খাতা অ্যাপ্লিকেশন ব্যবহার করার মাধ্যমে আপনি নিম্নলিখিত নীতিমালা ও শর্তাবলিতে সম্মতি জ্ঞাপন করছেন।'
                  : 'By registering, accessing, or using the Hishab Khata application and associated services, you acknowledge and agree to be bound by these Terms of Service.'}
              </p>

              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                  {isBn ? '১. সেবার পরিধি ও হিসাবরক্ষণ' : '1. Scope of Bookkeeping Service'}
                </h2>
                <p>
                  {isBn
                    ? 'হিসাব খাতা একটি ক্লাউড-ভিত্তিক ব্যক্তিগত অর্থ ব্যবস্থাপনা ও হিসাবরক্ষণ টুল। এটি ব্যবহারকারীর প্রদত্ত তথ্যের ভিত্তিতে স্বয়ংক্রিয় হিসাব, চার্ট এবং বিশ্লেষণ প্রদান করে। এটি কোনো বাণিজ্যিক ব্যাংক, লাইসেন্সপ্রাপ্ত কর পরামর্শক কিংবা বিনিয়োগ প্রতিষ্ঠান নয়।'
                    : 'Hishab Khata is an autonomous personal-finance bookkeeping and budgeting software application. It provides mathematical balance tracking, visual charting, and algorithmic insights. It does not constitute certified tax advisory, formal auditing, or licensed banking depository operations.'}
                </p>
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                  {isBn ? '২. ব্যবহারকারীর দায়িত্ব ও একাউন্ট নিরাপত্তা' : '2. User Responsibilities & Security'}
                </h2>
                <p>
                  {isBn
                    ? 'ব্যবহারকারী তার একাউন্টের পাসওয়ার্ড গোপন রাখতে বাধ্য। ভুল বা বিভ্রান্তিকর তথ্য এড়াতে আপনার ওয়ালেট লেনদেন নিয়মিত যাচাই করুন।'
                    : 'You are responsible for maintaining the confidentiality of your login credentials. You agree to notify administration immediately of any unauthorized account activity.'}
                </p>
              </div>

              {/* Anti-Spam & SuperChat Rules */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200 text-xs sm:text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>{isBn ? '৩. সুপারচ্যাট ও স্প্যাম বিরোধী কঠোর নিয়মাবলি' : '3. SuperChat, Donations & Anti-Spam Guidelines'}</span>
                </div>
                <ul className="list-disc list-inside text-xs space-y-1 text-amber-800 dark:text-amber-300">
                  <li>
                    {isBn
                      ? 'ভুয়া TrxID (Transaction ID) বা অন্যের লেনদেনের তথ্য প্রদান করা কঠোরভাবে নিষিদ্ধ। সিস্টেম দ্বারা ডুপ্লিকেট TrxID শনাক্ত হলে তাৎক্ষণিক প্রত্যাখ্যান করা হবে।'
                      : 'Submitting forged, duplicate, or fraudulent SMS TrxIDs is strictly prohibited. Duplicate transaction IDs are rejected by the automated validation layer.'}
                  </li>
                  <li>
                    {isBn
                      ? 'প্রতি ৪৫ সেকেন্ডে সর্বোচ্চ ১টি সাজেশন বা সুপারচ্যাট পাঠানো যাবে। এক ঘণ্টায় সর্বোচ্চ ৫টি সাবমিশনের সীমা রয়েছে।'
                      : 'Anti-flood protection limits submissions to a minimum interval of 45 seconds and maximum 5 entries per hour per account.'}
                  </li>
                  <li>
                    {isBn
                      ? 'জুয়া, বেটিং সাইটের লিংক (1xBet, Melbet ইত্যাদি) বা অবৈধ প্রমোশনাল মেসেজ অন্তর্ভুক্ত করলে একাউন্ট স্থায়ীভাবে নিষিদ্ধ করা হবে।'
                      : 'Gambling, casino, telegram promo links, or abusive spam will result in immediate termination of account privileges.'}
                  </li>
                  <li>
                    {isBn
                      ? 'সুপারচ্যাট অনুদান সফটওয়্যার উন্নয়নের জন্য স্বেচ্ছা প্রণোদনা এবং এটি অফেরতযোগ্য।'
                      : 'SuperChat contributions represent voluntary developer support and community encouragement, and are non-refundable.'}
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                  {isBn ? '৪. সাবস্ক্রিপশন ও প্রো সুবিধা' : '4. PRO Upgrades & Subscription Terms'}
                </h2>
                <p>
                  {isBn
                    ? 'হিসাব খাতা প্রো ব্যবহারকারীদের জন্য আনলিমিটেড ওয়ালেট, প্রিমিয়াম এক্সপোর্ট এবং এআই এডভাইজার সক্রিয় থাকে। পেমেন্ট কনফার্মেশনের সাথে সাথেই অ্যাকাউন্টে সুবিধা যুক্ত হয়।'
                    : 'Pro subscriptions unlock unlimited multi-currency wallets, high-resolution reports, and prioritized Gemini AI advisory. Services are activated upon payment verification.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* 3. ABOUT HISHAB KHATA */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'about' && (
          <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center shadow-xs">
                <Info className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {isBn ? 'হিসাব খাতা পরিচিতি (About Hishab Khata)' : 'About Hishab Khata'}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isBn ? 'আধুনিক ব্যক্তিগত অর্থ ব্যবস্থাপনা ও হিসাব প্ল্যাটফর্ম' : 'Modern Intelligent Financial Management Platform'}
                </p>
              </div>
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                {isBn ? (
                  <>
                    <strong>হিসাব খাতা</strong> বাংলা সংস্কৃতিতে শতাব্দীর প্রাচীন হিসাবরক্ষণের লাল মলাটের ঐতিহ্যের প্রতীক। সেই ঐতিহ্যের সারমর্মকে ধরে রেখে আমরা একে আধুনিক ক্লাউড আর্কিটেকচার, কৃত্রিম বুদ্ধিমত্তা এবং স্থানীয় পেমেন্ট মাধ্যমের সাথে সংযুক্ত করেছি।
                  </>
                ) : (
                  <>
                    <strong>Hishab Khata</strong> translates directly to <em>"The Ledger Book"</em> — an homage to the generational heritage of personal bookkeeping, reimagined as a modern, AI-augmented, multi-currency cloud software platform.
                  </>
                )}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                    {isBn ? '🇧🇩 দেশীয় পেমেন্ট বান্ধব' : 'Local Wallet Support'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isBn ? 'বিকাশ, নগদ, রকেট ও ব্যাংক একাউন্ট সহজেই ট্র্যাক করুন।' : 'Full support for bKash, Nagad, Rocket, cash, and multi-currency banks.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                    {isBn ? '🤖 জেমিনি এআই পরামর্শ' : 'Gemini AI Advisory'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isBn ? 'অতিরিক্ত খরচ কমিয়ে সঞ্চয় বাড়ানোর ব্যক্তিগত পরামর্শ।' : 'Actionable cashflow insights and intelligent budget forecasting.'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80">
                  <p className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                    {isBn ? '🔒 শতভাগ ক্লাউড ব্যাকআপ' : '100% Cloud Security'}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isBn ? 'যেকোনো ডিভাইস থেকে নিরাপদ অ্যাক্সেস ও ব্যাকআপ।' : 'Zero data loss with encrypted real-time cloud synchronization.'}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-[11px] text-slate-500">
                  Crafted with passion for financial sovereignty by Sultan IT Bangladesh.
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800">
                    <CheckCircle2 className="w-3 h-3" />
                    Verified & Live
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 dark:text-slate-500 pt-4">
          © {new Date().getFullYear()} Hishab Khata (হিসাব খাতা). All rights reserved.
        </div>
      </div>
    </div>
  );
};
