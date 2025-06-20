importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Fetch Firebase config securely from API endpoint
let messaging = null;

// Initialize Firebase with secure config
async function initializeFirebase() {
  try {
    // Fetch config from secure API endpoint
    const response = await fetch('/api/firebase-config');
    const firebaseConfig = await response.json();
    
    if (!firebaseConfig.apiKey) {
      throw new Error('Failed to get Firebase config');
    }
    
    // Initialize Firebase with fetched config
    firebase.initializeApp(firebaseConfig);
    messaging = firebase.messaging();
    
    console.log('🔥 Firebase messaging service worker initialized securely');
    
    // Set up message handling after initialization
    setupMessageHandling();
    
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
  }
}

// Set up message handling
function setupMessageHandling() {
  if (!messaging) return;
  
  // Handle background messages - This is where FCM notifications are processed
  messaging.onBackgroundMessage((payload) => {
    console.log('🔥 FCM Service Worker: Received background message:', payload);
    console.log('🔥 FCM Service Worker: Payload structure:', {
      notification: payload.notification,
      data: payload.data,
      from: payload.from,
      messageId: payload.messageId
    });

    try {
      // Extract notification data - handle both notification and data-only messages
      let notificationTitle = 'New Notification';
      let notificationBody = 'You have a new notification';
      let notificationIcon = '/icons/icon-192x192.png';
      let notificationBadge = '/icons/icon-72x72.png';
      let notificationData = {};

      // Priority 1: Use notification field if present (most common)
      if (payload.notification) {
        notificationTitle = payload.notification.title || notificationTitle;
        notificationBody = payload.notification.body || notificationBody;
        notificationIcon = payload.notification.icon || notificationIcon;
        console.log('🔥 FCM Service Worker: Using notification field');
      }
      // Priority 2: Use data field if no notification field
      else if (payload.data) {
        notificationTitle = payload.data.title || notificationTitle;
        notificationBody = payload.data.body || notificationBody;
        notificationIcon = payload.data.icon || notificationIcon;
        console.log('🔥 FCM Service Worker: Using data field for notification content');
      }

      // Always include data for click handling
      if (payload.data) {
        notificationData = { ...payload.data };
      }

      console.log('🔥 FCM Service Worker: Final notification config:', {
        title: notificationTitle,
        body: notificationBody,
        icon: notificationIcon,
        data: notificationData
      });
      
      const notificationOptions = {
        body: notificationBody,
        icon: notificationIcon,
        badge: notificationBadge,
        data: {
          ...notificationData,
          url: self.registration.scope,
          clickAction: notificationData.clickAction || '/dashboard',
          timestamp: Date.now(),
          source: 'fcm_background'
        },
        actions: [
          {
            action: 'open',
            title: 'Open App'
          },
          {
            action: 'dismiss',
            title: 'Dismiss'
          }
        ],
        requireInteraction: true,
        vibrate: [200, 100, 200],
        tag: `fcm-${Date.now()}`, // Unique tag to prevent grouping
        renotify: true, // Show even if similar notification exists
        silent: false // Make sure it's not silent
      };

      console.log('🔥 FCM Service Worker: Showing notification with options:', notificationOptions);
      
      return self.registration.showNotification(notificationTitle, notificationOptions);
      
    } catch (error) {
      console.error('❌ FCM Service Worker: Error processing background message:', error);
      
      // Fallback notification in case of error
      return self.registration.showNotification('Adaptonia Notification', {
        body: 'You have a new notification (error in processing)',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        tag: `fcm-error-${Date.now()}`,
        data: {
          error: true,
          originalPayload: payload
        }
      });
    }
  });
}

// Enhanced notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔥 FCM Service Worker: Notification clicked:', event);
  console.log('🔥 FCM Service Worker: Click action:', event.action);
  console.log('🔥 FCM Service Worker: Notification data:', event.notification.data);
  
  event.notification.close();
  
  // Handle different actions
  if (event.action === 'dismiss') {
    console.log('🔥 FCM Service Worker: Notification dismissed');
    return;
  }
  
  const clickAction = event.notification.data?.clickAction || '/dashboard';
  
  event.waitUntil(
    (async () => {
      try {
        // Get all clients
        const clients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        });
        
        console.log('🔥 FCM Service Worker: Found', clients.length, 'clients');
        
        // Try to focus an existing window
        for (const client of clients) {
          if (client.url.includes('/dashboard') && 'focus' in client) {
            console.log('🔥 FCM Service Worker: Focusing existing client');
            await client.focus();
            
            // Send message about notification click
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: event.notification.data,
              action: event.action
            });
            return;
          }
        }
        
        // If no existing window, open a new one
        if (self.clients.openWindow) {
          console.log('🔥 FCM Service Worker: Opening new window:', clickAction);
          const client = await self.clients.openWindow(clickAction);
          
          // Wait for client to load and send message
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (client) {
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              data: event.notification.data,
              action: event.action
            });
          }
        }
      } catch (error) {
        console.error('❌ FCM Service Worker: Failed to handle notification click:', error);
      }
    })()
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

// Initialize Firebase when service worker loads
initializeFirebase();

console.log('🔥 Firebase messaging service worker setup complete'); 