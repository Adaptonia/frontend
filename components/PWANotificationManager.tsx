'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { iosNotificationManager } from '@/lib/ios-notifications'
import { requestNotificationPermission as requestFirebasePermission, onMessageListener } from '@/lib/firebase'
import { pushNotificationService } from '@/lib/appwrite/push-notifications'
import { account } from '@/lib/appwrite/config'

interface PWANotificationManagerProps {
  children?: React.ReactNode
}

interface ReminderData {
  goalId: string
  title: string
  description: string
  sendDate: string
  alarm?: boolean
}

// Enhanced PWA Notification Manager with automatic triggers
export default function PWANotificationManager({ children }: PWANotificationManagerProps) {
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [badgeCount, setBadgeCount] = useState(0)
  const serviceWorkerRef = useRef<ServiceWorker | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const visibilityCheckRef = useRef<NodeJS.Timeout | null>(null)

  // Configuration for automatic checking
  const AUTO_CHECK_CONFIG = {
    HEARTBEAT_INTERVAL: 30000,      // Send heartbeat every 30 seconds
    VISIBILITY_CHECK_INTERVAL: 15000, // Check visibility every 15 seconds
    WAKE_UP_INTERVAL: 60000,        // Wake up service worker every minute
    RETRY_DELAY: 5000,              // Retry failed operations after 5 seconds
    MAX_RETRIES: 3                  // Maximum retry attempts
  }

  // Initialize PWA notification system
  useEffect(() => {
    initializePWANotifications()
    
    // Cleanup on unmount
    return () => {
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current)
      }
      if (visibilityCheckRef.current) {
        clearInterval(visibilityCheckRef.current)
      }
    }
  }, [])

  const initializePWANotifications = async () => {
    try {
      console.log('🚀 PWA Manager: Initializing comprehensive notification system')

      // Check if running on iOS
      const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      
      if (isIOS) {
        console.log('📱 PWA Manager: iOS device detected - using iOS notification system');
        toast.warning('Push notifications are not supported on iOS. Please use in-app reminders.');
        return;
      }

      // First register service workers
      const registration = await registerServiceWorkerWithRetry();
      if (!registration) {
        console.error('❌ PWA Manager: Failed to register service workers');
        return;
      }

      // Set up service worker communication
      await setupServiceWorkerCommunication(registration);

      // Initialize automatic systems
      await initializeAutomaticSystems(registration);

      // Start heartbeat and visibility monitoring
      startHeartbeatSystem();
      startVisibilityMonitoring();

      // Request Firebase notification permission
      const fcmToken = await requestFirebasePermission();
      if (fcmToken) {
        console.log('✅ PWA Manager: Firebase notification permission granted');
        setNotificationPermission('granted');
        setIsServiceWorkerReady(true);
        
        // Store FCM token in Appwrite
        try {
          const user = await account.get();
          await pushNotificationService.storePushToken(user.$id, fcmToken);
          console.log('✅ PWA Manager: FCM token stored in Appwrite');
        } catch (error) {
          console.error('❌ PWA Manager: Failed to store FCM token:', error);
        }
      } else {
        console.warn('⚠️ PWA Manager: Firebase notification permission denied');
        setNotificationPermission('denied');
      }

      // Set up foreground message listener
      onMessageListener().then((payload: any) => {
        console.log('📱 PWA Manager: Received foreground message:', payload);
        toast(payload.notification.title, {
          description: payload.notification.body,
          duration: 5000
        });
      }).catch(err => console.error('❌ PWA Manager: Failed to receive message:', err));

    } catch (error) {
      console.error('❌ PWA Manager: Initialization failed:', error)
      toast.error('Failed to initialize notifications')
    }
  }

  // Register service worker with automatic retry
  const registerServiceWorkerWithRetry = async (retries = 0): Promise<ServiceWorkerRegistration | null> => {
    try {
      console.log(`🔄 PWA Manager: Registering service workers (attempt ${retries + 1})`);
      
      // First register Firebase messaging service worker
      const fcmRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/firebase-cloud-messaging-push-scope'
      });
      console.log('✅ PWA Manager: Firebase messaging service worker registered');
      
      // Wait for FCM service worker to be ready and activate
      await navigator.serviceWorker.ready;
      if (fcmRegistration.active) {
        await fcmRegistration.active.postMessage({ type: 'ACTIVATE_WORKER' });
      }
      
      // Then register main service worker
      const mainRegistration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none',
        type: 'module'
      });
      console.log('✅ PWA Manager: Main service worker registered');
      
      // Wait for main service worker to be ready and activate
      await navigator.serviceWorker.ready;

      // Ensure the service worker is activated
      if (mainRegistration.waiting) {
        mainRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      
      // Wait for the service worker to be activated
      await new Promise<void>((resolve) => {
        if (mainRegistration.active) {
          resolve();
        } else {
          mainRegistration.addEventListener('activate', () => resolve());
        }
      });

      console.log('✅ PWA Manager: Service workers activated');
      return mainRegistration;

    } catch (error) {
      console.error(`❌ PWA Manager: Service worker registration failed (attempt ${retries + 1}):`, error);
      
      if (retries < AUTO_CHECK_CONFIG.MAX_RETRIES) {
        console.log(`🔄 PWA Manager: Retrying in ${AUTO_CHECK_CONFIG.RETRY_DELAY}ms...`);
        await new Promise(resolve => setTimeout(resolve, AUTO_CHECK_CONFIG.RETRY_DELAY));
        return registerServiceWorkerWithRetry(retries + 1);
      }
      
      toast.error('Failed to initialize notifications. Please refresh the page.');
      return null;
    }
  }

  // Request notification permission with user-friendly prompts
  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    try {
      if (!('Notification' in window)) {
        console.warn('⚠️ PWA Manager: Notifications not supported')
        return 'denied'
      }

      let permission = Notification.permission

      if (permission === 'default') {
        console.log('🔔 PWA Manager: Requesting notification permission')
        permission = await Notification.requestPermission()
      }

      console.log('🔔 PWA Manager: Notification permission:', permission)
      return permission

    } catch (error) {
      console.error('❌ PWA Manager: Failed to request notification permission:', error)
      return 'denied'
    }
  }

  // Set up comprehensive service worker communication
  const setupServiceWorkerCommunication = async (registration: ServiceWorkerRegistration) => {
    try {
      console.log('📡 PWA Manager: Setting up service worker communication')

      // Get active service worker
      const serviceWorker = registration.active || registration.waiting || registration.installing
      if (serviceWorker) {
        serviceWorkerRef.current = serviceWorker
      }

      // Listen for service worker messages
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)

      // Listen for service worker updates
      registration.addEventListener('updatefound', () => {
        console.log('🔄 PWA Manager: Service worker update found')
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('✅ PWA Manager: New service worker installed')
              toast.info('App updated! Refresh for latest features.')
            }
          })
        }
      })

      // Handle service worker controller change
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('🔄 PWA Manager: Service worker controller changed')
        window.location.reload()
      })

      console.log('✅ PWA Manager: Service worker communication established')

    } catch (error) {
      console.error('❌ PWA Manager: Failed to setup service worker communication:', error)
    }
  }

  // Initialize automatic checking systems
  const initializeAutomaticSystems = async (registration: ServiceWorkerRegistration) => {
    try {
      console.log('⚙️ PWA Manager: Initializing automatic systems')

      // Start automatic checking in service worker
      await sendMessageToServiceWorker({
        type: 'START_AUTOMATIC_CHECKING'
      })

      // Set up periodic sync if supported
      if ('sync' in registration) {
        try {
          await (registration as any).sync.register('reminder-sync')
          console.log('✅ PWA Manager: Background sync registered')
        } catch (error) {
          console.log('⚠️ PWA Manager: Background sync not supported:', error)
        }
      }

      // Set up periodic background sync if supported
      if ('periodicSync' in registration) {
        try {
          // @ts-ignore - periodicSync is experimental
          await registration.periodicSync.register('auto-reminder-check', {
            minInterval: 60000 // 1 minute
          })
          console.log('✅ PWA Manager: Periodic background sync registered')
        } catch (error) {
          console.log('⚠️ PWA Manager: Periodic background sync not supported:', error)
        }
      }

      console.log('✅ PWA Manager: Automatic systems initialized')

    } catch (error) {
      console.error('❌ PWA Manager: Failed to initialize automatic systems:', error)
    }
  }

  // Start heartbeat system to keep service worker alive
  const startHeartbeatSystem = () => {
    console.log('💓 PWA Manager: Starting heartbeat system')
    
    heartbeatIntervalRef.current = setInterval(async () => {
      try {
        // Send heartbeat to service worker
        await sendMessageToServiceWorker({
          type: 'HEARTBEAT',
          timestamp: Date.now()
        })

        // Trigger reminder check
        await sendMessageToServiceWorker({
          type: 'CHECK_DUE_REMINDERS'
        })

      } catch (error) {
        console.error('❌ PWA Manager: Heartbeat failed:', error)
      }
    }, AUTO_CHECK_CONFIG.HEARTBEAT_INTERVAL)
  }

  // Start visibility monitoring for better reliability
  const startVisibilityMonitoring = () => {
    console.log('👁️ PWA Manager: Starting visibility monitoring')

    // Monitor page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ PWA Manager: Page became visible - checking reminders')
        sendMessageToServiceWorker({
          type: 'CHECK_DUE_REMINDERS'
        }).catch(error => {
          console.error('❌ PWA Manager: Visibility check failed:', error)
        })
      }
    })

    // Periodic visibility checks
    visibilityCheckRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        sendMessageToServiceWorker({
          type: 'CHECK_DUE_REMINDERS'
        }).catch(error => {
          console.error('❌ PWA Manager: Periodic visibility check failed:', error)
        })
      }
    }, AUTO_CHECK_CONFIG.VISIBILITY_CHECK_INTERVAL)

    // Monitor focus/blur events
    window.addEventListener('focus', () => {
      console.log('👁️ PWA Manager: Window focused - checking reminders')
      sendMessageToServiceWorker({
        type: 'CHECK_DUE_REMINDERS'
      }).catch(error => {
        console.error('❌ PWA Manager: Focus check failed:', error)
      })
    })
  }

  // Handle messages from service worker
  const handleServiceWorkerMessage = (event: MessageEvent) => {
    try {
      const { type, data, count, goalId } = event.data

      switch (type) {
        case 'BADGE_COUNT_UPDATED':
          setBadgeCount(count || 0)
          break

        case 'REMINDER_SNOOZED':
          toast.info(`Reminder snoozed for 5 minutes`)
          break

        case 'GOAL_COMPLETED':
          toast.success('Goal marked as complete!')
          break

        case 'PLAY_NOTIFICATION_SOUND':
          playNotificationSound(data?.alarm)
          break

        case 'VIEW_GOAL':
          // Handle goal viewing logic
          console.log('📱 PWA Manager: View goal requested:', goalId)
          break

        default:
          console.log('📱 PWA Manager: Unknown message type:', type)
      }

    } catch (error) {
      console.error('❌ PWA Manager: Failed to handle service worker message:', error)
    }
  }

  // Send message to service worker with retry logic
  const sendMessageToServiceWorker = async (message: any, retries = 0): Promise<void> => {
    try {
      if (!navigator.serviceWorker.controller) {
        throw new Error('No service worker controller')
      }

      navigator.serviceWorker.controller.postMessage(message)

    } catch (error) {
      console.error(`❌ PWA Manager: Failed to send message (attempt ${retries + 1}):`, error)
      
      if (retries < AUTO_CHECK_CONFIG.MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, AUTO_CHECK_CONFIG.RETRY_DELAY))
        return sendMessageToServiceWorker(message, retries + 1)
      }
      
      throw error
    }
  }

  // Play notification sound
  const playNotificationSound = (useAlarm = false) => {
    try {
      const audio = new Audio(useAlarm ? '/sounds/alarm.mp3' : '/sounds/notification.mp3')
      audio.volume = 0.7
      audio.play().catch(error => {
        console.error('❌ PWA Manager: Failed to play notification sound:', error)
      })
    } catch (error) {
      console.error('❌ PWA Manager: Failed to create audio:', error)
    }
  }

  // Public API for scheduling reminders with FCM-first approach
  const scheduleReminder = async (reminderData: ReminderData): Promise<boolean> => {
    try {
      console.log('📅 PWA Manager: Scheduling reminder:', reminderData);
      
      // Ensure service worker is ready
      if (!isServiceWorkerReady) {
        console.log('🔄 PWA Manager: Service worker not ready, attempting to initialize...');
        await initializePWANotifications();
        
        if (!isServiceWorkerReady) {
          console.error('❌ PWA Manager: Service worker initialization failed');
          return false;
      }
      }
      
      // Get the service worker registration
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration || !registration.active) {
        console.error('❌ PWA Manager: No active service worker found');
        return false;
      }

      // Ensure the service worker is controlling the page
      if (!navigator.serviceWorker.controller) {
        console.log('🔄 PWA Manager: Service worker not controlling page, claiming clients...');
        await registration.active.postMessage({ type: 'CLAIM_CLIENTS' });
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Schedule the reminder
      await sendMessageToServiceWorker({
        type: 'SCHEDULE_REMINDER',
        reminder: reminderData
      });
      
      console.log('✅ PWA Manager: Reminder scheduled successfully');
        return true;
    } catch (error) {
      console.error('❌ PWA Manager: Failed to schedule reminder:', error);
      return false;
    }
  }

  // Public API for canceling reminders
  const cancelReminder = async (goalId: string): Promise<boolean> => {
    try {
      // Check if running on iOS
      const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      
      if (isIOS) {
        console.log('📱 PWA Manager: iOS device detected - no need to cancel in-app notification');
        return true;
      }

      if (!isServiceWorkerReady) {
        console.warn('⚠️ PWA Manager: Service worker not ready')
        return false
      }

      // Get current user
      const user = await account.get();
      
      // Call Appwrite function to cancel push notification
      const response = await fetch('/api/cancel-push-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.$id,
          goalId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ PWA Manager: Push notification canceled successfully');
        return true;
      } else {
        console.error('❌ PWA Manager: Failed to cancel push notification:', result.message);
        return false;
      }

    } catch (error) {
      console.error('❌ PWA Manager: Failed to cancel reminder:', error)
      return false
    }
  }

  // Public API for manual reminder check
  const checkReminders = async (): Promise<void> => {
    try {
      if (!isServiceWorkerReady) {
        console.warn('⚠️ PWA Manager: Service worker not ready')
        return
      }

      console.log('🔍 PWA Manager: Manual reminder check triggered')

      await sendMessageToServiceWorker({
        type: 'CHECK_DUE_REMINDERS'
      })

    } catch (error) {
      console.error('❌ PWA Manager: Manual reminder check failed:', error)
    }
  }

  // Expose API through window object for global access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.PWANotificationManager = {
        scheduleReminder,
        cancelReminder,
        checkReminders,
        isReady: isServiceWorkerReady,
        permission: notificationPermission,
        badgeCount,
        // Test function for debugging
        testReminder: async () => {
          const testReminder = {
            goalId: 'test-' + Date.now(),
            title: 'Test Reminder',
            description: 'This is a test reminder to verify the system works',
            sendDate: new Date(Date.now() + 10000).toISOString(), // 10 seconds from now
            alarm: true
          };
          
          console.log('🧪 Testing reminder system with:', testReminder);
          const result = await scheduleReminder(testReminder);
          console.log('🧪 Test reminder result:', result);
          return result;
        }
      }
    }
  }, [scheduleReminder, cancelReminder, checkReminders, isServiceWorkerReady, notificationPermission, badgeCount])

  return (
    <>
      {children}
      
      {/* Status indicator for development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 right-4 z-50 bg-black text-white p-2 rounded text-xs">
          SW: {isServiceWorkerReady ? '✅' : '❌'} | 
          Notif: {notificationPermission} | 
          Badge: {badgeCount}
        </div>
      )}
    </>
  )
}

// Type definitions for global PWA API
declare global {
  interface Window {
    PWANotificationManager: {
      scheduleReminder: (reminderData: ReminderData) => Promise<boolean>
      cancelReminder: (goalId: string) => Promise<boolean>
      checkReminders: () => Promise<void>
      isReady: boolean
      permission: NotificationPermission
      badgeCount: number
      testReminder: () => Promise<boolean>
    }
  }
}

// Global state for badge count (accessible outside React)
let globalBadgeCount = 0;

// Utility functions for external use (replacing sw-register exports)
export const getBadgeCount = (): number => {
  return globalBadgeCount;
};

export const updateBadgeCount = async (count: number): Promise<void> => {
  try {
    globalBadgeCount = Math.max(0, count);
    
    // Update app badge if supported
    if ('setAppBadge' in navigator) {
      await (navigator as any).setAppBadge(globalBadgeCount);
    }
    
    // Send message to service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_BADGE_COUNT',
        count: globalBadgeCount
      });
    }
  } catch (error) {
    console.error('Failed to update badge count:', error);
  }
};

export const clearBadgeCount = async (): Promise<void> => {
  await updateBadgeCount(0);
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    return permission === 'granted';
  } catch (error) {
    console.error('Failed to request notification permission:', error);
    return false;
  }
};

const claimClients = async (registration: ServiceWorkerRegistration): Promise<boolean> => {
  try {
    // Wait for the service worker to be activated
    if (registration.installing || registration.waiting) {
      await new Promise<void>((resolve) => {
        const stateChangeHandler = () => {
          if (registration.active) {
            registration.removeEventListener('statechange', stateChangeHandler);
            resolve();
          }
        };
        registration.addEventListener('statechange', stateChangeHandler);
      });
    }

    if (!registration.active) {
      console.error('❌ Service worker not active after waiting');
      return false;
    }
    
    // Create a promise that will resolve when we get a response from the service worker
    const claimPromise = new Promise<boolean>((resolve) => {
      const messageHandler = (event: MessageEvent) => {
        if (event.data?.type === 'CLIENTS_CLAIMED') {
          navigator.serviceWorker.removeEventListener('message', messageHandler);
          resolve(event.data.success);
        }
      };
      
      navigator.serviceWorker.addEventListener('message', messageHandler);
      
      // Set a timeout in case we don't get a response
      setTimeout(() => {
        navigator.serviceWorker.removeEventListener('message', messageHandler);
        resolve(false);
      }, 3000);
    });
    
    // Send the claim message
    registration.active.postMessage({ type: 'CLAIM_CLIENTS' });
    
    // Wait for the response
    const claimed = await claimPromise;
    
    if (!claimed) {
      console.error('❌ Failed to claim clients - no response from service worker');
      return false;
    }
    
    // Verify the controller is set
    return !!navigator.serviceWorker.controller;
  } catch (error) {
    console.error('Failed to claim clients:', error);
    return false;
  }
};

export const scheduleReminderNotification = async (reminder: {
  goalId: string;
  title: string;
  description?: string;
  sendDate: string;
}): Promise<boolean> => {
  try {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service worker not supported');
      return false;
    }

    // If service worker is not controlling the page, try to activate it
    if (!navigator.serviceWorker.controller) {
      console.log('🔄 Service worker not controlling page, attempting activation...');
      
      // Get or register service worker
      let registration = await navigator.serviceWorker.getRegistration();
      
      if (!registration) {
        console.log('📝 No registration found, registering service worker...');
        try {
          registration = await navigator.serviceWorker.register('/service-worker.js', {
            scope: '/',
            updateViaCache: 'none',
            type: 'module'
          });
          console.log('✅ Service worker registered successfully');
        } catch (error) {
          console.error('❌ Failed to register service worker:', error);
          return false;
        }
      }
      
      // Wait for activation and claim clients
      const claimed = await claimClients(registration);
      if (!claimed) {
        console.error('❌ Failed to claim clients');
        return false;
      }
    }

    // Schedule the reminder
    console.log('📱 Scheduling reminder with service worker:', reminder);
    navigator.serviceWorker.controller!.postMessage({
      type: 'SCHEDULE_REMINDER',
      reminder
    });

    return true;
  } catch (error) {
    console.error('Failed to schedule reminder notification:', error);
    return false;
  }
};

export const scheduleReminderNotificationWithAlarm = async (reminder: {
  goalId: string;
  title: string;
  description?: string;
  sendDate: string;
  alarm?: boolean;
}): Promise<boolean> => {
  return scheduleReminderNotification(reminder);
};

export const cancelReminderNotification = async (goalId: string): Promise<boolean> => {
  try {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      console.warn('Service worker not available');
      return false;
    }

    navigator.serviceWorker.controller.postMessage({
      type: 'CANCEL_REMINDER',
      goalId
    });

    return true;
  } catch (error) {
    console.error('Failed to cancel reminder notification:', error);
    return false;
  }
};

export const playNotificationSound = async (): Promise<void> => {
  try {
    const audio = new Audio('/sounds/notification.mp3');
    audio.volume = 0.7;
    await audio.play();
  } catch (error) {
    console.error('Failed to play notification sound:', error);
  }
};

// React hook for badge count
export const useNotificationBadge = () => {
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    // Get initial badge count
    setBadgeCount(getBadgeCount());

    // Listen for badge count updates from service worker
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'BADGE_COUNT_UPDATED') {
        const newCount = event.data.count || 0;
        globalBadgeCount = newCount;
        setBadgeCount(newCount);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      }
    };
  }, []);

  return badgeCount;
};
