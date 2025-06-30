// Simplified Service Worker for Adaptonia PWA
// Handles Firebase Cloud Messaging and basic PWA functionality only
// Local reminder notifications have been removed

importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

let messaging;
let notificationBadgeCount = 0;
let notificationCheckInterval = null;

async function initializeFirebase() {
  try {
    if (!messaging) {
      const response = await fetch('/api/firebase-config');
      const config = await response.json();
      
      console.log('🔥 Service Worker: Firebase config loaded');
      
      firebase.initializeApp(config);
      messaging = firebase.messaging();
      
      console.log('🔥 Service Worker: Firebase initialized');
      
      messaging.onBackgroundMessage((payload) => {
        console.log('🔥 Service Worker: Received Firebase background message:', payload);

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
            timestamp: Date.now(),
            source: 'firebase'
          },
          tag: `firebase-${Date.now()}`,
          requireInteraction: true,
          vibrate: [200, 100, 200],
          actions: [
            { action: 'open', title: 'Open' },
            { action: 'close', title: 'Close' }
          ]
        };

        updateBadgeCount(notificationBadgeCount + 1);
        return self.registration.showNotification(notificationTitle, notificationOptions);
      });
    }
  } catch (error) {
    console.error('🔥 Service Worker: Failed to initialize Firebase:', error);
  }
}

const CACHE_NAME = 'adaptonia-cache-v7';
const urlsToCache = [
  '/',
  '/dashboard',
  '/icons/icon-192x192.png',
  '/icons/icon-72x72.png',
  '/sounds/notification.mp3'
];

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing v7 - Firebase + notifications');
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(urlsToCache);
        await initializeFirebase();
      } catch (error) {
        console.error('Service Worker: Installation failed:', error);
      }
    })()
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating v7');
  event.waitUntil(
    (async () => {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter(cacheName => cacheName !== CACHE_NAME)
            .map(cacheName => caches.delete(cacheName))
        );
        await self.clients.claim();
        await initializeFirebase();
        
        // Start notification checking system
        startNotificationChecking();
        
        console.log('Service Worker: Activated and ready');
      } catch (error) {
        console.error('Service Worker: Activation failed:', error);
      }
    })()
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(event.request);
        
        if (cachedResponse) {
          return cachedResponse;
        }
        
        const networkResponse = await fetch(event.request);
        
        if (networkResponse.ok && (event.request.url.includes('/icons/') || event.request.url.includes('/sounds/'))) {
          cache.put(event.request, networkResponse.clone());
        }
        
        return networkResponse;
      } catch (error) {
        console.error('Service Worker: Fetch failed:', error);
        return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
      }
    })()
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked');
  event.notification.close();
  
  const goalId = event.notification.data?.goalId;
  const action = event.action;
  
  event.waitUntil(
    (async () => {
      try {
        const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
        
        for (const client of clients) {
          if (client.url.includes('/dashboard') && 'focus' in client) {
            await client.focus();
            client.postMessage({ type: 'NOTIFICATION_CLICKED', goalId, action });
            return;
          }
        }
        
        if (self.clients.openWindow) {
          const client = await self.clients.openWindow('/dashboard');
          await new Promise(resolve => setTimeout(resolve, 1000));
          client.postMessage({ type: 'NOTIFICATION_CLICKED', goalId, action });
        }
      } catch (error) {
        console.error('Service Worker: Failed to handle notification click:', error);
      }
    })()
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification closed');
  updateBadgeCount(Math.max(0, notificationBadgeCount - 1));
  
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'NOTIFICATION_CLOSED', goalId: event.notification.data?.goalId });
    });
  });
});

function updateBadgeCount(count) {
  try {
    notificationBadgeCount = Math.max(0, count);
    
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(notificationBadgeCount);
    }
    
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        try {
          client.postMessage({ type: 'BADGE_COUNT_UPDATED', count: notificationBadgeCount });
        } catch (error) {
          console.error('Service Worker: Failed to send badge update:', error);
        }
      });
    });
  } catch (error) {
    console.error('Service Worker: Failed to update badge count:', error);
  }
}

// Notification checking system - polls server for due notifications
function startNotificationChecking() {
  console.log('🔄 Service Worker: Starting notification checking system');
  console.log('🔄 Service Worker: Current time:', new Date().toISOString());
  
  // Check immediately
  console.log('🔄 Service Worker: Calling checkForDueNotifications immediately...');
  checkForDueNotifications();
  
  // Then check every 30 seconds
  if (notificationCheckInterval) {
    clearInterval(notificationCheckInterval);
  }
  
  console.log('🔄 Service Worker: Setting up 30-second interval...');
  notificationCheckInterval = setInterval(() => {
    console.log('⏰ Service Worker: 30-second interval triggered');
    checkForDueNotifications();
  }, 30000); // Check every 30 seconds
  
  console.log('✅ Service Worker: Notification checking system started');
}

async function checkForDueNotifications() {
  try {
    console.log('🔍 Service Worker: Checking for due notifications...');
    console.log('🔍 Service Worker: Function called at:', new Date().toISOString());
    
    // Get user ID from clients
    const clients = await self.clients.matchAll();
    console.log(`🔍 Service Worker: Found ${clients.length} clients`);
    
    if (clients.length === 0) {
      console.log('🔍 Service Worker: No clients found, skipping notification check');
      return;
    }
    
    let userId = null;
    for (const client of clients) {
      try {
        const response = await new Promise((resolve, reject) => {
          const channel = new MessageChannel();
          channel.port1.onmessage = (event) => {
            resolve(event.data);
          };
          setTimeout(() => reject(new Error('Timeout')), 2000);
          client.postMessage({ type: 'GET_USER_ID' }, [channel.port2]);
        });
        
        if (response && response.userId) {
          userId = response.userId;
          break;
        }
      } catch (error) {
        console.log('⚠️ Service Worker: Could not get user ID from client:', error.message);
      }
    }
    
    if (!userId) {
      console.log('🔍 Service Worker: No user ID found, skipping notification check');
      return;
    }
    
    console.log('👤 Service Worker: Checking notifications for user:', userId);
    
    // Check for due notifications from server
    const response = await fetch('/api/notifications/due', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });
    
    if (!response.ok) {
      console.error('❌ Service Worker: Failed to fetch due notifications:', response.status);
      return;
    }
    
    const data = await response.json();
    const dueNotifications = data.notifications || [];
    
    console.log(`📋 Service Worker: Found ${dueNotifications.length} due notifications`);
    
    // Show each due notification
    for (const notification of dueNotifications) {
      await showDueNotification(notification);
    }
    
  } catch (error) {
    console.error('❌ Service Worker: Failed to check for due notifications:', error);
  }
}

async function showDueNotification(notification) {
  try {
    console.log('📱 Service Worker: Showing notification:', notification.title);
    
    const notificationOptions = {
      body: notification.description || 'Time for your goal!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [200, 100, 200],
      data: {
        goalId: notification.goalId,
        reminderId: notification.id,
        url: '/dashboard',
        timestamp: Date.now(),
        source: 'server'
      },
      actions: [
        { action: 'view', title: 'View Goal' },
        { action: 'complete', title: 'Mark Complete' },
        { action: 'snooze', title: 'Snooze 5 min' }
      ],
      tag: `reminder-${notification.goalId}`,
      requireInteraction: true
    };
    
    updateBadgeCount(notificationBadgeCount + 1);
    await self.registration.showNotification(notification.title, notificationOptions);
    
    // Send sound message to clients
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      try {
        client.postMessage({
          type: 'PLAY_NOTIFICATION_SOUND',
          data: { goalId: notification.goalId }
        });
      } catch (error) {
        console.error('Service Worker: Failed to send sound message:', error);
      }
    });
    
    console.log('✅ Service Worker: Notification shown successfully');
    
  } catch (error) {
    console.error('❌ Service Worker: Failed to show notification:', error);
  }
}

self.addEventListener('message', (event) => {
  const { type, data } = event.data || {};
  
  console.log('Service Worker: Message received', { type });
  
  switch (type) {
    case 'CLAIM_CLIENTS':
      event.waitUntil(self.clients.claim());
      break;
    case 'GET_USER_ID':
      // Will be handled by PWA manager
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({ userId: null, message: 'Please handle in PWA manager' });
      }
      break;
    case 'PLAY_NOTIFICATION_SOUND':
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'PLAY_NOTIFICATION_SOUND', data });
        });
      });
      break;
    case 'UPDATE_BADGE_COUNT':
      updateBadgeCount(data?.count || 0);
      break;
    case 'CHECK_NOTIFICATIONS':
      checkForDueNotifications();
      break;
  }
});

console.log('🚀 Service Worker: Loaded v7 - Firebase + notification checking'); 