// Enhanced Service Worker for Adaptonia PWA
// Handles caching, notification events, badge counting, and AUTOMATIC background reminder scheduling
// Now also handles Firebase Cloud Messaging for push notifications

// Import Firebase scripts for FCM functionality
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

// Initialize Firebase messaging
let messaging;

// Initialize Firebase with config fetched from API
async function initializeFirebase() {
  try {
    if (!messaging) {
      // Fetch Firebase config from API
      const response = await fetch('/api/firebase-config');
      const config = await response.json();
      
      console.log('🔥 Service Worker: Firebase config loaded');
      
      // Initialize Firebase
      firebase.initializeApp(config);
      messaging = firebase.messaging();
      
      console.log('🔥 Service Worker: Firebase initialized');
      
      // Set up background message handler
      messaging.onBackgroundMessage((payload) => {
        console.log('🔥 Service Worker: Received Firebase background message:', payload);

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
            timestamp: Date.now(),
            source: 'firebase' // Mark as Firebase notification
          },
          tag: `firebase-${Date.now()}`,
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

        // Update badge count for Firebase notifications
        updateBadgeCount(notificationBadgeCount + 1);

        return self.registration.showNotification(notificationTitle, notificationOptions);
      });
    }
  } catch (error) {
    console.error('🔥 Service Worker: Failed to initialize Firebase:', error);
  }
}

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

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.notification.tag);
  
  event.notification.close();
  
  const goalId = event.notification.data?.goalId;
  const action = event.action;
  
  event.waitUntil(
    (async () => {
      try {
        // Get all clients
        const clients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        });
        
        // Try to focus an existing window
        for (const client of clients) {
          if (client.url.includes('/dashboard') && 'focus' in client) {
            await client.focus();
            // Send message about which goal was clicked
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              goalId: goalId,
              action: action
            });
            return;
          }
        }
        
        // If no existing window, open a new one
        if (self.clients.openWindow) {
          const client = await self.clients.openWindow('/dashboard');
          // Wait for client to load
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Send message about which goal was clicked
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            goalId: goalId,
            action: action
          });
        }
      } catch (error) {
        console.error('Service Worker: Failed to handle notification click:', error);
      }
    })()
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification closed', event.notification.tag);
  
  const goalId = event.notification.data?.goalId;
  
  // Update badge count
  updateBadgeCount(Math.max(0, notificationBadgeCount - 1));
  
  // Notify clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NOTIFICATION_CLOSED',
        goalId: goalId
      });
    });
  });
});

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

// Install event - cache static assets and initialize Firebase
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing v5 with AUTOMATIC background triggers + Firebase');
  event.waitUntil(
    (async () => {
      try {
        // Cache static assets
        const cache = await caches.open(CACHE_NAME);
        console.log('Service Worker: Caching Files');
        await cache.addAll(urlsToCache).catch((error) => {
          console.error('Service Worker: Cache installation failed:', error);
        });
        
        // Initialize Firebase
        await initializeFirebase();
        
      } catch (error) {
        console.error('Service Worker: Installation failed:', error);
      }
    })()
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - start automatic checking immediately
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated v5 - Starting automatic reminder system');
  event.waitUntil(
    (async () => {
      try {
        // Log the state before claiming
        console.log('🔍 Service Worker: Current state before claiming:', {
          hasClients: !!(await self.clients.matchAll()).length,
          isControlling: !!self.clients.controller
        });
        
        // Claim all clients immediately
      await self.clients.claim();
        console.log('✅ Service Worker: Successfully claimed all clients');
        
        // Log the state after claiming
        console.log('🔍 Service Worker: Current state after claiming:', {
          hasClients: !!(await self.clients.matchAll()).length,
          isControlling: !!self.clients.controller
        });
      
      // Initialize Firebase if not already initialized
      await initializeFirebase();
      
      // Initialize automatic checking system
      await initializeAutomaticChecking();
      
      // Perform initial reminder check
      setTimeout(() => {
        console.log('Service Worker: Initial automatic reminder check');
        performAutomaticReminderCheck();
      }, AUTO_CHECK_CONFIG.INITIAL_DELAY);
        
      } catch (error) {
        console.error('❌ Service Worker: Activation failed:', error);
        // Log detailed error information
        console.error('Activation error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        
        // Retry activation after delay
        setTimeout(async () => {
          try {
            await self.clients.claim();
            await initializeAutomaticChecking();
          } catch (retryError) {
            console.error('❌ Service Worker: Retry activation failed:', retryError);
          }
        }, 5000);
      }
    })()
  );
});

// CORE AUTOMATIC CHECKING SYSTEM
async function initializeAutomaticChecking() {
  try {
    console.log('🚀 Service Worker: Initializing automatic checking system');
    
    // Request notification permission if needed
    if (Notification.permission !== 'granted') {
      console.log('Service Worker: Requesting notification permission');
      const permission = await Notification.requestPermission();
      console.log('Service Worker: Notification permission:', permission);
    }
    
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
    const message = event.data;
    
    // Handle activation message
    if (message && message.type === 'ACTIVATE_WORKER') {
      console.log('🚀 Service Worker: Received activation message');
      self.skipWaiting();
      self.clients.claim();
      // Initialize Firebase if not already done
      initializeFirebase().catch(error => {
        console.error('🔥 Service Worker: Failed to initialize Firebase on activation:', error);
      });
      return;
    }
    
    // Handle reminder scheduling
    if (message && message.type === 'SCHEDULE_REMINDER') {
      console.log('📅 Service Worker: Scheduling reminder:', message.reminder);
      const reminder = message.reminder;
      
      // Store the reminder
      getStoredReminders().then(reminders => {
        reminders.push(reminder);
        return storeReminders(reminders);
      }).then(() => {
        console.log('✅ Service Worker: Reminder stored successfully');
        // Trigger an immediate check
        performAutomaticReminderCheck();
      }).catch(error => {
        console.error('❌ Service Worker: Failed to store reminder:', error);
      });
      return;
    }
    
    // Handle check due reminders request
    if (message && message.type === 'CHECK_DUE_REMINDERS') {
      console.log('🔍 Service Worker: Manual reminder check requested');
      performAutomaticReminderCheck();
      return;
    }
    
    // Handle regular messages
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
  
  // Trigger 3: On notification click
  self.addEventListener('notificationclick', (event) => {
    if (!isCheckingReminders) {
      setTimeout(performAutomaticReminderCheck, 2000);
    }
  });
  
  // Trigger 4: Periodic sync (when supported)
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
    const now = new Date();
    const dueReminders = [];
    const remainingReminders = [];
    
    // Separate due and future reminders with more reasonable tolerance
    storedReminders.forEach(reminder => {
      const reminderTime = new Date(reminder.sendDate);
      
      // Convert both times to UTC for comparison
      const reminderTimeUTC = reminderTime.getTime();
      const nowUTC = now.getTime();
      
      // // Log the times for debugging
      // console.log(`Service Worker: Comparing times for reminder ${reminder.title}:`);
      // console.log(`- Current time (UTC): ${new Date(nowUTC).toISOString()}`);
      // console.log(`- Reminder time (UTC): ${new Date(reminderTimeUTC).toISOString()}`);
      
      // Check if reminder is due with a 5-minute window
      // This includes 2.5 minutes before and 2.5 minutes after the scheduled time
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
      const timeDiff = Math.abs(reminderTimeUTC - nowUTC);
      
      if (timeDiff <= fiveMinutes) {
        console.log(`Service Worker: Reminder due - ${reminder.title} scheduled for ${reminderTime.toLocaleString()}`);
        console.log(`- Time difference: ${timeDiff / 1000} seconds`);
        dueReminders.push(reminder);
      } else if (reminderTimeUTC < nowUTC) {
        // If the reminder is more than 5 minutes past due, log it and still show it
        console.log(`Service Worker: Past due reminder found - ${reminder.title}`);
        console.log(`- Was scheduled for: ${reminderTime.toLocaleString()}`);
        console.log(`- Time difference: ${timeDiff / 1000} seconds`);
        dueReminders.push(reminder);
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
    console.log('Service Worker: Attempting to show notification:', {
      goalId: reminder.goalId,
      title: reminder.title,
      description: reminder.description,
      sendDate: reminder.sendDate,
      currentTime: new Date().toISOString(),
      notificationPermission: Notification.permission
    });
    
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

// Message event handler
self.addEventListener('message', (event) => {
  const message = event.data;
  console.log('Service Worker: Message received', {
    type: message.type,
    hasSource: !!event.source,
    sourceId: event.source?.id,
    sourceUrl: event.source?.url,
    data: message
  });
  
  if (message.type === 'CLAIM_CLIENTS') {
    event.waitUntil(
      (async () => {
        try {
          // Log state before claiming
          console.log('🔍 Service Worker: State before claiming:', {
            hasClients: !!(await self.clients.matchAll()).length,
            isControlling: !!self.clients.controller
          });
          
          await self.clients.claim();
          console.log('✅ Service Worker: Successfully claimed all clients');
          
          // Log state after claiming
          const clients = await self.clients.matchAll();
          console.log('🔍 Service Worker: State after claiming:', {
            hasClients: !!clients.length,
            clientCount: clients.length,
            isControlling: !!self.clients.controller
          });
          
          // Notify the client that claiming was successful
          if (event.source) {
            event.source.postMessage({
              type: 'CLIENTS_CLAIMED',
              success: true
            });
            console.log('✅ Service Worker: Sent success response to client');
          } else {
            console.warn('⚠️ Service Worker: No source to respond to');
          }
        } catch (error) {
          console.error('❌ Service Worker: Failed to claim clients:', {
            error: error.message,
            stack: error.stack
          });
          if (event.source) {
            event.source.postMessage({
              type: 'CLIENTS_CLAIMED',
              success: false,
              error: error.message
            });
          }
        }
      })()
    );
    return;
  }
  
  // Handle other message types
  try {
    switch (message.type) {
      case 'SCHEDULE_REMINDER':
        if (message.reminder) {
          event.waitUntil(automaticBackgroundReminderManager.addReminder(message.reminder));
        }
        break;
        
      case 'CANCEL_REMINDER':
        if (message.goalId) {
          event.waitUntil(automaticBackgroundReminderManager.removeReminder(message.goalId));
        }
        break;
        
      case 'UPDATE_BADGE_COUNT':
        if (typeof message.count === 'number') {
          updateBadgeCount(message.count);
        }
        break;
        
      default:
        console.warn('Service Worker: Unknown message type:', message.type);
    }
  } catch (error) {
    console.error('Service Worker: Message processing failed:', {
      error: error.message,
      stack: error.stack,
      messageType: message.type
    });
  }
});

// Ensure all async operations in message handler are properly waited for
self.addEventListener('message', (event) => {
  if (event.data && typeof event.data === 'object') {
    event.waitUntil(
      (async () => {
        try {
          // Create a new MessageChannel for two-way communication
          const messageChannel = new MessageChannel();
          
          // Handle port messages
          messageChannel.port1.onmessage = async (event) => {
            const response = await handleMessage(event.data);
            messageChannel.port1.postMessage(response);
          };
          
          // Send the port to the client
          if (event.source) {
            event.source.postMessage(
              { type: 'PORT_INIT' },
              [messageChannel.port2]
            );
          }
        } catch (error) {
          console.error('Service Worker: Failed to setup message channel:', error);
        }
      })()
    );
  }
});

// Helper function to handle messages
async function handleMessage(message) {
  try {
    switch (message.type) {
      case 'CLAIM_CLIENTS':
        await self.clients.claim();
        return { type: 'CLIENTS_CLAIMED', success: true };
        
      case 'SCHEDULE_REMINDER':
        if (message.reminder) {
          await automaticBackgroundReminderManager.addReminder(message.reminder);
          return { type: 'REMINDER_SCHEDULED', success: true };
        }
        return { type: 'REMINDER_SCHEDULED', success: false, error: 'No reminder data' };
        
      default:
        return { type: 'UNKNOWN_MESSAGE', error: `Unknown message type: ${message.type}` };
    }
  } catch (error) {
    return { type: 'ERROR', error: error.message };
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked', event.notification.tag);
  
    event.notification.close();
    
  const goalId = event.notification.data?.goalId;
  const action = event.action;
  
        event.waitUntil(
    (async () => {
      try {
        // Get all clients
        const clients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true
        });
        
        // Try to focus an existing window
        for (const client of clients) {
              if (client.url.includes('/dashboard') && 'focus' in client) {
            await client.focus();
            // Send message about which goal was clicked
                client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              goalId: goalId,
              action: action
            });
            return;
          }
        }
        
        // If no existing window, open a new one
            if (self.clients.openWindow) {
          const client = await self.clients.openWindow('/dashboard');
          // Wait for client to load
          await new Promise(resolve => setTimeout(resolve, 1000));
          // Send message about which goal was clicked
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            goalId: goalId,
            action: action
          });
    }
  } catch (error) {
        console.error('Service Worker: Failed to handle notification click:', error);
  }
    })()
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: Notification closed', event.notification.tag);
  
  const goalId = event.notification.data?.goalId;
  
  // Update badge count
  updateBadgeCount(Math.max(0, notificationBadgeCount - 1));
  
  // Notify clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'NOTIFICATION_CLOSED',
        goalId: goalId
      });
    });
  });
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