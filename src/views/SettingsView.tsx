import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { LanguageSelector } from '../components/LanguageSelector';
import { CurrencySelector } from '../components/CurrencySelector';
import { api } from '../lib/api';
import {
  User as UserIcon,
  Globe,
  DollarSign,
  Moon,
  Sun,
  Shield,
  Crown,
  KeyRound,
  RotateCcw,
  Check,
  AlertTriangle,
  Loader2,
  Download,
  Smartphone,
  Laptop,
  Palette
} from 'lucide-react';

interface SettingsViewProps {
  onOpenUpgrade: () => void;
  onDataReset: () => Promise<void>;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  onOpenDownloadApp?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onOpenUpgrade,
  onDataReset,
  isDarkMode = false,
  onToggleDarkMode,
  onOpenDownloadApp,
}) => {
  const { t, isRTL } = useI18n();
  const { user, updateUserProfile, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(false);
    try {
      await updateUserProfile({ name: name.trim() });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      setPwError('New password must be at least 6 characters');
      return;
    }

    setPwLoading(true);
    setPwError(null);
    setPwSuccess(false);
    try {
      await api.changePassword(oldPassword, newPassword);
      setPwSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setTimeout(() => setPwSuccess(false), 4000);
    } catch (err: any) {
      setPwError(err.message || 'Failed to update password');
    } finally {
      setPwLoading(false);
    }
  };

  const handleResetData = async () => {
    setResetLoading(true);
    try {
      await onDataReset();
      setResetConfirm(false);
    } catch (err: any) {
      console.error(err);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
        <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
          {t('nav_settings')} & Account Preferences
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Manage your identity, security, global currencies, and localization rules.
        </p>
      </div>

      {/* Plan & Subscription Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-teal-800 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base sm:text-lg">
                Current Plan: <span className="uppercase text-amber-300">{user?.plan || 'Free'}</span>
              </h3>
              {user?.plan === 'pro' && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-extrabold">
                  Active Pro
                </span>
              )}
            </div>
            <p className="text-xs text-teal-100 mt-0.5">
              {user?.plan === 'pro'
                ? 'Enjoy unlimited wallets, unlimited transactions, PDF downloads, and Gemini AI Coach.'
                : 'Upgrade to PRO for unlimited accounts, automated AI advice, and tax-ready exports.'}
            </p>
          </div>
        </div>

        {user?.plan !== 'pro' && (
          <button
            id="settings-upgrade-btn"
            type="button"
            onClick={onOpenUpgrade}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition shrink-0 cursor-pointer"
          >
            Upgrade to PRO
          </button>
        )}
      </div>

      {/* Profile & Security Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Info */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <UserIcon className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Personal Information
            </h3>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-3">
            {profileSuccess && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-1.5 font-bold">
                <Check className="w-4 h-4" /> Profile updated successfully!
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                id="settings-name-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-900/60 text-slate-400 text-sm font-medium cursor-not-allowed"
              />
            </div>

            <button
              id="settings-save-profile-btn"
              type="submit"
              disabled={profileLoading}
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {profileLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Save Profile</span>
            </button>
          </form>
        </div>

        {/* Change Password */}
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <KeyRound className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Change Password
            </h3>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-3">
            {pwError && (
              <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-600 text-xs rounded-xl font-bold">
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-1.5 font-bold">
                <Check className="w-4 h-4" /> Password changed successfully!
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Current Password
              </label>
              <input
                id="settings-old-password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                id="settings-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                required
              />
            </div>

            <button
              id="settings-change-pw-btn"
              type="submit"
              disabled={pwLoading}
              className="px-5 py-2 bg-slate-900 hover:bg-black dark:bg-slate-700 dark:hover:bg-slate-600 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {pwLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Update Password</span>
            </button>
          </form>
        </div>
      </div>

      {/* Global Regional Settings */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white text-sm">
          Localization & Currency Preferences
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Application Language
            </span>
            <LanguageSelector />
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Primary Currency
            </span>
            <CurrencySelector />
          </div>
        </div>
      </div>

      {/* Appearance & Dark Mode Settings */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-teal-600 dark:text-teal-400" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Appearance & Theme Mode
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => {
              if (isDarkMode && onToggleDarkMode) onToggleDarkMode();
            }}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
              !isDarkMode
                ? 'bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Light Mode</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Bright, high-contrast theme</div>
              </div>
            </div>
            {!isDarkMode && <Check className="w-4 h-4 text-teal-600 font-bold" />}
          </button>

          <button
            type="button"
            onClick={() => {
              if (!isDarkMode && onToggleDarkMode) onToggleDarkMode();
            }}
            className={`p-4 rounded-2xl border text-left transition cursor-pointer flex items-center justify-between ${
              isDarkMode
                ? 'bg-teal-950/40 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-950 text-indigo-400 flex items-center justify-center">
                <Moon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">Dark Mode</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Low-light OLED eye comfort</div>
              </div>
            </div>
            {isDarkMode && <Check className="w-4 h-4 text-teal-400 font-bold" />}
          </button>
        </div>
      </div>

      {/* App Download / PWA Installation Card */}
      {onOpenDownloadApp && (
        <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 text-white shadow-xl space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-teal-300">
                <Download className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                    Standalone App
                  </span>
                  <span className="text-xs text-teal-200">Mobile & Desktop PWA</span>
                </div>
                <h3 className="font-extrabold text-base text-white mt-0.5">
                  Download Hishab Khata Application
                </h3>
              </div>
            </div>

            <button
              id="settings-download-app-btn"
              type="button"
              onClick={onOpenDownloadApp}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-400/20 transition cursor-pointer flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download / Install Now</span>
            </button>
          </div>

          <p className="text-xs text-teal-100/90 leading-relaxed">
            Install Hishab Khata directly to your Android, iPhone, or PC/Mac desktop. Enjoy instant offline access, home screen shortcuts, and fast performance without app store installation.
          </p>
        </div>
      )}

      {/* Reset / Demo Data Reset */}
      <div className="p-6 rounded-3xl bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertTriangle className="w-5 h-5" />
          <h3 className="font-bold text-sm">Danger Zone / Data Reset</h3>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300">
          Reset all transaction ledgers, wallets, budgets, and savings records back to clean seed data.
        </p>

        {!resetConfirm ? (
          <button
            id="settings-reset-init-btn"
            type="button"
            onClick={() => setResetConfirm(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Demo Ledger Data</span>
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              id="settings-reset-confirm-btn"
              type="button"
              disabled={resetLoading}
              onClick={handleResetData}
              className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              {resetLoading ? 'Resetting...' : 'Yes, Permanently Reset'}
            </button>
            <button
              type="button"
              onClick={() => setResetConfirm(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
