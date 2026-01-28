const CACHE_NAME = "dompetku-v1";

self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames
                    .filter((name) => name !== CACHE_NAME)
                    .map((name) => caches.delete(name))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);

    // Ignore non-http requests (e.g. chrome-extension://)
    if (!url.protocol.startsWith("http")) return;

    // 1. Stale-while-revalidate for Next.js static assets and other static files
    // (We assume built files in _next/static are immutable-ish, but let's be safe)
    if (
        url.pathname.startsWith("/_next/static") ||
        url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico)$/)
    ) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        if (networkResponse.ok) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    });
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }

    // 2. Network-first for HTML pages (Navigation) allows offline usage if visited before
    // For strict Offline-First, we might want Cache-First for App Shell, but Network-First is safer for updates.
    if (event.request.mode === "navigate") {
        event.respondWith(
            fetch(event.request)
                .then((networkResponse) => {
                    return caches.open(CACHE_NAME).then((cache) => {
                        // Determine if valid response
                        if (networkResponse.ok) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    });
                })
                .catch(() => {
                    return caches.match(event.request)
                        .then(res => {
                            if (res) return res;
                            // Fallback to offline page if we had one, or just '/' potentially
                            return caches.match("/");
                        });
                })
        );
        return;
    }

    // Default: Network only
});
