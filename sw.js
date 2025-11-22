self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => e.waitUntil(clients.claim()));

self.addEventListener("fetch", (event) => {
    // This is a "pass-through" strategy. 
    // It satisfies the PWA requirement without caching anything yet.
    event.respondWith(fetch(event.request));
});
