const CACHE_NAME = "kya-staff-v2";
const STATIC_ASSETS = ["/", "/documents", "/transactions", "/customers", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Only handle same-origin requests. Let everything cross-origin
  // (Clerk UI, CDNs, third-party APIs) go straight to the network untouched.
  if (url.origin !== self.location.origin) return;

  // Skip API routes and Clerk/auth-related paths.
  if (url.pathname.includes("/api/")) return;
  if (url.pathname.includes("/sign-in")) return;
  if (url.pathname.includes("/account")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => cached || caches.match("/"))
      )
  );
});