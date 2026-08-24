// Service Worker for Intrihub PWA
const CACHE_NAME = "intrihub-cache-v1";

const STATIC_ASSETS = [
  "/",
  "/favicon.ico",
  "/icon-192.png",
  "/icon-512.png",
  "/logo/intri-web-logo.png",
  "/site.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
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
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  // Don't intercept API routes or next auth
  const url = new URL(event.request.url);
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/_next/")) {
    return;
  }

  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request).then((res) => {
        if (res) return res;
        if (event.request.headers.get("accept")?.includes("text/html")) {
          return caches.match("/");
        }
      });
    })
  );
});
