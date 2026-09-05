import React, { useState, useEffect, useMemo } from 'react';
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
  EmailLogEntry,
  SuggestionSuperChat
} from '../types';
import { BKashIcon, NagadIcon, RocketIcon, BankIconBadge, PaymentMethodBadge, BKashFullLogo, NagadFullLogo } from '../components/PaymentIcons';
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
  ListFilter,
  LayoutDashboard,
  LogOut,
  Sparkles,
  ThumbsUp,
  Trash2,
  Heart,
  Database,
  Download
} from 'lucide-react';
import {
  fetchAllUsersFromFirestore,
  subscribeToFirestoreUsers,
  subscribeToFirestorePresences,
  updateUserRoleOrPlanInFirestore,
  seedDefaultUsersToFirestore,
  deleteUserFromFirestore,
  purgeAllNonAdminUsersFromFirestore
} from '../lib/accountPersistence';
import firebaseConfigData from '../../firebase-applet-config.json';

interface AdminViewProps {
  onNavigate?: (view: string) => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ onNavigate }) => {
  const { t } = useI18n();
  const { user, logout } = useAuth();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'presence' | 'activities' | 'payments' | 'suggestions' | 'emailLogs' | 'users' | 'broadcast' | 'config'>('presence');

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

  // Suggestions & SuperChats state
  const [adminSuggestions, setAdminSuggestions] = useState<SuggestionSuperChat[]>([]);
  const [suggestionStats, setSuggestionStats] = useState<any>(null);
  const [suggestionFilter, setSuggestionFilter] = useState<'all' | 'superchat' | 'pending' | 'planned' | 'completed'>('all');
  const [replyModalOpen, setReplyModalOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SuggestionSuperChat | null>(null);
  const [replyText, setReplyText] = useState('');
  const [statusUpdate, setStatusUpdate] = useState<string>('pending');
  const [superChatVerifyStatus, setSuperChatVerifyStatus] = useState<boolean>(true);
  const [savingReply, setSavingReply] = useState(false);

  // Filters
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [userPlanFilter, setUserPlanFilter] = useState<'all' | 'free' | 'pro'>('all');
  const [syncingFirestore, setSyncingFirestore] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  // Presence Radar Filters & State
  const [presenceSearch, setPresenceSearch] = useState('');
  const [presenceFilter, setPresenceFilter] = useState<'all' | 'online' | 'away' | 'offline'>('all');
  const [presenceRefreshing, setPresenceRefreshing] = useState(false);

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
      const [statsRes, firestoreUsers, presencesRes, paymentsRes, configRes, activitiesRes, emailsRes, sugRes] = await Promise.all([
        api.getAdminStats().catch(() => null),
        fetchAllUsersFromFirestore().catch(() => api.getAdminUsers().catch(() => [])),
        api.getAdminPresences().catch(() => []),
        api.getAdminSubscriptionPayments().catch(() => []),
        api.getSubscriptionConfig().catch(() => null),
        api.getLiveActivities().catch(() => []),
        api.getEmailLogs().catch(() => []),
        api.getAdminSuggestions().catch(() => ({ suggestions: [], stats: null })),
      ]);

      if (statsRes) setStats((statsRes as any).stats || statsRes);
      if (Array.isArray(firestoreUsers)) {
        setUsers(firestoreUsers);
      } else if ((firestoreUsers as any)?.users) {
        setUsers((firestoreUsers as any).users);
      }
      if (Array.isArray(presencesRes)) setPresences(presencesRes);
      if (Array.isArray(paymentsRes)) setPayments(paymentsRes);
      if (configRes) {
        setPaymentConfig(configRes);
        setConfigForm(configRes || {});
      }
      if (Array.isArray(activitiesRes)) setLiveActivities(activitiesRes);
      if (Array.isArray(emailsRes)) setEmailLogs(emailsRes);
      if (sugRes?.suggestions) setAdminSuggestions(sugRes.suggestions);
      if (sugRes?.stats) setSuggestionStats(sugRes.stats);
    } catch (err: any) {
      console.error('Failed to load admin suite data', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setPresenceRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();

    // Live real-time stream directly from Firebase Firestore users collection
    const unsubscribeUsers = subscribeToFirestoreUsers((freshFirestoreUsers) => {
      if (freshFirestoreUsers && freshFirestoreUsers.length > 0) {
        setUsers(freshFirestoreUsers);
      }
    });

    // Live real-time stream directly from Firebase Firestore user_presences collection
    const unsubscribePresences = subscribeToFirestorePresences((freshPresences) => {
      if (freshPresences && freshPresences.length > 0) {
        setPresences((prev) => {
          const map = new Map<string, UserPresence>();
          prev.forEach((p) => map.set(p.userId, p));
          freshPresences.forEach((p) => map.set(p.userId, p));
          return Array.from(map.values()).sort((a, b) => (a.isOnline === b.isOnline ? 0 : a.isOnline ? -1 : 1));
        });
      }
    });

    // Auto refresh presence & activities every 10 seconds
    const interval = setInterval(() => {
      api.getAdminPresences().then(res => {
        if (Array.isArray(res)) {
          setPresences((prev) => {
            const map = new Map<string, UserPresence>();
            prev.forEach((p) => map.set(p.userId, p));
            res.forEach((p) => map.set(p.userId, p));
            return Array.from(map.values()).sort((a, b) => (a.isOnline === b.isOnline ? 0 : a.isOnline ? -1 : 1));
          });
        }
      }).catch(() => {});
      api.getAdminSubscriptionPayments().then(res => setPayments(res || [])).catch(() => {});
      api.getLiveActivities().then(res => setLiveActivities(res || [])).catch(() => {});
      api.getEmailLogs().then(res => setEmailLogs(res || [])).catch(() => {});
      api.getAdminSuggestions().then(res => {
        if (res?.suggestions) setAdminSuggestions(res.suggestions);
        if (res?.stats) setSuggestionStats(res.stats);
      }).catch(() => {});
    }, 10000);

    return () => {
      clearInterval(interval);
      unsubscribeUsers();
      unsubscribePresences();
    };
  }, []);

  const handleRefreshPresences = async () => {
    setPresenceRefreshing(true);
    try {
      const res = await api.getAdminPresences().catch(() => []);
      if (Array.isArray(res)) {
        setPresences(res);
      }
    } finally {
      setPresenceRefreshing(false);
    }
  };

  const handleManualRefresh = () => {
    setRefreshing(true);
    fetchAllAdminData();
  };

  const handleSyncFirestoreUsers = async () => {
    setSyncingFirestore(true);
    try {
      await seedDefaultUsersToFirestore();
      const fresh = await fetchAllUsersFromFirestore();
      setUsers(fresh);
    } catch (err: any) {
      alert('Firestore sync: ' + (err.message || err));
    } finally {
      setSyncingFirestore(false);
    }
  };

  const handleCopyEmail = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleExportUsersCsv = () => {
    const headers = ['User Name', 'Email Address', 'Phone', 'Role', 'Plan', 'Status', 'User ID', 'Created At'];
    const rows = filteredUsers.map(u => [
      `"${(u.name || '').replace(/"/g, '""')}"`,
      `"${(u.email || '').replace(/"/g, '""')}"`,
      `"${(u.phone || '').replace(/"/g, '""')}"`,
      u.role || 'user',
      u.plan || 'free',
      u.status || 'active',
      u.id,
      u.createdAt || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hishabkhata_firebase_users_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // User Management Handlers (Persisted to Firebase Firestore)
  const handleUpdateUserRole = async (targetUserId: string, newRole: 'admin' | 'user') => {
    try {
      await updateUserRoleOrPlanInFirestore(targetUserId, { role: newRole });
      await api.updateUserRole(targetUserId, newRole).catch(() => {});
      const fresh = await fetchAllUsersFromFirestore();
      setUsers(fresh);
    } catch (err: any) {
      alert(err.message || 'Failed to update role');
    }
  };

  const handleUpdateUserPlan = async (targetUserId: string, newPlan: 'free' | 'pro' | 'enterprise') => {
    try {
      await updateUserRoleOrPlanInFirestore(targetUserId, { plan: newPlan as any });
      await api.updateUserPlan(targetUserId, newPlan).catch(() => {});
      const fresh = await fetchAllUsersFromFirestore();
      setUsers(fresh);
    } catch (err: any) {
      alert(err.message || 'Failed to update plan');
    }
  };

  const handleUpdateUserStatus = async (targetUserId: string, newStatus: 'active' | 'deactivated') => {
    try {
      await updateUserRoleOrPlanInFirestore(targetUserId, { status: newStatus });
      await api.updateUserStatus(targetUserId, newStatus).catch(() => {});
      const fresh = await fetchAllUsersFromFirestore();
      setUsers(fresh);
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [purgingUsers, setPurgingUsers] = useState(false);

  const handleDeleteUser = async (targetUser: User) => {
    if ((targetUser.email || '').toLowerCase().trim() === 'sultanitbangladesh@gmail.com' || targetUser.id === 'admin-sultan-001') {
      alert('Cannot delete Primary Owner Admin account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete user account "${targetUser.name}" (${targetUser.email || targetUser.phone || targetUser.id}) from Firebase and the database?`)) {
      return;
    }
    setDeletingUserId(targetUser.id);
    try {
      await deleteUserFromFirestore(targetUser.id, targetUser.email, targetUser.phone);
      const fresh = await fetchAllUsersFromFirestore();
      setUsers(fresh);
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handlePurgeNonAdminUsers = async () => {
    if (!window.confirm('Are you sure you want to delete ALL non-admin user accounts? Only your Owner Admin account (sultanitbangladesh@gmail.com) will be preserved. All other demo/non-admin user accounts will be permanently deleted from Firebase and the database.')) {
      return;
    }
    setPurgingUsers(true);
    try {
      const res = await purgeAllNonAdminUsersFromFirestore();
      const fresh = await fetchAllUsersFromFirestore();
      setUsers(fresh);
      alert(`Cleanup successful: ${res.deletedCount} account(s) deleted. Only Sultan (Owner Admin) is preserved.`);
    } catch (err: any) {
      alert(err.message || 'Purge failed');
    } finally {
      setPurgingUsers(false);
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

  // Suggestion & SuperChat Handlers
  const handleOpenReply = (item: SuggestionSuperChat) => {
    setSelectedSuggestion(item);
    setReplyText(item.adminReply || '');
    setStatusUpdate(item.status || 'pending');
    setSuperChatVerifyStatus(Boolean(item.isSuperChatVerified));
    setReplyModalOpen(true);
  };

  const handleSaveReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSuggestion) return;
    setSavingReply(true);
    try {
      await api.updateAdminSuggestion(selectedSuggestion.id, {
        adminReply: replyText.trim() || undefined,
        status: statusUpdate,
        isSuperChatVerified: selectedSuggestion.hasSuperChat ? superChatVerifyStatus : undefined,
      });
      setReplyModalOpen(false);
      setSelectedSuggestion(null);
      await fetchAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update suggestion');
    } finally {
      setSavingReply(false);
    }
  };

  const handleDeleteSuggestion = async (id: string) => {
    if (window.confirm('Delete this user suggestion?')) {
      try {
        await api.deleteAdminSuggestion(id);
        await fetchAllAdminData();
      } catch (err: any) {
        alert(err.message || 'Failed to delete suggestion');
      }
    }
  };

  const unifiedPresences = useMemo(() => {
    const map = new Map<string, UserPresence>();

    // 1. Add all presences from radar
    for (const p of presences) {
      if (p && p.userId) {
        map.set(p.userId, p);
      }
    }

    // 2. Ensure every registered user from users list is represented
    for (const u of users) {
      if (u && u.id && !map.has(u.id)) {
        const isCurrentAdmin = user && (user.id === u.id || user.email === u.email);
        map.set(u.id, {
          userId: u.id,
          userName: u.name || 'User',
          userEmail: u.email || 'No email',
          avatarUrl: u.avatarUrl,
          plan: u.plan || 'free',
          role: u.role || 'user',
          isOnline: Boolean(isCurrentAdmin),
          currentView: isCurrentAdmin ? 'Admin Control Center' : 'offline',
          lastActiveAt: u.updatedAt || u.createdAt || new Date().toISOString(),
          deviceType: 'desktop',
          browser: 'Web App',
          lastAction: isCurrentAdmin ? 'Active in Admin Panel' : 'Registered Account',
        });
      }
    }

    // Always ensure current admin is present and online
    if (user && user.id) {
      const existing = map.get(user.id);
      map.set(user.id, {
        userId: user.id,
        userName: user.name || 'Sultan (Owner Admin)',
        userEmail: user.email || 'sultanitbangladesh@gmail.com',
        avatarUrl: user.avatarUrl,
        plan: user.plan || 'pro',
        role: user.role || 'admin',
        isOnline: true,
        currentView: 'Admin Control Center',
        lastActiveAt: new Date().toISOString(),
        deviceType: existing?.deviceType || 'desktop',
        browser: existing?.browser || 'Admin Console',
        lastAction: 'Monitoring System Telemetry',
      });
    }

    const list = Array.from(map.values());
    const nowMs = Date.now();

    // Re-evaluate online/away based on real active timestamp
    const evaluated = list.map((p) => {
      const lastMs = new Date(p.lastActiveAt || 0).getTime();
      const isValidDate = !isNaN(lastMs) && lastMs > 0;
      const diffMs = isValidDate ? nowMs - lastMs : Infinity;
      const isCurrent = user && (user.id === p.userId || user.email === p.userEmail);
      // Online: active within last 90 seconds or is current active admin session
      const isOnline = Boolean(isCurrent || (diffMs < 90000));
      const statusGroup: 'online' | 'away' | 'offline' = isOnline
        ? 'online'
        : (diffMs < 600000 ? 'away' : 'offline');
      return {
        ...p,
        isOnline,
        statusGroup,
      };
    });

    // Filter by search and filter status
    return evaluated.filter((p) => {
      const q = presenceSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        (p.userName || '').toLowerCase().includes(q) ||
        (p.userEmail || '').toLowerCase().includes(q) ||
        (p.currentView || '').toLowerCase().includes(q) ||
        (p.browser || '').toLowerCase().includes(q);

      if (!matchSearch) return false;
      if (presenceFilter === 'all') return true;
      if (presenceFilter === 'online') return p.isOnline;
      if (presenceFilter === 'away') return !p.isOnline && p.statusGroup === 'away';
      if (presenceFilter === 'offline') return !p.isOnline && p.statusGroup === 'offline';
      return true;
    }).sort((a, b) => {
      if (a.isOnline === b.isOnline) {
        return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
      }
      return a.isOnline ? -1 : 1;
    });
  }, [presences, users, user, presenceSearch, presenceFilter]);

  const liveOnlineCount = useMemo(() => {
    return unifiedPresences.filter(p => p.isOnline).length;
  }, [unifiedPresences]);

  const onlineCount = presences.filter(p => p.isOnline).length;
  const pendingPaymentsCount = payments.filter(p => p.status === 'pending').length;

  const filteredUsers = useMemo(() => {
    // Ensure every user in the list has a unique id to prevent duplicate React keys
    const seenIds = new Set<string>();
    const uniqueList: User[] = [];
    for (const u of users) {
      if (u && u.id && !seenIds.has(u.id)) {
        seenIds.add(u.id);
        uniqueList.push(u);
      }
    }

    return uniqueList.filter(u => {
      const searchLower = userSearch.toLowerCase().trim();
      const matchesSearch = !searchLower ||
        (u.name || '').toLowerCase().includes(searchLower) ||
        (u.email || '').toLowerCase().includes(searchLower) ||
        (u.phone || '').toLowerCase().includes(searchLower) ||
        (u.id || '').toLowerCase().includes(searchLower);

      const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      const matchesPlan = userPlanFilter === 'all' || u.plan === userPlanFilter;

      return matchesSearch && matchesRole && matchesPlan;
    });
  }, [users, userSearch, userRoleFilter, userPlanFilter]);

  const filteredPayments = payments.filter(p => {
    if (paymentFilter === 'all') return true;
    return p.status === paymentFilter;
  });

  const filteredSuggestions = adminSuggestions.filter(s => {
    if (suggestionFilter === 'superchat') return s.hasSuperChat;
    if (suggestionFilter === 'pending') return s.status === 'pending';
    if (suggestionFilter === 'planned') return s.status === 'planned' || s.status === 'in_progress';
    if (suggestionFilter === 'completed') return s.status === 'completed';
    return true;
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
      {/* Mobile Sticky Quick Action Bar */}
      <div className="md:hidden flex items-center justify-between gap-2 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-xs font-black text-slate-900 dark:text-white truncate">SuperAdmin Mode</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {onNavigate && (
            <button
              id="admin-mobile-return-app-btn"
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="px-2.5 py-1.5 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-bold rounded-xl border border-teal-200 dark:border-teal-800 flex items-center gap-1 cursor-pointer"
              title="Return to User Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>App</span>
            </button>
          )}
          <button
            id="admin-mobile-refresh-btn"
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-600' : ''}`} />
          </button>
          <button
            id="admin-mobile-logout-btn"
            type="button"
            onClick={logout}
            className="px-2.5 py-1.5 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-300 text-xs font-bold rounded-xl border border-red-200 dark:border-red-900/60 flex items-center gap-1 cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* SuperAdmin Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-teal-800 via-teal-900 to-slate-950 text-white shadow-xl border border-teal-700/40">
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

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto shrink-0">
          <div className="px-3.5 py-2 rounded-2xl bg-emerald-950/70 border border-emerald-400/60 text-emerald-300 flex items-center gap-2 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-black text-emerald-300 tracking-wide">{onlineCount} Online</span>
          </div>

          <button
            id="admin-refresh-telemetry-btn"
            type="button"
            onClick={handleManualRefresh}
            disabled={refreshing}
            className="px-3.5 py-2 bg-white/90 hover:bg-white text-teal-950 text-xs font-black rounded-2xl transition flex items-center gap-1.5 cursor-pointer shadow-md disabled:opacity-50"
            title="Refresh All Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-teal-700' : 'text-teal-700'}`} />
            <span>Refresh</span>
          </button>

          {onNavigate && (
            <button
              id="admin-return-user-app-btn"
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="px-3.5 py-2 bg-teal-600/90 hover:bg-teal-600 text-white text-xs font-bold rounded-2xl transition flex items-center gap-1.5 cursor-pointer shadow-md border border-teal-400/40"
              title="Return to User App / Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Return to App</span>
            </button>
          )}

          <button
            id="admin-header-logout-btn"
            type="button"
            onClick={logout}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-2xl transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-rose-900/40"
            title="Log Out of Account"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
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

      {/* Primary Database Status Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl bg-amber-500/10 dark:bg-amber-500/5 border border-amber-400/50 dark:border-amber-500/30">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-900 dark:text-amber-300">
                Primary Database: Firebase Firestore Only
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold border border-emerald-300 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Live Real-Time Sync
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
              Firestore Project: <span className="font-mono font-bold text-slate-900 dark:text-slate-100">pelagic-nebula-7jk7s</span> | Database ID: <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{firebaseConfigData.firestoreDatabaseId || 'ai-studio-hishabkhata-fbe26cc2-dd75-4f5c-950d-f8c94bf7952a'}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="admin-sync-firestore-btn"
            type="button"
            onClick={handleSyncFirestoreUsers}
            disabled={syncingFirestore}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
            title="Sync all default system accounts and persistent users to Firestore"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingFirestore ? 'animate-spin' : ''}`} />
            <span>{syncingFirestore ? 'Syncing...' : 'Sync to Firestore'}</span>
          </button>
          <button
            id="admin-jump-to-users-btn"
            type="button"
            onClick={() => setActiveTab('users')}
            className="px-3.5 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-850 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>View All Users ({users.length})</span>
          </button>
        </div>
      </div>

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
          id="admin-tab-suggestions"
          type="button"
          onClick={() => setActiveTab('suggestions')}
          className={`px-4 py-2.5 rounded-2xl transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'suggestions'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Suggestions & SuperChat ({adminSuggestions.length})</span>
          {suggestionStats?.totalFundsBDT > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
              ৳{suggestionStats.totalFundsBDT}
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
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Database className="w-4 h-4 text-amber-400" />
          <span>Firebase Users ({users.length})</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black">
            Firestore Live
          </span>
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
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-500 animate-pulse" />
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Live Active Sessions & User Presence Radar
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Real-Time Synced
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Live monitoring of all active visitors, current views, live device types, and system telemetry across web & mobile.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">{liveOnlineCount} Online</span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>{unifiedPresences.filter(p => p.statusGroup === 'away').length} Away</span>
                <span className="text-slate-300 dark:text-slate-700">|</span>
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <span>{unifiedPresences.filter(p => p.statusGroup === 'offline').length} Offline</span>
              </div>

              <button
                type="button"
                onClick={handleRefreshPresences}
                disabled={presenceRefreshing}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${presenceRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Radar</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={presenceSearch}
                onChange={(e) => setPresenceSearch(e.target.value)}
                placeholder="Search user name, email, view, browser..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              <button
                type="button"
                onClick={() => setPresenceFilter('all')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  presenceFilter === 'all'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                All Users ({unifiedPresences.length})
              </button>
              <button
                type="button"
                onClick={() => setPresenceFilter('online')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  presenceFilter === 'online'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Online Only ({liveOnlineCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setPresenceFilter('away')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  presenceFilter === 'away'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100'
                }`}
              >
                Away / Idle
              </button>
              <button
                type="button"
                onClick={() => setPresenceFilter('offline')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  presenceFilter === 'offline'
                    ? 'bg-slate-700 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                Offline
              </button>
            </div>
          </div>

          {/* User Presence Cards Grid */}
          {unifiedPresences.length === 0 ? (
            <div className="py-16 text-center rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 p-6 space-y-3">
              <Radio className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto animate-pulse" />
              <p className="text-sm font-bold text-slate-800 dark:text-white">No Users Matching Current Filter</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Try clearing your search query or switching to "All Users" to see everyone registered on Hishab Khata.
              </p>
              <button
                type="button"
                onClick={() => { setPresenceSearch(''); setPresenceFilter('all'); }}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {unifiedPresences.map((p) => {
                const isOnline = p.isOnline;
                const isAway = !isOnline && p.statusGroup === 'away';
                const isCurrentAdmin = user && (user.id === p.userId || user.email === p.userEmail);

                return (
                  <div
                    key={p.userId}
                    className={`p-5 rounded-3xl border transition shadow-xs flex flex-col justify-between ${
                      isOnline
                        ? 'bg-gradient-to-br from-emerald-50/80 via-white to-teal-50/50 dark:from-emerald-950/30 dark:via-slate-800 dark:to-slate-800/90 border-emerald-400/80 dark:border-emerald-700/70 shadow-sm'
                        : isAway
                        ? 'bg-gradient-to-br from-amber-50/50 via-white to-slate-50 dark:from-amber-950/20 dark:via-slate-800 dark:to-slate-800/90 border-amber-300/70 dark:border-amber-700/60'
                        : 'bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/80 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <div className="w-10 h-10 rounded-2xl bg-teal-700 text-white font-black text-sm flex items-center justify-center shadow-xs">
                              {(p.userName || 'U').slice(0, 2).toUpperCase()}
                            </div>
                            <span
                              className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 ${
                                isOnline
                                  ? 'bg-emerald-500 animate-pulse shadow-xs shadow-emerald-500/50'
                                  : isAway
                                  ? 'bg-amber-400'
                                  : 'bg-slate-400'
                              }`}
                            />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white leading-tight">
                                {p.userName || 'Unknown User'}
                              </h4>
                              {isCurrentAdmin && (
                                <span className="px-1.5 py-0.2 bg-purple-500/20 text-purple-600 dark:text-purple-300 text-[10px] font-black rounded-full">
                                  YOU
                                </span>
                              )}
                              {p.plan === 'pro' && (
                                <span className="px-1.5 py-0.2 bg-amber-400/20 text-amber-600 dark:text-amber-400 text-[10px] font-black rounded-full flex items-center gap-0.5">
                                  <Crown className="w-2.5 h-2.5" />
                                  <span>PRO</span>
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 leading-tight truncate max-w-[180px]">{p.userEmail}</p>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                            isOnline
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : isAway
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOnline ? 'bg-emerald-500 animate-ping' : isAway ? 'bg-amber-500' : 'bg-slate-400'
                            }`}
                          />
                          <span>{isOnline ? 'Live Now' : isAway ? 'Away' : 'Offline'}</span>
                        </span>
                      </div>

                      {/* Activity Badge */}
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-700/60 space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">Current View:</span>
                          <span className="font-bold text-teal-700 dark:text-teal-300 capitalize truncate max-w-[150px]">
                            {String(p.currentView || 'dashboard').replace(/-/g, ' ')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 font-medium">Device & Browser:</span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <Laptop className="w-3 h-3 text-slate-400" />
                            <span>{p.deviceType || 'Desktop'} / {p.browser || 'Browser'}</span>
                          </span>
                        </div>

                        {p.lastAction && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 italic truncate pt-0.5 border-t border-slate-100 dark:border-slate-800">
                            "{p.lastAction}"
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Action */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>
                          {p.lastActiveAt
                            ? (() => {
                                const d = new Date(p.lastActiveAt);
                                return isNaN(d.getTime()) ? 'Recently' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                              })()
                            : 'Just now'}
                        </span>
                      </span>

                      {!isCurrentAdmin && (
                        <button
                          type="button"
                          onClick={() => handleOpenDirectMessage({ id: p.userId, name: p.userName, email: p.userEmail })}
                          className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Message User</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
      {/* TAB 3: FIREBASE FIRESTORE USERS DIRECTORY */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
                <Database className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3 className="font-black text-lg sm:text-xl text-slate-900 dark:text-white">
                    Firebase Firestore User Directory
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider border border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Live Firestore Sync
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                    {users.length} Total Registered
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Direct live stream from Firebase Firestore database <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 rounded font-mono text-amber-700 dark:text-amber-400">{firebaseConfigData.firestoreDatabaseId || 'ai-studio-hishabkhata-fbe26cc2-dd75-4f5c-950d-f8c94bf7952a'}</code>. Showing all existing accounts and new registrations.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                id="admin-purge-non-admin-users-btn"
                type="button"
                onClick={handlePurgeNonAdminUsers}
                disabled={purgingUsers}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                title="Delete all demo and non-admin user accounts from Firebase and database"
              >
                <Trash2 className={`w-3.5 h-3.5 ${purgingUsers ? 'animate-spin' : ''}`} />
                <span>{purgingUsers ? 'Purging...' : 'Delete Non-Admin Users'}</span>
              </button>

              <button
                id="admin-sync-firestore-users-btn"
                type="button"
                onClick={handleSyncFirestoreUsers}
                disabled={syncingFirestore}
                className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                title="Force sync baseline and new accounts to Cloud Firestore"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingFirestore ? 'animate-spin' : ''}`} />
                <span>{syncingFirestore ? 'Syncing...' : 'Sync with Firebase'}</span>
              </button>

              <button
                id="admin-export-users-csv-btn"
                type="button"
                onClick={handleExportUsersCsv}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs border border-slate-200 dark:border-slate-600"
                title="Download user list with names and emails in CSV format"
              >
                <Download className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total In Database</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {users.length}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Existing & new accounts</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <p className="text-[11px] font-bold text-purple-500 uppercase tracking-wider">Administrators</p>
              <p className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-400 mt-0.5">
                {users.filter(u => u.role === 'admin').length}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Elevated access</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <p className="text-[11px] font-bold text-amber-500 uppercase tracking-wider">PRO Subscriptions</p>
              <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-0.5">
                {users.filter(u => u.plan === 'pro').length}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Active premium tier</p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
              <p className="text-[11px] font-bold text-teal-600 uppercase tracking-wider">Free Accounts</p>
              <p className="text-xl sm:text-2xl font-black text-teal-700 dark:text-teal-400 mt-0.5">
                {users.filter(u => u.plan !== 'pro').length}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Standard tier</p>
            </div>
          </div>

          {/* Search & Filters Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="admin-search-users-input"
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search user by Name, Email address, or Phone number..."
                className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 font-medium"
              />
              {userSearch && (
                <button
                  onClick={() => setUserSearch('')}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    userRoleFilter === 'all'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  All ({users.length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('admin')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    userRoleFilter === 'admin'
                      ? 'bg-white dark:bg-slate-800 text-purple-700 dark:text-purple-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Admins ({users.filter(u => u.role === 'admin').length})
                </button>
                <button
                  type="button"
                  onClick={() => setUserRoleFilter('user')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    userRoleFilter === 'user'
                      ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Users ({users.filter(u => u.role !== 'admin').length})
                </button>
              </div>

              <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setUserPlanFilter('all')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    userPlanFilter === 'all'
                      ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  All Plans
                </button>
                <button
                  type="button"
                  onClick={() => setUserPlanFilter('pro')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    userPlanFilter === 'pro'
                      ? 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  PRO Only
                </button>
                <button
                  type="button"
                  onClick={() => setUserPlanFilter('free')}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                    userPlanFilter === 'free'
                      ? 'bg-white dark:bg-slate-800 text-teal-700 dark:text-teal-300 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Free Only
                </button>
              </div>
            </div>
          </div>

          {/* User Table with Name and Email Highlighted */}
          <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/50 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <th className="py-3 px-4">User Name</th>
                    <th className="py-3 px-4">Email Address</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Plan</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Registered Date</th>
                    <th className="py-3 px-4">Firestore Sync</th>
                    <th className="py-3 px-4 text-center">Manage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                        <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No users found matching your filters</p>
                        <p className="text-xs mt-1">Try clearing your search or filters</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isOwner = u.email === 'sultanitbangladesh@gmail.com';
                      const initials = (u.name || 'U')
                        .split(' ')
                        .map(n => n[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition">
                          {/* User Name */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                                isOwner
                                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-400/40'
                                  : u.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300'
                                  : 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300'
                              }`}>
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-black text-slate-900 dark:text-white truncate">
                                    {u.name || 'Unnamed User'}
                                  </p>
                                  {isOwner && (
                                    <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black text-[9px] rounded-md tracking-wider uppercase">
                                      Owner
                                    </span>
                                  )}
                                </div>
                                {u.phone && (
                                  <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                    <Smartphone className="w-3 h-3 text-slate-400" />
                                    <span>{u.phone}</span>
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Email Address */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 text-xs">
                                {u.email || 'No email associated'}
                              </span>
                              {u.email && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyEmail(u.email)}
                                  className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                                  title="Copy Email Address"
                                >
                                  {copiedEmail === u.email ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                              {u.email && (
                                <a
                                  href={`mailto:${u.email}`}
                                  className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-teal-600 transition cursor-pointer"
                                  title="Send Email"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              u.role === 'admin'
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {u.role}
                            </span>
                          </td>

                          {/* Plan */}
                          <td className="py-3.5 px-4">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              u.plan === 'pro'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {u.plan}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleUpdateUserStatus(u.id, u.status === 'active' ? 'deactivated' : 'active')}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition ${
                                u.status === 'active'
                                  ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100'
                                  : 'text-red-700 bg-red-50 dark:bg-red-950/60 hover:bg-red-100'
                              }`}
                              title="Click to toggle active/deactivated"
                            >
                              {u.status || 'active'}
                            </button>
                          </td>

                          {/* Created / Joined */}
                          <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 text-xs">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            }) : 'Earlier'}
                          </td>

                          {/* Firestore Status */}
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold border border-emerald-200 dark:border-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                              <span>Firestore Doc</span>
                            </span>
                          </td>

                          {/* Manage Actions */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <select
                                value={u.plan || 'free'}
                                onChange={(e) => handleUpdateUserPlan(u.id, e.target.value as any)}
                                className="px-2 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none cursor-pointer"
                                title="Change User Subscription Plan"
                              >
                                <option value="free">Free</option>
                                <option value="pro">PRO</option>
                                <option value="enterprise">Enterprise</option>
                              </select>

                              <select
                                value={u.role || 'user'}
                                onChange={(e) => handleUpdateUserRole(u.id, e.target.value as any)}
                                className="px-2 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white outline-none cursor-pointer"
                                title="Change User Role"
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>

                              <button
                                type="button"
                                onClick={() => handleOpenDirectMessage({ id: u.id, name: u.name, email: u.email })}
                                className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900 text-teal-700 dark:text-teal-300 transition cursor-pointer"
                                title="Send Direct In-App Message"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                              </button>

                              {!isOwner && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u)}
                                  disabled={deletingUserId === u.id}
                                  className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 transition cursor-pointer disabled:opacity-50"
                                  title="Delete User Account permanently"
                                >
                                  <Trash2 className={`w-3.5 h-3.5 ${deletingUserId === u.id ? 'animate-spin' : ''}`} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
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
                <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between pb-1">
                    <label className="text-xs font-black text-pink-700 dark:text-pink-400">bKash Account</label>
                    <BKashFullLogo height={24} />
                  </div>
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
                <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between pb-1">
                    <label className="text-xs font-black text-orange-700 dark:text-orange-400">Nagad Account</label>
                    <NagadFullLogo height={24} />
                  </div>
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
      {/* SUGGESTIONS & SUPERCHAT TAB */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'suggestions' && (
        <div className="space-y-6">
          {/* Top KPI Metrics for Suggestions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Total Ideas</span>
                <MessageSquare className="w-4 h-4 text-teal-600" />
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white">
                {suggestionStats?.totalSuggestions ?? adminSuggestions.length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Submitted by users</p>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">SuperChats</span>
                <Crown className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {suggestionStats?.totalSuperChats ?? adminSuggestions.filter(s => s.hasSuperChat).length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Funds: ৳{suggestionStats?.totalFundsBDT ?? adminSuggestions.reduce((a, b) => a + (Number(b.superChatAmount) || 0), 0)} BDT
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Pending Review</span>
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <p className="text-2xl font-black text-blue-600 dark:text-blue-400">
                {suggestionStats?.pendingReview ?? adminSuggestions.filter(s => s.status === 'pending').length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Awaiting Sultan response</p>
            </div>

            <div className="p-4 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-bold uppercase tracking-wider">Implemented</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {suggestionStats?.completedCount ?? adminSuggestions.filter(s => s.status === 'completed').length}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">Live improvements</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between gap-3 flex-wrap bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold">
              <button
                type="button"
                onClick={() => setSuggestionFilter('all')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                  suggestionFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                All ({adminSuggestions.length})
              </button>
              <button
                type="button"
                onClick={() => setSuggestionFilter('superchat')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  suggestionFilter === 'superchat'
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : 'bg-slate-100 dark:bg-slate-700 text-amber-600 dark:text-amber-400'
                }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>SuperChats ({adminSuggestions.filter(s => s.hasSuperChat).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setSuggestionFilter('pending')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                  suggestionFilter === 'pending'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Pending Review
              </button>
              <button
                type="button"
                onClick={() => setSuggestionFilter('planned')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                  suggestionFilter === 'planned'
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Planned / In Progress
              </button>
              <button
                type="button"
                onClick={() => setSuggestionFilter('completed')}
                className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
                  suggestionFilter === 'completed'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                Implemented
              </button>
            </div>

            <button
              type="button"
              onClick={fetchAllAdminData}
              className="px-3 py-1.5 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh List</span>
            </button>
          </div>

          {/* Suggestions List */}
          {filteredSuggestions.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
              <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                No user suggestions found in this category.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSuggestions.map((item) => (
                <div
                  key={item.id}
                  className={`p-5 rounded-3xl bg-white dark:bg-slate-800 border transition shadow-xs ${
                    item.hasSuperChat
                      ? 'border-amber-400 dark:border-amber-500/70 bg-gradient-to-r from-amber-500/5 via-white dark:via-slate-800 to-transparent'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    <div className="space-y-2 max-w-3xl">
                      {/* Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.hasSuperChat && (
                          <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-xs">
                            <Crown className="w-3.5 h-3.5" />
                            <span>SUPERCHAT ৳{item.superChatAmount} BDT</span>
                            {item.isSuperChatVerified ? (
                              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-700 text-white text-[9px]">
                                VERIFIED ✓
                              </span>
                            ) : (
                              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-800 text-white text-[9px]">
                                UNVERIFIED
                              </span>
                            )}
                          </span>
                        )}
                        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold uppercase">
                          {item.category}
                        </span>
                        <span className="text-xs text-slate-400">
                          Upvotes: <strong className="text-teal-600">{item.upvotes || 0}</strong>
                        </span>

                        {/* Status */}
                        {item.status === 'completed' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-black uppercase">
                            ✓ Implemented
                          </span>
                        )}
                        {(item.status === 'planned' || item.status === 'in_progress') && (
                          <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-black uppercase">
                            Clock In Progress
                          </span>
                        )}
                        {item.status === 'pending' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-black uppercase">
                            Pending Review
                          </span>
                        )}
                        {item.status === 'declined' && (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-xs font-black uppercase">
                            Declined
                          </span>
                        )}
                      </div>

                      {/* Title & Description */}
                      <h3 className="text-base font-black text-slate-900 dark:text-white">
                        {item.title}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                        {item.description}
                      </p>

                      {/* SuperChat details box if present */}
                      {item.hasSuperChat && (
                        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs space-y-1">
                          <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-200">
                            <Zap className="w-3.5 h-3.5 text-amber-600" />
                            <span>Payment Method: <strong>{item.paymentMethod}</strong></span>
                            {item.paymentTrxId && (
                              <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-amber-300 dark:border-amber-700">
                                TrxID: {item.paymentTrxId}
                              </span>
                            )}
                            {item.senderNumber && (
                              <span>From: <strong>{item.senderNumber}</strong></span>
                            )}
                          </div>
                          {item.superChatMessage && (
                            <p className="italic text-slate-600 dark:text-slate-300">
                              Donor note: "{item.superChatMessage}"
                            </p>
                          )}
                        </div>
                      )}

                      {/* Existing Admin Reply */}
                      {item.adminReply && (
                        <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-xs space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-teal-800 dark:text-teal-300">
                            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                            <span>Sultan Admin Response:</span>
                            {item.adminRepliedAt && (
                              <span className="text-[10px] text-teal-600 font-normal">
                                ({new Date(item.adminRepliedAt).toLocaleString()})
                              </span>
                            )}
                          </div>
                          <p className="text-slate-700 dark:text-slate-200">{item.adminReply}</p>
                        </div>
                      )}

                      {/* Author details */}
                      <div className="text-[11px] text-slate-400 flex items-center gap-3 pt-1">
                        <span>Submitted by: <strong className="text-slate-700 dark:text-slate-200">{item.userName}</strong> ({item.userEmail})</span>
                        <span>Date: {new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center lg:flex-col gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenReply(item)}
                        className="px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>{item.adminReply ? 'Edit Reply / Status' : 'Reply & Status'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSuggestion(item.id)}
                        className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs cursor-pointer transition"
                        title="Delete suggestion"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* SUGGESTION REPLY & STATUS MODAL */}
      {/* ------------------------------------------------------------- */}
      {replyModalOpen && selectedSuggestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Respond to Suggestion
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReplyModalOpen(false);
                  setSelectedSuggestion(null);
                }}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Target Suggestion Overview */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-1 text-xs">
              <p className="font-bold text-slate-900 dark:text-white">{selectedSuggestion.title}</p>
              <p className="text-slate-500 line-clamp-2">{selectedSuggestion.description}</p>
              <p className="text-[11px] text-teal-600 dark:text-teal-400">
                User: {selectedSuggestion.userName} ({selectedSuggestion.userEmail})
              </p>
            </div>

            <form onSubmit={handleSaveReply} className="space-y-4">
              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Lifecycle Status
                </label>
                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold cursor-pointer"
                >
                  <option value="pending">Pending Review</option>
                  <option value="reviewed">Under Review by Sultan Admin</option>
                  <option value="planned">Planned for Next Release</option>
                  <option value="in_progress">Currently In Development</option>
                  <option value="completed">Implemented & Live 🎉</option>
                  <option value="declined">Declined</option>
                </select>
              </div>

              {/* SuperChat Verification Checkbox if SuperChat attached */}
              {selectedSuggestion.hasSuperChat && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      SuperChat Amount: ৳{selectedSuggestion.superChatAmount} ({selectedSuggestion.paymentMethod})
                    </p>
                    {selectedSuggestion.paymentTrxId && (
                      <p className="text-[11px] font-mono text-amber-800 dark:text-amber-300">
                        TrxID: {selectedSuggestion.paymentTrxId}
                      </p>
                    )}
                  </div>
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={superChatVerifyStatus}
                      onChange={(e) => setSuperChatVerifyStatus(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600"
                    />
                    <span>Verified ✓</span>
                  </label>
                </div>
              )}

              {/* Reply Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sultan Admin Reply Note (Will send in-app notification to user)
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  placeholder="e.g. Thanks for the brilliant suggestion! We have scheduled this for release in v2.4."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs outline-none resize-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setReplyModalOpen(false);
                    setSelectedSuggestion(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReply}
                  className="px-5 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {savingReply ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>Save & Notify User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
