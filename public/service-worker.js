// Enhanced Service Worker for Adaptonia PWA
// Handles caching, notification events, badge counting, and reminder scheduling

const CACHE_NAME = 'adaptonia-cache-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/dashboard',
  '/icons/icon-192x192.png',
  '/icons/icon-72x72.png',
  '/sounds/notification.mp3',
  // Add other static assets here
];

// Badge counter for notifications
let notificationBadgeCount = 0;

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing v3 with enhanced mobile support');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching Files');
      return cache.addAll(urlsToCache).catch((error) => {
        console.error('Service Worker: Cache installation failed:', error);
      });
    })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated v3 with badge support');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing Old Cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    }).then(() => {
      // Initialize badge count
      updateBadgeCount(0);
    })
  );
});

// Enhanced fetch event with better error handling
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and extension-related requests
  if (event.request.method !== 'GET' || event.request.url.includes('extension')) {
    return;
  }

  // IMPORTANT: Skip caching for authentication and form pages
  const url = new URL(event.request.url);
  const pathname = url.pathname;
  
  // Don't cache authentication pages, API routes, or pages with query params
  if (pathname.includes('/signup') || 
      pathname.includes('/login') || 
      pathname.includes('/api/') || 
      url.search.length > 0) {
    console.log('Service Worker: Bypassing cache for:', pathname);
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found
      if (response) {
        console.log('Service Worker: Serving from cache:', event.request.url);
        return response;
      }
      
      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        // Don't cache if not a valid response
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        
        // Don't cache API requests or dynamic content
        if (pathname.includes('/api/') || url.search.length > 0) {
          return response;
        }
        
        // Clone the response since it can only be consumed once
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache).catch((error) => {
            console.error('Service Worker: Failed to cache request:', error);
          });
        });
        
        return response;
      }).catch((error) => {
        console.error('Service Worker: Fetch failed:', error);
        // Return a fallback response for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/') || new Response('Offline', { status: 503 });
        }
        throw error;
      });
    })
  );
});

// Enhanced badge management
function updateBadgeCount(count) {
  notificationBadgeCount = Math.max(0, count);
  
  if ('setAppBadge' in navigator) {
    // Use the new Badge API if available (Chrome 81+, Edge 84+)
    if (notificationBadgeCount > 0) {
      navigator.setAppBadge(notificationBadgeCount).catch((error) => {
        console.error('Service Worker: Failed to set app badge:', error);
      });
    } else {
      navigator.clearAppBadge().catch((error) => {
        console.error('Service Worker: Failed to clear app badge:', error);
      });
    }
  }
  
  // Send badge count to all clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      try {
        client.postMessage({
          type: 'BADGE_COUNT_UPDATED',
          count: notificationBadgeCount
        });
      } catch (error) {
        console.error('Service Worker: Failed to send badge update:', error);
      }
    });
  });
  
  console.log('Service Worker: Badge count updated to:', notificationBadgeCount);
}

// Handle push notifications from server
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received', event);
  
  try {
    const data = event.data ? event.data.json() : {};
    
    // Increment badge count
    updateBadgeCount(notificationBadgeCount + 1);
  
    const options = {
      body: data.description || 'Reminder for your goal',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/dashboard',
        goalId: data.goalId,
        timestamp: Date.now()
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
      ],
      silent: false,
      requireInteraction: true,
      tag: `goal-${data.goalId || Date.now()}` // Prevents duplicate notifications
    };
  
    event.waitUntil(
      self.registration.showNotification(data.title || 'Adaptonia Reminder', options)
        .catch((error) => {
          console.error('Service Worker: Failed to show push notification:', error);
        })
    );
  } catch (error) {
    console.error('Service Worker: Push notification processing failed:', error);
  }
});

// Enhanced reminder management
class ReminderManager {
  constructor() {
    this.reminders = new Map();
    this.timeouts = new Map();
  }

  scheduleReminder(reminder) {
    try {
      const now = new Date();
      const reminderTime = new Date(reminder.sendDate);
      const timeUntilReminder = reminderTime.getTime() - now.getTime();
      
      // Clear any existing timeout for this goal
      this.cancelReminder(reminder.goalId);
      
      if (timeUntilReminder <= 0) {
        // If time has passed, show notification immediately
        this.showNotification(reminder);
        return;
      }
      
      console.log(`Scheduling reminder for goal ${reminder.goalId} in ${timeUntilReminder}ms`);
      
      // Set new timeout
      const timeoutId = setTimeout(() => {
        this.showNotification(reminder);
        this.timeouts.delete(reminder.goalId);
        this.reminders.delete(reminder.goalId);
      }, timeUntilReminder);
      
      // Store timeout and reminder data
      this.timeouts.set(reminder.goalId, timeoutId);
      this.reminders.set(reminder.goalId, reminder);
      
    } catch (error) {
      console.error('Service Worker: Failed to schedule reminder:', error);
    }
  }

  cancelReminder(goalId) {
    try {
      if (this.timeouts.has(goalId)) {
        clearTimeout(this.timeouts.get(goalId));
        this.timeouts.delete(goalId);
        this.reminders.delete(goalId);
        console.log(`Cancelled reminder for goal ${goalId}`);
      }
    } catch (error) {
      console.error('Service Worker: Failed to cancel reminder:', error);
    }
  }

  showNotification(reminder) {
    try {
      // Increment badge count for new notification
      updateBadgeCount(notificationBadgeCount + 1);
      
      const options = {
        body: reminder.description || 'Time for your goal!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
          url: '/dashboard',
          goalId: reminder.goalId,
          alarm: reminder.alarm,
          timestamp: Date.now()
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
        ],
        silent: false,
        requireInteraction: true,
        tag: `goal-${reminder.goalId}`, // Prevents duplicate notifications
        renotify: true // Allow renotification for the same tag
      };
      
      self.registration.showNotification(reminder.title || 'Adaptonia Reminder', options)
        .then(() => {
          console.log('Service Worker: Notification shown for goal', reminder.goalId);
          
          // Send message to clients to play sound
          return self.clients.matchAll();
        })
        .then((clients) => {
          clients.forEach(client => {
            try {
              client.postMessage({
                type: 'PLAY_NOTIFICATION_SOUND',
                data: {
                  goalId: reminder.goalId,
                  alarm: reminder.alarm
                }
              });
            } catch (error) {
              console.error('Service Worker: Failed to send message to client:', error);
            }
          });
        })
        .catch((error) => {
          console.error('Service Worker: Failed to show notification:', error);
        });
        
    } catch (error) {
      console.error('Service Worker: Notification creation failed:', error);
    }
  }

  snoozeReminder(goalId, originalData) {
    try {
      const snoozeTime = new Date();
      snoozeTime.setMinutes(snoozeTime.getMinutes() + 5);
      
      const snoozeReminder = {
        ...originalData,
        sendDate: snoozeTime.toISOString(),
        title: `${originalData.title} (Snoozed)`
      };
      
      this.scheduleReminder(snoozeReminder);
      
      // Notify clients about the snooze
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          try {
            client.postMessage({
              type: 'REMINDER_SNOOZED',
              data: {
                goalId,
                snoozeTime: snoozeTime.toISOString()
              }
            });
          } catch (error) {
            console.error('Service Worker: Failed to send snooze message:', error);
          }
        });
      });
      
    } catch (error) {
      console.error('Service Worker: Failed to snooze reminder:', error);
    }
  }
}

// Initialize reminder manager
const reminderManager = new ReminderManager();

// Enhanced message event handler
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  try {
    const { type, reminder, goalId, count } = event.data;
    
    switch (type) {
      case 'SCHEDULE_REMINDER':
        if (reminder) {
          reminderManager.scheduleReminder(reminder);
        }
        break;
        
      case 'CANCEL_REMINDER':
        if (goalId) {
          reminderManager.cancelReminder(goalId);
        }
        break;
        
      case 'UPDATE_BADGE_COUNT':
        if (typeof count === 'number') {
          updateBadgeCount(count);
        }
        break;
        
      case 'CLEAR_BADGE':
        updateBadgeCount(0);
        break;
        
      case 'REQUEST_BADGE_COUNT':
        // Send current badge count to requesting client
        event.ports[0]?.postMessage({
          type: 'BADGE_COUNT_RESPONSE',
          count: notificationBadgeCount
        });
        break;
        
      default:
        console.log('Service Worker: Unknown message type:', type);
    }
  } catch (error) {
    console.error('Service Worker: Message processing failed:', error);
  }
});

// Enhanced notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification Click', event);
  
  try {
    event.notification.close();
    
    // Decrement badge count when notification is clicked
    updateBadgeCount(notificationBadgeCount - 1);
    
    const { action } = event;
    const { goalId, url } = event.notification.data || {};
    
    switch (action) {
      case 'snooze':
        if (goalId) {
          const originalData = reminderManager.reminders.get(goalId) || {
            goalId,
            title: event.notification.title,
            description: event.notification.body,
            alarm: event.notification.data?.alarm
          };
          reminderManager.snoozeReminder(goalId, originalData);
        }
        break;
        
      case 'view':
        const viewUrl = goalId ? `/dashboard?goal=${goalId}` : url || '/dashboard';
        event.waitUntil(
          self.clients.matchAll({ type: 'window' }).then((clientList) => {
            // Try to focus existing window
            for (const client of clientList) {
              if (client.url.includes('/dashboard') && 'focus' in client) {
                client.postMessage({
                  type: 'VIEW_GOAL',
                  goalId: goalId
                });
                return client.focus();
              }
            }
            // Open new window if none exists
            if (self.clients.openWindow) {
              return self.clients.openWindow(viewUrl);
            }
          }).catch((error) => {
            console.error('Service Worker: Failed to handle view action:', error);
          })
        );
        break;
        
      case 'complete':
        if (goalId) {
          event.waitUntil(
            self.registration.sync.register(`complete-goal-${goalId}`)
              .catch((error) => {
                console.error('Service Worker: Failed to register sync:', error);
              })
          );
        }
        break;
        
      default:
        // Default action - open app
        event.waitUntil(
          self.clients.matchAll({ type: 'window' }).then((clientList) => {
            if (clientList.length > 0) {
              // Focus existing window
              return clientList[0].focus();
            }
            // Open new window
            if (self.clients.openWindow) {
              return self.clients.openWindow('/dashboard');
            }
          }).catch((error) => {
            console.error('Service Worker: Failed to handle default action:', error);
          })
        );
    }
  } catch (error) {
    console.error('Service Worker: Notification click handling failed:', error);
  }
});

// Handle notification close event
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification closed');
  // Decrement badge count when notification is dismissed
  updateBadgeCount(notificationBadgeCount - 1);
});

// Background sync for completed goals
self.addEventListener('sync', (event) => {
  if (event.tag.startsWith('complete-goal-')) {
    const goalId = event.tag.replace('complete-goal-', '');
    event.waitUntil(completeGoalSync(goalId));
  }
});

async function completeGoalSync(goalId) {
  try {
    console.log('Service Worker: Syncing goal completion for:', goalId);
    
    // Send message to clients to handle goal completion
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      try {
        client.postMessage({
          type: 'GOAL_COMPLETED',
          goalId: goalId
        });
      } catch (error) {
        console.error('Service Worker: Failed to send goal completion message:', error);
      }
    });
    
  } catch (error) {
    console.error('Service Worker: Goal completion sync failed:', error);
    throw error;
  }
} 