
/**
 * DOCTIVO Service Worker - v2
 * Incremented version to force cache update for new logo assets.
 */

const CACHE_NAME = 'doctivo-cache-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json?v=2',
  '/icons/icon-192x192.png?v=2',
  '/icons/icon-512x512.png?v=2'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
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
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
