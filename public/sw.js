// public/sw.js
// Service worker background caching engine for offline support

const CACHE_NAME = 'dalasisaver-v2';
const ASSETS = [
    '/',
    '/index.html',
    '/manifest.json'
];

self.addEventListener('install', (e) => {
    self.skipWaiting();
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
});

self.addEventListener('fetch', (e) => {
    if (e.request.url.includes('/api/')) {
        return; // Always fetch fresh calculations from the server
    }
    e.respondWith(
        fetch(e.request).catch(() => caches.match(e.request))
    );
});
