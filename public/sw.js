const CACHE_NAME = 'doctivo-v1';
const ASSETS = [
  '/',
  '/manifest.json',
  '/562c71b5-1be4-415a-94dc-002e1889eb7c-0.jpg',
  '/562c71b5-1be4-415a-94dc-002e1889eb7c-1.jpg',
  '/562c71b5-1be4-415a-94dc-002e1889eb7c-2.jpg',
  '/562c71b5-1be4-415a-94dc-002e1889eb7c-3.jpg',
  '/562c71b5-1be4-415a-94dc-002e1889eb7c-4.jpg',
  '/562c71b5-1be4-415a-94dc-002e1889eb7c-5.jpg',
  '/562c71b5-1be4-415a-94dc-002e1889eb7c-6.jpg',
  '/562c71b5-1be4-415a-94dc-002e1889eb7c-7.jpg',
  '/562c71b5-1be4-415a-94dc-002e1889eb7c-8.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});