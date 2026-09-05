import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  Trash2,
  Filter,
  ArrowRight,
  Sparkles,
  Wallet,
  PieChart,
  Target,
  HandCoins,
  Crown,
  Settings,
  Search
} from 'lucide-react';
import {
  ActionLogItem,
  getStoredActionLogs,
  subscribeToLogsUpdates,
  clearActionLogs
} from '../lib/actionNotifications';
import { formatCurrency } from '../lib/currencies';

interface ActivityLogWidgetProps {
  onNavigate?: (view: string) => void;
  currency: string;
}

export const ActivityLogWidget: React.FC<ActivityLogWidgetProps> = ({
  onNavigate,
  currency,
}) => {
  const [logs, setLogs] = useState<ActionLogItem[]>([]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    let existing = getStoredActionLogs();
    if (existing.length === 0) {
      // Seed initial confirmation activity logs so user immediately sees how it works
      const initialSeed: ActionLogItem[] = [
        {
          id: `seed_action_1`,
          type: 'subscription_status',
          category: 'SUBSCRIPTION',
          title: 'System Initialized & Secured',
          message: 'Welcome to Hishab Khata PRO. Multi-currency ledger is ready.',
          details: 'Wallets synced: bKash Personal, Nagad, and City Bank Account.',
          status: 'confirmed',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        },
        {
          id: `seed_action_2`,
          type: 'wallet_add',
          category: 'WALLET',
          title: 'Mobile Financial Services Linked',
          message: 'bKash & Nagad instant transfer channels verified.',
          details: 'Supports Send Money, Cash In, Cash Out, and Payment.',
          status: 'confirmed',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        },
      ];
      localStorage.setItem('hishab_action_audit_logs_v1', JSON.stringify(initialSeed));
      existing = initialSeed;
    }
    setLogs(existing);
    const unsubscribe = subscribeToLogsUpdates((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return unsubscribe;
  }, []);

  const filteredLogs = logs.filter((item) => {
    const matchesCategory =
      filterCategory === 'all' ||
      (filterCategory === 'TRANSACTION' && item.category === 'TRANSACTION') ||
      (filterCategory === 'WALLET' && (item.category === 'WALLET' || item.category === 'BUDGET')) ||
      (filterCategory === 'SUBSCRIPTION' && item.category === 'SUBSCRIPTION') ||
      (filterCategory === 'GOAL' && (item.category === 'SAVINGS' || item.category === 'LOAN'));

    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.details && item.details.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Recent';
    }
  };

  const getIcon = (category: ActionLogItem['category']) => {
    switch (category) {
      case 'TRANSACTION':
        return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'WALLET':
        return <Wallet className="w-4 h-4 text-teal-500" />;
      case 'BUDGET':
        return <PieChart className="w-4 h-4 text-blue-500" />;
      case 'SAVINGS':
        return <Target className="w-4 h-4 text-purple-500" />;
      case 'LOAN':
        return <HandCoins className="w-4 h-4 text-amber-500" />;
      case 'SUBSCRIPTION':
        return <Crown className="w-4 h-4 text-amber-500" />;
      case 'SETTINGS':
        return <Settings className="w-4 h-4 text-slate-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-teal-500" />;
    }
  };

  const getStatusBadge = (status: ActionLogItem['status']) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
            Confirmed
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
            Pending Review
          </span>
        );
      case 'deleted':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/80">
            Deleted
          </span>
        );
      case 'updated':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
            Updated
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <section id="dashboard-activity-log-widget" className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950/70 border border-teal-200 dark:border-teal-800/80 flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Activity & Confirmation Log
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {logs.length}
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
              Live confirmation records for transactions, wallet changes, budgets & purchases
            </p>
          </div>
        </div>

        {logs.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Clear your local activity confirmation log?')) {
                clearActionLogs();
              }
            }}
            className="self-start sm:self-center px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Log</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="pt-3 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'all', label: 'All Actions' },
            { id: 'TRANSACTION', label: 'Transactions' },
            { id: 'WALLET', label: 'Wallets & Budgets' },
            { id: 'SUBSCRIPTION', label: 'Subscriptions' },
            { id: 'GOAL', label: 'Goals & Loans' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer border ${
                filterCategory === cat.id
                  ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200/80 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        {logs.length > 3 && (
          <div className="relative w-full md:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activity..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        )}
      </div>

      {/* Log Entries List */}
      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {filteredLogs.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-800 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No recent activity in log
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              When you add a transaction, update a wallet, save a budget, or submit a subscription purchase, a live confirmation pop-up will appear and your audit record will be stored here.
            </p>
          </div>
        ) : (
          filteredLogs.map((item) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shrink-0 mt-0.5 shadow-xs">
                  {getIcon(item.category)}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </span>
                    {getStatusBadge(item.status)}
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3 h-3 inline" />
                      {formatTimestamp(item.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug">
                    {item.message}
                  </p>
                  {item.details && (
                    <span className="inline-block mt-1 text-[11px] font-mono font-medium text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800/60">
                      {item.details}
                    </span>
                  )}
                </div>
              </div>

              {/* Right Side Amount & Quick View */}
              <div className="flex items-center justify-between sm:justify-end gap-3 sm:shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700/60">
                {item.amount !== undefined && item.currency && (
                  <span className={`font-mono text-xs font-extrabold ${
                    item.type === 'transaction_delete' ? 'text-red-600 dark:text-red-400 line-through' :
                    item.category === 'TRANSACTION' ? 'text-emerald-600 dark:text-emerald-400' :
                    'text-slate-900 dark:text-white'
                  }`}>
                    {formatCurrency(item.amount, item.currency)}
                  </span>
                )}

                {onNavigate && (
                  <button
                    type="button"
                    onClick={() => {
                      if (item.category === 'TRANSACTION') onNavigate('transactions');
                      else if (item.category === 'WALLET') onNavigate('wallets');
                      else if (item.category === 'BUDGET') onNavigate('budgets');
                      else if (item.category === 'SAVINGS') onNavigate('savings');
                      else if (item.category === 'LOAN') onNavigate('loans');
                      else if (item.category === 'SETTINGS') onNavigate('settings');
                    }}
                    className="text-[11px] font-bold text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300 flex items-center gap-1 transition cursor-pointer"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
};
