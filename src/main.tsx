import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Global recovery handler for stale module chunks / unexpected token errors
if (typeof window !== 'undefined') {
  const autoRecoverStaleAssets = () => {
    const key = 'hk_chunk_reload_lock';
    const hasAttempted = sessionStorage.getItem(key);
    if (!hasAttempted) {
      sessionStorage.setItem(key, String(Date.now()));
      // Unregister service workers and clear caches
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((regs) => {
          for (const reg of regs) {
            reg.unregister();
          }
        });
      }
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((k) => caches.delete(k));
        });
      }
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  };

  window.addEventListener('error', (event) => {
    const msg = (event.message || '').toLowerCase();
    if (
      msg.includes('dynamically imported module') ||
      msg.includes('loading chunk') ||
      msg.includes('unexpected token') ||
      msg.includes('failed to fetch')
    ) {
      console.warn('[Hishab Khata] Detected stale asset or script error, recovering:', msg);
      autoRecoverStaleAssets();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = String(event.reason || '').toLowerCase();
    if (
      reason.includes('dynamically imported module') ||
      reason.includes('loading chunk') ||
      reason.includes('failed to fetch')
    ) {
      console.warn('[Hishab Khata] Detected unhandled promise rejection with chunk error:', reason);
      autoRecoverStaleAssets();
    }
  });
}

// Register PWA Service Worker with auto-update
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        // Check for updates
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content is available; prompt worker to activate
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          }
        });
      })
      .catch((err) => {
        console.warn('Service Worker registration skipped/failed:', err);
      });
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}
