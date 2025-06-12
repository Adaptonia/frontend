// Enhanced Service Worker for Adaptonia PWA
// Handles caching, notification events, badge counting, and AUTOMATIC background reminder scheduling

const CACHE_NAME = 'adaptonia-cache-v5';
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

// Persistent storage for reminders (survives service worker restarts)
const REMINDERS_STORE_NAME = 'adaptonia-reminders';
const WAKE_UP_STORE_NAME = 'adaptonia-wakeup';

// Global timer management for automatic checking
let globalReminderTimer = null;
let isCheckingReminders = false;
let lastCheckTime = 0;

// Configuration for automatic checking
const AUTO_CHECK_CONFIG = {
  INITIAL_DELAY: 5000,        // 5 seconds after SW starts
  CHECK_INTERVAL: 30000,      // Check every 30 seconds
  MAX_CHECK_INTERVAL: 300000, // Max 5 minutes between checks
  RETRY_MULTIPLIER: 1.5,      // Exponential backoff
  WAKE_UP_INTERVAL: 60000,    // Wake up every minute
  STORAGE_CHECK_INTERVAL: 15000 // Check storage every 15 seconds
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing v5 with AUTOMATIC background triggers');
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

// Activate event - start automatic checking immediately
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated v5 - Starting automatic reminder system');
  event.waitUntil(
    (async () => {
      await self.clients.claim();
      
      // Initialize automatic checking system
      await initializeAutomaticChecking();
      
      // Perform initial reminder check
      setTimeout(() => {
        console.log('Service Worker: Initial automatic reminder check');
        performAutomaticReminderCheck();
      }, AUTO_CHECK_CONFIG.INITIAL_DELAY);
    })()
  );
});

// CORE AUTOMATIC CHECKING SYSTEM
async function initializeAutomaticChecking() {
  try {
    console.log('🚀 Service Worker: Initializing automatic checking system');
    
    // Clear any existing timers
    if (globalReminderTimer) {
      clearTimeout(globalReminderTimer);
    }
    
    // Start the main automatic checking loop
    scheduleNextAutomaticCheck();
    
    // Set up storage-based wake-up mechanism
    await setupStorageWakeUp();
    
    // Set up multiple fallback triggers
    setupFallbackTriggers();
    
    console.log('✅ Service Worker: Automatic checking system initialized');
    
  } catch (error) {
    console.error('❌ Service Worker: Failed to initialize automatic checking:', error);
    // Retry initialization after delay
    setTimeout(initializeAutomaticChecking, 10000);
  }
}

// Main automatic checking function
async function performAutomaticReminderCheck() {
  // Prevent overlapping checks
  if (isCheckingReminders) {
    console.log('Service Worker: Check already in progress, skipping');
    return;
  }
  
  try {
    isCheckingReminders = true;
    const now = Date.now();
    
    console.log('🔍 Service Worker: Performing automatic reminder check');
    
    // Check for due reminders
    const processedCount = await checkAndProcessDueReminders();
    
    // Update last check time
    lastCheckTime = now;
    
    // Store wake-up timestamp for persistence
    await storeWakeUpTime(now);
    
    // Schedule next check
    scheduleNextAutomaticCheck();
    
    if (processedCount > 0) {
      console.log(`✅ Service Worker: Processed ${processedCount} due reminders`);
    }
    
  } catch (error) {
    console.error('❌ Service Worker: Automatic reminder check failed:', error);
    // Schedule retry with exponential backoff
    scheduleNextAutomaticCheck(true);
  } finally {
    isCheckingReminders = false;
  }
}

// Intelligent scheduling for next automatic check
function scheduleNextAutomaticCheck(isRetry = false) {
  // Clear existing timer
  if (globalReminderTimer) {
    clearTimeout(globalReminderTimer);
  }
  
  // Calculate next check interval
  let nextInterval = AUTO_CHECK_CONFIG.CHECK_INTERVAL;
  
  if (isRetry) {
    // Exponential backoff for retries
    nextInterval = Math.min(
      nextInterval * AUTO_CHECK_CONFIG.RETRY_MULTIPLIER,
      AUTO_CHECK_CONFIG.MAX_CHECK_INTERVAL
    );
  }
  
  // Schedule next check
  globalReminderTimer = setTimeout(() => {
    performAutomaticReminderCheck();
  }, nextInterval);
  
  console.log(`⏰ Service Worker: Next automatic check in ${nextInterval/1000} seconds`);
}

// Storage-based wake-up mechanism (survives SW restarts)
async function setupStorageWakeUp() {
  try {
    // Store current timestamp
    await storeWakeUpTime(Date.now());
    
    // Set up periodic storage checks
    setInterval(async () => {
      try {
        const lastWakeUp = await getLastWakeUpTime();
        const now = Date.now();
        
        // If it's been too long since last wake-up, trigger check
        if (now - lastWakeUp > AUTO_CHECK_CONFIG.WAKE_UP_INTERVAL) {
          console.log('🔔 Service Worker: Storage wake-up triggered');
          performAutomaticReminderCheck();
        }
      } catch (error) {
        console.error('Service Worker: Storage wake-up check failed:', error);
      }
    }, AUTO_CHECK_CONFIG.STORAGE_CHECK_INTERVAL);
    
  } catch (error) {
    console.error('Service Worker: Failed to setup storage wake-up:', error);
  }
}

// Store wake-up timestamp
async function storeWakeUpTime(timestamp) {
  try {
    const cache = await caches.open(WAKE_UP_STORE_NAME);
    const response = new Response(JSON.stringify({ lastWakeUp: timestamp }));
    await cache.put('/wake-up-time', response);
  } catch (error) {
    console.error('Service Worker: Failed to store wake-up time:', error);
  }
}

// Get last wake-up timestamp
async function getLastWakeUpTime() {
  try {
    const cache = await caches.open(WAKE_UP_STORE_NAME);
    const response = await cache.match('/wake-up-time');
    if (response) {
      const data = await response.json();
      return data.lastWakeUp || 0;
    }
    return 0;
  } catch (error) {
    console.error('Service Worker: Failed to get wake-up time:', error);
    return 0;
  }
}

// Multiple fallback triggers for different browsers
function setupFallbackTriggers() {
  console.log('🔧 Service Worker: Setting up fallback triggers');
  
  // Trigger 1: On any message received
  self.addEventListener('message', (event) => {
    if (!isCheckingReminders && Date.now() - lastCheckTime > 10000) {
      performAutomaticReminderCheck();
    }
  });
  
  // Trigger 2: On fetch events (with throttling)
  let lastFetchCheck = 0;
  self.addEventListener('fetch', (event) => {
    const now = Date.now();
    if (now - lastFetchCheck > 30000) { // Throttle to every 30 seconds
      lastFetchCheck = now;
      if (!isCheckingReminders) {
        setTimeout(performAutomaticReminderCheck, 1000);
      }
    }
  });
  
  // Trigger 3: On push events
  self.addEventListener('push', (event) => {
    if (!isCheckingReminders) {
      event.waitUntil(performAutomaticReminderCheck());
    }
  });
  
  // Trigger 4: On notification click
  self.addEventListener('notificationclick', (event) => {
    if (!isCheckingReminders) {
      setTimeout(performAutomaticReminderCheck, 2000);
    }
  });
  
  // Trigger 5: Periodic sync (when supported)
  if ('periodicSync' in self.registration) {
    self.registration.periodicSync.register('auto-reminder-check', {
      minInterval: 60000 // 1 minute
    }).then(() => {
      console.log('✅ Service Worker: Periodic sync registered');
    }).catch((error) => {
      console.log('⚠️ Service Worker: Periodic sync not supported:', error.message);
    });
  }
}

// Persistent storage utilities for reminders
async function getStoredReminders() {
  try {
    const cache = await caches.open(REMINDERS_STORE_NAME);
    const response = await cache.match('/reminders-data');
    if (response) {
      const data = await response.json();
      return data.reminders || [];
    }
    return [];
  } catch (error) {
    console.error('Service Worker: Failed to get stored reminders:', error);
    return [];
  }
}

async function storeReminders(reminders) {
  try {
    const cache = await caches.open(REMINDERS_STORE_NAME);
    const response = new Response(JSON.stringify({ 
      reminders, 
      lastUpdated: Date.now() 
    }));
    await cache.put('/reminders-data', response);
    console.log('Service Worker: Stored', reminders.length, 'reminders');
  } catch (error) {
    console.error('Service Worker: Failed to store reminders:', error);
  }
}

// Enhanced reminder checking with better error handling
async function checkAndProcessDueReminders() {
  try {
    console.log('Service Worker: Checking for due reminders...');
    
    const storedReminders = await getStoredReminders();
    const now = Date.now();
    const dueReminders = [];
    const remainingReminders = [];
    
    // Separate due and future reminders with more reasonable tolerance
    storedReminders.forEach(reminder => {
      const reminderTime = new Date(reminder.sendDate).getTime();
      
      // Check if reminder is actually due (only past due reminders, no future tolerance)
      // Allow 30 seconds past due for processing delays
      if (reminderTime <= now + 30000) { // 30 second tolerance for processing delays only
        dueReminders.push(reminder);
        console.log(`Service Worker: Reminder due - ${reminder.title} scheduled for ${new Date(reminder.sendDate).toLocaleString()}`);
      } else {
        remainingReminders.push(reminder);
      }
    });
    
    console.log(`Service Worker: Found ${dueReminders.length} due reminders out of ${storedReminders.length} total`);
    
    // Process due reminders
    for (const reminder of dueReminders) {
      try {
        await showNotificationForReminder(reminder);
      } catch (error) {
        console.error('Service Worker: Failed to show notification for reminder:', reminder.goalId, error);
        // Keep the reminder for retry
        remainingReminders.push(reminder);
      }
    }
    
    // Store remaining reminders
    await storeReminders(remainingReminders);
    
    return dueReminders.length;
  } catch (error) {
    console.error('Service Worker: Failed to check due reminders:', error);
    return 0;
  }
}

// Show notification for a specific reminder
async function showNotificationForReminder(reminder) {
  try {
    console.log('Service Worker: Showing notification for reminder:', reminder.goalId);
    
    // Increment badge count
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
        timestamp: Date.now(),
        reminderId: reminder.goalId
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
      tag: `goal-${reminder.goalId}`,
      renotify: true
    };
    
    await self.registration.showNotification(reminder.title || 'Adaptonia Reminder', options);
    
    // Try to send sound message to any open clients
    const clients = await self.clients.matchAll();
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
        console.error('Service Worker: Failed to send sound message:', error);
      }
    });
    
    console.log('Service Worker: Notification shown for goal', reminder.goalId);
    
    // Trigger immediate check if reminder is due soon
    const reminderTime = new Date(reminder.sendDate).getTime();
    const now = Date.now();
    
    if (reminderTime - now < 60000) { // If due within 1 minute (reduced from 5 minutes)
      console.log('Service Worker: Reminder due very soon, triggering immediate check');
      setTimeout(performAutomaticReminderCheck, 1000);
    }
    
  } catch (error) {
    console.error('Service Worker: Failed to show notification for reminder:', error);
    throw error; // Re-throw to handle in caller
  }
}

// Badge count management
function updateBadgeCount(count) {
  try {
    notificationBadgeCount = Math.max(0, count);
    
    // Update app badge if supported
    if ('setAppBadge' in navigator) {
      navigator.setAppBadge(notificationBadgeCount);
    }
    
    // Send update to all clients
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
    
  } catch (error) {
    console.error('Service Worker: Failed to update badge count:', error);
  }
}

// Enhanced Background Reminder Manager with automatic scheduling
class AutomaticBackgroundReminderManager {
  constructor() {
    console.log('🎯 Service Worker: Automatic Background Reminder Manager initialized');
  }

  async addReminder(reminder) {
    try {
      const existingReminders = await getStoredReminders();
      
      // Remove any existing reminder for the same goal
      const filteredReminders = existingReminders.filter(r => r.goalId !== reminder.goalId);
      
      // Add the new reminder with automatic checking metadata
      filteredReminders.push({
        ...reminder,
        storedAt: Date.now(),
        autoCheckEnabled: true
      });
      
      await storeReminders(filteredReminders);
      
      console.log('Service Worker: Added automatic reminder for goal:', reminder.goalId);
      console.log('Service Worker: Reminder scheduled for:', new Date(reminder.sendDate).toLocaleString());
      
      // Trigger immediate check if reminder is due soon
      const reminderTime = new Date(reminder.sendDate).getTime();
      const now = Date.now();
      
      if (reminderTime - now < 60000) { // If due within 1 minute (reduced from 5 minutes)
        console.log('Service Worker: Reminder due very soon, triggering immediate check');
        setTimeout(performAutomaticReminderCheck, 1000);
      }
      
      return true;
    } catch (error) {
      console.error('Service Worker: Failed to add automatic reminder:', error);
      return false;
    }
  }

  async removeReminder(goalId) {
    try {
      const existingReminders = await getStoredReminders();
      const filteredReminders = existingReminders.filter(r => r.goalId !== goalId);
      await storeReminders(filteredReminders);
      console.log('Service Worker: Removed automatic reminder for goal:', goalId);
      return true;
    } catch (error) {
      console.error('Service Worker: Failed to remove automatic reminder:', error);
      return false;
    }
  }

  async snoozeReminder(goalId, originalData) {
    try {
      // Create new reminder 5 minutes from now
      const snoozeTime = new Date();
      snoozeTime.setMinutes(snoozeTime.getMinutes() + 5);
      
      const snoozeReminder = {
        ...originalData,
        sendDate: snoozeTime.toISOString(),
        snoozed: true,
        originalTime: originalData.sendDate
      };
      
      await this.addReminder(snoozeReminder);
      
      // Send message to clients
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        try {
          client.postMessage({
            type: 'REMINDER_SNOOZED',
            goalId: goalId,
            newTime: snoozeTime.toISOString()
          });
        } catch (error) {
          console.error('Service Worker: Failed to send snooze message:', error);
        }
      });
      
      console.log('Service Worker: Snoozed reminder for goal:', goalId, 'until', snoozeTime.toLocaleString());
      return true;
    } catch (error) {
      console.error('Service Worker: Failed to snooze reminder:', error);
      return false;
    }
  }
}

// Initialize automatic background reminder manager
const automaticBackgroundReminderManager = new AutomaticBackgroundReminderManager();

// Enhanced message event handler with automatic checking
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data);
  
  try {
    const { type, reminder, goalId, count } = event.data;
    
    switch (type) {
      case 'SCHEDULE_REMINDER':
        if (reminder) {
          event.waitUntil(automaticBackgroundReminderManager.addReminder(reminder));
        }
        break;
        
      case 'CANCEL_REMINDER':
        if (goalId) {
          event.waitUntil(automaticBackgroundReminderManager.removeReminder(goalId));
        }
        break;
        
      case 'CHECK_DUE_REMINDERS':
        event.waitUntil(performAutomaticReminderCheck());
        break;
        
      case 'START_AUTOMATIC_CHECKING':
        event.waitUntil(initializeAutomaticChecking());
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
          const originalData = {
            goalId,
            title: event.notification.title,
            description: event.notification.body,
            alarm: event.notification.data?.alarm
          };
          event.waitUntil(automaticBackgroundReminderManager.snoozeReminder(goalId, originalData));
        }
        break;
        
      case 'view':
        const viewUrl = goalId ? `/dashboard?goal=${goalId}` : url || '/dashboard';
        event.waitUntil(
          self.clients.matchAll({ type: 'window' }).then((clientList) => {
            for (const client of clientList) {
              if (client.url.includes('/dashboard') && 'focus' in client) {
                client.postMessage({
                  type: 'VIEW_GOAL',
                  goalId: goalId
                });
                return client.focus();
              }
            }
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
        event.waitUntil(
          self.clients.matchAll({ type: 'window' }).then((clientList) => {
            if (clientList.length > 0) {
              return clientList[0].focus();
            }
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
  updateBadgeCount(notificationBadgeCount - 1);
});

// Periodic background sync event (when supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'auto-reminder-check') {
    console.log('Service Worker: Periodic sync triggered - performing automatic check');
    event.waitUntil(performAutomaticReminderCheck());
  }
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

// Handle push notifications from server
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push Received', event);
  
  try {
    const data = event.data ? event.data.json() : {};
    
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
      tag: `goal-${data.goalId || Date.now()}`
    };
  
    event.waitUntil(
      self.registration.showNotification(data.title || 'Adaptonia Reminder', options)
        .then(() => {
          // Trigger automatic check after push notification
          return performAutomaticReminderCheck();
        })
        .catch((error) => {
          console.error('Service Worker: Failed to show push notification:', error);
        })
    );
  } catch (error) {
    console.error('Service Worker: Push notification processing failed:', error);
  }
});

// Enhanced fetch handler with automatic checking
self.addEventListener('fetch', (event) => {
  // Handle caching logic here...
  
  // Trigger automatic check periodically during app usage
  if (Math.random() < 0.05) { // 5% chance to avoid too frequent checks
    setTimeout(() => {
      if (!isCheckingReminders) {
        performAutomaticReminderCheck();
      }
    }, 2000);
  }
});

console.log('🚀 Service Worker v5: Automatic background reminder system loaded and ready!');