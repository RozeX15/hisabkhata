import React from 'react';
import { AppNotification } from '../types';
import { Bell, Sparkles, AlertTriangle, Target, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LiveNotificationToastProps {
  notification: AppNotification | null;
  onClose: () => void;
  onClick: () => void;
}

export const LiveNotificationToast: React.FC<LiveNotificationToastProps> = ({
  notification,
  onClose,
  onClick,
}) => {
  if (!notification) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'announcement':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      case 'budget_warning':
      case 'budget_exceeded':
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
      case 'savings_reminder':
        return <Target className="w-5 h-5 text-teal-400" />;
      default:
        return <Bell className="w-5 h-5 text-teal-400" />;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -30, scale: 0.95 }}
        className="fixed top-4 right-4 sm:right-6 z-50 max-w-md w-full px-3 pointer-events-auto"
      >
        <div className="p-4 rounded-2xl bg-slate-900/95 text-white border border-teal-500/40 shadow-2xl backdrop-blur-md flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-teal-950/80 border border-teal-800/60 shrink-0">
            {getIcon(notification.type)}
          </div>
          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={onClick}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <span className="px-1.5 py-0.5 rounded-md bg-teal-500/20 text-teal-300 text-[10px] font-extrabold uppercase tracking-wide">
                {notification.userId === null ? 'Global Broadcast' : 'Notification'}
              </span>
              <span className="text-[10px] text-slate-400">Just now</span>
            </div>
            <h4 className="text-sm font-bold text-white truncate">
              {notification.titleKey}
            </h4>
            <p className="text-xs text-slate-300 line-clamp-2 mt-0.5">
              {notification.messageKey}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
