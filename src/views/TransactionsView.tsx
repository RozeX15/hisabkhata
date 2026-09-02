import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { Transaction, Wallet, Category } from '../types';
import { formatCurrency } from '../lib/currencies';
import { exportToCSV, exportToExcel, exportToPDF } from '../lib/exportUtils';
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Download,
  Plus,
  Trash2,
  Edit2,
  FileSpreadsheet,
  FileText,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface TransactionsViewProps {
  transactions: Transaction[];
  wallets: Wallet[];
  categories: Category[];
  currency: string;
  userName: string;
  onOpenAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onDeleteTransaction: (id: string) => Promise<void>;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  wallets,
  categories,
  currency,
  userName,
  onOpenAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedWallet, setSelectedWallet] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Filter transactions
  const filtered = transactions.filter((tx) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchNote = tx.note && tx.note.toLowerCase().includes(q);
      if (!matchDesc && !matchNote) return false;
    }
    if (selectedType !== 'all' && tx.type !== selectedType) return false;
    if (selectedWallet !== 'all' && tx.walletId !== selectedWallet && tx.toWalletId !== selectedWallet) return false;
    if (selectedCategory !== 'all' && tx.categoryId !== selectedCategory) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalIncome = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const handleExportPDF = () => {
    exportToPDF(filtered, {
      totalIncome,
      totalExpense,
      netSavings: totalIncome - totalExpense,
      currency,
      userName,
    });
  };

  const handleExportExcel = () => {
    exportToExcel(filtered, wallets);
  };

  const handleExportCSV = () => {
    exportToCSV(filtered);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with quick stats & exports */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('nav_transactions')} Ledger
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {filtered.length} recorded operations found
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export buttons */}
          <button
            id="export-pdf-btn"
            type="button"
            onClick={handleExportPDF}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FileText className="w-4 h-4 text-red-500" />
            <span>PDF</span>
          </button>

          <button
            id="export-excel-btn"
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            id="export-csv-btn"
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-blue-500" />
            <span>CSV</span>
          </button>

          <button
            id="tx-view-add-btn"
            type="button"
            onClick={onOpenAddTransaction}
            className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-700/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('add_transaction')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shadow-xs">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            id="tx-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search description, notes..."
            className="w-full pl-10 pr-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Type selector */}
        <select
          id="tx-type-filter"
          value={selectedType}
          onChange={(e) => {
            setSelectedType(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">All Types</option>
          <option value="expense">Expense (-)</option>
          <option value="income">Income (+)</option>
          <option value="transfer">Transfer</option>
        </select>

        {/* Wallet selector */}
        <select
          id="tx-wallet-filter"
          value={selectedWallet}
          onChange={(e) => {
            setSelectedWallet(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">All Wallets</option>
          {wallets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name}
            </option>
          ))}
        </select>

        {/* Category selector */}
        <select
          id="tx-category-filter"
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.customName || t(c.nameKey) || c.id}
            </option>
          ))}
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-700/80 bg-slate-50/70 dark:bg-slate-900/50 text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Wallet</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    No transactions match your search criteria.
                  </td>
                </tr>
              ) : (
                paginated.map((tx) => {
                  const isIncome = tx.type === 'income';
                  const isTransfer = tx.type === 'transfer';
                  const wallet = wallets.find(w => w.id === tx.walletId);
                  const destWallet = isTransfer ? wallets.find(w => w.id === tx.toWalletId) : null;
                  const cat = categories.find(c => c.id === tx.categoryId);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {tx.date}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          isIncome ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                          isTransfer ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                          'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                        }`}>
                          {isIncome ? <ArrowUpRight className="w-3 h-3" /> : isTransfer ? <ArrowLeftRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                          <span>{tx.type}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 min-w-[180px]">
                        <p className="font-bold text-slate-900 dark:text-white truncate">
                          {tx.description}
                        </p>
                        {tx.note && (
                          <p className="text-[11px] text-slate-400 truncate max-w-xs">
                            {tx.note}
                          </p>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {cat ? (cat.customName || t(cat.nameKey) || cat.id) : '-'}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 dark:text-slate-300">
                        {isTransfer ? (
                          <span>{wallet?.name || 'Wallet'} → {destWallet?.name || 'Wallet'}</span>
                        ) : (
                          <span>{wallet?.name || 'Wallet'}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap font-extrabold">
                        <span className={
                          isIncome ? 'text-emerald-600 dark:text-emerald-400' :
                          isTransfer ? 'text-blue-600 dark:text-blue-400' :
                          'text-red-600 dark:text-red-400'
                        }>
                          {isIncome ? '+' : isTransfer ? '' : '-'}{formatCurrency(tx.amount, currency)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditTransaction(tx)}
                            title="Edit"
                            className="p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteTransaction(tx.id)}
                            title="Delete"
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
