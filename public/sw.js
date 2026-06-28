// Basic Service Worker for DOCTIVO PWA
const CACHE_NAME = 'doctivo-cache-v1';
const urlsToCache = [
  '/',
  '/home',
  '/manifest.json',
  '/562ca6c0e52711681283626.png',
  '/562ca6c0e52b21681283626.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});