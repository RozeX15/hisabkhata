import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, AlertTriangle, Home, Sparkles } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Hishab Khata ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleHardReset = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
    } catch {
      // Ignore cache clearing errors
    } finally {
      window.location.href = window.location.origin;
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 sm:p-6 select-none">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-center relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Icon */}
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center mb-5 shadow-lg">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Application Recovery
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto leading-relaxed">
              Hishab Khata encountered an unexpected view state or stale cached bundle. You can cleanly reload the application to restore your session.
            </p>

            {/* Actions */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={this.handleHardReset}
                className="w-full sm:w-auto px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-teal-950/50 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reload & Clear Cache</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null, errorInfo: null });
                  window.location.reload();
                }}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4 text-teal-400" />
                <span>Try Again</span>
              </button>
            </div>

            {/* Diagnostic hint */}
            {this.state.error && (
              <div className="mt-6 p-3 rounded-xl bg-slate-950 border border-slate-800 text-left">
                <p className="text-[11px] font-mono text-slate-400 truncate">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
