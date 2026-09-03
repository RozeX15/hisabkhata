import React, { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import {
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Wallet,
  ArrowUpDown,
  PiggyBank,
  Sparkles,
  Crown,
  FileSpreadsheet,
  Zap,
  ShieldCheck,
  Building2,
  Smartphone,
  CreditCard,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface OnboardingTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUpgrade?: () => void;
  userName?: string;
  userPlan?: string;
  userId?: string;
}

export const OnboardingTutorialModal: React.FC<OnboardingTutorialModalProps> = ({
  isOpen,
  onClose,
  onOpenUpgrade,
  userName = 'User',
  userPlan = 'free',
  userId,
}) => {
  const { language } = useI18n();
  const isBn = language === 'bn';
  const [currentStep, setCurrentStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFinish = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('hk_onboarding_completed', 'true');
        if (userId) {
          localStorage.setItem(`hk_onboarding_${userId}`, 'true');
        }
      } catch (e) {
        // ignore
      }
    }
    onClose();
  };

  const handleSkip = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('hk_onboarding_completed', 'true');
        if (userId) {
          localStorage.setItem(`hk_onboarding_${userId}`, 'true');
        }
      } catch (e) {
        // ignore
      }
    }
    onClose();
  };

  const STEPS = [
    {
      id: 'welcome',
      title: isBn ? `স্বাগতম, ${userName}!` : `Welcome, ${userName}!`,
      subtitle: isBn
        ? 'হিসাব খাতা - আপনার দৈনন্দিন ও পারিবারিক আর্থিক হিসাবের বিশ্বস্ত সঙ্গী'
        : 'Hishab Khata - Your Comprehensive Smart Multi-Wallet Financial Ledger',
      badge: isBn ? 'শুরুর গাইড' : 'Getting Started',
      badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      icon: Sparkles,
      iconColor: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
      content: (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {isBn
              ? 'হিসাব খাতা দিয়ে আপনার নগদ টাকা, ব্যাংক অ্যাকাউন্ট, বিকাশ এবং নগদের সব লেনদেন একসাথে নির্ভুলভাবে পরিচালনা করুন। এক নজরে দেখে নিন কীভাবে সর্বোচ্চ সুবিধা পাবেন:'
              : 'Effortlessly oversee all your Cash, Bank accounts, bKash, Nagad, and cards in one single, high-security dashboard. Here is a quick 1-minute visual tour to get you up to speed:'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-left">
              <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-2 font-bold">
                1
              </div>
              <h4 className="text-xs font-bold text-white mb-1">
                {isBn ? 'ওয়ালেট সংযোগ' : 'Connect Wallets'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {isBn
                  ? 'নগদ, ব্যাংক ও মোবাইল ওয়ালেট যোগ করুন'
                  : 'Add cash, bank accounts & mobile MFS'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-left">
              <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2 font-bold">
                2
              </div>
              <h4 className="text-xs font-bold text-white mb-1">
                {isBn ? 'আয়-ব্যয় লিখুন' : 'Track Cashflows'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {isBn
                  ? '১-ক্লিকে খরচ ও ট্রান্সফার রেকর্ড করুন'
                  : 'Record daily income, expenses & transfers'}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-left">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2 font-bold">
                3
              </div>
              <h4 className="text-xs font-bold text-white mb-1">
                {isBn ? 'বাজেট ও সঞ্চয়' : 'Smart Budgeting'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {isBn
                  ? 'মাসিক লক্ষ্য ও রিপোর্ট তৈরি করুন'
                  : 'Set expense caps & download statements'}
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'wallets',
      title: isBn ? 'মাল্টি-অ্যাকাউন্ট ও লিকুইডিটি' : 'Multi-Account Wallets & Balances',
      subtitle: isBn
        ? 'আপনার সকল ব্যাংক ও মোবাইল ওয়ালেটের ব্যালেন্স এক জায়গায়'
        : 'Organize real-time balances across Cash, Bank, and Mobile MFS',
      badge: isBn ? 'ওয়ালেট গাইড' : 'Wallets & Accounts',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      icon: Wallet,
      iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      content: (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {isBn
              ? 'আপনার প্রতিটি হিসাবের জন্য আলাদা ওয়ালেট থাকবে। এক অ্যাকাউন্ট থেকে অন্য অ্যাকাউন্টে টাকা ট্রান্সফার করলে উভয় ব্যালেন্স সাথে সাথে সমন্বয় হবে।'
              : 'Manage distinct balances for each financial channel. Transferring funds between accounts automatically recalculates both balances with transaction audit tracking.'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
            <div className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-center flex flex-col items-center">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 mb-1.5">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">{isBn ? 'নগদ টাকা' : 'Cash (নগদ)'}</span>
              <span className="text-[10px] text-slate-400">{isBn ? 'প্রধান ক্যাশ' : 'Daily Pocket Cash'}</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-center flex flex-col items-center">
              <div className="p-2 rounded-xl bg-pink-500/20 text-pink-400 mb-1.5">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">{isBn ? 'বিকাশ / নগদ' : 'bKash / Nagad'}</span>
              <span className="text-[10px] text-slate-400">{isBn ? 'মোবাইল ওয়ালেট' : 'Mobile Banking'}</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-center flex flex-col items-center">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 mb-1.5">
                <Building2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">{isBn ? 'ব্যাংক অ্যাকাউন্ট' : 'Bank Accounts'}</span>
              <span className="text-[10px] text-slate-400">{isBn ? 'সঞ্চয়ী / চলতি' : 'Current / Savings'}</span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/90 border border-slate-700 text-center flex flex-col items-center">
              <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 mb-1.5">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-white">{isBn ? 'ক্রেডিট কার্ড' : 'Credit Cards'}</span>
              <span className="text-[10px] text-slate-400">{isBn ? 'কার্ড ব্যালেন্স' : 'Billing Limits'}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-teal-950/40 border border-teal-800/50 flex items-center gap-2 text-xs text-teal-200">
            <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
            <span>
              {isBn
                ? 'ফ্রি প্ল্যানে আপনি ৩টি অ্যাকাউন্ট সম্পূর্ণ বিনামূল্যে ব্যবহার করতে পারবেন।'
                : 'Free tier includes 3 fully functional wallets. PRO allows unlimited wallets.'}
            </span>
          </div>
        </div>
      ),
    },
    {
      id: 'transactions',
      title: isBn ? 'দৈনিক লেনদেন হিসাব' : 'Fast Income & Expense Logging',
      subtitle: isBn
        ? 'সহজে আয়, ব্যয় ও আন্তঃ-হিসাব ফান্ড ট্রান্সফার এন্ট্রি করুন'
        : 'Instant recording with categories, notes, and receipt attachments',
      badge: isBn ? 'লেনদেন হিসাব' : 'Transactions & Receipts',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      icon: ArrowUpDown,
      iconColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
      content: (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {isBn
              ? 'যেকোনো স্ক্রিন থেকে উপরে থাকা "+ লেনদেন" বাটনে ক্লিক করে খরচ বা আয়ের হিসাব যুক্ত করুন। বিভাগ নির্বাচন করে রসিদের ছবি ও বিবরণ সংরক্ষণ করতে পারবেন।'
              : 'Hit "+ Add" anytime from the top bar to record cash spent or earned. Categorize transactions to view monthly breakdowns and trends.'}
          </p>

          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                +৳
              </div>
              <div className="text-left flex-1">
                <span className="text-xs font-bold text-white block">{isBn ? 'আয় (Income)' : 'Income'}</span>
                <span className="text-[11px] text-slate-400">{isBn ? 'বেতন, ব্যবসা, ফ্রিল্যান্সিং বা বিনিয়োগ' : 'Salary, business revenue, freelance'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="w-7 h-7 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center font-bold text-xs">
                -৳
              </div>
              <div className="text-left flex-1">
                <span className="text-xs font-bold text-white block">{isBn ? 'ব্যয় (Expense)' : 'Expense'}</span>
                <span className="text-[11px] text-slate-400">{isBn ? 'বাজার, বাসা ভাড়া, বিদ্যুৎ বিল, যাতায়াত' : 'Groceries, rent, utility bills, dining'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                ⇄
              </div>
              <div className="text-left flex-1">
                <span className="text-xs font-bold text-white block">{isBn ? 'ট্রান্সফার (Transfer)' : 'Transfer'}</span>
                <span className="text-[11px] text-slate-400">{isBn ? 'ব্যাংক থেকে বিকাশ বা ক্যাশে টাকা সরানো' : 'Move money from Bank to bKash or Cash'}</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'budgets',
      title: isBn ? 'বাজেট ও সেভিংস লক্ষ্য' : 'Smart Budgets & Target Goals',
      subtitle: isBn
        ? 'মাসিক খরচের সীমা নির্ধারণ করুন এবং সঞ্চয় গড়ে তুলুন'
        : 'Prevent overspending with visual budget progress and milestones',
      badge: isBn ? 'বাজেটিং' : 'Budgets & Savings',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      icon: PiggyBank,
      iconColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
      content: (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {isBn
              ? 'নির্দিষ্ট ক্যাটাগরির জন্য (যেমন খাবার বা বিনোদন) মাসিক বাজেট নির্ধারণ করুন। বাজেট অতিক্রমের ঝুঁকি তৈরি হলে সিস্টেম স্বয়ংক্রিয় সতর্কবার্তা জানাবে।'
              : 'Set custom monthly budget limits for food, entertainment, or overall spending. Keep track of emergency fund savings targets with visual milestone bars.'}
          </p>

          <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 space-y-2.5">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-white">{isBn ? 'উদাহরণ: মাসিক বাজার বাজেট' : 'Example: Monthly Groceries Budget'}</span>
              <span className="text-teal-400">72% {isBn ? 'ব্যবহৃত' : 'Used'}</span>
            </div>
            <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full w-[72%]" />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>{isBn ? 'খরচ: ৳১৪,৪০০' : 'Spent: ৳14,400'}</span>
              <span>{isBn ? 'বাজেট সীমা: ৳২০,০০০' : 'Limit: ৳20,000'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <span className="font-bold text-white block mb-0.5">{isBn ? 'ঋণ ও ধার খাতা' : 'Debt & Loans'}</span>
              <span className="text-[11px] text-slate-400">{isBn ? 'পাওনা ও দেনা ট্র্যাক করুন' : 'Track who owes you and whom you owe'}</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <span className="font-bold text-white block mb-0.5">{isBn ? 'অডিট লগ' : 'Activity Logs'}</span>
              <span className="text-[11px] text-slate-400">{isBn ? 'প্রতিটি পরিবর্তনের রেকর্ড' : 'Complete chronological action history'}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'plans',
      title: isBn ? 'ফ্রি ও প্রো ফিচারসমূহ' : 'Free vs PRO Features',
      subtitle: isBn
        ? 'ফ্রি প্ল্যানে সব প্রয়োজনীয় ফিচার ব্যবহার করুন, প্রো-তে পাবেন আনলিমিটেড ক্ষমতা'
        : 'All core features are completely free. Upgrade anytime for unlimited mastery.',
      badge: isBn ? 'স্বচ্ছ পলিসি' : 'Feature Transparency',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      icon: Crown,
      iconColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      content: (
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {isBn
              ? 'হিসাব খাতা প্রতিটি ব্যবহারকারীর জন্য উন্মুক্ত। যতদিন প্রো আপগ্রেড না করবেন ততদিন সব ফ্রি ফিচার নির্বিঘ্নে ব্যবহার করতে পারবেন। আপগ্রেড করলে সাথে সাথে সব প্রো ফিচার আনলক হয়ে যাবে:'
              : 'Use all core free features without any expiration. Whenever you need unlimited accounts or official statement downloads, upgrade anytime to PRO:'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* Free Column */}
            <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 text-left relative">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[10px] font-extrabold uppercase">
                  {isBn ? 'ফ্রি প্ল্যান' : 'Free Starter'}
                </span>
                <span className="text-xs font-black text-slate-400">{isBn ? 'আজীবন ফ্রি' : 'Free Forever'}</span>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>{isBn ? '৩টি অ্যাকাউন্ট বা ওয়ালেট' : 'Up to 3 Wallets & Accounts'}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>{isBn ? 'মাসে ১০০টি পর্যন্ত লেনদেন' : '100 Transactions / Month'}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>{isBn ? '২টি বাজেট ও ২টি সেভিংস লক্ষ্য' : '2 Budgets & 2 Savings Goals'}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>{isBn ? 'ঋণ খাতা ও কারেন্সি কনভার্টার' : 'Loans Manager & Currency Calc'}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                  <span>{isBn ? 'CSV ডেটা এক্সপোর্ট' : 'CSV Spreadsheet Data Export'}</span>
                </li>
              </ul>
            </div>

            {/* Pro Column */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-800/90 to-teal-950/40 border border-amber-500/40 text-left relative shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black uppercase flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-300" />
                  <span>PRO VIP</span>
                </span>
                <span className="text-xs font-black text-amber-300">499 ৳ / {isBn ? 'মাস' : 'Month'}</span>
              </div>
              <ul className="space-y-1.5 text-xs text-amber-100/90">
                <li className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-semibold">{isBn ? 'আনলিমিটেড অ্যাকাউন্ট ও ওয়ালেট' : 'Unlimited Accounts & Wallets'}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-semibold">{isBn ? 'আনলিমিটেড মাসিক লেনদেন' : 'Unlimited Transactions'}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="font-semibold">{isBn ? 'Gemini AI ফিনান্সিয়াল কোচ' : 'Gemini AI Financial Coach'}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                  <span className="font-semibold">{isBn ? 'অফিসিয়াল PDF ও Excel স্টেটমেন্ট' : 'Official PDF & Excel Statements'}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="font-semibold">{isBn ? 'আনলিমিটেড সেভিংস মাইলস্টোন' : 'Unlimited Savings Milestones'}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const currentStepData = STEPS[currentStep];
  const StepIcon = currentStepData.icon;
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <div
      id="onboarding-tutorial-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Header Strip */}
        <div className="p-5 sm:p-6 pb-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-slate-800 flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl border ${currentStepData.iconColor}`}>
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${currentStepData.badgeColor}`}
                >
                  {currentStepData.badge}
                </span>
                <span className="text-[11px] text-slate-400 font-bold">
                  {currentStep + 1} / {STEPS.length}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {currentStepData.title}
              </h3>
            </div>
          </div>

          <button
            id="onboarding-skip-top-btn"
            type="button"
            onClick={handleSkip}
            className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 hover:bg-slate-700 transition cursor-pointer"
            title={isBn ? 'বাদ দিন' : 'Skip Tutorial'}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-7 overflow-y-auto flex-1">
          <p className="text-xs text-slate-400 mb-4 font-medium">
            {currentStepData.subtitle}
          </p>
          {currentStepData.content}
        </div>

        {/* Footer Navigation Strip */}
        <div className="p-4 sm:p-6 pt-3 bg-slate-900/95 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Don't show again toggle */}
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none order-2 sm:order-1">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded text-teal-600 bg-slate-800 border-slate-700 focus:ring-teal-500 cursor-pointer"
            />
            <span>{isBn ? 'পরবর্তীতে আর দেখাবেন না' : "Don't show this guide automatically"}</span>
          </label>

          {/* Controls */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end order-1 sm:order-2">
            <button
              type="button"
              onClick={handleSkip}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              {isBn ? 'বাদ দিন (Skip)' : 'Skip Tour'}
            </button>

            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => Math.max(0, prev - 1))}
                className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{isBn ? 'পূর্ববর্তী' : 'Back'}</span>
              </button>
            )}

            {!isLastStep ? (
              <button
                id="onboarding-next-btn"
                type="button"
                onClick={() => setCurrentStep((prev) => Math.min(STEPS.length - 1, prev + 1))}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold shadow-md shadow-teal-700/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>{isBn ? 'পরবর্তী' : 'Next'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                {userPlan !== 'pro' && onOpenUpgrade && (
                  <button
                    type="button"
                    onClick={() => {
                      handleFinish();
                      onOpenUpgrade();
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Crown className="w-3.5 h-3.5" />
                    <span>{isBn ? 'প্রো আপগ্রেড দেখুন' : 'View PRO Plans'}</span>
                  </button>
                )}
                <button
                  id="onboarding-finish-btn"
                  type="button"
                  onClick={handleFinish}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-black shadow-md shadow-teal-700/20 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isBn ? 'শুরু করুন' : 'Get Started'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
