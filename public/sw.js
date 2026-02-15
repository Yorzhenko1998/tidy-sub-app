// Service Worker for TidySub PWA
const CACHE_NAME = 'tidysub-v1'
const urlsToCache = [
  '/',
  '/manifest.json',
  '/offline.html'
]

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache')
        return cache.addAll(urlsToCache)
      })
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
      })
      .catch(() => {
        // If both fail, return offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/offline.html')
        }
      })
  )
})

// Push event - show notification
self.addEventListener('push', (event) => {
  if (!event.data) return
  let data = { title: 'TidySub', body: 'Upcoming payment reminder' }
  try {
    const parsed = event.data.json()
    if (parsed.title) data.title = parsed.title
    if (parsed.body) data.body = parsed.body
  } catch (_) {
    data.body = event.data.text() || data.body
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'tidysub-reminder',
      requireInteraction: false
    })
  )
})

// Notification click - focus app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        clientList[0].focus()
      } else if (clients.openWindow) {
        clients.openWindow('/')
      }
    })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
})

