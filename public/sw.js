self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Pass-through fetch for PWA installability requirements
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request));
  }
});