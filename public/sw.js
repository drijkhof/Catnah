/*
 * The service worker: installable, playable offline, and **always current**.
 *
 * The whole difficulty of a service worker is the second and third of those
 * fighting each other. A worker that serves from its cache first makes a fast,
 * offline-capable app that shows people yesterday's build for ever. This one
 * takes the other side of that trade everywhere it matters.
 *
 * - **The page itself is fetched from the network first.** A cached copy is
 *   only ever a fallback for being offline, so a deploy is live the next time
 *   the game is opened with a connection.
 * - **Built assets are cache-first**, and safely so: Vite puts a content hash
 *   in every filename, so a changed file is a *different* file. A hit can never
 *   be stale.
 * - **The worker replaces itself immediately.** `skipWaiting` and `clients.claim`
 *   mean a new build does not sit waiting for every tab to close first, which is
 *   the usual reason an update appears days later.
 *
 * Bump CACHE when the strategy changes; the version is what sweeps the old
 * caches away on activate.
 */

const CACHE = 'catnah-v1';

/** Enough to open the game with no connection at all. */
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // Best effort: one asset missing must not stop the worker installing.
      .then((cache) => cache.addAll(SHELL).catch(() => undefined))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

/** Puts a copy in the cache without making the response wait for it. */
function remember(request, response) {
  if (response && response.ok && request.method === 'GET') {
    const copy = response.clone();

    void caches.open(CACHE).then((cache) => cache.put(request, copy));
  }

  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  // The page: network first. This is the one that decides whether an update is
  // ever seen, so the cache is a fallback and never a shortcut.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => remember(request, response))
        .catch(() => caches.match(request).then((hit) => hit || caches.match('./index.html'))),
    );
    return;
  }

  // Everything else: cache first, because everything else has a hash in its
  // name. A miss goes to the network and is remembered for next time.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request)
          .then((response) => remember(request, response))
          .catch(() => hit),
    ),
  );
});
