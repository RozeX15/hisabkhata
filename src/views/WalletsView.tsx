import React from 'react';
import { useI18n } from '../lib/i18n';
import { Wallet } from '../types';
import { formatCurrency } from '../lib/currencies';
import {
  Wallet as WalletIcon,
  Building2,
  CreditCard,
  Smartphone,
  PiggyBank,
  Plus,
  ArrowLeftRight,
  Edit2,
  Trash2,
  Star
} from 'lucide-react';

interface WalletsViewProps {
  wallets: Wallet[];
  currency: string;
  onOpenAddWallet: () => void;
  onEditWallet: (w: Wallet) => void;
  onDeleteWallet: (id: string) => Promise<void>;
  onOpenTransfer: () => void;
}

export const WalletsView: React.FC<WalletsViewProps> = ({
  wallets,
  currency,
  onOpenAddWallet,
  onEditWallet,
  onDeleteWallet,
  onOpenTransfer,
}) => {
  const { t } = useI18n();
  const totalBalance = wallets.reduce((s, w) => s + w.balance, 0);

  const getWalletIcon = (type: string) => {
    switch (type) {
      case 'bank': return Building2;
      case 'card': return CreditCard;
      case 'bkash':
      case 'nagad': return Smartphone;
      case 'savings': return PiggyBank;
      default: return WalletIcon;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {t('nav_wallets')} & Accounts
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Total Aggregate Liquidity: <strong className="text-teal-700 dark:text-teal-400">{formatCurrency(totalBalance, currency)}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenTransfer}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <ArrowLeftRight className="w-4 h-4 text-blue-500" />
            <span>Transfer Funds</span>
          </button>

          <button
            id="add-wallet-btn"
            type="button"
            onClick={onOpenAddWallet}
            className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-md shadow-teal-700/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{t('add_wallet')}</span>
          </button>
        </div>
      </div>

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wallets.map((wallet) => {
          const IconComp = getWalletIcon(wallet.type);
          return (
            <div
              key={wallet.id}
              className="relative p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md transition-shadow overflow-hidden flex flex-col justify-between"
            >
              {/* Accent top stripe */}
              <div
                className="absolute top-0 left-0 right-0 h-2"
                style={{ backgroundColor: wallet.color || '#0F766E' }}
              />

              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
                      style={{ backgroundColor: wallet.color || '#0F766E' }}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {wallet.name}
                        </h3>
                        {wallet.isDefault && (
                          <span title="Default Primary Wallet">
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 capitalize">
                        {wallet.type} Account
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEditWallet(wallet)}
                      className="p-1.5 text-slate-400 hover:text-teal-600 dark:hover:text-teal-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {wallets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteWallet(wallet.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {wallet.accountNumber && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mb-2">
                    {wallet.accountNumber}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Available Balance
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  {formatCurrency(wallet.balance, wallet.currency || currency)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
