import React from 'react';
import { useI18n } from '../lib/i18n';
import { AppNotification } from '../types';
import {
  X,
  Bell,
  CheckCheck,
  AlertTriangle,
  Target,
  Sparkles,
  Info
} from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
}) => {
  const { t } = useI18n();

  if (!isOpen) return null;

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'budget_warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'savings_reminder':
        return <Target className="w-4 h-4 text-teal-600" />;
      case 'announcement':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      default:
        return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-teal-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              {t('nav_notifications')}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onMarkAllRead}
              title={t('mark_all_read')}
              className="p-1.5 text-xs text-teal-600 dark:text-teal-400 font-bold hover:bg-teal-50 dark:hover:bg-teal-950/40 rounded-lg transition cursor-pointer flex items-center gap-1"
            >
              <CheckCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Mark all read</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-medium">No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => onMarkRead(n.id)}
                className={`p-3.5 rounded-2xl border transition cursor-pointer ${
                  n.isRead
                    ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800/80 opacity-70'
                    : 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-200/60 dark:border-teal-900/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white dark:bg-slate-800 shadow-xs shrink-0">
                    {getNotifIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {t(n.titleKey) || n.titleKey}
                      </p>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                      {t(n.messageKey) || n.messageKey}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-1.5 block">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
