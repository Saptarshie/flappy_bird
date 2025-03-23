const cacheName = 'flappy-bird-cache-v1';
const staticAssets = [
    '/',
    '/index.html',
    '/style.css',
    '/style2.css',
    '/script.js',
    '/manifest.json',
    '/assets/img/bird.png',
    '/assets/img/pipe.png',
    '/assets/img/background.png',
    '/assets/audio/background_music.mp3',
    '/assets/audio/flap.wav',
    '/assets/audio/hit.wav',
    '/assets/audio/score.wav',
    '/assets/img/icons/icon-192x192.png',
    '/assets/img/icons/icon-512x512.png'
];

self.addEventListener('install', async () => {
    const cache = await caches.open(cacheName);
    await cache.addAll(staticAssets);
});

self.addEventListener('fetch', event => {
    const req = event.request;
    const url = new URL(req.url);
    if (url.origin === location.origin) {
        event.respondWith(cacheFirst(req));
    } else {
        event.respondWith(networkFirst(req));
    }
});

async function cacheFirst(req) {
    const cachedResponse = await caches.match(req);
    return cachedResponse || fetch(req);
}

async function networkFirst(req) {
    const cache = await caches.open('dynamic-cache');
    try {
        const res = await fetch(req);
        await cache.put(req, res.clone());
        return res;
    } catch (error) {
        return await cache.match(req);
    }
}