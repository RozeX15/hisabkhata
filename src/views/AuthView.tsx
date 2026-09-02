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
  const { login, loginWithGoogle, register, loading, error, clearError } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setFormError(null);
    clearError();
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      onSuccess();
    } catch (err: any) {
      if (err.message) {
        setFormError(err.message);
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    clearError();

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setFormError('Please enter both email and password');
      return;
    }

    try {
      if (mode === 'login') {
        await login(cleanEmail, password);
      } else {
        if (!name.trim()) {
          setFormError('Please provide your full name');
          return;
        }
        if (password.length < 6) {
          setFormError('Password must be at least 6 characters');
          return;
        }
        await register(name.trim(), cleanEmail, password);
      }
      onSuccess();
    } catch (err: any) {
      setFormError(err.message || 'Authentication failed. Please check your credentials.');
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
              className={`py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
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
              className={`py-2.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                mode === 'register' ? 'bg-teal-700 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {(formError || error) && (
            <div className="p-3.5 mb-4 text-xs font-semibold text-red-300 bg-red-950/60 rounded-xl border border-red-900/60 leading-relaxed">
              {formError || error}
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            id="auth-google-signin-btn"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 shadow-md transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 mb-5"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            )}
            <span>{mode === 'login' ? 'Continue with Google' : 'Sign up with Google'}</span>
          </button>

          <div className="relative flex items-center justify-center mb-5">
            <div className="border-t border-slate-700 w-full" />
            <span className="bg-slate-800/90 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              or with email
            </span>
            <div className="border-t border-slate-700 w-full" />
          </div>

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
                    placeholder="Enter your name"
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
                  placeholder="name@example.com"
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
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-teal-900/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Account' : 'Create Account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Mode toggle helper text */}
          <div className="mt-6 text-center text-xs text-slate-400">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    clearError();
                    setFormError(null);
                  }}
                  className="text-teal-400 font-bold hover:underline cursor-pointer"
                >
                  Create one now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    clearError();
                    setFormError(null);
                  }}
                  className="text-teal-400 font-bold hover:underline cursor-pointer"
                >
                  Sign in here
                </button>
              </p>
            )}
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
