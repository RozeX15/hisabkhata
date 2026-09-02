import React, { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { AppNotification } from '../types';
import {
  X,
  Bell,
  CheckCheck,
  AlertTriangle,
  Target,
  Sparkles,
  Info,
  BellRing,
  Trash2,
  CheckCircle2,
  Crown
} from 'lucide-react';
import { requestPushPermission, getPushPermissionState } from '../lib/pushNotifications';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onDelete?: (id: string) => void;
  onClearAll?: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDelete,
  onClearAll,
}) => {
  const { t } = useI18n();
  const [pushStatus, setPushStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (isOpen) {
      setPushStatus(getPushPermissionState());
    }
  }, [isOpen]);

  const handleEnablePush = async () => {
    const res = await requestPushPermission();
    setPushStatus(res);
  };

  if (!isOpen) return null;

  const getNotifIcon = (type: string, title: string) => {
    if (title.includes('PRO') || title.includes('Subscription') || title.includes('VIP')) {
      return <Crown className="w-4 h-4 text-amber-500" />;
    }
    switch (type) {
      case 'budget_warning':
      case 'budget_exceeded':
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case 'savings_reminder':
        return <Target className="w-4 h-4 text-teal-600" />;
      case 'announcement':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                  {t('nav_notifications')}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {notifications.filter(n => !n.isRead).length} unread alerts
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Toolbar */}
          {notifications.length > 0 && (
            <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
              <button
                type="button"
                onClick={onMarkAllRead}
                className="px-2.5 py-1 text-xs text-teal-700 dark:text-teal-300 font-bold hover:bg-teal-100/60 dark:hover:bg-teal-950/60 rounded-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
              {onClearAll && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="px-2.5 py-1 text-xs text-rose-600 dark:text-rose-400 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear all</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Push notification enable banner if not granted */}
        {pushStatus !== 'granted' && 'Notification' in window && (
          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border-b border-teal-100 dark:border-teal-900/40 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs text-teal-900 dark:text-teal-200">
              <BellRing className="w-4 h-4 text-teal-600 shrink-0" />
              <span className="font-semibold">Receive real-time push alerts</span>
            </div>
            <button
              type="button"
              onClick={handleEnablePush}
              className="px-2.5 py-1 text-[11px] font-bold text-white bg-teal-600 hover:bg-teal-500 rounded-lg transition cursor-pointer shrink-0 shadow-xs"
            >
              Enable
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-20 text-center text-slate-400 dark:text-slate-500">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2.5 opacity-30 text-teal-600" />
              <p className="text-sm font-extrabold text-slate-700 dark:text-slate-300">You're all caught up!</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">No pending or unread notifications.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`group relative p-3.5 rounded-2xl border transition-all ${
                  n.isRead
                    ? 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                    : 'bg-teal-50/70 dark:bg-teal-950/40 border-teal-300/80 dark:border-teal-800/80 shadow-xs text-slate-900 dark:text-white'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs shrink-0 border border-slate-100 dark:border-slate-700/60">
                    {getNotifIcon(n.type, t(n.titleKey) || n.titleKey)}
                  </div>
                  <div className="flex-1 min-w-0 pr-6" onClick={() => onMarkRead(n.id)}>
                    <div className="flex items-center gap-1.5 mb-1">
                      {n.userId === null && (
                        <span className="px-1.5 py-0.2 bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 text-[9px] font-black rounded uppercase tracking-wider">
                          Broadcast
                        </span>
                      )}
                      <p className="text-xs font-black truncate text-slate-900 dark:text-white">
                        {t(n.titleKey) || n.titleKey}
                      </p>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0 ml-auto" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                      {t(n.messageKey) || n.messageKey}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                        {new Date(n.createdAt).toLocaleDateString()} • {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!n.isRead && (
                        <span className="text-[10px] font-bold text-teal-600 dark:text-teal-400">
                          Click to mark read
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Individual Delete Button */}
                  {onDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(n.id);
                      }}
                      title="Delete notification"
                      className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 transition cursor-pointer opacity-80 hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

