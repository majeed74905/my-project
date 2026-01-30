
// Service Worker for Zara AI - Offline Capable
const CACHE_NAME = 'zara-ai-offline-v2';

// Files to cache immediately
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  // Assuming the build system/server serves this at this path based on index.tsx import
  './styles/themes.css' 
];

// External domains to cache (CDNs for React, Tailwind, Fonts, Icons)
const EXTERNAL_DOMAINS = [
  'cdn.tailwindcss.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'aistudiocdn.com',
  'unpkg.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching app shell');
      // We use addAll but catch errors so one missing file doesn't break the whole install
      return cache.addAll(PRECACHE_URLS).catch(err => {
          console.warn('Pre-caching failed for some URLs', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isExternal = EXTERNAL_DOMAINS.some(domain => url.hostname.includes(domain));
  const isLocal = url.origin === self.location.origin;

  // Strategy: Cache First, falling back to Network
  if (isExternal || isLocal) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .then((networkResponse) => {
            // Check if valid response
            if (!networkResponse || networkResponse.status !== 200 || (networkResponse.type !== 'basic' && networkResponse.type !== 'cors')) {
              return networkResponse;
            }

            // Clone and cache
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return networkResponse;
          })
          .catch((err) => {
            console.error('Fetch failed:', err);
            // Offline fallback for navigation requests (SPA)
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }
          });
      })
    );
  }
});
