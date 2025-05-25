// Service Worker for Adaptonia PWA
const CACHE_NAME = 'adaptonia-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Add other important assets here
];

// Install event - cache basic assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Cache open failed:', err))
  );
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
  // Claim clients to ensure updates are applied immediately
  self.clients.claim();
});

// Fetch event - network first with cache fallback strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip browser extensions and chrome-extension requests
  if (
    event.request.url.startsWith('chrome-extension') ||
    event.request.url.includes('extension') ||
    event.request.url.includes('chrome')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response since we'll use it twice
        const responseToCache = response.clone();
        
        // Open the cache and store the new response
        caches.open(CACHE_NAME)
          .then((cache) => {
            // Only cache successful responses
            if (response.status === 200) {
              cache.put(event.request, responseToCache);
            }
          });
          
        return response;
      })
      .catch(() => {
        // If network fetch fails, try to serve from cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // For navigation requests, return the cached homepage as a fallback
            if (event.request.mode === 'navigate') {
              return caches.match('/');
            }
            
            // Otherwise fail
            return new Response('Network error happened', {
              status: 408,
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});

// Push Event - Handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push received:', event);

  let notification = {
    title: 'Adaptonia',
    body: 'New message received',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      url: '/'
    }
  };

  // Check if there's a payload with custom data
  if (event.data) {
    try {
      const data = event.data.json();
      notification = { ...notification, ...data };
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notification.title, notification)
  );
});

// Notification click - Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click:', event);
  
  event.notification.close();

  // Get URL to open from notification data or use default
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if a window is already open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if none are open
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Message Event - Handle messages from client
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
}); 