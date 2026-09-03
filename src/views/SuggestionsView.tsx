import React, { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { SuggestionSuperChat, Wallet } from '../types';
import confetti from 'canvas-confetti';
import {
  Sparkles,
  Heart,
  MessageSquare,
  ThumbsUp,
  Send,
  CheckCircle2,
  Clock,
  Zap,
  Crown,
  ShieldCheck,
  TrendingUp,
  Plus,
  Wallet as WalletIcon,
  Flame,
  Star,
  Tag,
  AlertCircle,
  Eye,
  Check
} from 'lucide-react';
import { BKashIcon, NagadIcon } from '../components/PaymentIcons';

interface SuggestionsViewProps {
  currency: string;
  wallets?: Wallet[];
  onNavigate?: (view: string) => void;
  onRefreshWallets?: () => Promise<void>;
}

const CATEGORIES = [
  { id: 'feature', label: 'Feature Request', icon: Zap },
  { id: 'ui_ux', label: 'UI / UX Design', icon: Sparkles },
  { id: 'bug', label: 'Bug Report', icon: AlertCircle },
  { id: 'performance', label: 'Speed & Performance', icon: TrendingUp },
  { id: 'improvement', label: 'General Improvement', icon: MessageSquare },
  { id: 'other', label: 'Other Feedback', icon: Tag },
];

const PRESET_AMOUNTS = [
  { amount: 50, label: '৳50', tier: 'bronze', name: 'Bronze', color: 'text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300' },
  { amount: 100, label: '৳100', tier: 'silver', name: 'Silver', color: 'text-slate-700 bg-slate-200 dark:bg-slate-800 dark:text-slate-300' },
  { amount: 250, label: '৳250', tier: 'silver', name: 'Silver Pro', color: 'text-slate-700 bg-slate-200 dark:bg-slate-800 dark:text-slate-300' },
  { amount: 500, label: '৳500', tier: 'gold', name: 'Gold Supporter', color: 'text-amber-950 bg-amber-400 dark:bg-amber-500 dark:text-slate-950' },
  { amount: 1000, label: '৳1000', tier: 'diamond', name: 'Diamond VIP', color: 'text-cyan-900 bg-cyan-300 dark:bg-cyan-500 dark:text-slate-950' },
];

export const SuggestionsView: React.FC<SuggestionsViewProps> = ({
  currency,
  wallets = [],
  onNavigate,
  onRefreshWallets,
}) => {
  const { t } = useI18n();
  const { user } = useAuth();

  const [suggestions, setSuggestions] = useState<SuggestionSuperChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'superchat' | 'planned' | 'completed' | 'my'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'feature' | 'improvement' | 'ui_ux' | 'bug' | 'performance' | 'other'>('feature');
  const [impact, setImpact] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [hasSuperChat, setHasSuperChat] = useState(false);
  const [superChatAmount, setSuperChatAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [superChatMessage, setSuperChatMessage] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'wallet_balance' | 'bkash' | 'nagad' | 'bank'>('wallet_balance');
  const [walletId, setWalletId] = useState<string>(wallets[0]?.id || '');
  const [paymentTrxId, setPaymentTrxId] = useState('');
  const [senderNumber, setSenderNumber] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Upvoting tracking
  const [upvotingIds, setUpvotingIds] = useState<Set<string>>(new Set());

  // Load suggestions
  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const res: any = await api.getSuggestions();
      const list = Array.isArray(res) ? res : res?.suggestions || [];
      setSuggestions(list);
    } catch (err: any) {
      console.error('Failed to load suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, []);

  useEffect(() => {
    if (wallets.length > 0 && !walletId) {
      setWalletId(wallets[0].id);
    }
  }, [wallets, walletId]);

  const effectiveAmount = customAmount ? parseFloat(customAmount) || 0 : superChatAmount;

  // Handle Submit Suggestion / SuperChat
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!title.trim() || !description.trim()) {
      setErrorMsg('Please provide both a title and details for your suggestion.');
      return;
    }

    if (hasSuperChat) {
      if (effectiveAmount <= 0) {
        setErrorMsg('Please specify a valid SuperChat amount greater than 0.');
        return;
      }
      if (paymentMethod === 'wallet_balance') {
        if (!walletId) {
          setErrorMsg('Please select a wallet to deduct the SuperChat amount from.');
          return;
        }
        const selWallet = wallets.find(w => w.id === walletId);
        if (selWallet && selWallet.balance < effectiveAmount) {
          setErrorMsg(`Insufficient funds in "${selWallet.name}". Current balance: ${selWallet.currency} ${selWallet.balance}.`);
          return;
        }
      }
      if ((paymentMethod === 'bkash' || paymentMethod === 'nagad') && !paymentTrxId.trim()) {
        setErrorMsg('Please enter the SMS TrxID / Transaction ID for verification.');
        return;
      }
    }

    setSubmitting(true);
    try {
      await api.submitSuggestion({
        title: title.trim(),
        description: description.trim(),
        category,
        impact,
        hasSuperChat,
        superChatAmount: hasSuperChat ? effectiveAmount : 0,
        superChatCurrency: 'BDT',
        superChatMessage: superChatMessage.trim() || undefined,
        paymentMethod: hasSuperChat ? paymentMethod : undefined,
        walletId: hasSuperChat && paymentMethod === 'wallet_balance' ? walletId : undefined,
        paymentTrxId: hasSuperChat && paymentTrxId.trim() ? paymentTrxId.trim() : undefined,
        senderNumber: hasSuperChat && senderNumber.trim() ? senderNumber.trim() : undefined,
      });

      if (hasSuperChat) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 },
        });
      }

      setSuccessMsg(hasSuperChat ? '🎉 SuperChat sent! Sultan Admin has been alerted!' : '✅ Suggestion posted successfully!');
      setTitle('');
      setDescription('');
      setSuperChatMessage('');
      setHasSuperChat(false);
      setPaymentTrxId('');
      setSenderNumber('');
      setCustomAmount('');
      
      await loadSuggestions();
      if (onRefreshWallets && hasSuperChat && paymentMethod === 'wallet_balance') {
        await onRefreshWallets();
      }

      setTimeout(() => {
        setIsModalOpen(false);
        setSuccessMsg('');
      }, 1400);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit suggestion');
    } finally {
      setSubmitting(false);
    }
  };

  // Upvote Handler
  const handleUpvote = async (id: string) => {
    if (upvotingIds.has(id)) return;
    setUpvotingIds(prev => new Set(prev).add(id));

    try {
      const res = await api.upvoteSuggestion(id);
      setSuggestions(prev =>
        prev.map(s => {
          if (s.id !== id) return s;
          const upvotedUserIds = s.upvotedUserIds || [];
          const already = user && upvotedUserIds.includes(user.id);
          const nextIds = already
            ? upvotedUserIds.filter(uid => uid !== user?.id)
            : user ? [...upvotedUserIds, user.id] : upvotedUserIds;
          return {
            ...s,
            upvotes: res.upvotes ?? (already ? Math.max(0, (s.upvotes || 1) - 1) : (s.upvotes || 0) + 1),
            upvotedUserIds: nextIds,
          };
        })
      );
    } catch (err: any) {
      console.error('Upvote failed:', err);
    } finally {
      setUpvotingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  // Filtered list
  const filteredSuggestions = suggestions.filter(s => {
    if (filter === 'superchat') return s.hasSuperChat;
    if (filter === 'planned') return s.status === 'planned' || s.status === 'in_progress' || s.status === 'reviewed';
    if (filter === 'completed') return s.status === 'completed';
    if (filter === 'my') return s.userId === user?.id;
    return true;
  });

  const totalSuperChats = suggestions.filter(s => s.hasSuperChat).length;
  const completedCount = suggestions.filter(s => s.status === 'completed').length;
  const totalSuperChatBDT = suggestions.reduce((sum, s) => sum + (Number(s.superChatAmount) || 0), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-amber-600 via-teal-800 to-slate-900 p-6 sm:p-8 text-white shadow-xl border border-amber-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-amber-200 text-xs font-black uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Direct Community Feedback & Sultan Admin Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Suggest Features & SuperChat
            </h1>
            <p className="text-teal-100 text-xs sm:text-sm mt-2 leading-relaxed font-medium">
              Have an idea to make Hishab Khata even better? Suggest what you want added, vote on top community requests, and optionally send a SuperChat contribution to fast-track development directly with Sultan Admin!
            </p>
            <div className="flex flex-wrap items-center gap-2.5 mt-4 text-xs font-bold text-amber-200">
              <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-xl border border-white/10">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>SuperAdmin SultanIT Direct Line</span>
              </div>
              <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-xl border border-white/10">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Live In-App Admin Notification Alert</span>
              </div>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-3">
            <button
              id="open-suggest-modal-btn"
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 ring-2 ring-amber-300/40"
            >
              <Plus className="w-4 h-4" />
              <span>Suggest Feature / SuperChat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">Community Ideas</span>
            <MessageSquare className="w-4 h-4 text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{suggestions.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Submitted proposals</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">Implemented</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{completedCount}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Live in production</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">SuperChats</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-400">{totalSuperChats}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Fast-track sponsors</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase">Community Support</span>
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">৳{totalSuperChatBDT}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Total contributions</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
              filter === 'all'
                ? 'bg-teal-700 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            All Suggestions ({suggestions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('superchat')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              filter === 'superchat'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 hover:bg-slate-100'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>SuperChat Spotlight ({totalSuperChats})</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('planned')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
              filter === 'planned'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            Planned / In Progress
          </button>
          <button
            type="button"
            onClick={() => setFilter('completed')}
            className={`px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
              filter === 'completed'
                ? 'bg-emerald-600 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            Implemented 🎉 ({completedCount})
          </button>
          {user && (
            <button
              type="button"
              onClick={() => setFilter('my')}
              className={`px-3.5 py-2 rounded-xl transition cursor-pointer shrink-0 ${
                filter === 'my'
                  ? 'bg-purple-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              My Posts
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Write a suggestion</span>
        </button>
      </div>

      {/* Suggestion Feed */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">
          Loading suggestions & SuperChats...
        </div>
      ) : filteredSuggestions.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <Sparkles className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No suggestions in this view</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Be the first to share an improvement idea or send a SuperChat to Sultan Admin!
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-2 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl cursor-pointer"
          >
            Create Suggestion
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSuggestions.map((item) => {
            const hasUpvoted = Boolean(user && item.upvotedUserIds?.includes(user.id));

            return (
              <div
                key={item.id}
                className={`relative flex flex-col justify-between p-5 rounded-3xl bg-white dark:bg-slate-900 border transition shadow-xs hover:shadow-md ${
                  item.hasSuperChat
                    ? 'border-amber-400/80 dark:border-amber-500/50 bg-gradient-to-br from-amber-500/5 via-white to-transparent dark:from-amber-500/10 dark:via-slate-900'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Card Header Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      {item.hasSuperChat && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-xs animate-pulse">
                          <Crown className="w-3.5 h-3.5 text-slate-950" />
                          <span>SUPERCHAT ৳{item.superChatAmount}</span>
                          {item.isSuperChatVerified && (
                            <span title="Verified by Sultan Admin">✓</span>
                          )}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold uppercase">
                        {item.category}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {item.status === 'completed' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Implemented
                        </span>
                      )}
                      {(item.status === 'planned' || item.status === 'in_progress') && (
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[10px] font-black uppercase flex items-center gap-1">
                          <Clock className="w-3 h-3" /> In Progress
                        </span>
                      )}
                      {(item.status === 'pending' || item.status === 'reviewed') && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Under Review
                        </span>
                      )}
                      {item.status === 'declined' && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-[10px] font-black uppercase">
                          Declined
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line mb-3">
                    {item.description}
                  </p>

                  {/* Admin Reply Box if present */}
                  {item.adminReply && (
                    <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/80 mb-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-teal-800 dark:text-teal-300 font-bold text-xs">
                        <ShieldCheck className="w-4 h-4 text-teal-600" />
                        <span>Sultan Admin Reply</span>
                        {item.adminRepliedAt && (
                          <span className="text-[10px] text-teal-600/70 font-normal">
                            ({new Date(item.adminRepliedAt).toLocaleDateString()})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-200">
                        {item.adminReply}
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-black text-[10px] flex items-center justify-center">
                      {item.userName?.charAt(0) || 'U'}
                    </div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                      {item.userName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Upvote Button */}
                  <button
                    type="button"
                    onClick={() => handleUpvote(item.id)}
                    disabled={upvotingIds.has(item.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                      hasUpvoted
                        ? 'bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${hasUpvoted ? 'fill-teal-600 text-teal-600' : ''}`} />
                    <span>{item.upvotes || 0}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Suggestion & SuperChat Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-600 via-teal-800 to-slate-900 text-white flex items-center justify-between">
              <div>
                <h2 className="text-lg sm:text-xl font-black">Submit Suggestion & SuperChat</h2>
                <p className="text-xs text-teal-100 mt-0.5">Delivered directly to Sultan Admin</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs font-bold border border-red-200 dark:border-red-900/50">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-900/50">
                  {successMsg}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Suggestion Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Add monthly budget report PDF export with charts"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e: any) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Impact */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Expected Impact
                  </label>
                  <select
                    value={impact}
                    onChange={(e: any) => setImpact(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    <option value="low">Low - Nice to have</option>
                    <option value="medium">Medium - Helpful for many</option>
                    <option value="high">High - Very important</option>
                    <option value="critical">Critical - Fix immediately</option>
                  </select>
                </div>
              </div>

              {/* Details */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Detailed Explanation *
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your idea or what feature you want implemented, and why it would be helpful..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
              </div>

              {/* SuperChat Toggle Box */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300 dark:border-amber-700/60">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                        Attach SuperChat Supporter Donation
                      </h4>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300">
                        Spotlight your suggestion & prioritize implementation!
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={hasSuperChat}
                    onChange={(e) => setHasSuperChat(e.target.checked)}
                    className="w-5 h-5 accent-amber-500 cursor-pointer"
                  />
                </div>

                {hasSuperChat && (
                  <div className="mt-4 pt-3 border-t border-amber-200 dark:border-amber-700/50 space-y-3.5">
                    {/* Presets */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-2">
                        Select Supporter Tier
                      </label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {PRESET_AMOUNTS.map((p) => {
                          const isSelected = !customAmount && superChatAmount === p.amount;
                          return (
                            <button
                              key={p.amount}
                              type="button"
                              onClick={() => {
                                setSuperChatAmount(p.amount);
                                setCustomAmount('');
                              }}
                              className={`p-2 rounded-xl text-center border transition cursor-pointer ${
                                isSelected
                                  ? 'bg-amber-500 text-slate-950 font-black border-amber-500 shadow-xs'
                                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-amber-300'
                              }`}
                            >
                              <div className="text-xs font-black">{p.label}</div>
                              <div className="text-[9px] opacity-80 truncate">{p.name}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Amount */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Or Custom Amount (৳ BDT)
                      </label>
                      <input
                        type="number"
                        min="10"
                        step="10"
                        placeholder="e.g. 300"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    {/* Optional Personal Note to Admin */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Personal Message to Sultan Admin (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Keep up the great work on Hishab Khata!"
                        value={superChatMessage}
                        onChange={(e) => setSuperChatMessage(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                      />
                    </div>

                    {/* Payment Method Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-2">
                        Payment Method
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('wallet_balance')}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition ${
                            paymentMethod === 'wallet_balance'
                              ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 ring-1 ring-amber-500'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <WalletIcon className="w-4 h-4 text-teal-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold leading-none truncate">In-App Wallet</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Instant</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('bkash')}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition ${
                            paymentMethod === 'bkash'
                              ? 'border-pink-500 bg-pink-50 dark:bg-pink-950/40 text-pink-900 dark:text-pink-200 ring-1 ring-pink-500'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <BKashIcon size={18} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold leading-none">bKash</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Send Money</p>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setPaymentMethod('nagad')}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition ${
                            paymentMethod === 'nagad'
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/40 text-orange-900 dark:text-orange-200 ring-1 ring-orange-500'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <NagadIcon size={18} />
                          <div className="min-w-0">
                            <p className="text-xs font-bold leading-none">Nagad</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Send Money</p>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Wallet Select if wallet_balance */}
                    {paymentMethod === 'wallet_balance' && (
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                          Select Source Wallet (Deduction: ৳{effectiveAmount})
                        </label>
                        <select
                          value={walletId}
                          onChange={(e) => setWalletId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold cursor-pointer"
                        >
                          {wallets.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name} (Balance: {w.currency} {w.balance.toLocaleString()})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* TrxID & Number if bKash or Nagad */}
                    {(paymentMethod === 'bkash' || paymentMethod === 'nagad') && (
                      <div className="space-y-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Send ৳{effectiveAmount} via {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} Personal to Sultan Admin:
                        </p>
                        <p className="text-xs font-black text-teal-700 dark:text-teal-400 font-mono tracking-wider">
                          01784988583 (Personal)
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              Sender Mobile Number
                            </label>
                            <input
                              type="text"
                              placeholder="01XXXXXXXXX"
                              value={senderNumber}
                              onChange={(e) => setSenderNumber(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                              SMS TrxID (Transaction ID) *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. BL99ABC123"
                              value={paymentTrxId}
                              onChange={(e) => setPaymentTrxId(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono font-bold uppercase focus:ring-1 focus:ring-teal-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs text-white transition flex items-center gap-2 cursor-pointer ${
                    hasSuperChat
                      ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md'
                      : 'bg-teal-700 hover:bg-teal-800'
                  }`}
                >
                  {submitting ? (
                    <span>Submitting...</span>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>{hasSuperChat ? `Send SuperChat (৳${effectiveAmount})` : 'Post Suggestion'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
