import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { Transaction, Wallet, Category, DashboardSummary } from '../types';
import { formatCurrency } from '../lib/currencies';
import { exportToPDF, exportToExcel, exportToCSV } from '../lib/exportUtils';
import {
  BarChart3,
  FileSpreadsheet,
  FileText,
  Download,
  Calendar,
  PieChart as PieChartIcon,
  TrendingUp,
  TrendingDown,
  PiggyBank
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface ReportsViewProps {
  summary: DashboardSummary | null;
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  currency: string;
  userName: string;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  summary,
  transactions,
  wallets,
  categories,
  currency,
  userName,
}) => {
  const { t } = useI18n();
  const [reportPeriod, setReportPeriod] = useState<'all' | '30days' | '90days'>('all');

  const now = new Date();
  const filteredTxs = transactions.filter((tx) => {
    if (reportPeriod === 'all') return true;
    const txDate = new Date(tx.date);
    const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
    if (reportPeriod === '30days') return diffDays <= 30;
    if (reportPeriod === '90days') return diffDays <= 90;
    return true;
  });

  const totalIncome = filteredTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filteredTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.max(0, Math.round((netSavings / totalIncome) * 100)) : 0;

  // Category breakdown for filtered transactions
  const catTotals: Record<string, number> = {};
  filteredTxs.filter(t => t.type === 'expense').forEach((tx) => {
    catTotals[tx.categoryId] = (catTotals[tx.categoryId] || 0) + tx.amount;
  });

  const catPieData = Object.entries(catTotals).map(([catId, amount]) => {
    const cat = categories.find(c => c.id === catId);
    return {
      name: cat ? (cat.customName || t(cat.nameKey) || cat.id) : catId,
      value: amount,
      color: cat?.color || '#0F766E',
    };
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Export Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('nav_reports')} & Statement Generation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit-ready cashflow intelligence and formal ledger downloads
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
            {(['all', '30days', '90days'] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setReportPeriod(p)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  reportPeriod === p
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500'
                }`}
              >
                {p === 'all' ? 'All Time' : p === '30days' ? 'Last 30D' : 'Last 90D'}
              </button>
            ))}
          </div>

          <button
            id="reports-pdf-btn"
            type="button"
            onClick={() => exportToPDF(filteredTxs, { totalIncome, totalExpense, netSavings, currency, userName })}
            className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FileText className="w-4 h-4" />
            <span>PDF Statement</span>
          </button>

          <button
            id="reports-excel-btn"
            type="button"
            onClick={() => exportToExcel(filteredTxs, wallets)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel Ledger</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Inflow
          </span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalIncome, currency)}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Total Outflow
          </span>
          <p className="text-2xl font-black text-red-600 dark:text-red-400">
            {formatCurrency(totalExpense, currency)}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Net Surplus
          </span>
          <p className={`text-2xl font-black ${netSavings >= 0 ? 'text-teal-700 dark:text-teal-400' : 'text-red-500'}`}>
            {formatCurrency(netSavings, currency)}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Savings Rate
          </span>
          <p className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {savingsRate}%
          </p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        {summary && (
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-4">
              Historical Cashflow Timeline
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.monthlySpendingTrend}>
                  <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip
                    formatter={(val: number) => [`${currency} ${val.toLocaleString()}`, '']}
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="income" fill="#10B981" radius={[6, 6, 0, 0]} name="Income" />
                  <Bar dataKey="expense" fill="#EF4444" radius={[6, 6, 0, 0]} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Expense Category Breakdown Chart */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
              Expense Allocation Breakdown
            </h3>
            <p className="text-xs text-slate-400 mb-4">Proportion by category</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            {catPieData.length === 0 ? (
              <p className="text-xs text-slate-400">No expense records found in selected interval</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={catPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {catPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [`${currency} ${val.toLocaleString()}`, '']}
                    contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2 max-h-24 overflow-y-auto">
            {catPieData.slice(0, 6).map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate text-slate-600 dark:text-slate-300">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
