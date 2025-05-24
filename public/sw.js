// Service Worker Version
const SW_VERSION = 'v1.0.0';
const CACHE_NAME = `adaptonia-app-${SW_VERSION}`;

// Assets to cache initially
const INITIAL_CACHED_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/blueLogo.png',
  '/Mlogo.png',
  // Add your app's essential files here
];

// Install Event - Cache the initial resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Installing and caching initial resources');
      return cache.addAll(INITIAL_CACHED_RESOURCES);
    })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Activated and claiming clients');
      // Take control of all clients
      return self.clients.claim();
    })
  );
});

// Fetch Event - Serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and Appwrite API requests (let them go directly to network)
  if (
    event.request.method !== 'GET' || 
    event.request.url.includes('appwrite') ||
    event.request.url.includes('websocket')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response;
      }

      // Clone the request (it's a one-time use stream)
      const fetchRequest = event.request.clone();

      // Make network request
      return fetch(fetchRequest).then((response) => {
        // Check if valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone the response (it's a one-time use stream)
        const responseToCache = response.clone();

        // Cache the fetched response
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch((error) => {
        console.error('[Service Worker] Fetch failed:', error);
        // You could return a custom offline page here
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