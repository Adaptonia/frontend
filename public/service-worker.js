// Service Worker for Adaptonia PWA
// Handles caching and notification events

const CACHE_NAME = 'adaptonia-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard',
  '/icons/medal.png',
  // Add other static assets here
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching Files');
      return cache.addAll(urlsToCache);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache when possible
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        return response;
      }
      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        // Don't cache if not a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Clone the response since it can only be consumed once
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      });
    })
  );
});

// Handle push notifications from server
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received', event);
  
  const data = event.data.json();
  
  const options = {
    body: data.description || 'Reminder for your goal',
    icon: '/icons/logo-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/dashboard',
      goalId: data.goalId
    },
    actions: [
      {
        action: 'view',
        title: 'View Goal'
      },
      {
        action: 'complete',
        title: 'Mark Complete'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Adaptonia Reminder', options)
  );
});

// Map to track reminder timeouts
const reminderTimeouts = new Map();

// Function to play an alarm with notification
const showAlarmNotification = (reminder) => {
  // Show notification
  self.registration.showNotification(reminder.title || 'Adaptonia Reminder', {
    body: reminder.description || 'Time for your goal!',
    icon: '/icons/logo-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    sound: '/sounds/notification.wav', // This may not work on all browsers
    silent: false,
    data: {
      url: '/dashboard',
      goalId: reminder.goalId,
      alarm: reminder.alarm
    },
    actions: [
      {
        action: 'view',
        title: 'View Goal'
      },
      {
        action: 'complete',
        title: 'Mark Complete'
      },
      {
        action: 'snooze',
        title: 'Snooze 5 min'
      }
    ]
  });
  
  // For browsers that don't support notification sound, 
  // we can send a message to the client to play a sound
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'PLAY_NOTIFICATION_SOUND',
        data: {
          goalId: reminder.goalId
        }
      });
    });
  });
};

// Update the message event handler
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  if (event.data.type === 'SCHEDULE_REMINDER') {
    const { reminder } = event.data;
    
    // Calculate time until reminder
    const now = new Date();
    const reminderTime = new Date(reminder.sendDate);
    const timeUntilReminder = reminderTime.getTime() - now.getTime();
    
    // Only schedule if it's in the future
    if (timeUntilReminder > 0) {
      console.log(`Scheduling reminder for ${timeUntilReminder}ms from now`);
      
      // Clear any existing timeout for this goal
      if (reminderTimeouts.has(reminder.goalId)) {
        clearTimeout(reminderTimeouts.get(reminder.goalId));
      }
      
      // Set new timeout
      const timeoutId = setTimeout(() => {
        showAlarmNotification(reminder);
        reminderTimeouts.delete(reminder.goalId);
      }, timeUntilReminder);
      
      // Store timeout ID for potential cancellation
      reminderTimeouts.set(reminder.goalId, timeoutId);
    }
  } else if (event.data.type === 'CANCEL_REMINDER') {
    const { goalId } = event.data;
    
    // Cancel the timeout if it exists
    if (reminderTimeouts.has(goalId)) {
      clearTimeout(reminderTimeouts.get(goalId));
      reminderTimeouts.delete(goalId);
      console.log(`Reminder for goal ${goalId} cancelled`);
    }
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification Click', event);
  
  event.notification.close();
  
  // Handle snooze action
  if (event.action === 'snooze') {
    const { goalId } = event.notification.data;
    
    if (goalId) {
      // Schedule a new notification 5 minutes from now
      const snoozeTime = new Date();
      snoozeTime.setMinutes(snoozeTime.getMinutes() + 5);
      
      // Use the same notification data but update the time
      const reminderData = {
        goalId,
        title: event.notification.title,
        description: event.notification.body,
        sendDate: snoozeTime.toISOString(),
        alarm: event.notification.data.alarm
      };
      
      // Clear any existing timeout
      if (reminderTimeouts.has(goalId)) {
        clearTimeout(reminderTimeouts.get(goalId));
      }
      
      // Set new timeout
      const timeoutId = setTimeout(() => {
        showAlarmNotification(reminderData);
        reminderTimeouts.delete(goalId);
      }, 5 * 60 * 1000); // 5 minutes
      
      reminderTimeouts.set(goalId, timeoutId);
      
      // Notify clients about the snooze
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'REMINDER_SNOOZED',
            data: {
              goalId,
              snoozeTime: snoozeTime.toISOString()
            }
          });
        });
      });
    }
  }
  
  // Handle different actions
  if (event.action === 'view') {
    const goalId = event.notification.data.goalId;
    const urlToOpen = goalId 
      ? `/dashboard?goal=${goalId}` 
      : event.notification.data.url || '/dashboard';
      
    event.waitUntil(
      clients.matchAll({type: 'window'}).then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes('/dashboard') && 'focus' in client) {
            client.postMessage({
              type: 'VIEW_GOAL',
              goalId: goalId
            });
            return client.focus();
          }
        }
        
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
    );
  } else if (event.action === 'complete') {
    const goalId = event.notification.data.goalId;
    
    if (goalId) {
      // Mark goal as complete via background sync
      event.waitUntil(
        self.registration.sync.register(`complete-goal-${goalId}`)
      );
    }
  } else {
    // Default action is to open the app
    event.waitUntil(
      clients.matchAll({type: 'window'}).then((clientList) => {
        if (clientList.length > 0) {
          return clientList[0].focus();
        }
        return clients.openWindow('/dashboard');
      })
    );
  }
});

// Handle background sync (for completing goals when offline)
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Sync event', event);
  
  if (event.tag.startsWith('complete-goal-')) {
    const goalId = event.tag.replace('complete-goal-', '');
    
    event.waitUntil(
      fetch(`/api/goals/${goalId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          completed: true
        })
      }).then((response) => {
        if (!response.ok) {
          throw new Error('Failed to complete goal');
        }
        return response;
      })
    );
  }
}); 