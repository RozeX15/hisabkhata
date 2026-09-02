import React, { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { api } from '../lib/api';
import { User } from '../types';
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
  Bell
} from 'lucide-react';

export const AdminView: React.FC = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Broadcast form
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastType, setBroadcastType] = useState('announcement');
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
      ]);
      setStats((statsRes as any).stats || statsRes);
      setUsers((usersRes as any).users || usersRes);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdateUserRole = async (targetUserId: string, newRole: 'admin' | 'user') => {
    try {
      await api.updateAdminUser(targetUserId, { role: newRole });
      await fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user role');
    }
  };

  const handleUpdateUserPlan = async (targetUserId: string, newPlan: 'free' | 'pro' | 'enterprise') => {
    try {
      await api.updateAdminUser(targetUserId, { plan: newPlan });
      await fetchAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update user plan');
    }
  };

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

  if (loading && !stats) {
    return (
      <div className="py-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-teal-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-slate-900 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black tracking-tight">Hishab Khata SaaS SuperAdmin</h2>
              <span className="px-2 py-0.5 rounded-full bg-red-500/30 text-red-300 text-[10px] font-extrabold uppercase">
                System Root
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Live telemetry, registered tenancy management, and global broadcasts.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchAdminData}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* KPI Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
              <Users className="w-4 h-4 text-teal-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.totalUsers}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              {stats.proUsers} PRO Subscribers
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Ledgers</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.totalTransactions}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Recorded across all wallets
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Wallets & Accounts</span>
              <CreditCard className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {stats.totalWallets}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Active liquidity nodes
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Estimated ARR</span>
              <TrendingUp className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              ${stats.proUsers * 60}/yr
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              SaaS Subscription Run-rate
            </p>
          </div>
        </div>
      )}

      {/* Broadcast Announcement Form */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">
            Broadcast System Notification
          </h3>
        </div>

        <form onSubmit={handleSendBroadcast} className="space-y-3">
          {broadcastSuccess && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Notification broadcasted to all registered tenant accounts!
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <input
                id="admin-broadcast-title"
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="Notification Title (e.g. New Gemini Financial AI features live!)"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                required
              />
            </div>
            <div>
              <select
                id="admin-broadcast-type"
                value={broadcastType}
                onChange={(e) => setBroadcastType(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none"
              >
                <option value="announcement">Announcement</option>
                <option value="system_alert">System Alert</option>
                <option value="budget_warning">Tips & Reminder</option>
              </select>
            </div>
          </div>

          <div>
            <textarea
              id="admin-broadcast-msg"
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Notification body details..."
              rows={2}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none resize-none"
              required
            />
          </div>

          <button
            id="admin-broadcast-send-btn"
            type="submit"
            disabled={broadcastLoading}
            className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {broadcastLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Push Global Broadcast</span>
          </button>
        </form>
      </div>

      {/* Users Directory Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700/80">
          <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
            Registered Tenant Directory ({users.length})
          </h3>
          <p className="text-xs text-slate-400">
            Control roles, elevate subscriptions, and review tenant metadata.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/50 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Plan</th>
                <th className="py-3 px-4">Currency</th>
                <th className="py-3 px-4">Created At</th>
                <th className="py-3 px-4 text-center">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {users.map((u) => (
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
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                    {u.preferredCurrency || (u as any).defaultCurrency || 'BDT'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 text-xs">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <select
                        value={u.plan}
                        onChange={(e) => handleUpdateUserPlan(u.id, e.target.value as any)}
                        className="px-2 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        <option value="free">Free</option>
                        <option value="pro">PRO</option>
                        <option value="enterprise">Enterprise</option>
                      </select>

                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateUserRole(u.id, e.target.value as any)}
                        className="px-2 py-1 text-[11px] font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
