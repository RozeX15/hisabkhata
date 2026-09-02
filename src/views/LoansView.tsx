import React from 'react';
import { useI18n } from '../lib/i18n';
import { Loan } from '../types';
import { formatCurrency } from '../lib/currencies';
import {
  HandCoins,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  Trash2,
  Calendar,
  Phone,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface LoansViewProps {
  loans: Loan[];
  currency: string;
  onOpenAddLoan: () => void;
  onOpenPayment: (loan: Loan) => void;
  onDeleteLoan: (id: string) => Promise<void>;
}

export const LoansView: React.FC<LoansViewProps> = ({
  loans,
  currency,
  onOpenAddLoan,
  onOpenPayment,
  onDeleteLoan,
}) => {
  const { t } = useI18n();

  const oweMeTotal = loans.filter(l => l.type === 'owe_me').reduce((s, l) => s + (l.amount - l.paidAmount), 0);
  const iOweTotal = loans.filter(l => l.type === 'i_owe').reduce((s, l) => s + (l.amount - l.paidAmount), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('nav_loans')} & Outstanding Debts
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            To Receive: <strong className="text-emerald-600">{formatCurrency(oweMeTotal, currency)}</strong> •
            To Pay Back: <strong className="text-amber-600">{formatCurrency(iOweTotal, currency)}</strong>
          </p>
        </div>

        <button
          id="add-loan-btn"
          type="button"
          onClick={onOpenAddLoan}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-700/20 transition flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t('add_loan')}</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-5 rounded-3xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40">
          <div className="flex items-center gap-2 mb-2 text-emerald-800 dark:text-emerald-300">
            <ArrowDownLeft className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">{t('owe_me')} (Receivables)</span>
          </div>
          <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
            {formatCurrency(oweMeTotal, currency)}
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40">
          <div className="flex items-center gap-2 mb-2 text-amber-800 dark:text-amber-300">
            <ArrowUpRight className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">{t('i_owe')} (Payables)</span>
          </div>
          <p className="text-2xl font-black text-amber-700 dark:text-amber-400">
            {formatCurrency(iOweTotal, currency)}
          </p>
        </div>
      </div>

      {/* Loans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loans.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white dark:bg-slate-800/90 rounded-3xl border border-slate-200/80 dark:border-slate-700/80">
            <HandCoins className="w-12 h-12 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">No Active Loans or Debts</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4">
              Track money borrowed from or lent to family, colleagues, or institutions.
            </p>
            <button
              type="button"
              onClick={onOpenAddLoan}
              className="px-4 py-2 bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs"
            >
              Add First Loan Record
            </button>
          </div>
        ) : (
          loans.map((loan) => {
            const isOweMe = loan.type === 'owe_me';
            const remaining = Math.max(0, loan.amount - loan.paidAmount);
            const isPaid = loan.status === 'paid' || remaining === 0;

            return (
              <div
                key={loan.id}
                className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                        isOweMe
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                      }`}>
                        {isOweMe ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                            {loan.personName}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            isOweMe ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}>
                            {isOweMe ? 'They Owe Me' : 'I Owe'}
                          </span>
                        </div>
                        {loan.personContact && (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3" />
                            <span>{loan.personContact}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeleteLoan(loan.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {loan.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                      {loan.description}
                    </p>
                  )}

                  <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Total Principal:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(loan.amount, currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Paid so far:</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(loan.paidAmount, currency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Due Date:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {loan.dueDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Remaining</span>
                    <span className="text-base font-black text-slate-900 dark:text-white">
                      {formatCurrency(remaining, currency)}
                    </span>
                  </div>

                  {isPaid ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl">
                      <CheckCircle2 className="w-4 h-4" /> Fully Settled
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onOpenPayment(loan)}
                      className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                    >
                      {isOweMe ? 'Receive Payment' : 'Pay Repayment'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
