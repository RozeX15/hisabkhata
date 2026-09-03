import React, { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { AdminPaymentConfig, SubscriptionPayment, PaymentMethodType } from '../types';
import { BKashIcon, NagadIcon, RocketIcon, BankIconBadge, BKashFullLogo, NagadFullLogo } from './PaymentIcons';
import { recordActionConfirmation } from '../lib/actionNotifications';
import { AppLogoMark } from './AppLogo';
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
  Loader2,
  Copy,
  CheckCheck,
  Building2,
  Smartphone,
  Clock,
  AlertCircle,
  ArrowRight,
  Send,
  History
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
  const { t, currency } = useI18n();
  const { user, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'benefits' | 'checkout' | 'history'>('benefits');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly' | 'lifetime'>('yearly');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('bkash');
  
  // Payment Config from Admin
  const [config, setConfig] = useState<AdminPaymentConfig | null>(null);
  const [myPayments, setMyPayments] = useState<SubscriptionPayment[]>([]);
  const [loadingConfig, setLoadingConfig] = useState(false);

  // Form Fields
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [senderNumber, setSenderNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [notes, setNotes] = useState('');
  
  // Validation touch states
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [trxIdTouched, setTrxIdTouched] = useState(false);

  // State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (user?.email && !contactEmail) {
        setContactEmail(user.email);
      }
      loadPaymentConfig();
      loadMyPayments();
    }
  }, [isOpen, user]);

  const loadPaymentConfig = async () => {
    setLoadingConfig(true);
    try {
      const cfg = await api.getSubscriptionConfig();
      setConfig(cfg);
    } catch (err) {
      console.error('Failed to load payment config', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  const loadMyPayments = async () => {
    try {
      const list = await api.getMySubscriptionPayments();
      setMyPayments(list || []);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  const isAlreadyPro = user?.plan === 'pro';

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const PRO_BENEFITS = [
    {
      title: 'Unlimited Accounts & Wallets',
      desc: 'Connect unlimited Bank, bKash, Nagad, Cash & Credit Cards (Free tier limited to 3).',
      icon: Infinity,
      color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-950/60'
    },
    {
      title: 'Unlimited Monthly Transactions',
      desc: 'Record and track all your household and business cashflows with no monthly quotas.',
      icon: Zap,
      color: 'text-amber-500 bg-amber-100 dark:bg-amber-950/60'
    },
    {
      title: 'Gemini 3.7 Pro AI Financial Coach',
      desc: 'Deep predictive budgeting, anomaly detection, automated debt reduction roadmap.',
      icon: Sparkles,
      color: 'text-purple-500 bg-purple-100 dark:bg-purple-950/60'
    },
    {
      title: 'Tax-Ready PDF & Excel Statement Export',
      desc: 'Download high-resolution official financial statements and full CSV/Excel spreadsheets.',
      icon: FileText,
      color: 'text-blue-500 bg-blue-100 dark:bg-blue-950/60'
    },
    {
      title: 'Unlimited Savings Milestones',
      desc: 'Create unlimited target trackers with automated contribution schedules and progress curves.',
      icon: ShieldCheck,
      color: 'text-teal-500 bg-teal-100 dark:bg-teal-950/60'
    },
    {
      title: 'Multi-Currency Real-time Conversion',
      desc: 'Auto-convert between BDT, USD, EUR, GBP, SAR, AED with live exchange parity.',
      icon: Crown,
      color: 'text-indigo-500 bg-indigo-100 dark:bg-indigo-950/60'
    }
  ];

  const getTargetPriceDisplay = () => {
    const isUSD = currency === 'USD';
    const monthlyBDT = config?.proMonthlyPriceBDT ?? 499;
    const yearlyBDT = config?.proYearlyPriceBDT ?? 4999;
    const lifetimeBDT = config?.proLifetimePriceBDT ?? 9999;
    const monthlyUSD = config?.proMonthlyPriceUSD ?? 4.99;
    const yearlyUSD = config?.proYearlyPriceUSD ?? 49.99;
    const lifetimeUSD = config?.proLifetimePriceUSD ?? 99.99;
    const discount = config?.yearlyDiscountPercent ?? 20;

    if (billingCycle === 'monthly') {
      return {
        amount: isUSD ? monthlyUSD : monthlyBDT,
        curr: isUSD ? 'USD' : 'BDT',
        bdt: `${monthlyBDT.toLocaleString()} ৳/Month`,
        usd: `$${monthlyUSD}/mo`,
        display: isUSD ? `$${monthlyUSD}/mo` : `${monthlyBDT.toLocaleString()} ৳/Month`,
        period: 'Monthly'
      };
    }
    if (billingCycle === 'yearly') {
      return {
        amount: isUSD ? yearlyUSD : yearlyBDT,
        curr: isUSD ? 'USD' : 'BDT',
        bdt: `${yearlyBDT.toLocaleString()} ৳/Year`,
        usd: `$${yearlyUSD}/yr`,
        display: isUSD ? `$${yearlyUSD}/yr` : `${yearlyBDT.toLocaleString()} ৳/Year`,
        period: `Yearly (Save ${discount}%)`
      };
    }
    return {
      amount: isUSD ? lifetimeUSD : lifetimeBDT,
      curr: isUSD ? 'USD' : 'BDT',
      bdt: `${lifetimeBDT.toLocaleString()} ৳ Lifetime`,
      usd: `$${lifetimeUSD} Lifetime`,
      display: isUSD ? `$${lifetimeUSD} Lifetime` : `${lifetimeBDT.toLocaleString()} ৳ Lifetime`,
      period: 'Lifetime VIP Access'
    };
  };

  const priceInfo = getTargetPriceDisplay();

  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const isMFS = ['bkash', 'nagad', 'rocket', 'upay'].includes(paymentMethod);
  const validatePhone = (val: string) => {
    const clean = val.replace(/[\s\-\+]/g, '');
    if (isMFS) {
      return /^(?:88)?01[3-9]\d{8}$/.test(clean);
    }
    return clean.length >= 6;
  };
  const validateTrx = (val: string) => /^[A-Za-z0-9\-_]{6,35}$/.test(val.trim());

  const isEmailValid = validateEmail(contactEmail);
  const isPhoneValid = validatePhone(senderNumber);
  const isTrxValid = validateTrx(trxId);

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setPhoneTouched(true);
    setTrxIdTouched(true);

    if (!isEmailValid) {
      setError('Please provide a valid contact & billing email address (e.g. name@example.com).');
      return;
    }

    if (!isPhoneValid) {
      setError(
        isMFS
          ? `Please provide a valid 11-digit ${paymentMethod.toUpperCase()} mobile number (e.g. 01712345678).`
          : 'Please enter a valid sender bank account or account identifier (at least 6 characters).'
      );
      return;
    }

    if (!isTrxValid) {
      setError('Transaction ID (TrxID) must be at least 6 alphanumeric characters without spaces or symbols.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const targetAmount = priceInfo.amount;

      await api.submitSubscriptionPayment({
        billingCycle,
        paymentMethod,
        senderNumberOrAccount: senderNumber.trim(),
        transactionId: trxId.trim(),
        userEmail: contactEmail.trim(),
        amount: targetAmount,
        currency: priceInfo.curr,
        notes: notes.trim() || undefined,
      });

      setSubmitSuccess(true);
      await loadMyPayments();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      // Record action confirmation notification & audit log
      recordActionConfirmation({
        type: 'subscription_submit',
        category: 'SUBSCRIPTION',
        title: 'PRO Subscription Submitted!',
        message: `Payment request of ${priceInfo.curr} ${targetAmount} via ${paymentMethod.toUpperCase()} received for approval.`,
        details: `TrxID: ${trxId.trim()} • Sender: ${senderNumber.trim()} • Email: ${contactEmail.trim()} (${billingCycle.toUpperCase()})`,
        amount: targetAmount,
        currency: priceInfo.curr,
        status: 'pending',
      });

      setTimeout(() => {
        setActiveTab('history');
        setSubmitSuccess(false);
        setSenderNumber('');
        setTrxId('');
        setEmailTouched(false);
        setPhoneTouched(false);
        setTrxIdTouched(false);
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Payment submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Banner Header */}
        <div className="relative p-6 sm:p-7 bg-gradient-to-br from-teal-900 via-teal-800 to-slate-950 text-white shrink-0">
          <div className="absolute top-0 right-0 w-72 h-72 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
          
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <div className="px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-300" />
              <span>Hishab Khata VIP PRO</span>
            </div>
            {isAlreadyPro && (
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-xs font-extrabold">
                Active Subscriber
              </span>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Unlock Full Financial Mastery
          </h2>
          <p className="text-xs sm:text-sm text-teal-100 mt-1 max-w-xl">
            Upgrade your account to receive unlimited accounts, Gemini AI predictive guidance, and official financial statement downloads.
          </p>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-5 pt-3 border-t border-teal-700/50 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('benefits')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'benefits'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <Crown className="w-3.5 h-3.5" />
              <span>Premium Benefits</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('checkout')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'checkout'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Mobile / Bank Payment</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Payment History ({myPayments.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 sm:p-7 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3.5 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-900/50 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: BENEFITS */}
          {activeTab === 'benefits' && (
            <div className="space-y-6">
              {/* Billing Cycle Picker */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider pl-1">
                  Choose Plan Tier:
                </span>
                <div className="flex flex-wrap items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer ${
                      billingCycle === 'monthly'
                        ? 'bg-teal-700 text-white shadow-md'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    Monthly ({config ? `${config.proMonthlyPriceBDT} ৳` : '499 ৳'})
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('yearly')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer relative ${
                      billingCycle === 'yearly'
                        ? 'bg-teal-700 text-white shadow-md'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>Yearly ({config ? `${config.proYearlyPriceBDT} ৳` : '4,999 ৳'})</span>
                    <span className="ml-1 px-1.5 py-0.2 bg-emerald-500 text-white text-[9px] rounded-full font-black">
                      Save {config?.yearlyDiscountPercent ?? 20}%
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBillingCycle('lifetime')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer relative ${
                      billingCycle === 'lifetime'
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>Lifetime ({config?.proLifetimePriceBDT ? `${config.proLifetimePriceBDT} ৳` : '9,999 ৳'})</span>
                    <span className="ml-1 px-1.5 py-0.2 bg-purple-600 text-white text-[9px] rounded-full font-black">
                      VIP
                    </span>
                  </button>
                </div>
              </div>

              {/* Grid of benefits */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {PRO_BENEFITS.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex items-start gap-3.5"
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold ${item.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed font-medium">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* CTA Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('checkout')}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-teal-700 via-teal-600 to-amber-500 hover:from-teal-800 hover:to-amber-600 text-white font-black text-sm sm:text-base shadow-xl shadow-teal-700/25 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <CreditCard className="w-5 h-5" />
                  <span>Proceed to Mobile / Banking Payment ({priceInfo.display})</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
                <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                  🔒 Fast verification via bKash, Nagad, Rocket, or Bank Transfer. Admin approves within minutes.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: MOBILE & BANKING CHECKOUT */}
          {activeTab === 'checkout' && (
            <div className="space-y-6">
              {submitSuccess && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded-2xl text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-3">
                  <CheckCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-extrabold text-sm">Payment Details Submitted Successfully!</p>
                    <p className="text-[11px] font-normal text-emerald-700 dark:text-emerald-300 mt-0.5">
                      Admin has received your TrxID and will verify it shortly. You can monitor the approval in your Payment History tab.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 1: Select Payment Method */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  1. Select Payment Method:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* bKash */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bkash')}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-2 ${
                      paymentMethod === 'bkash'
                        ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/50 text-pink-900 dark:text-pink-200 ring-2 ring-pink-500 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <BKashIcon size={36} className="shadow-xs rounded-xl" />
                    <div className="leading-tight">
                      <span className="text-xs font-black block">bKash</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{config?.bkashType === 'merchant' ? 'Merchant Pay' : 'Personal Send'}</span>
                    </div>
                  </button>

                  {/* Nagad */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('nagad')}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-2 ${
                      paymentMethod === 'nagad'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/50 text-orange-900 dark:text-orange-200 ring-2 ring-orange-500 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <NagadIcon size={36} className="shadow-xs rounded-xl" />
                    <div className="leading-tight">
                      <span className="text-xs font-black block">Nagad</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{config?.nagadType === 'merchant' ? 'Merchant Pay' : 'Personal Send'}</span>
                    </div>
                  </button>

                  {/* Rocket */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('rocket')}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-2 ${
                      paymentMethod === 'rocket'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/50 text-purple-900 dark:text-purple-200 ring-2 ring-purple-500 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <RocketIcon size={36} className="shadow-xs rounded-xl" />
                    <div className="leading-tight">
                      <span className="text-xs font-black block">Rocket</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">DBBL Rocket</span>
                    </div>
                  </button>

                  {/* Bank Transfer */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center gap-2 ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/50 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <BankIconBadge size={36} className="shadow-xs rounded-xl" />
                    <div className="leading-tight">
                      <span className="text-xs font-black block">Bank Transfer</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">IBBL / NPSB</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Step 2: Admin Receiving Account Details */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 space-y-3.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-slate-950 dark:text-teal-400" />
                    <h4 className="text-sm font-black uppercase tracking-wider text-black dark:text-white">
                      2. Admin Receiving Account:
                    </h4>
                  </div>
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-black text-white dark:bg-emerald-400 dark:text-black shadow-xs">
                    Fee: {priceInfo.bdt}
                  </span>
                </div>

                {paymentMethod === 'bkash' && (
                  <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3.5">
                      <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800 shrink-0">
                        <BKashFullLogo height={32} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                          bKash Account ({config?.bkashType || 'Personal'}):
                        </p>
                        <p className="font-mono text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-wider mt-0.5 select-all">
                          {config?.bkashNumber || '01711-234567'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      id="copy-bkash-ac-btn"
                      onClick={() => handleCopy(config?.bkashNumber || '01711-234567', 'bkash')}
                      className={`px-5 py-2.5 rounded-xl border-2 font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0 ${
                        copiedField === 'bkash'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 border-slate-900 text-white dark:bg-teal-600 dark:hover:bg-teal-500 dark:border-teal-500'
                      }`}
                      style={{
                        backgroundColor: copiedField === 'bkash' ? '#059669' : undefined,
                        color: '#ffffff',
                      }}
                      title="Copy bKash Account Number"
                    >
                      {copiedField === 'bkash' ? <CheckCheck className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-emerald-300 dark:text-teal-200" />}
                      <span className="font-black text-xs tracking-wider uppercase" style={{ color: '#ffffff' }}>
                        {copiedField === 'bkash' ? 'Copied' : 'Copy'}
                      </span>
                    </button>
                  </div>
                )}

                {paymentMethod === 'nagad' && (
                  <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3.5">
                      <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800 shrink-0">
                        <NagadFullLogo height={32} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                          Nagad Account ({config?.nagadType || 'Personal'}):
                        </p>
                        <p className="font-mono text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-wider mt-0.5 select-all">
                          {config?.nagadNumber || '01811-234567'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      id="copy-nagad-ac-btn"
                      onClick={() => handleCopy(config?.nagadNumber || '01811-234567', 'nagad')}
                      className={`px-5 py-2.5 rounded-xl border-2 font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0 ${
                        copiedField === 'nagad'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 border-slate-900 text-white dark:bg-teal-600 dark:hover:bg-teal-500 dark:border-teal-500'
                      }`}
                      style={{
                        backgroundColor: copiedField === 'nagad' ? '#059669' : undefined,
                        color: '#ffffff',
                      }}
                      title="Copy Nagad Account Number"
                    >
                      {copiedField === 'nagad' ? <CheckCheck className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-emerald-300 dark:text-teal-200" />}
                      <span className="font-black text-xs tracking-wider uppercase" style={{ color: '#ffffff' }}>
                        {copiedField === 'nagad' ? 'Copied' : 'Copy'}
                      </span>
                    </button>
                  </div>
                )}

                {paymentMethod === 'rocket' && (
                  <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border-2 border-slate-300 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                    <div className="flex items-center gap-3.5">
                      <div className="p-1 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 shrink-0">
                        <RocketIcon size={44} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                          Rocket Account Number:
                        </p>
                        <p className="font-mono text-xl sm:text-2xl font-black text-slate-950 dark:text-white tracking-wider mt-0.5 select-all">
                          {config?.rocketNumber || '01911-234567-8'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      id="copy-rocket-ac-btn"
                      onClick={() => handleCopy(config?.rocketNumber || '01911-234567-8', 'rocket')}
                      className={`px-5 py-2.5 rounded-xl border-2 font-black text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-md shrink-0 ${
                        copiedField === 'rocket'
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 border-slate-900 text-white dark:bg-teal-600 dark:hover:bg-teal-500 dark:border-teal-500'
                      }`}
                      style={{
                        backgroundColor: copiedField === 'rocket' ? '#059669' : undefined,
                        color: '#ffffff',
                      }}
                      title="Copy Rocket Account Number"
                    >
                      {copiedField === 'rocket' ? <CheckCheck className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4 text-emerald-300 dark:text-teal-200" />}
                      <span className="font-black text-xs tracking-wider uppercase" style={{ color: '#ffffff' }}>
                        {copiedField === 'rocket' ? 'Copied' : 'Copy'}
                      </span>
                    </button>
                  </div>
                )}

                {paymentMethod === 'bank_transfer' && (
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border-2 border-slate-300 dark:border-slate-700 space-y-2 text-xs shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-black dark:text-white font-bold">Bank Name:</span>
                      <span className="font-black text-black dark:text-white text-sm">{config?.bankName || 'Islami Bank Bangladesh PLC'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-black dark:text-white font-bold">Account Name:</span>
                      <span className="font-black text-black dark:text-white text-sm">{config?.bankAccountName || 'Hishab Khata SaaS Admin'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-black dark:text-white font-bold">Account Number:</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-black dark:text-teal-300 text-base">{config?.bankAccountNumber || '2050112020345678'}</span>
                        <button
                          type="button"
                          id="copy-bank-ac-btn"
                          onClick={() => handleCopy(config?.bankAccountNumber || '2050112020345678', 'bankAc')}
                          className={`px-4 py-2 rounded-xl border-2 font-black text-xs transition flex items-center gap-1.5 cursor-pointer shadow-md ${
                            copiedField === 'bankAc'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 border-slate-900 text-white dark:bg-teal-600 dark:hover:bg-teal-500 dark:border-teal-500'
                          }`}
                          style={{
                            backgroundColor: copiedField === 'bankAc' ? '#059669' : undefined,
                            color: '#ffffff',
                          }}
                          title="Copy Bank Account Number"
                        >
                          {copiedField === 'bankAc' ? <CheckCheck className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5 text-emerald-300 dark:text-teal-200" />}
                          <span className="font-black text-xs tracking-wider uppercase" style={{ color: '#ffffff' }}>
                            {copiedField === 'bankAc' ? 'Copied' : 'Copy'}
                          </span>
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-black dark:text-white font-bold">Branch & Routing:</span>
                      <span className="text-black dark:text-white font-semibold">{config?.bankBranch || 'Dhanmondi Branch'} (Routing: {config?.bankRoutingNumber || '125272847'})</span>
                    </div>
                  </div>
                )}

                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700">
                  <p className="text-xs sm:text-sm text-black dark:text-white font-bold leading-relaxed">
                    {config?.instructionsBn || 'বিকাশ বা নগদ অ্যাপ থেকে "Send Money" বা "Payment" করুন। পেমেন্ট সফল হলে প্রাপ্ত TrxID এবং আপনার মোবাইল নম্বর সাবমিট করুন। অ্যাডমিন ৫-১০ মিনিটের মধ্যে ভেরিফাই করে PRO একাউন্ট একটিভ করে দিবে।'}
                  </p>
                </div>
              </div>

              {/* Step 3: Submission Form */}
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    3. Submit Your Transaction Proof:
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Enter your verified billing email, the sender mobile/account number, and the confirmation TrxID.
                  </p>
                </div>

                {/* Email Address Field */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Billing & Confirmation Email Address *
                    </label>
                    {emailTouched && (
                      <span className={`text-[10px] font-bold ${isEmailValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {isEmailValid ? '✓ Valid Email' : '✗ Invalid Email Format'}
                      </span>
                    )}
                  </div>
                  <input
                    id="upgrade-contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => {
                      setContactEmail(e.target.value);
                      setEmailTouched(true);
                    }}
                    onBlur={() => setEmailTouched(true)}
                    placeholder="e.g. yourname@example.com"
                    className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 outline-none transition ${
                      emailTouched && !isEmailValid
                        ? 'border-rose-500 focus:ring-rose-500'
                        : 'border-slate-200 dark:border-slate-700 focus:ring-teal-500'
                    }`}
                    required
                  />
                  {emailTouched && !isEmailValid && (
                    <p className="text-[11px] text-rose-500 mt-1 font-medium">
                      Please enter a valid email address for subscription activation receipt.
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        {isMFS ? `${paymentMethod.toUpperCase()} Mobile Number *` : 'Sender Account Number *'}
                      </label>
                      {phoneTouched && (
                        <span className={`text-[10px] font-bold ${isPhoneValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {isPhoneValid ? '✓ Valid Number' : isMFS ? '✗ 11 Digits Req' : '✗ Min 6 Chars'}
                        </span>
                      )}
                    </div>
                    <input
                      id="upgrade-sender-number"
                      type="text"
                      value={senderNumber}
                      onChange={(e) => {
                        setSenderNumber(e.target.value);
                        setPhoneTouched(true);
                      }}
                      onBlur={() => setPhoneTouched(true)}
                      placeholder={isMFS ? 'e.g. 01712345678' : 'e.g. 150-101-0023456'}
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-semibold focus:ring-2 outline-none transition ${
                        phoneTouched && !isPhoneValid
                          ? 'border-rose-500 focus:ring-rose-500'
                          : 'border-slate-200 dark:border-slate-700 focus:ring-teal-500'
                      }`}
                      required
                    />
                    {phoneTouched && !isPhoneValid && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">
                        {isMFS
                          ? 'Enter valid 11-digit mobile number (e.g. 01712345678).'
                          : 'Enter at least 6 characters.'}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Transaction ID (TrxID) *
                      </label>
                      {trxIdTouched && (
                        <span className={`text-[10px] font-bold ${isTrxValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {isTrxValid ? '✓ Valid TrxID' : '✗ Min 6 Chars'}
                        </span>
                      )}
                    </div>
                    <input
                      id="upgrade-trx-id"
                      type="text"
                      value={trxId}
                      onChange={(e) => {
                        setTrxId(e.target.value);
                        setTrxIdTouched(true);
                      }}
                      onBlur={() => setTrxIdTouched(true)}
                      placeholder="e.g. 9K7J3M2N1X"
                      className={`w-full px-3.5 py-2.5 rounded-xl border bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-mono font-bold focus:ring-2 outline-none uppercase transition ${
                        trxIdTouched && !isTrxValid
                          ? 'border-rose-500 focus:ring-rose-500'
                          : 'border-slate-200 dark:border-slate-700 focus:ring-teal-500'
                      }`}
                      required
                    />
                    {trxIdTouched && !isTrxValid && (
                      <p className="text-[11px] text-rose-500 mt-1 font-medium">
                        Must be at least 6 alphanumeric characters.
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Optional Reference Note / Screenshot Details
                  </label>
                  <input
                    id="upgrade-notes"
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Sent from personal bKash around 2:30 PM"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    id="upgrade-submit-payment-btn"
                    type="submit"
                    disabled={submitting || (emailTouched && !isEmailValid) || (phoneTouched && !isPhoneValid) || (trxIdTouched && !isTrxValid)}
                    className="w-full py-3.5 px-6 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-extrabold text-sm shadow-lg shadow-teal-700/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Submit Payment Proof for Verification</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: MY PAYMENT HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Your Submitted Subscriptions ({myPayments.length})
                </h4>
                <button
                  type="button"
                  onClick={loadMyPayments}
                  className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline cursor-pointer"
                >
                  Refresh Status
                </button>
              </div>

              {myPayments.length === 0 ? (
                <div className="py-12 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 p-6">
                  <CreditCard className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No Payment Requests Yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    When you submit a mobile or bank payment, its status will be tracked here.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('checkout')}
                    className="mt-3 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Submit a Payment
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {myPayments.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-700/80 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900 dark:text-white uppercase">
                            {p.paymentMethod}
                          </span>
                          <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
                            {p.amount} {p.currency} ({p.billingCycle})
                          </span>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            p.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : p.status === 'rejected'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                          }`}
                        >
                          {p.status === 'approved' ? '✓ Approved' : p.status === 'rejected' ? '✗ Rejected' : '⏳ Pending Review'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 text-[11px]">Sender Number:</span>
                          <p className="font-bold text-slate-800 dark:text-slate-200">{p.senderNumberOrAccount}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[11px]">TrxID:</span>
                          <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{p.transactionId}</p>
                        </div>
                      </div>

                      {p.adminNotes && (
                        <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 text-xs">
                          <span className="font-bold">Admin Note:</span> {p.adminNotes}
                        </div>
                      )}

                      <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                        <span>Submitted on {new Date(p.createdAt).toLocaleString()}</span>
                        {p.reviewedAt && <span>Reviewed: {new Date(p.reviewedAt).toLocaleString()}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
