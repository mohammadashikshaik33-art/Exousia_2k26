// Service Worker for EXOUSIA 2K26 — Safe Static Cache Only
// SECURITY DIRECTIVE: SW caches ONLY safe static app shell resources (HTML, CSS, JS, fonts, images).
// STRICT EXCLUSION: Service worker NEVER caches /api/* routes or authenticated API responses.

const CACHE_NAME = 'exousia-pwa-static-v1';

const STATIC_ALLOWLIST = [
  '/',
  '/pass',
  '/pass.html',
  '/coordinator',
  '/coordinator.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Pre-cache primary app shells safely
      for (const url of STATIC_ALLOWLIST) {
        try {
          await cache.add(url);
        } catch (e) {
          console.warn(`[SW] Pre-cache skipped for ${url}:`, e.message);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Deleting obsolete cache key:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // STRICT RULE 1: Never intercept or cache API requests (/api/*)
  if (url.pathname.startsWith('/api/')) {
    return; // Pass through directly to network
  }

  // STRICT RULE 2: Non-GET requests pass directly to network
  if (req.method !== 'GET') {
    return;
  }

  // Handle static app shell and assets (Stale-While-Revalidate)
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req).then((networkResponse) => {
        // Cache valid static responses only
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(req, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Return cached version if network fails
        return cachedResponse;
      });

      return cachedResponse || fetchPromise;
    })
  );
});
