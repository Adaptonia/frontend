// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize Firebase with config from environment variables
firebase.initializeApp({
  apiKey: self.FIREBASE_CONFIG.apiKey,
  authDomain: self.FIREBASE_CONFIG.authDomain,
  projectId: self.FIREBASE_CONFIG.projectId,
  storageBucket: self.FIREBASE_CONFIG.storageBucket,
  messagingSenderId: self.FIREBASE_CONFIG.messagingSenderId,
  appId: self.FIREBASE_CONFIG.appId
});

const messaging = firebase.messaging();

// Handle background messages
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

// Service worker activation
self.addEventListener('activate', (event) => {
  console.log('🔥 FCM Service Worker: Activated');
  event.waitUntil(self.clients.claim());
});

// Service worker installation
self.addEventListener('install', (event) => {
  console.log('🔥 FCM Service Worker: Installed');
  self.skipWaiting();
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('🔥 FCM Service Worker: Received message:', event.data);
  
  if (event.data && event.data.type === 'ACTIVATE_WORKER') {
    console.log('🔥 FCM Service Worker: Activation requested');
    self.clients.claim();
  }
});

console.log('🔥 Firebase messaging service worker setup complete'); 