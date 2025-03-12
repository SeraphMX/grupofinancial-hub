importScripts('https://js.pusher.com/beams/service-worker.js')

self.addEventListener('push', function (event) {
  const payload = event.data ? event.data.json() : {}
  const title = payload.notification.title || 'Nueva notificación'
  const options = {
    body: payload.notification.body || '',
    icon: payload.notification.icon || '/favicon-32x32-dark.png',
    badge: '/badge-android.png',
    data: payload.data || {}
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(clients.openWindow(event.notification.data.url))
  }
})
