import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { LanguageSelector } from '../components/LanguageSelector';
import {
  Wallet,
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Zap,
  Globe,
  Loader2
} from 'lucide-react';

interface AuthViewProps {
  onSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const { t } = useI18n();
  const { login, register, loginDemoUser, loginDemoAdmin, loading, error, clearError } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        if (!name.trim()) {
          setFormError('Please provide your name');
          return;
        }
        await register(name.trim(), email, password);
      }
      onSuccess();
    } catch (err: any) {
      setFormError(err.message || 'Authentication failed');
    }
  };

  const handleDemoUser = async () => {
    try {
      await loginDemoUser();
      onSuccess();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  const handleDemoAdmin = async () => {
    try {
      await loginDemoAdmin();
      onSuccess();
    } catch (err: any) {
      setFormError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between text-slate-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <div className="relative z-10 max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-700 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-900/40">
            <Wallet className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h1 className="font-black text-lg tracking-tight text-white flex items-center gap-1.5">
              <span>HISHAB KHATA</span>
              <span className="px-1.5 py-0.2 bg-teal-500/20 text-teal-300 text-[10px] font-extrabold rounded-md">
                PRO
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Smart Global Financial SaaS</p>
          </div>
        </div>

        <LanguageSelector />
      </div>

      {/* Main Authentication Card */}
      <div className="relative z-10 max-w-md w-full mx-auto my-8">
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-800/90 border border-slate-700 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {mode === 'login' ? 'Welcome Back' : 'Create Free Account'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'login'
                ? 'Sign in to access your multi-wallet financial ledger'
                : 'Start tracking cashflows, debts, and savings goals in minutes'}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900/80 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                clearError();
                setFormError(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                mode === 'login' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                clearError();
                setFormError(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                mode === 'register' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {(formError || error) && (
            <div className="p-3 mb-4 text-xs font-semibold text-red-400 bg-red-950/50 rounded-xl border border-red-900/50">
              {formError || error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="auth-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Tahmid Rahman"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="auth-email-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="demo@hishabkhata.io"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="auth-password-input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none"
                  required
                />
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-teal-900/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Dashboard' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 1-Click Instant Demo Logins */}
          <div className="mt-6 pt-6 border-t border-slate-700/80 space-y-2.5">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2">
              Instant 1-Click Testing Access
            </p>

            <button
              id="auth-demo-user-btn"
              type="button"
              onClick={handleDemoUser}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-900 text-slate-200 text-xs font-bold transition flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Demo User (Tahmid Rahman)</span>
              </div>
              <span className="text-[11px] text-teal-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                Log In →
              </span>
            </button>

            <button
              id="auth-demo-admin-btn"
              type="button"
              onClick={handleDemoAdmin}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-700 bg-slate-900/90 hover:bg-slate-900 text-slate-200 text-xs font-bold transition flex items-center justify-between cursor-pointer group"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>Demo SuperAdmin (Rafiqul Islam)</span>
              </div>
              <span className="text-[11px] text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                Log In →
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 max-w-6xl w-full mx-auto text-center text-xs text-slate-500">
        <p>© 2026 Hishab Khata SaaS. Bank-grade 256-bit encryption & localized financial intelligence.</p>
      </div>
    </div>
  );
};
