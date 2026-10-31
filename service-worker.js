// NovelWeaver offline-first cache; all app resources are embedded in index.html.
const CACHE_NAME = 'novelweaver-singlefile-v1.10.0-built-in-help';
const CORE = [
  './',
  './index.html',
  './novelweaver-config.js',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];


const OPTIONAL_FONTS = [
  'https://cdn.jsdelivr.net/gh/antijingoist/opendyslexic@main/compiled/OpenDyslexic-Regular.woff2',
  'https://cdn.jsdelivr.net/gh/antijingoist/opendyslexic@main/compiled/OpenDyslexic-Bold.woff2'
];
async function cacheOptionalFonts(cache) {
  await Promise.allSettled(OPTIONAL_FONTS.map(async url => {
    const request = new Request(url, { mode: 'cors' });
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response);
  }));
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => { await cache.addAll(CORE); await cacheOptionalFonts(cache); })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key.startsWith('novelweaver-') && key !== CACHE_NAME)
        .map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || req.cache === 'no-store' || req.headers.has('Authorization')) return;
  const fontRequest = OPTIONAL_FONTS.includes(req.url);
  if (!fontRequest && new URL(req.url).origin !== self.location.origin) return;
  // Always check for changes to the public configuration while online;
  // fall back to its cached copy when editing without a connection.
  if (req.url === new URL('./novelweaver-config.js', self.registration.scope).href) {
    event.respondWith(
      fetch(new Request(req, { cache: 'no-cache' })).then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
        }
        return response;
      }).catch(() => caches.match(req))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(response => {
      if (response.ok) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy));
      }
      return response;
    }).catch(() => {
      if (req.mode === 'navigate') return caches.match('./index.html');
      return Response.error();
    }))
  );
});
