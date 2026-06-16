const CACHE = 'foglio-camere-v9';
const ASSETS = [
  './',
  './index.html',
  './icon-192.png?v=2',
  './icon-512.png?v=2',
  './apple-touch-icon.png?v=2',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll())
      .then(clientsList => {
        // ricarica automaticamente tutte le finestre/app aperte sulla nuova versione
        clientsList.forEach(client => client.navigate(client.url));
      })
  );
});

// network-first per HTML, manifest e icone: prende sempre l'ultima versione
// quando online, usa la cache solo come fallback offline.
// Questo forza l'aggiornamento del logo anche su app già installate.
self.addEventListener('fetch', e => {
  const url = e.request.url;
  const isDoc = e.request.mode === 'navigate' || e.request.destination === 'document';
  const isIconOrManifest = /icon-(192|512)\.png|apple-touch-icon\.png|manifest\.json/.test(url);

  if (isDoc || isIconOrManifest) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
