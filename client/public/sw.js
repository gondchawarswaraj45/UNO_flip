/**
 * UNO Flip PWA Service Worker — Multithreaded Background Worker.
 *
 * Provides:
 * - Instant offline startup for local Pass & Play & solo games.
 * - Stale-while-revalidate caching for app shell & visual assets.
 * - Network-first for Socket.IO multiplayer APIs.
 */

const CACHE_NAME = 'uno-flip-v1.2.0';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// Install Event: Precaching App Shell in background thread
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
});

// Activate Event: Clear stale cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Stale-While-Revalidate for app assets, bypass for WebSockets/APIs
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass socket.io and real-time backend API endpoints
  if (url.pathname.startsWith('/socket.io') || url.pathname.startsWith('/api/')) {
    return;
  }

  // Handle GET requests with Stale-While-Revalidate
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || fetchPromise;
      })
    );
  }
});
