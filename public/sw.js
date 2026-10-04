// Service Worker for Intrihub PWA (First-Party Hosting Hardened)
const CACHE_VERSION = "intrihub-v2-firstparty";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const MAX_IMAGE_ENTRIES = 200;

const STATIC_ASSETS = [
  "/",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
  "/logo/intri-web-logo.png",
  "/images/placeholder-product.svg",
  "/images/banners/banner-slide-1-1400.webp",
  "/site.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!key.startsWith(CACHE_VERSION)) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Helper: Trim image cache to max entries
async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxEntries) {
    await cache.delete(keys[0]);
    trimCache(cacheName, maxEntries);
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Do NOT intercept cross-origin third-party requests (Google Translate, Google avatars, Razorpay, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // 1. First-Party Images: Stale-While-Revalidate with Entry Cap
  if (url.pathname.startsWith("/images/") || url.pathname.startsWith("/logo/") || url.pathname.startsWith("/api/uploads/")) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        const networkFetchPromise = fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
              trimCache(IMAGE_CACHE, MAX_IMAGE_ENTRIES);
            }
            return networkResponse;
          })
          .catch(() => cachedResponse);

        return cachedResponse || networkFetchPromise;
      })
    );
    return;
  }

  // 2. Do not intercept API routes, static Next.js internals, or fonts/CSS/scripts/preloads
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/_next/") ||
    event.request.destination === "font" ||
    event.request.destination === "style" ||
    event.request.destination === "script"
  ) {
    return;
  }

  // 3. Navigation requests (HTML pages): Network first with offline fallback
  if (event.request.mode === "navigate" || event.request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match("/").then((res) => res || Response.error());
      })
    );
    return;
  }
});
