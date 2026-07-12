const CACHE_NAME = 'doctivo-cache-v1';
const urlsToCache = [
  '/',
  '/home',
  '/manifest.json',
  '/562c71b5-1be4-415a-94dc-002e1889eb7c-8.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});