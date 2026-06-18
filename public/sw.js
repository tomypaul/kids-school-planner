// Minimal service worker — required for PWA installation and Web Share Target
// Passes all requests straight through to the network (no caching needed).
self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
