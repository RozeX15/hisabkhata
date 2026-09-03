import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  CheckCircle2,
  X,
  ArrowUpRight,
  Wallet,
  PieChart,
  Target,
  HandCoins,
  Crown,
  Settings,
  Sparkles,
  Info
} from 'lucide-react';
import { ActionLogItem, subscribeToActionNotifications } from '../lib/actionNotifications';
import { formatCurrency } from '../lib/currencies';

interface ActionConfirmationPopupProps {
  onViewDashboardLog?: () => void;
}

export const ActionConfirmationPopup: React.FC<ActionConfirmationPopupProps> = ({
  onViewDashboardLog,
}) => {
  const [activeItem, setActiveItem] = useState<ActionLogItem | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToActionNotifications((item) => {
      setActiveItem(item);
    });
    return unsubscribe;
  }, []);

  // Auto dismiss after 6.5 seconds
  useEffect(() => {
    if (!activeItem) return;
    const timer = setTimeout(() => {
      setActiveItem(null);
    }, 6500);
    return () => clearTimeout(timer);
  }, [activeItem]);

  if (!activeItem) return null;

  const getCategoryIcon = () => {
    switch (activeItem.category) {
      case 'TRANSACTION':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'WALLET':
        return <Wallet className="w-5 h-5 text-teal-400" />;
      case 'BUDGET':
        return <PieChart className="w-5 h-5 text-blue-400" />;
      case 'SAVINGS':
        return <Target className="w-5 h-5 text-purple-400" />;
      case 'LOAN':
        return <HandCoins className="w-5 h-5 text-amber-400" />;
      case 'SUBSCRIPTION':
        return <Crown className="w-5 h-5 text-amber-400" />;
      case 'SETTINGS':
        return <Settings className="w-5 h-5 text-slate-300" />;
      default:
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
    }
  };

  const getBadgeColor = () => {
    switch (activeItem.status) {
      case 'confirmed':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'pending':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'deleted':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'updated':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
    }
  };

  return (
    <div className="fixed top-4 sm:top-5 right-3 sm:right-6 z-50 max-w-md w-[calc(100%-24px)] sm:w-full pointer-events-none">
      <AnimatePresence>
        {activeItem && (
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, y: -25, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.92, transition: { duration: 0.2 } }}
            className="pointer-events-auto rounded-2xl bg-slate-900/95 dark:bg-slate-900/98 text-white border-2 border-emerald-500/50 shadow-2xl backdrop-blur-xl p-4 overflow-hidden relative"
          >
            {/* Top glowing edge bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-amber-400" />

            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-700/60 shrink-0 mt-0.5 shadow-inner">
                {getCategoryIcon()}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${getBadgeColor()}`}>
                    {activeItem.status === 'confirmed' ? 'Confirmed' : activeItem.status}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">Just now</span>
                  {activeItem.amount !== undefined && activeItem.currency && (
                    <span className="ml-auto font-mono text-xs font-black text-emerald-400">
                      {formatCurrency(activeItem.amount, activeItem.currency)}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-black text-white leading-tight">
                  {activeItem.title}
                </h4>

                <p className="text-xs text-slate-300 mt-1 leading-snug">
                  {activeItem.message}
                </p>

                {activeItem.details && (
                  <p className="text-[11px] text-teal-300/90 mt-1 font-medium bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60 inline-block max-w-full truncate">
                    {activeItem.details}
                  </p>
                )}

                {onViewDashboardLog && (
                  <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <button
                      type="button"
                      onClick={() => {
                        onViewDashboardLog();
                        setActiveItem(null);
                      }}
                      className="text-[11px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition cursor-pointer"
                    >
                      <span>View Activity Log in Dashboard</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveItem(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer shrink-0"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
