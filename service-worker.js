const CACHE_NAME = 'catur-cache-v3'; // Naikkan versi cache
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './ai-worker.js', // <-- FILE BARU DITAMBAHKAN DI SINI
  './images/bishop-b.png',
  './images/bishop-w.png',
  './images/king-b.png',
  './images/king-w.png',
  './images/knight-b.png',
  './images/knight-w.png',
  './images/pawn-b.png',
  './images/pawn-w.png',
  './images/queen-b.png',
  './images/queen-w.png',
  './images/rook-b.png',
  './images/rook-w.png',
  './images/icon-192.png',
  './images/icon-512.png',
  './images/background-menu.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Cache dibuka dan file baru ditambahkan');
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// Hapus cache lama saat service worker baru aktif
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});