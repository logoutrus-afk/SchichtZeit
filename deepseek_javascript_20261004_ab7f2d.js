const CACHE_NAME = 'schichtzeit-v1';
const urlsToCache = [
    './',
    './index.html',
    './manifest.json'
];

// Установка — кэшируем основные файлы
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache);
        }).then(() => self.skipWaiting())
    );
});

// Активация — очищаем старые кэши
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.filter(name => name !== CACHE_NAME)
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

// Перехват запросов — отдаём из кэша, если есть
self.addEventListener('fetch', event => {
    // WorldTimeAPI — всегда из сети (не кэшируем время!)
    if (event.request.url.includes('worldtimeapi.org')) {
        event.respondWith(
            fetch(event.request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' }}))
        );
        return;
    }
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).then(fetchResponse => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, fetchResponse.clone());
                    return fetchResponse;
                });
            });
        }).catch(() => caches.match('./index.html'))
    );
});