// Hishab Khata PWA Service Worker - v3.0.0
const CACHE_NAME = 'hishab-khata-v3.0.0';

// Only pre-cache static, immutable brand assets - NEVER pre-cache root HTML cache-first
const STATIC_ASSETS = [
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS).catch((err) => {
          console.warn('[SW] Pre-caching non-critical static assets failed:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => {
        // Delete all older caches immediately to purge stale index.html and obsolete JS chunks
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              console.log('[SW] Purging old cache:', key);
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Skip API requests from service worker caching
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/.netlify/')) {
    return;
  }

  const isNavigation =
    event.request.mode === 'navigate' ||
    (event.request.headers.get('accept') &&
      event.request.headers.get('accept').includes('text/html'));

  // 1. Navigation requests (HTML pages): ALWAYS NETWORK-FIRST
  // This guarantees users always get the latest deployment bundle and never a stale, white-screen HTML
  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(async () => {
          // Offline fallback: attempt to return cached HTML if offline
          const cached = await caches.match(event.request);
          if (cached) return cached;
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Hishab Khata - Offline</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center;"><h2>You are offline</h2><p>Please check your internet connection and reload Hishab Khata.</p><button onclick="window.location.reload()" style="padding:10px 20px;background:#0D9488;color:#fff;border:none;border-radius:8px;cursor:pointer;font-weight:bold;">Try Again</button></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // 2. Static Assets (JS, CSS, Images, Fonts)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache for next time (stale-while-revalidate for assets)
        fetch(event.request)
          .then((freshResponse) => {
            if (
              freshResponse &&
              freshResponse.status === 200 &&
              !freshResponse.headers.get('content-type')?.includes('text/html')
            ) {
              const freshClone = freshResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, freshClone);
              });
            }
          })
          .catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        // Only cache valid asset responses, and NEVER cache HTML responses masquerading as JS/CSS
        const contentType = networkResponse.headers.get('content-type') || '';
        const isJsOrCss = url.pathname.endsWith('.js') || url.pathname.endsWith('.css');
        if (isJsOrCss && contentType.includes('text/html')) {
          // This is a 404 redirected to index.html - do NOT cache it!
          return networkResponse;
        }

        if (
          networkResponse &&
          networkResponse.status === 200 &&
          (url.pathname.startsWith('/assets/') ||
            url.pathname.endsWith('.png') ||
            url.pathname.endsWith('.svg') ||
            url.pathname.endsWith('.woff2') ||
            url.pathname.endsWith('.json'))
        ) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});

// Support manual message triggers from client (e.g. cache purge or skip waiting)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'PURGE_CACHE') {
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => caches.delete(k)));
    });
  }
});
