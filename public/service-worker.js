importScripts('https://js.pusher.com/beams/service-worker.js')
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.3/workbox-sw.js')

if (workbox) {
  console.log('Workbox cargado ✅')

  // ⚡ Precarga archivos estáticos
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST)

  // ⚡ Cache First para imágenes
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'image',
    new workbox.strategies.CacheFirst({
      cacheName: 'images-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 30 * 24 * 60 * 60 // 30 días
        })
      ]
    })
  )

  // ⚡ Stale-While-Revalidate para scripts y estilos
  workbox.routing.registerRoute(
    ({ request }) => request.destination === 'script' || request.destination === 'style',
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'static-resources'
    })
  )
} else {
  console.error('Workbox no pudo cargarse ❌')
}

// ⚡ Notificaciones Push con Pusher Beams
self.addEventListener('push', function (event) {
  const payload = event.data ? event.data.json() : {}
  const title = payload.notification?.title || 'Nueva notificación'
  const options = {
    body: payload.notification?.body || '',
    icon: payload.notification?.icon || '/favicon-32x32-dark.png',
    badge: '/badge-android.png',
    data: payload.data || {}
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// ⚡ Manejo de clic en notificaciones
self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  if (event.notification.data?.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url))
  }
})

self.addEventListener('install', (event) => {
  self.skipWaiting() // Forzar actualización inmediata
})

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()) // Reclamar control sobre las pestañas abiertas
})
