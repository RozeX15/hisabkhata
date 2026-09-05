import React, { useState, useMemo } from 'react';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { LanguageSelector } from '../components/LanguageSelector';
import { AppLogo } from '../components/AppLogo';
import { safeStorage } from '../lib/storage';
import { isPhoneNumber, normalizeBDPhone } from '../lib/accountPersistence';
import {
  Lock,
  Mail,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Zap,
  Loader2,
  Eye,
  EyeOff,
  Phone,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  KeyRound,
  RefreshCw
} from 'lucide-react';

interface AuthViewProps {
  onSuccess: (user?: any) => void;
  onBackToLanding?: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess, onBackToLanding }) => {
  const { t } = useI18n();
  const {
    login,
    loginWithGoogle,
    register,
    loginSultanAdmin,
    loading,
    error,
    clearError
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(() => safeStorage.getItem('hk_remembered_identifier') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showDemoLogins, setShowDemoLogins] = useState(false);

  // Dynamic identifier type detection for refined UX
  const identifierType = useMemo(() => {
    const clean = email.trim();
    if (!clean) return null;
    if (clean.includes('@')) return 'email';
    const digits = clean.replace(/\D/g, '');
    if (digits.length >= 7 || clean.startsWith('01') || clean.startsWith('+880') || clean.startsWith('880')) {
      return 'phone';
    }
    return 'generic';
  }, [email]);

  // Password strength calculation for register mode
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: 'bg-slate-700' };
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500', text: 'text-red-400' };
    if (score <= 3) return { score: 2, label: 'Good', color: 'bg-amber-500', text: 'text-amber-400' };
    return { score: 3, label: 'Strong', color: 'bg-emerald-500', text: 'text-emerald-400' };
  }, [password]);

  const formatErrorMessage = (errValue: any): string | null => {
    if (!errValue) return null;
    if (typeof errValue === 'string') {
      if (errValue === '[object Object]' || errValue.includes('[object Object]')) {
        return 'Authentication failed. Please check your credentials or network connection.';
      }
      return errValue;
    }
    if (typeof errValue === 'object') {
      if (errValue.message && typeof errValue.message === 'string' && errValue.message !== '[object Object]') {
        return errValue.message;
      }
      if (errValue.error && typeof errValue.error === 'string') {
        return errValue.error;
      }
      try {
        const str = JSON.stringify(errValue);
        return str !== '{}' ? str : 'Authentication error occurred. Please try again.';
      } catch {
        return 'Authentication error occurred. Please try again.';
      }
    }
    return String(errValue);
  };

  const activeError = formatErrorMessage(formError) || formatErrorMessage(error);

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

    const cleanIdentifier = email.trim();
    if (!cleanIdentifier || !password) {
      setFormError('Please enter your email or mobile number and password');
      return;
    }

    try {
      if (mode === 'login') {
        const loggedIn = await login(cleanIdentifier, password);
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
        const registered = await register(name.trim(), cleanIdentifier, password);
        onSuccess(registered);
      }
    } catch (err: any) {
      setFormError(err.message || 'Authentication failed. Please check your credentials.');
    }
  };

  const handleQuickFill = (identifier: string, samplePass?: string) => {
    setEmail(identifier);
    if (samplePass) setPassword(samplePass);
    clearError();
    setFormError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-slate-900/60 rounded-full blur-2xl pointer-events-none" />

      {/* Top Navbar */}
      <div className="relative z-10 max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AppLogo variant="full" size="md" subtitle="Smart Global Financial SaaS" isDarkBg={true} />
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
      <div className="relative z-10 max-w-md w-full mx-auto my-6">
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Bank-Grade Cloud Sync</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {mode === 'login' ? 'Sign In to Account' : 'Create Free Account'}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {mode === 'login'
                ? 'Access your wallets, transactions, and live financial ledger'
                : 'Zero setup fee. Track income, expenses, loans & savings in minutes'}
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-slate-950/80 rounded-2xl mb-5 border border-slate-800/80">
            <button
              id="auth-tab-login"
              type="button"
              onClick={() => {
                setMode('login');
                clearError();
                setFormError(null);
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'login'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              id="auth-tab-register"
              type="button"
              onClick={() => {
                setMode('register');
                clearError();
                setFormError(null);
              }}
              className={`py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                mode === 'register'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sign Up</span>
            </button>
          </div>

          {/* Error Message with Contextual Recovery Action */}
          {activeError && (
            <div className="p-4 mb-5 text-xs font-medium text-red-200 bg-red-950/60 rounded-2xl border border-red-800/60 leading-relaxed shadow-sm">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p>{activeError}</p>
                  {/* Contextual recovery button */}
                  {mode === 'login' &&
                    (activeError.includes('No account found') ||
                      activeError.includes('Sign Up') ||
                      activeError.includes('not found')) && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('register');
                          clearError();
                          setFormError(null);
                        }}
                        className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Click here to Sign Up with this ID</span>
                      </button>
                    )}
                  {mode === 'register' && activeError.includes('already exists') && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('login');
                        clearError();
                        setFormError(null);
                      }}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs rounded-lg transition cursor-pointer"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Click here to Sign In instead</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Google Sign-In */}
          <button
            id="auth-google-signin-btn"
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 shadow-md transition flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 mb-5 active:scale-[0.99]"
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
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              or with email / mobile number
            </span>
            <div className="border-t border-slate-800 w-full" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="auth-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sultan Mahmud"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition placeholder:text-slate-500"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Email or Mobile Number
                </label>
                {/* Dynamic badge */}
                {identifierType === 'phone' && (
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>BD Mobile</span>
                  </span>
                )}
                {identifierType === 'email' && (
                  <span className="text-[11px] font-semibold text-teal-400 flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span>Email Address</span>
                  </span>
                )}
              </div>
              <div className="relative">
                {identifierType === 'phone' ? (
                  <Phone className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
                ) : (
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                )}
                <input
                  id="auth-email-input"
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@gmail.com or 017xxxxxxxx"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition placeholder:text-slate-500"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                <span>
                  {mode === 'register'
                    ? 'Use your Gmail/Email or BD mobile number (e.g. 01712345678)'
                    : 'Works with both registered email & mobile number'}
                </span>
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
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
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-700 bg-slate-950 text-white text-sm font-medium focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition placeholder:text-slate-500"
                  required
                />
              </div>

              {/* Password strength meter in Register mode */}
              {mode === 'register' && password && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">Strength:</span>
                    <span className={`font-bold ${passwordStrength.text}`}>{passwordStrength.label}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 h-1.5">
                    <div className={`h-full rounded-full transition-all ${passwordStrength.score >= 1 ? passwordStrength.color : 'bg-slate-800'}`} />
                    <div className={`h-full rounded-full transition-all ${passwordStrength.score >= 2 ? passwordStrength.color : 'bg-slate-800'}`} />
                    <div className={`h-full rounded-full transition-all ${passwordStrength.score >= 3 ? passwordStrength.color : 'bg-slate-800'}`} />
                  </div>
                </div>
              )}
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-teal-950/50 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-4 active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Account...</span>
                </>
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
                Don't have an account yet?{' '}
                <button
                  id="auth-switch-to-register-btn"
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
                  id="auth-switch-to-login-btn"
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

          {/* Quick Demo Credentials Accordion */}
          <div className="mt-6 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={() => setShowDemoLogins(!showDemoLogins)}
              className="w-full text-center text-[11px] font-semibold text-slate-400 hover:text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3 h-3 text-amber-400" />
              <span>{showDemoLogins ? 'Hide Demo / Test Credentials' : 'Quick Test Accounts (Click to Fill)'}</span>
            </button>

            {showDemoLogins && (
              <div className="mt-3 p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">Sultan (Owner Admin)</p>
                    <p className="text-[10px] text-slate-400">sultanitbangladesh@gmail.com</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('sultanitbangladesh@gmail.com', 'admin123')}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg font-bold text-[11px] cursor-pointer"
                  >
                    Fill Admin
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 max-w-6xl w-full mx-auto text-center text-xs text-slate-500">
        <p>© 2026 Hishab Khata SaaS. Cloud-Synced & Encrypted with Bcrypt + AES-256.</p>
      </div>
    </div>
  );
};
