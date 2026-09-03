import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { AppNotification } from '../types';
import {
  Bell,
  CheckCheck,
  Trash2,
  AlertTriangle,
  Target,
  Sparkles,
  Info,
  Crown,
  CheckCircle2,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Wallet,
  ShieldCheck,
  BellRing
} from 'lucide-react';
import { requestPushPermission, getPushPermissionState } from '../lib/pushNotifications';

interface NotificationsViewProps {
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete?: (id: string) => void;
  onClearAll?: () => void;
  onNavigate?: (view: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onClearAll,
  onNavigate,
}) => {
  const { t } = useI18n();
  const [filter, setFilter] = useState<'all' | 'unread' | 'alerts' | 'transactions' | 'system'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pushStatus, setPushStatus] = useState<NotificationPermission>(getPushPermissionState());

  const handleEnablePush = async () => {
    const res = await requestPushPermission();
    setPushStatus(res);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filteredNotifications = notifications.filter((n) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (n.titleKey || '').toLowerCase().includes(q);
      const matchMsg = (n.messageKey || '').toLowerCase().includes(q);
      if (!matchTitle && !matchMsg) return false;
    }

    if (filter === 'unread') return !n.isRead;
    if (filter === 'alerts') {
      return n.type === 'budget_warning' || n.type === 'budget_exceeded' || n.type === 'system';
    }
    if (filter === 'transactions') {
      return n.type === 'savings_reminder' || (n.titleKey || '').toLowerCase().includes('transaction') || (n.titleKey || '').toLowerCase().includes('wallet');
    }
    if (filter === 'system') {
      return n.type === 'announcement' || (n.titleKey || '').toLowerCase().includes('pro') || (n.titleKey || '').toLowerCase().includes('subscription');
    }
    return true;
  });

  const getNotifDetails = (n: AppNotification) => {
    const title = (n.titleKey || '').toLowerCase();
    const type = n.type;

    if (title.includes('pro') || title.includes('subscription') || title.includes('vip')) {
      return {
        icon: <Crown className="w-5 h-5 text-amber-500" />,
        bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        badge: 'PRO & VIP',
        navTarget: 'settings',
      };
    }
    if (type === 'budget_warning' || type === 'budget_exceeded' || title.includes('budget')) {
      return {
        icon: <AlertTriangle className="w-5 h-5 text-rose-500" />,
        bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        badge: 'Budget Alert',
        navTarget: 'budgets',
      };
    }
    if (type === 'savings_reminder' || title.includes('saving') || title.includes('goal')) {
      return {
        icon: <Target className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
        bg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
        badge: 'Savings Vault',
        navTarget: 'savings_goals',
      };
    }
    if (title.includes('loan') || title.includes('debt')) {
      return {
        icon: <TrendingUp className="w-5 h-5 text-indigo-500" />,
        bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        badge: 'Loan & Debt',
        navTarget: 'loans',
      };
    }
    if (title.includes('wallet') || title.includes('balance') || title.includes('cash')) {
      return {
        icon: <Wallet className="w-5 h-5 text-emerald-500" />,
        bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        badge: 'Wallet Alert',
        navTarget: 'wallets',
      };
    }
    if (type === 'announcement') {
      return {
        icon: <Sparkles className="w-5 h-5 text-purple-500" />,
        bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
        badge: 'Announcement',
        navTarget: undefined,
      };
    }
    return {
      icon: <Info className="w-5 h-5 text-sky-500" />,
      bg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
      badge: 'System Notice',
      navTarget: undefined,
    };
  };

  const formatTimestamp = (ts: string) => {
    try {
      const date = new Date(ts);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* View Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-teal-900 via-slate-900 to-slate-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-teal-500/30">
              <Bell className="w-3.5 h-3.5" />
              <span>Real-Time Alert Center</span>
            </span>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-xs font-black animate-pulse">
                {unreadCount} Unread
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t('nav_notifications')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mt-1">
            Live updates on wallet adjustments, budget overruns, savings milestones, and administrative verification notices.
          </p>
        </div>

        {/* Action Controls */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All as Read</span>
            </button>
          )}

          {notifications.length > 0 && onClearAll && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Are you sure you want to clear all notifications?')) {
                  onClearAll();
                }
              }}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-rose-900/60 hover:text-rose-200 text-slate-300 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
              title="Clear all alerts"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}

          {pushStatus !== 'granted' && (
            <button
              type="button"
              onClick={handleEnablePush}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <BellRing className="w-4 h-4" />
              <span>Enable Browser Alerts</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filter === 'all'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Alerts ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              filter === 'unread'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-amber-200 text-amber-900 font-extrabold">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setFilter('alerts')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filter === 'alerts'
                ? 'bg-rose-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Budget & System
          </button>
          <button
            type="button"
            onClick={() => setFilter('transactions')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filter === 'transactions'
                ? 'bg-teal-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Wallets & Savings
          </button>
          <button
            type="button"
            onClick={() => setFilter('system')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filter === 'system'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            PRO & Broadcasts
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notifications..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 outline-none"
          />
        </div>
      </div>

      {/* Notifications List */}
      {filteredNotifications.length === 0 ? (
        <div className="py-16 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-4 border border-teal-200 dark:border-teal-800">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
            {searchQuery ? 'No matching notifications found' : 'All caught up! No notifications'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1">
            {searchQuery
              ? 'Try changing your search term or selecting a different category filter.'
              : 'You have no alerts at the moment. As you log transactions, hit budget thresholds, or receive PRO subscription updates, they will appear right here.'}
          </p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="mt-4 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 transition cursor-pointer"
            >
              Clear Search Query
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const details = getNotifDetails(notif);

            return (
              <div
                key={notif.id}
                className={`p-4 sm:p-5 rounded-2xl border transition relative group flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  !notif.isRead
                    ? 'bg-teal-50/60 dark:bg-teal-950/20 border-teal-200 dark:border-teal-800/80 shadow-xs'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Left Side: Icon & Content */}
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div className={`p-2.5 rounded-2xl shrink-0 border ${details.bg}`}>
                    {details.icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        {details.badge}
                      </span>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 ring-2 ring-amber-300 dark:ring-amber-900 shrink-0" />
                      )}
                      <span className="text-[11px] text-slate-400 font-medium">
                        {formatTimestamp(notif.createdAt)}
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                      {notif.titleKey}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {notif.messageKey}
                    </p>
                  </div>
                </div>

                {/* Right Side: Action Buttons */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 w-full sm:w-auto justify-end">
                  {/* Context Link */}
                  {details.navTarget && onNavigate && (
                    <button
                      type="button"
                      onClick={() => onNavigate(details.navTarget!)}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Toggle Read */}
                  {!notif.isRead ? (
                    <button
                      type="button"
                      onClick={() => onMarkRead(notif.id)}
                      className="px-3 py-1.5 rounded-xl bg-teal-100 hover:bg-teal-200 dark:bg-teal-950/80 dark:hover:bg-teal-900 text-teal-800 dark:text-teal-300 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      title="Mark as read"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark Read</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 font-medium px-2 py-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                      <span>Read</span>
                    </span>
                  )}

                  {/* Delete */}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(notif.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                      title="Delete notification"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
