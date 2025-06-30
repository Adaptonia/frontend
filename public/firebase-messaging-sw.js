// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize Firebase with config fetched from API
let messaging;

// Fetch Firebase config and initialize
self.addEventListener('install', async (event) => {
  console.log('🔥 FCM Service Worker: Installing...');
  
  event.waitUntil(
    (async () => {
      try {
        // Fetch Firebase config from API
        const response = await fetch('/api/firebase-config');
        const config = await response.json();
        
        console.log('🔥 FCM Service Worker: Firebase config loaded');
        
        // Initialize Firebase
        firebase.initializeApp(config);
        messaging = firebase.messaging();
        
        console.log('🔥 FCM Service Worker: Firebase initialized');
      } catch (error) {
        console.error('🔥 FCM Service Worker: Failed to initialize Firebase:', error);
      }
      
      self.skipWaiting();
    })()
  );
});

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('🔥 FCM Service Worker: Activated');
  event.waitUntil(self.clients.claim());
});

// Handle background messages
self.addEventListener('message', async (event) => {
  console.log('🔥 FCM Service Worker: Received message:', event.data);
  
  if (event.data && event.data.type === 'ACTIVATE_WORKER') {
    console.log('🔥 FCM Service Worker: Activation requested');
    self.clients.claim();
  }
  
  // Initialize Firebase if not already done
  if (!messaging) {
    try {
      const response = await fetch('/api/firebase-config');
      const config = await response.json();
      firebase.initializeApp(config);
      messaging = firebase.messaging();
      console.log('🔥 FCM Service Worker: Firebase initialized on demand');
    } catch (error) {
      console.error('🔥 FCM Service Worker: Failed to initialize Firebase on demand:', error);
    }
  }
});

// Set up background message handler after Firebase is initialized
setTimeout(() => {
  if (messaging) {
    messaging.onBackgroundMessage((payload) => {
      console.log('Received background message:', payload);

      // Extract notification data
      const notificationTitle = payload.notification?.title || 'New Notification';
      const notificationBody = payload.notification?.body || 'You have a new notification';
      const notificationData = payload.data || {};

      const notificationOptions = {
        body: notificationBody,
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        data: {
          ...notificationData,
          url: self.registration.scope,
          timestamp: Date.now()
        },
        tag: `adaptonia-${Date.now()}`,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        actions: [
          {
            action: 'open',
            title: 'Open'
          },
          {
            action: 'close',
            title: 'Close'
          }
        ]
      };

      return self.registration.showNotification(notificationTitle, notificationOptions);
    });
  }
}, 1000);

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  // Handle action clicks
  if (event.action === 'close') {
    return;
  }

  // Focus or open window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a window exists, focus it
        for (const client of clientList) {
          if ('focus' in client) {
            return client.focus();
          }
        }
        // If no window exists, open a new one
        if (clients.openWindow) {
          return clients.openWindow('/dashboard');
        }
      })
  );
});

// Enhanced notification close handler
self.addEventListener('notificationclose', (event) => {
  console.log('🔥 FCM Service Worker: Notification closed:', event.notification.tag);
  
  // Notify clients about notification close
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NOTIFICATION_CLOSED',
        data: event.notification.data
      });
    });
  });
});

console.log('🔥 Firebase messaging service worker setup complete');