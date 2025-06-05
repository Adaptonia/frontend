// // Enhanced Service Worker for Adaptonia PWA
// // Handles caching, notification events, badge counting, and BACKGROUND reminder scheduling

// const CACHE_NAME = 'adaptonia-cache-v4';
// const urlsToCache = [
//   '/',
//   '/index.html',
//   '/dashboard',
//   '/icons/icon-192x192.png',
//   '/icons/icon-72x72.png',
//   '/sounds/notification.mp3',
//   // Add other static assets here
// ];

// // Badge counter for notifications
// let notificationBadgeCount = 0;

// // Persistent storage for reminders (survives service worker restarts)
// const REMINDERS_STORE_NAME = 'adaptonia-reminders';

// // Install event - cache static assets
// self.addEventListener('install', (event) => {
//   console.log('Service Worker: Installing v4 with BACKGROUND notification support');
//   event.waitUntil(
//     caches.open(CACHE_NAME).then((cache) => {
//       console.log('Service Worker: Caching Files');
//       return cache.addAll(urlsToCache).catch((error) => {
//         console.error('Service Worker: Cache installation failed:', error);
//       });
//     })
//   );
//   // Skip waiting to activate immediately
//   self.skipWaiting();
// });

// // Activate event - clean up old caches and initialize
// self.addEventListener('activate', (event) => {
//   console.log('Service Worker: Activated v4 with background notification support');
//   event.waitUntil(
//     caches.keys().then((cacheNames) => {
//       return Promise.all(
//         cacheNames.map((cache) => {
//           if (cache !== CACHE_NAME) {
//             console.log('Service Worker: Clearing Old Cache:', cache);
//             return caches.delete(cache);
//           }
//         })
//       );
//     }).then(() => {
//       // Take control of all clients immediately
//       return self.clients.claim();
//     }).then(() => {
//       // Initialize badge count and check for due reminders
//       updateBadgeCount(0);
//       return checkAndProcessDueReminders();
//     })
//   );
// });

// // Enhanced fetch event with better error handling
// self.addEventListener('fetch', (event) => {
//   // Skip non-GET requests and extension-related requests
//   if (event.request.method !== 'GET' || event.request.url.includes('extension')) {
//     return;
//   }

//   // IMPORTANT: Skip caching for authentication and form pages
//   const url = new URL(event.request.url);
//   const pathname = url.pathname;
  
//   // Don't cache authentication pages, API routes, or pages with query params
//   if (pathname.includes('/signup') || 
//       pathname.includes('/login') || 
//       pathname.includes('/api/') || 
//       url.search.length > 0) {
//     console.log('Service Worker: Bypassing cache for:', pathname);
//     return;
//   }

//   event.respondWith(
//     caches.match(event.request).then((response) => {
//       // Return cached response if found
//       if (response) {
//         console.log('Service Worker: Serving from cache:', event.request.url);
//         return response;
//       }
      
//       // Otherwise fetch from network
//       return fetch(event.request).then((response) => {
//         // Don't cache if not a valid response
//         if (!response || response.status !== 200 || response.type !== 'basic') {
//           return response;
//         }
        
//         // Don't cache API requests or dynamic content
//         if (pathname.includes('/api/') || url.search.length > 0) {
//           return response;
//         }
        
//         // Clone the response since it can only be consumed once
//         const responseToCache = response.clone();
        
//         caches.open(CACHE_NAME).then((cache) => {
//           cache.put(event.request, responseToCache).catch((error) => {
//             console.error('Service Worker: Failed to cache request:', error);
//           });
//         });
        
//         return response;
//       }).catch((error) => {
//         console.error('Service Worker: Fetch failed:', error);
//         // Return a fallback response for navigation requests
//         if (event.request.mode === 'navigate') {
//           return caches.match('/') || new Response('Offline', { status: 503 });
//         }
//         throw error;
//       });
//     })
//   );
// });

// // Enhanced badge management
// function updateBadgeCount(count) {
//   notificationBadgeCount = Math.max(0, count);
  
//   if ('setAppBadge' in navigator) {
//     // Use the new Badge API if available (Chrome 81+, Edge 84+)
//     if (notificationBadgeCount > 0) {
//       navigator.setAppBadge(notificationBadgeCount).catch((error) => {
//         console.error('Service Worker: Failed to set app badge:', error);
//       });
//     } else {
//       navigator.clearAppBadge().catch((error) => {
//         console.error('Service Worker: Failed to clear app badge:', error);
//       });
//     }
//   }
  
//   // Send badge count to all clients
//   self.clients.matchAll().then(clients => {
//     clients.forEach(client => {
//       try {
//         client.postMessage({
//           type: 'BADGE_COUNT_UPDATED',
//           count: notificationBadgeCount
//         });
//       } catch (error) {
//         console.error('Service Worker: Failed to send badge update:', error);
//       }
//     });
//   });
  
//   console.log('Service Worker: Badge count updated to:', notificationBadgeCount);
// }

// // Persistent storage utilities for reminders
// async function getStoredReminders() {
//   try {
//     const cache = await caches.open(REMINDERS_STORE_NAME);
//     const response = await cache.match('/reminders-data');
//     if (response) {
//       const data = await response.json();
//       return data.reminders || [];
//     }
//     return [];
//   } catch (error) {
//     console.error('Service Worker: Failed to get stored reminders:', error);
//     return [];
//   }
// }

// async function storeReminders(reminders) {
//   try {
//     const cache = await caches.open(REMINDERS_STORE_NAME);
//     const data = { reminders, lastUpdated: Date.now() };
//     const response = new Response(JSON.stringify(data), {
//       headers: { 'Content-Type': 'application/json' }
//     });
//     await cache.put('/reminders-data', response);
//     console.log('Service Worker: Stored', reminders.length, 'reminders');
//   } catch (error) {
//     console.error('Service Worker: Failed to store reminders:', error);
//   }
// }

// // NEW: Check for due reminders (works when app is closed!)
// async function checkAndProcessDueReminders() {
//   try {
//     console.log('Service Worker: Checking for due reminders...');
    
//     const storedReminders = await getStoredReminders();
//     const now = Date.now();
//     const dueReminders = [];
//     const remainingReminders = [];
    
//     // Separate due and future reminders
//     storedReminders.forEach(reminder => {
//       const reminderTime = new Date(reminder.sendDate).getTime();
      
//       // Check if reminder is due (within 1 minute tolerance)
//       if (reminderTime <= now + 60000) { // 1 minute tolerance
//         dueReminders.push(reminder);
//       } else {
//         remainingReminders.push(reminder);
//       }
//     });
    
//     console.log(`Service Worker: Found ${dueReminders.length} due reminders`);
    
//     // Process due reminders
//     for (const reminder of dueReminders) {
//       await showNotificationForReminder(reminder);
//     }
    
//     // Store remaining reminders
//     await storeReminders(remainingReminders);
    
//     return dueReminders.length;
//   } catch (error) {
//     console.error('Service Worker: Failed to check due reminders:', error);
//     return 0;
//   }
// }

// // Show notification for a specific reminder
// async function showNotificationForReminder(reminder) {
//   try {
//     console.log('Service Worker: Showing notification for reminder:', reminder.goalId);
    
//     // Increment badge count
//     updateBadgeCount(notificationBadgeCount + 1);
    
//     const options = {
//       body: reminder.description || 'Time for your goal!',
//       icon: '/icons/icon-192x192.png',
//       badge: '/icons/icon-72x72.png',
//       vibrate: [200, 100, 200],
//       data: {
//         url: '/dashboard',
//         goalId: reminder.goalId,
//         alarm: reminder.alarm,
//         timestamp: Date.now(),
//         reminderId: reminder.goalId
//       },
//       actions: [
//         {
//           action: 'view',
//           title: 'View Goal'
//         },
//         {
//           action: 'complete',
//           title: 'Mark Complete'
//         },
//         {
//           action: 'snooze',
//           title: 'Snooze 5 min'
//         }
//       ],
//       silent: false,
//       requireInteraction: true,
//       tag: `goal-${reminder.goalId}`,
//       renotify: true
//     };
    
//     await self.registration.showNotification(reminder.title || 'Adaptonia Reminder', options);
    
//     // Try to send sound message to any open clients
//     const clients = await self.clients.matchAll();
//     clients.forEach(client => {
//       try {
//         client.postMessage({
//           type: 'PLAY_NOTIFICATION_SOUND',
//           data: {
//             goalId: reminder.goalId,
//             alarm: reminder.alarm
//           }
//         });
//       } catch (error) {
//         console.error('Service Worker: Failed to send sound message:', error);
//       }
//     });
    
//     console.log('Service Worker: Notification shown for goal', reminder.goalId);
    
//   } catch (error) {
//     console.error('Service Worker: Failed to show notification for reminder:', error);
//   }
// }

// // Handle push notifications from server
// self.addEventListener('push', (event) => {
//   console.log('Service Worker: Push Received', event);
  
//   try {
//     const data = event.data ? event.data.json() : {};
    
//     // Increment badge count
//     updateBadgeCount(notificationBadgeCount + 1);
  
//   const options = {
//     body: data.description || 'Reminder for your goal',
//       icon: '/icons/icon-192x192.png',
//       badge: '/icons/icon-72x72.png',
//     vibrate: [100, 50, 100],
//     data: {
//       url: data.url || '/dashboard',
//         goalId: data.goalId,
//         timestamp: Date.now()
//     },
//     actions: [
//       {
//         action: 'view',
//         title: 'View Goal'
//       },
//       {
//         action: 'complete',
//         title: 'Mark Complete'
//       }
//       ],
//       silent: false,
//       requireInteraction: true,
//       tag: `goal-${data.goalId || Date.now()}`
//   };
  
//   event.waitUntil(
//     self.registration.showNotification(data.title || 'Adaptonia Reminder', options)
//         .catch((error) => {
//           console.error('Service Worker: Failed to show push notification:', error);
//         })
//     );
//   } catch (error) {
//     console.error('Service Worker: Push notification processing failed:', error);
//   }
// });

// // NEW: Background Reminder Manager that doesn't rely on setTimeout
// class BackgroundReminderManager {
//   constructor() {
//     // This manager doesn't use setTimeout - it stores reminders persistently
//   }

//   async addReminder(reminder) {
//     try {
//       const existingReminders = await getStoredReminders();
      
//       // Remove any existing reminder for the same goal
//       const filteredReminders = existingReminders.filter(r => r.goalId !== reminder.goalId);
      
//       // Add the new reminder
//       filteredReminders.push({
//         ...reminder,
//         storedAt: Date.now()
//       });
      
//       await storeReminders(filteredReminders);
      
//       console.log('Service Worker: Added background reminder for goal:', reminder.goalId);
//       console.log('Service Worker: Reminder scheduled for:', new Date(reminder.sendDate).toLocaleString());
      
//       // Schedule a periodic check
//       await schedulePeriodicCheck();
      
//       return true;
//     } catch (error) {
//       console.error('Service Worker: Failed to add background reminder:', error);
//       return false;
//     }
//   }

//   async removeReminder(goalId) {
//     try {
//       const existingReminders = await getStoredReminders();
//       const filteredReminders = existingReminders.filter(r => r.goalId !== goalId);
//       await storeReminders(filteredReminders);
//       console.log('Service Worker: Removed background reminder for goal:', goalId);
//       return true;
//     } catch (error) {
//       console.error('Service Worker: Failed to remove background reminder:', error);
//       return false;
//     }
//   }

//   async snoozeReminder(goalId, originalData) {
//     try {
//       const snoozeTime = new Date();
//       snoozeTime.setMinutes(snoozeTime.getMinutes() + 5);
      
//       const snoozeReminder = {
//         ...originalData,
//         sendDate: snoozeTime.toISOString(),
//         title: `${originalData.title} (Snoozed)`,
//         goalId: originalData.goalId || goalId
//       };
      
//       await this.addReminder(snoozeReminder);
      
//       // Notify clients about the snooze
//       const clients = await self.clients.matchAll();
//         clients.forEach(client => {
//           try {
//           client.postMessage({
//             type: 'REMINDER_SNOOZED',
//             data: {
//               goalId,
//               snoozeTime: snoozeTime.toISOString()
//             }
//           });
//           } catch (error) {
//             console.error('Service Worker: Failed to send snooze message:', error);
//           }
//       });
      
//       return true;
//     } catch (error) {
//       console.error('Service Worker: Failed to snooze reminder:', error);
//       return false;
//     }
//   }
// }

// // Schedule periodic background check (when supported)
// async function schedulePeriodicCheck() {
//   try {
//     // Try to register periodic background sync (limited browser support)
//     if ('periodicSync' in self.registration) {
//       await self.registration.periodicSync.register('check-reminders', {
//         minInterval: 60 * 1000 // Every minute
//       });
//       console.log('Service Worker: Periodic sync registered');
//     }
//   } catch (error) {
//     console.log('Service Worker: Periodic sync not supported:', error.message);
//   }
// }

// // Initialize background reminder manager
// const backgroundReminderManager = new BackgroundReminderManager();

// // Enhanced message event handler
// self.addEventListener('message', (event) => {
//   console.log('Service Worker: Message received', event.data);
  
//   try {
//     const { type, reminder, goalId, count } = event.data;
    
//     switch (type) {
//       case 'SCHEDULE_REMINDER':
//         if (reminder) {
//           // Use background reminder manager instead of setTimeout
//           event.waitUntil(backgroundReminderManager.addReminder(reminder));
//         }
//         break;
        
//       case 'CANCEL_REMINDER':
//         if (goalId) {
//           event.waitUntil(backgroundReminderManager.removeReminder(goalId));
//         }
//         break;
        
//       case 'CHECK_DUE_REMINDERS':
//         // Manual check trigger
//         event.waitUntil(checkAndProcessDueReminders());
//         break;
        
//       case 'UPDATE_BADGE_COUNT':
//         if (typeof count === 'number') {
//           updateBadgeCount(count);
//         }
//         break;
        
//       case 'CLEAR_BADGE':
//         updateBadgeCount(0);
//         break;
        
//       case 'REQUEST_BADGE_COUNT':
//         // Send current badge count to requesting client
//         event.ports[0]?.postMessage({
//           type: 'BADGE_COUNT_RESPONSE',
//           count: notificationBadgeCount
//         });
//         break;
        
//       default:
//         console.log('Service Worker: Unknown message type:', type);
//     }
//   } catch (error) {
//     console.error('Service Worker: Message processing failed:', error);
//   }
// });

// // Enhanced notification click handler
// self.addEventListener('notificationclick', (event) => {
//   console.log('Service Worker: Notification Click', event);
  
//   try {
//     event.notification.close();
    
//     // Decrement badge count when notification is clicked
//     updateBadgeCount(notificationBadgeCount - 1);
    
//     const { action } = event;
//     const { goalId, url } = event.notification.data || {};
    
//     switch (action) {
//       case 'snooze':
//         if (goalId) {
//           const originalData = {
//             goalId,
//             title: event.notification.title,
//             description: event.notification.body,
//             alarm: event.notification.data?.alarm
//           };
//           event.waitUntil(backgroundReminderManager.snoozeReminder(goalId, originalData));
//         }
//         break;
        
//       case 'view':
//         const viewUrl = goalId ? `/dashboard?goal=${goalId}` : url || '/dashboard';
//     event.waitUntil(
//           self.clients.matchAll({ type: 'window' }).then((clientList) => {
//             // Try to focus existing window
//         for (const client of clientList) {
//           if (client.url.includes('/dashboard') && 'focus' in client) {
//             client.postMessage({
//               type: 'VIEW_GOAL',
//               goalId: goalId
//             });
//             return client.focus();
//           }
//         }
//             // Open new window if none exists
//             if (self.clients.openWindow) {
//               return self.clients.openWindow(viewUrl);
//             }
//           }).catch((error) => {
//             console.error('Service Worker: Failed to handle view action:', error);
//           })
//         );
//         break;
        
//       case 'complete':
//     if (goalId) {
//       event.waitUntil(
//         self.registration.sync.register(`complete-goal-${goalId}`)
//               .catch((error) => {
//                 console.error('Service Worker: Failed to register sync:', error);
//               })
//           );
//         }
//         break;
        
//       default:
//         // Default action - open app
//     event.waitUntil(
//           self.clients.matchAll({ type: 'window' }).then((clientList) => {
//         if (clientList.length > 0) {
//               // Focus existing window
//           return clientList[0].focus();
//         }
//             // Open new window
//             if (self.clients.openWindow) {
//             return self.clients.openWindow('/dashboard');
//             }
//           }).catch((error) => {
//             console.error('Service Worker: Failed to handle default action:', error);
//       })
//     );
//     }
//   } catch (error) {
//     console.error('Service Worker: Notification click handling failed:', error);
//   }
// });

// // Handle notification close event
// self.addEventListener('notificationclose', (event) => {
//   console.log('Service Worker: Notification closed');
//   // Decrement badge count when notification is dismissed
//   updateBadgeCount(notificationBadgeCount - 1);
// });

// // NEW: Periodic background sync event (when supported)
// self.addEventListener('periodicsync', (event) => {
//   if (event.tag === 'check-reminders') {
//     console.log('Service Worker: Periodic sync triggered - checking reminders');
//     event.waitUntil(checkAndProcessDueReminders());
//   }
// });

// // Background sync for completed goals
// self.addEventListener('sync', (event) => {
//   if (event.tag.startsWith('complete-goal-')) {
//     const goalId = event.tag.replace('complete-goal-', '');
//     event.waitUntil(completeGoalSync(goalId));
//   }
// });

// async function completeGoalSync(goalId) {
//   try {
//     console.log('Service Worker: Syncing goal completion for:', goalId);
    
//     // Send message to clients to handle goal completion
//     const clients = await self.clients.matchAll();
//           clients.forEach(client => {
//             try {
//               client.postMessage({
//                 type: 'GOAL_COMPLETED',
//                 goalId: goalId
//               });
//             } catch (error) {
//         console.error('Service Worker: Failed to send goal completion message:', error);
//       }
//     });
    
//   } catch (error) {
//     console.error('Service Worker: Goal completion sync failed:', error);
//     throw error;
//   }
// }

// // NEW: Wake up and check reminders when service worker starts
// self.addEventListener('activate', (event) => {
//   event.waitUntil(
//     (async () => {
//       await self.clients.claim();
//       console.log('Service Worker: Activated - checking for due reminders');
//       await checkAndProcessDueReminders();
//     })()
//   );
// });

// // NEW: Check reminders when any fetch happens (app is being used)
// self.addEventListener('fetch', (event) => {
//   // Existing fetch handler code...
  
//   // Additionally, periodically check for due reminders during normal app usage
//   if (Math.random() < 0.1) { // 10% chance on each fetch
//     checkAndProcessDueReminders().catch(error => {
//       console.error('Service Worker: Background reminder check failed:', error);
//     });
//   }
// }); 