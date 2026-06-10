/* ═══════════════════════════════════════════════
   Kanji Quest – Service Worker
   Caches core assets so the game works offline
   ═══════════════════════════════════════════════ */

const CACHE = 'kanji-quest-v1';

const CORE_ASSETS = [
  '/kanji-quest/',
  '/kanji-quest/index.html',
  '/kanji-quest/manifest.json',
  '/kanji-quest/favicon.png',
  '/kanji-quest/apple-touch-icon.png',
  '/kanji-quest/icon-192.png',
  '/kanji-quest/icon-512.png',
  '/kanji-quest/logo.png',
  '/kanji-quest/lumi.png',
  '/kanji-quest/lumi_1star.png',
  '/kanji-quest/lumi_2stars.png',
  '/kanji-quest/lumi_3stars.png',
  '/kanji-quest/heroes.png',
  '/kanji-quest/Lumi_Battle.mp3',
];

/* ── Install: cache all core assets ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

/* ── Activate: clean up old caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* ── Fetch: cache-first for core assets, network-first for everything else ── */
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Only handle same-origin and GitHub Pages requests
  if (!url.hostname.includes('herosproof.github.io') &&
      !url.hostname.includes('localhost') &&
      !url.hostname.includes('127.0.0.1')) {
    return; // Let Google Fonts, etc. go straight to network
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache successful GET responses for game assets
        if (
          event.request.method === 'GET' &&
          response.ok &&
          (url.pathname.startsWith('/kanji-quest/'))
        ) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback: serve cached index for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/kanji-quest/');
        }
      });
    })
  );
});
