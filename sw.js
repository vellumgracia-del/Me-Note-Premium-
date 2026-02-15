const CACHE_NAME = 'menote-premium-v2'; // Naikkan versi cache
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './manifest.json',
    'https://cdn.tailwindcss.com',
    'https://unpkg.com/@phosphor-icons/web',
    'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Fira+Code:wght@400;500&display=swap'
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('SW: Pre-caching core assets');
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting(); // Paksa SW baru segera aktif
});

// Activate Event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(
                keyList.map((key) => {
                    if (key !== CACHE_NAME) {
                        console.log('SW: Menghapus cache lama', key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch Event (Cache First, Network Fallback, Dynamic Caching)
self.addEventListener('fetch', (event) => {
    // Abaikan request non-GET (seperti POST data) atau extension chrome
    if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // 1. Jika ada di cache, kembalikan segera
            if (cachedResponse) {
                return cachedResponse;
            }

            // 2. Jika tidak, ambil dari network
            return fetch(event.request).then((networkResponse) => {
                // Cek validitas respon
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
                    return networkResponse;
                }

                // 3. Simpan ke cache (Dynamic Caching) untuk penggunaan offline berikutnya
                // Kita perlu meng-clone respon karena stream hanya bisa dibaca sekali
                const responseToCache = networkResponse.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                // Fallback jika offline total dan aset tidak ada di cache
                // (Opsional: Bisa return halaman offline.html khusus jika ada)
                console.log('Offline dan aset tidak ditemukan:', event.request.url);
            });
        })
    );
});
