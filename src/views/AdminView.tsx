import React, { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import {
  User,
  UserPresence,
  SubscriptionPayment,
  AdminPaymentConfig,
  PaymentMethodType,
  LiveUserActivity,
  EmailLogEntry
} from '../types';
import { BKashIcon, NagadIcon, RocketIcon, BankIconBadge, PaymentMethodBadge } from '../components/PaymentIcons';
import confetti from 'canvas-confetti';
import {
  ShieldAlert,
  Users,
  DollarSign,
  TrendingUp,
  CreditCard,
  Send,
  Loader2,
  Crown,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Bell,
  Activity,
  Smartphone,
  Building2,
  Check,
  X,
  Copy,
  CheckCheck,
  Search,
  Filter,
  Eye,
  MessageSquare,
  Settings,
  Save,
  Laptop,
  Globe,
  Clock,
  Radio,
  UserCheck,
  UserX,
  Mail,
  History,
  ShieldCheck,
  FileText,
  Zap,
  ListFilter
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { t } = useI18n();
  const { user } = useAuth();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'presence' | 'activities' | 'payments' | 'emailLogs' | 'users' | 'broadcast' | 'config'>('presence');

  // Core Data
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [presences, setPresences] = useState<UserPresence[]>([]);
  const [liveActivities, setLiveActivities] = useState<LiveUserActivity[]>([]);
  const [emailLogs, setEmailLogs] = useState<EmailLogEntry[]>([]);
  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [paymentConfig, setPaymentConfig] = useState<AdminPaymentConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [userSearch, setUserSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Direct Message Modal / Form
  const [msgModalOpen, setMsgModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<{ id: string; name: string; email: string } | null>(null);
  const [directTitle, setDirectTitle] = useState('');
  const [directMessage, setDirectMessage] = useState('');
  const [directType, setDirectType] = useState('announcement');
  const [sendingDirect, setSendingDirect] = useState(false);
  const [directSuccess, setDirectSuccess] = useState(false);

  // Global Broadcast Form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState('announcement');
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Rejection Reason Prompt
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectPaymentId, setRejectPaymentId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Payment Config Form
  const [savingConfig, setSavingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);
  const [configForm, setConfigForm] = useState<Partial<AdminPaymentConfig>>({});

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchAllAdminData = async () => {
    try {
      const [statsRes, usersRes, presencesRes, paymentsRes, configRes, activitiesRes, emailsRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
        api.getAdminPresences(),
        api.getAdminSubscriptionPayments(),
        api.getSubscriptionConfig(),
        api.getLiveActivities(),
        api.getEmailLogs(),
      ]);

      setStats((statsRes as any).stats || statsRes);
      setUsers((usersRes as any).users || usersRes);
      setPresences(presencesRes || []);
      setPayments(paymentsRes || []);
      setPaymentConfig(configRes);
      setConfigForm(configRes || {});
      setLiveActivities(activitiesRes || []);
      setEmailLogs(emailsRes || []);
    } catch (err: any) {
      console.error('Failed to load admin suite data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
    // Auto refresh presence & activities every 10 seconds
    const interval = setInterval(() => {
      api.getAdminPresences().then(res => setPresences(res || [])).catch(() => {});
      api.getAdminSubscriptionPayments().then(res => setPayments(res || [])).catch(() => {});
      api.getLiveActivities().then(res => setLiveActivities(res || [])).catch(() => {});
      api.getEmailLogs().then(res => setEmailLogs(res || [])).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchAllAdminData();
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // User Management Handlers
  const handleUpdateUserRole = async (targetUserId: string, newRole: 'admin' | 'user') => {
    try {
      await api.updateUserRole(targetUserId, newRole);
      await fetchAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  const handleUpdateUserPlan = async (targetUserId: string, newPlan: 'free' | 'pro' | 'enterprise') => {
    try {
      await api.updateUserPlan(targetUserId, newPlan);
      await fetchAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update plan');
    }
  };

  const handleUpdateUserStatus = async (targetUserId: string, newStatus: 'active' | 'deactivated') => {
    try {
      await api.updateUserStatus(targetUserId, newStatus);
      await fetchAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Payment Approval / Rejection
  const handleApprovePayment = async (paymentId: string) => {
    try {
      await api.approveSubscriptionPayment(paymentId);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      await fetchAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleOpenReject = (paymentId: string) => {
    setRejectPaymentId(paymentId);
    setRejectReason('Transaction ID not verified or amount mismatch.');
    setRejectModalOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectPaymentId) return;
    setRejecting(true);
    try {
      await api.rejectSubscriptionPayment(rejectPaymentId, rejectReason);
      setRejectModalOpen(false);
      setRejectPaymentId(null);
      await fetchAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    } finally {
      setRejecting(false);
    }
  };

  // Payment Config Save
  const handleSavePaymentConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    try {
      const updated = await api.updateAdminPaymentConfig(configForm);
      setPaymentConfig(updated);
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to save configuration');
    } finally {
      setSavingConfig(false);
    }
  };

  // Direct Messaging
  const handleOpenDirectMessage = (u: { id: string; name: string; email: string }) => {
    setTargetUser(u);
    setDirectTitle(`Notice from Sultan Admin`);
    setDirectMessage(`Hello ${u.name}, `);
    setDirectType('announcement');
    setMsgModalOpen(true);
  };

  const handleSendDirectNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser || !directTitle || !directMessage) return;

    setSendingDirect(true);
    try {
      await api.sendDirectNotification({
        targetUserId: targetUser.id,
        title: directTitle.trim(),
        message: directMessage.trim(),
        type: directType,
      });
      setDirectSuccess(true);
      setTimeout(() => {
        setDirectSuccess(false);
        setMsgModalOpen(false);
        setTargetUser(null);
      }, 1800);
    } catch (err: any) {
      alert(err.message || 'Failed to send notification');
    } finally {
      setSendingDirect(false);
    }
  };

  // Global Broadcast
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMessage) return;

    setBroadcastLoading(true);
    try {
      await api.broadcastNotification(broadcastTitle, broadcastMessage, broadcastType);
      setBroadcastSuccess(true);
      setBroadcastTitle('');
      setBroadcastMessage('');
      setTimeout(() => setBroadcastSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message || 'Broadcast failed');
    } finally {
      setBroadcastLoading(false);
    }
  };

  const onlineCount = presences.filter(p => p.isOnline).length;
  const pendingPaymentsCount = payments.filter(p => p.status === 'pending').length;

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredPayments = payments.filter(p => {
    if (paymentFilter === 'all') return true;
    return p.status === paymentFilter;
  });

  if (loading && !stats) {
    return (
      <div className="py-24 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* SuperAdmin Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-teal-800 via-teal-900 to-slate-950 text-white shadow-xl border border-teal-700/40">
        <div className="flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-400/25 ring-4 ring-white/10 shrink-0">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">Hishab Khata SuperAdmin Suite</h2>
              <span className="px-3 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black uppercase tracking-widest shadow-sm">
                System Root
              </span>
            </div>
            <p className="text-xs sm:text-sm text-teal-100/90 font-medium mt-1 leading-snug">
              Live user presence monitor, mobile & banking payment verification, and multi-tenant broadcast controls.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <div className="px-4 py-2 rounded-2xl bg-emerald-950/70 border border-emerald-400/60 text-emerald-300 flex items-center gap-2.5 shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black text-emerald-300 tracking-wide">{onlineCount} Online Now</span>
          </div>

          <button
            id="admin-refresh-telemetry-btn"
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="px-4 py-2.5 bg-white hover:bg-teal-50 text-teal-950 text-xs font-black rounded-2xl transition flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-700' : 'text-teal-700'}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Online Now</span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {onlineCount} <span className="text-xs font-bold text-slate-400">/ {stats.totalUsers} users</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Real-time socket & heartbeat</p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Payments</span>
              <CreditCard className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
              {pendingPaymentsCount} <span className="text-xs font-bold text-slate-400">requests</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">bKash, Nagad & Bank Deposits</p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">PRO Subscribers</span>
              <Crown className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
              {stats.proUsers} <span className="text-xs font-bold text-slate-400">members</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Monthly MRR: {stats.revenueMRR ? `$${stats.revenueMRR}` : `${stats.proUsers * 499} ৳`}
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Platform Ledgers</span>
              <TrendingUp className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {stats.totalTransactions}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Across {stats.totalWallets} active wallets</p>
          </div>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 dark:border-slate-700/80 text-xs sm:text-sm font-extrabold">
        <button
          id="admin-tab-presence"
          type="button"
          onClick={() => setActiveTab('presence')}
          className={`px-4 py-2.5 rounded-2xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'presence'
              ? 'bg-teal-700 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Radio className="w-4 h-4 text-emerald-400" />
          <span>Live Radar</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black">
            {onlineCount}
          </span>
        </button>

        <button
          id="admin-tab-activities"
          type="button"
          onClick={() => setActiveTab('activities')}
          className={`px-4 py-2.5 rounded-2xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'activities'
              ? 'bg-teal-700 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Activity className="w-4 h-4 text-blue-400" />
          <span>Live User Activity ({liveActivities.length})</span>
        </button>

        <button
          id="admin-tab-payments"
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2.5 rounded-2xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'payments'
              ? 'bg-teal-700 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <CreditCard className="w-4 h-4 text-pink-400" />
          <span>Subscription Inflow</span>
          {pendingPaymentsCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black animate-pulse">
              {pendingPaymentsCount} Pending
            </span>
          )}
        </button>

        <button
          id="admin-tab-emaillogs"
          type="button"
          onClick={() => setActiveTab('emailLogs')}
          className={`px-4 py-2.5 rounded-2xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'emailLogs'
              ? 'bg-teal-700 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Mail className="w-4 h-4 text-purple-400" />
          <span>Email Logs ({emailLogs.length})</span>
        </button>

        <button
          id="admin-tab-users"
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 rounded-2xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'users'
              ? 'bg-teal-700 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Tenant Directory ({users.length})</span>
        </button>

        <button
          id="admin-tab-broadcast"
          type="button"
          onClick={() => setActiveTab('broadcast')}
          className={`px-4 py-2.5 rounded-2xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'broadcast'
              ? 'bg-teal-700 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Broadcasts</span>
        </button>

        <button
          id="admin-tab-config"
          type="button"
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2.5 rounded-2xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'config'
              ? 'bg-teal-700 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Pricing & Accounts</span>
        </button>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: LIVE USER PRESENCE & TELEMETRY */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'presence' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-500 animate-pulse" />
                <span>Live Active Sessions & User Presence</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time tracking of which users are currently logged in, what view/task they are performing, and device telemetry.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>{onlineCount} Online</span>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span>{presences.length - onlineCount} Away</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {presences.map((p) => (
              <div
                key={p.userId}
                className={`p-5 rounded-3xl border transition shadow-xs flex flex-col justify-between ${
                  p.isOnline
                    ? 'bg-gradient-to-br from-emerald-50/70 via-white to-teal-50/50 dark:from-emerald-950/30 dark:via-slate-800 dark:to-slate-800/90 border-emerald-300 dark:border-emerald-800'
                    : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80 opacity-80'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-2xl bg-teal-700 text-white font-black text-sm flex items-center justify-center">
                          {p.userName.slice(0, 2).toUpperCase()}
                        </div>
                        <span
                          className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 ${
                            p.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                            {p.userName}
                          </h4>
                          {p.plan === 'pro' && (
                            <span className="px-1.5 py-0.2 bg-amber-400/20 text-amber-600 dark:text-amber-400 text-[10px] font-black rounded-full">
                              PRO
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">{p.userEmail}</p>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        p.isOnline
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                      }`}
                    >
                      {p.isOnline ? '● Online' : 'Away'}
                    </span>
                  </div>

                  {/* Activity Badge */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Current View:</span>
                      <span className="font-bold text-teal-700 dark:text-teal-300 capitalize">
                        {p.currentView.replace('-', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Device & Browser:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Laptop className="w-3 h-3 text-slate-400" />
                        <span>{p.deviceType} / {p.browser}</span>
                      </span>
                    </div>

                    {p.lastAction && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 italic truncate pt-0.5">
                        "{p.lastAction}"
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(p.lastActiveAt).toLocaleTimeString()}</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => handleOpenDirectMessage({ id: p.userId, name: p.userName, email: p.userEmail })}
                    className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message User</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: LIVE USER ACTIVITIES LOG */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
                <span>Live User Activity Radar & Stream</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Real-time audit log of all actions across the platform (wallet creation, ledger entries, logins, subscription requests, updates).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-full text-xs font-black">
                {liveActivities.length} Events Tracked
              </span>
            </div>
          </div>

          {liveActivities.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-6">
              <Activity className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-white">No Live Activity Events Yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Activity events will stream in automatically as users navigate and interact.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/50 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Time</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">Activity Description</th>
                      <th className="py-3 px-4">Device / IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                    {liveActivities.map((act) => {
                      const isAuth = act.category === 'AUTH';
                      const isSub = act.category === 'SUBSCRIPTION';
                      const isTx = act.category === 'TRANSACTION' || act.category === 'WALLET';
                      const isNav = act.category === 'NAVIGATION';
                      
                      return (
                        <tr key={act.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition">
                          <td className="py-3 px-4 text-[11px] font-mono text-slate-400 whitespace-nowrap">
                            {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900 dark:text-white text-xs">{act.userName}</div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[160px]">{act.userEmail}</div>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide ${
                                isAuth
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                                  : isSub
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                                  : isTx
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : isNav
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {act.action}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <p className="text-xs text-slate-800 dark:text-slate-200 font-medium">
                              {act.details}
                            </p>
                            {act.currentView && (
                              <p className="text-[10px] text-teal-600 dark:text-teal-400 font-medium mt-0.5">
                                View: {act.currentView}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-4 text-[11px] text-slate-400 whitespace-nowrap capitalize">
                            {act.deviceType || 'Desktop'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: SUBSCRIPTION PAYMENTS VERIFICATION */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'payments' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-600" />
                <span>Subscription Payment Inflow & Verification</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Verify bKash, Nagad, Rocket & Bank transfers submitted by users. Approving elevates user to PRO instantly and dispatches a verified email notification.
              </p>
            </div>

            {/* Filter */}
            <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPaymentFilter('pending')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  paymentFilter === 'pending'
                    ? 'bg-amber-400 text-slate-950 font-black shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Pending ({pendingPaymentsCount})
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('approved')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  paymentFilter === 'approved'
                    ? 'bg-teal-700 text-white font-black shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                Approved
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                  paymentFilter === 'all'
                    ? 'bg-slate-800 text-white font-black shadow-xs'
                    : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                All ({payments.length})
              </button>
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-sm font-bold text-slate-800 dark:text-white">All Clear!</p>
              <p className="text-xs text-slate-400 mt-0.5">No subscription payment requests match this filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPayments.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <PaymentMethodBadge method={p.paymentMethod} />
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        {p.amount} {p.currency}
                      </span>
                      <span className="text-xs font-bold text-slate-400">
                        ({p.billingCycle} plan)
                      </span>
                      <span
                        className={`ml-auto md:ml-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          p.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : p.status === 'rejected'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 text-[11px]">User:</span>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{p.userName}</p>
                        <p className="text-[11px] text-slate-400">{p.userEmail}</p>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[11px]">Sender Mobile/Account:</span>
                        <p className="font-mono font-bold text-slate-900 dark:text-white">{p.senderNumberOrAccount}</p>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[11px]">Transaction ID (TrxID):</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-md">
                            {p.transactionId}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(p.transactionId, p.id)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                            title="Copy TrxID"
                          >
                            {copiedKey === p.id ? <CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>

                    {p.notes && (
                      <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-900/60 p-2 rounded-xl">
                        User Note: "{p.notes}"
                      </p>
                    )}

                    {p.adminNotes && (
                      <p className="text-xs text-red-600 italic bg-red-50 dark:bg-red-950/30 p-2 rounded-xl">
                        Admin Note: "{p.adminNotes}"
                      </p>
                    )}

                    <p className="text-[10px] text-slate-400">
                      Submitted: {new Date(p.createdAt).toLocaleString()} {p.reviewedAt && `• Reviewed by ${p.reviewedBy}`}
                    </p>
                  </div>

                  {/* Actions */}
                  {p.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700">
                      <button
                        type="button"
                        onClick={() => handleApprovePayment(p.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve & Activate PRO</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleOpenReject(p.id)}
                        className="px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/50 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl transition flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: EMAIL NOTIFICATION AUDIT LOGS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'emailLogs' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Mail className="w-5 h-5 text-purple-500" />
                <span>Transactional Email Dispatch & Audit Trail</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Every subscription application and admin approval/rejection triggers a verified transactional email record.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 rounded-full text-xs font-black">
                {emailLogs.length} Dispatches Recorded
              </span>
            </div>
          </div>

          {emailLogs.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-6">
              <Mail className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800 dark:text-white">No Email Dispatches Yet</p>
              <p className="text-xs text-slate-400 mt-0.5">When users submit subscription payments or admins approve/reject them, logs will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {emailLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-xs font-black uppercase">
                        {log.type.replace(/_/g, ' ')}
                      </span>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {log.subject}
                      </h4>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold uppercase text-[10px]">
                        {log.status}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        {new Date(log.sentAt).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700/60">
                    <div>
                      <span className="text-slate-400 font-medium text-[11px]">Recipient:</span>
                      <p className="font-bold text-slate-800 dark:text-slate-200 font-mono">{log.to}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium text-[11px]">Sender:</span>
                      <p className="font-semibold text-teal-700 dark:text-teal-300 font-mono">{log.from}</p>
                    </div>
                  </div>

                  {/* Email Body / Preview */}
                  <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto whitespace-pre-wrap border border-slate-800">
                    {log.preview || log.htmlContent || 'Email content transmitted successfully.'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 3: TENANT DIRECTORY & ROLES */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Registered Tenant Directory ({users.length})
              </h3>
              <p className="text-xs text-slate-400">
                Manage roles, elevate tier subscriptions, and inspect user accounts.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user name or email..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/50 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4 text-center">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition">
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">{u.name}</p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          u.plan === 'pro'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {u.plan}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          u.status === 'active'
                            ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40'
                            : 'text-red-600 bg-red-50 dark:bg-red-950/40'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <select
                            value={u.plan}
                            onChange={(e) => handleUpdateUserPlan(u.id, e.target.value as any)}
                            className="px-2 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none cursor-pointer"
                          >
                            <option value="free">Free</option>
                            <option value="pro">PRO</option>
                            <option value="enterprise">Enterprise</option>
                          </select>

                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateUserRole(u.id, e.target.value as any)}
                            className="px-2 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none cursor-pointer"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>

                          <button
                            type="button"
                            onClick={() => handleOpenDirectMessage({ id: u.id, name: u.name, email: u.email })}
                            className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 transition cursor-pointer"
                            title="Send Direct Message"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 4: BROADCAST SYSTEM NOTIFICATION */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'broadcast' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Push Broadcast Notification to All Tenants
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Send an instant announcement, system maintenance alert, or tips banner that immediately appears on every active user's device.
          </p>

          <form onSubmit={handleSendBroadcast} className="space-y-3 pt-2">
            {broadcastSuccess && (
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl font-bold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-4 h-4" /> Notification broadcasted successfully!
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Broadcast Title
                </label>
                <input
                  id="admin-broadcast-title"
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="e.g. New Gemini 3.7 AI Financial Intelligence is Live!"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category
                </label>
                <select
                  id="admin-broadcast-type"
                  value={broadcastType}
                  onChange={(e) => setBroadcastType(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                >
                  <option value="announcement">Announcement</option>
                  <option value="system_alert">System Alert</option>
                  <option value="budget_warning">Tips & Reminder</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Notification Message Details
              </label>
              <textarea
                id="admin-broadcast-msg"
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Write your broadcast message..."
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                required
              />
            </div>

            <button
              id="admin-broadcast-send-btn"
              type="submit"
              disabled={broadcastLoading}
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {broadcastLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Push Global Broadcast</span>
            </button>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 5: ADMIN PAYMENT RECEIVING CONFIGURATION */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'config' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-teal-600" />
                <span>Admin Mobile Banking & Bank Account Settings</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                These numbers and bank details will be shown to users in their Upgrade Modal when paying for PRO subscriptions.
              </p>
            </div>
          </div>

          {configSuccess && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl font-bold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 className="w-4 h-4" /> Admin payment accounts and pricing saved successfully!
            </div>
          )}

          <form onSubmit={handleSavePaymentConfig} className="space-y-5">
            {/* Mobile Banking Numbers */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Mobile Financial Services (MFS):
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* bKash */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-pink-700 dark:text-pink-400">bKash Number</label>
                  <input
                    type="text"
                    value={configForm.bkashNumber || ''}
                    onChange={(e) => setConfigForm({ ...configForm, bkashNumber: e.target.value })}
                    placeholder="01711-234567"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                  />
                  <div className="flex gap-2 text-[11px]">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="bkashType"
                        checked={configForm.bkashType !== 'merchant'}
                        onChange={() => setConfigForm({ ...configForm, bkashType: 'personal' })}
                      />
                      <span>Personal</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="bkashType"
                        checked={configForm.bkashType === 'merchant'}
                        onChange={() => setConfigForm({ ...configForm, bkashType: 'merchant' })}
                      />
                      <span>Merchant</span>
                    </label>
                  </div>
                </div>

                {/* Nagad */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-orange-700 dark:text-orange-400">Nagad Number</label>
                  <input
                    type="text"
                    value={configForm.nagadNumber || ''}
                    onChange={(e) => setConfigForm({ ...configForm, nagadNumber: e.target.value })}
                    placeholder="01811-234567"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                  />
                  <div className="flex gap-2 text-[11px]">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="nagadType"
                        checked={configForm.nagadType !== 'merchant'}
                        onChange={() => setConfigForm({ ...configForm, nagadType: 'personal' })}
                      />
                      <span>Personal</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        name="nagadType"
                        checked={configForm.nagadType === 'merchant'}
                        onChange={() => setConfigForm({ ...configForm, nagadType: 'merchant' })}
                      />
                      <span>Merchant</span>
                    </label>
                  </div>
                </div>

                {/* Rocket */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-purple-700 dark:text-purple-400">Rocket Number</label>
                  <input
                    type="text"
                    value={configForm.rocketNumber || ''}
                    onChange={(e) => setConfigForm({ ...configForm, rocketNumber: e.target.value })}
                    placeholder="01911-234567-8"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Bank Deposit / EFT Account Details:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={configForm.bankName || ''}
                    onChange={(e) => setConfigForm({ ...configForm, bankName: e.target.value })}
                    placeholder="Islami Bank Bangladesh PLC / City Bank"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Holder Name</label>
                  <input
                    type="text"
                    value={configForm.bankAccountName || ''}
                    onChange={(e) => setConfigForm({ ...configForm, bankAccountName: e.target.value })}
                    placeholder="Hishab Khata SaaS Admin"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={configForm.bankAccountNumber || ''}
                    onChange={(e) => setConfigForm({ ...configForm, bankAccountNumber: e.target.value })}
                    placeholder="2050112020345678"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Branch & Routing</label>
                  <input
                    type="text"
                    value={configForm.bankBranch || ''}
                    onChange={(e) => setConfigForm({ ...configForm, bankBranch: e.target.value })}
                    placeholder="Dhanmondi Branch (Routing: 125272847)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Pricing Details */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Subscription Pricing & Discount Controls:
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Configure the exact prices shown in both Bangladeshi Taka (৳) and US Dollars ($). Changes update immediately for all users.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-lg bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 text-xs font-black">
                  Dynamic Real-time
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Monthly */}
                <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-teal-700 dark:text-teal-400 uppercase">Monthly Plan</span>
                    <span className="text-[10px] text-slate-400 font-bold">1 Month</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Price in BDT (৳)</label>
                    <input
                      type="number"
                      value={configForm.proMonthlyPriceBDT ?? 499}
                      onChange={(e) => setConfigForm({ ...configForm, proMonthlyPriceBDT: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Price in USD ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={configForm.proMonthlyPriceUSD ?? 4.99}
                      onChange={(e) => setConfigForm({ ...configForm, proMonthlyPriceUSD: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-black"
                    />
                  </div>
                </div>

                {/* Yearly */}
                <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 uppercase">Yearly Plan</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-black px-1.5 py-0.5 rounded">
                      {configForm.yearlyDiscountPercent ?? 20}% OFF
                    </span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Price in BDT (৳)</label>
                    <input
                      type="number"
                      value={configForm.proYearlyPriceBDT ?? 4999}
                      onChange={(e) => setConfigForm({ ...configForm, proYearlyPriceBDT: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Price in USD ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={configForm.proYearlyPriceUSD ?? 49.99}
                      onChange={(e) => setConfigForm({ ...configForm, proYearlyPriceUSD: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-black"
                    />
                  </div>
                </div>

                {/* Lifetime */}
                <div className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-purple-700 dark:text-purple-400 uppercase">Lifetime VIP</span>
                    <span className="text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 font-black px-1.5 py-0.5 rounded">
                      One-time
                    </span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Price in BDT (৳)</label>
                    <input
                      type="number"
                      value={configForm.proLifetimePriceBDT ?? 9999}
                      onChange={(e) => setConfigForm({ ...configForm, proLifetimePriceBDT: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-black"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">Price in USD ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={configForm.proLifetimePriceUSD ?? 99.99}
                      onChange={(e) => setConfigForm({ ...configForm, proLifetimePriceUSD: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-black"
                    />
                  </div>
                </div>
              </div>

              {/* Discount Percentage Setting */}
              <div className="pt-1 flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Yearly Plan Discount Badge (%):
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={configForm.yearlyDiscountPercent ?? 20}
                  onChange={(e) => setConfigForm({ ...configForm, yearlyDiscountPercent: Number(e.target.value) })}
                  className="w-24 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-black text-center"
                />
              </div>
            </div>

            {/* Custom Payment Instructions */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Payment Guidance Text for Users:
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Bangla Instructions (displayed in Upgrade Checkout modal):
                </label>
                <input
                  type="text"
                  value={configForm.instructionsBn || ''}
                  onChange={(e) => setConfigForm({ ...configForm, instructionsBn: e.target.value })}
                  placeholder="বিকাশ বা নগদ অ্যাপ থেকে উল্লেখিত নম্বরে Send Money করুন। সফল ট্রানজেকশনের TrxID নিচে প্রদান করুন।"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  English Instructions:
                </label>
                <input
                  type="text"
                  value={configForm.instructionsEn || ''}
                  onChange={(e) => setConfigForm({ ...configForm, instructionsEn: e.target.value })}
                  placeholder="Send money/transfer to the admin account shown above and provide the Transaction ID."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingConfig}
              className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {savingConfig ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Admin Payment Settings</span>
            </button>
          </form>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* DIRECT MESSAGE MODAL */}
      {/* ------------------------------------------------------------- */}
      {msgModalOpen && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-600" />
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                  Send Direct Alert to {targetUser.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMsgModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Recipient: <span className="font-bold text-slate-700 dark:text-slate-300">{targetUser.email}</span>
            </p>

            {directSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Message delivered to user's notifications!
              </div>
            )}

            <form onSubmit={handleSendDirectNotification} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={directTitle}
                  onChange={(e) => setDirectTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Alert Type
                </label>
                <select
                  value={directType}
                  onChange={(e) => setDirectType(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs outline-none"
                >
                  <option value="announcement">Announcement</option>
                  <option value="system_alert">Security / System Alert</option>
                  <option value="budget_warning">Payment / Account Notice</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Message Body
                </label>
                <textarea
                  value={directMessage}
                  onChange={(e) => setDirectMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs outline-none resize-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMsgModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingDirect}
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {sendingDirect ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Send Notification</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* REJECTION REASON MODAL */}
      {/* ------------------------------------------------------------- */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Reject Subscription Payment
              </h3>
            </div>

            <p className="text-xs text-slate-500">
              Please enter the reason for rejecting this payment proof. The user will be notified to check and re-submit.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Reason / Note for User:
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs outline-none resize-none focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={rejecting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {rejecting ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
