// Service Worker for My Music - enables true offline support
// This file must be updated (version bumped) whenever youtube.html changes,
// so the app knows to fetch the new version once, then cache it again offline.

const CACHE_NAME = 'my-music-v1';
const FILES_TO_CACHE = [
  './youtube.html'
];

// Install: cache the app shell
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: serve from cache first, fall back to network, and update cache when online
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Update the cache in the background if we got a fresh copy
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => cachedResponse); // offline: fall back to cache

      // Serve cached version immediately if we have it, otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
