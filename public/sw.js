self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only intercept http/https requests to avoid chrome-extension:// or other protocols throwing errors
  if (event.request.url.startsWith('http')) {
    event.respondWith(
      fetch(event.request).catch((err) => {
        console.warn('Service worker fetch failed:', err);
        // Return a custom network error response instead of throwing uncaught rejection
        return new Response('Network error', { status: 480, statusText: 'Network Error' });
      })
    );
  }
});