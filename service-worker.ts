// // src/service-worker.ts
// self.addEventListener('install', (event) => {
//     event.waitUntil(
//         caches.open('mattru-nursing-v1').then((cache) =>
//             cache.addAll([
//                 '/',
//                 '/index.html',
//                 '/vite.svg',
//                 '/manifest.json',
//             ])
//         )
//     );
// });
//
// self.addEventListener('fetch', (event) => {
//     event.respondWith(
//         caches.match(event.request).then((response) => response || fetch(event.request))
//     );
// });