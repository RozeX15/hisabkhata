import React, { useState } from 'react';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { LanguageSelector } from '../components/LanguageSelector';
import { AppLogo } from '../components/AppLogo';
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
  Loader2,
  Eye,
  EyeOff,
  Crown,
  KeyRound
} from 'lucide-react';

interface AuthViewProps {
  onSuccess: (user?: any) => void;
  onBackToLanding?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess, onBackToLanding }) => {
  const { t } = useI18n();
  const { login, loginWithGoogle, register, loading, error, clearError } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleQuickLogin = async (fillEmail: string, fillPass: string) => {
    setEmail(fillEmail);
    setPassword(fillPass);
    setFormError(null);
    clearError();
    try {
      const loggedIn = await login(fillEmail, fillPass);
      onSuccess(loggedIn);
    } catch (err: any) {
      setFormError(err.message || 'Login failed. Please check credentials.');
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    clearError();
    setGoogleLoading(true);
    try {
      const loggedIn = await loginWithGoogle();
      onSuccess(loggedIn);
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
        const loggedIn = await login(cleanEmail, password);
        onSuccess(loggedIn);
      } else {
        if (!name.trim()) {
          setFormError('Please provide your full name');
          return;
        }
        if (password.length < 6) {
          setFormError('Password must be at least 6 characters');
          return;
        }
        const registered = await register(name.trim(), cleanEmail, password);
        onSuccess(registered);
      }
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
          <AppLogo variant="full" size="md" subtitle="Smart Global Financial SaaS" />
        </div>

        <div className="flex items-center gap-3">
          {onBackToLanding && (
            <button
              type="button"
              onClick={onBackToLanding}
              className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              Back to Home
            </button>
          )}
          <LanguageSelector />
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="relative z-10 max-w-md w-full mx-auto my-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-800/95 border border-slate-700 shadow-2xl backdrop-blur-md">
          {/* Header */}
          <div className="text-center mb-5">
            <h2 className="text-2xl font-black text-white tracking-tight">
              {mode === 'login' ? 'Sign In to Hishab Khata' : 'Create Free Account'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {mode === 'login'
                ? 'Sign in to access your multi-wallet financial ledger'
                : 'Start tracking cashflows, debts, and savings goals in minutes'}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900/80 rounded-xl mb-5">
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

          {/* Dedicated SuperAdmin 1-Click Access Card */}
          {mode === 'login' && (
            <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-slate-900/90 to-teal-500/15 border-2 border-amber-500/40 shadow-xl">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-300">
                    <Crown className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider block">
                      Owner &amp; SuperAdmin Login
                    </span>
                    <span className="text-xs font-bold text-white">
                      Sultan (Owner Admin)
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  SuperAdmin
                </span>
              </div>

              <div className="text-[11px] text-slate-300 bg-slate-950/70 p-2 rounded-xl border border-slate-700/60 mb-2.5 space-y-0.5 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-teal-300 font-bold">sultanitbangladesh@gmail.com</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Password:</span>
                  <span className="text-amber-300 font-bold">admin123 <span className="text-slate-500 font-normal">or</span> password123</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  id="quick-admin-login-direct-btn"
                  type="button"
                  onClick={() => handleQuickLogin('sultanitbangladesh@gmail.com', 'admin123')}
                  disabled={loading}
                  className="w-full py-2.5 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>1-Click Admin Sign In</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail('sultanitbangladesh@gmail.com');
                    setPassword('admin123');
                    setFormError(null);
                  }}
                  className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-850 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 hover:border-slate-500 transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5 text-teal-400" />
                  <span>Fill In Fields</span>
                </button>
              </div>
            </div>
          )}

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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showPassword ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  id="auth-password-input"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-900 text-white text-sm font-medium focus:ring-2 focus:ring-teal-500 outline-none"
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

          {/* 1-Click Fast Sign-In Presets */}
          {mode === 'login' && (
            <div className="mt-5 pt-4 border-t border-slate-700/70">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 text-center flex items-center justify-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-teal-400" />
                <span>Instant 1-Click Access</span>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('sultanitbangladesh@gmail.com', 'admin123')}
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-teal-500/40 hover:border-teal-400 text-left transition flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block group-hover:text-teal-300">Sultan (Admin)</span>
                      <span className="text-[10px] text-slate-400 font-mono">sultanitbangladesh@...</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-950 text-teal-300 font-bold border border-teal-800">
                    Log in
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickLogin('user@hishabkhata.com', 'password123')}
                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 hover:border-slate-500 text-left transition flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-teal-400 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-white block group-hover:text-teal-300">User Account</span>
                      <span className="text-[10px] text-slate-400 font-mono">user@hishabkhata...</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-bold border border-slate-700">
                    Log in
                  </span>
                </button>
              </div>
            </div>
          )}

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
