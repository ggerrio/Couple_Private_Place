const CACHE_NAME = "gn-universe-cache-v2";
const OFFLINE_URL = "/index.html";

const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/logo/G&N_logo.png",
  "/logo/G&N_logo.svg",
];

// Install event: cache initial assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate event: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-first with cache fallback for HTML, Cache-first for assets
self.addEventListener("fetch", (event) => {
  // Only handle GET requests and exclude Firestore/API/Auth requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip external sync API calls to prevent data sync issues
  if (
    url.hostname.includes("firestore") ||
    url.hostname.includes("googleapis") ||
    url.pathname.includes("/api/") ||
    url.hostname.includes("cloudinary.com")
  ) {
    return;
  }

  // Handle navigate request with Network-First
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseCopy);
          });
          return response;
        })
        .catch(() => {
          return caches.match(OFFLINE_URL) || caches.match(event.request);
        })
    );
  } else {
    // Handle other static assets with Stale-While-Revalidate pattern
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          fetch(event.request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== "basic") {
            return networkResponse;
          }
          const responseCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseCopy);
          });
          return networkResponse;
        });
      })
    );
  }
});
