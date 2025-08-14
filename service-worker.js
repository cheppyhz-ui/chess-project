const CACHE_NAME = 'catur-cache-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
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
  './images/background-menu.jpg' // <-- TAMBAHKAN BARIS INI
];

// Saat service worker di-install, buka cache dan tambahkan file-file di atas
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache dibuka');
        return cache.addAll(urlsToCache);
      })
  );
});

// Setiap kali ada request (misal, memuat gambar), coba ambil dari cache dulu
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Jika ada di cache, kembalikan dari cache. Jika tidak, ambil dari network.
        return response || fetch(event.request);
      })
  );
});