'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { iosNotificationManager } from '@/lib/ios-notifications'

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

  // Initialize comprehensive PWA notification system
  const initializePWANotifications = async () => {
    try {
      console.log('🚀 PWA Manager: Initializing comprehensive notification system')

      // Check if running on iOS
      const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      
      if (isIOS && iosNotificationManager) {
        console.log('📱 PWA Manager: iOS device detected - using iOS notification system');
        
        // Initialize iOS notification manager
        const permissionGranted = await iosNotificationManager.requestPermission();
        setNotificationPermission(iosNotificationManager.getPermissionStatus());
        
        if (permissionGranted) {
          setIsServiceWorkerReady(true);
          console.log('✅ PWA Manager: iOS notification system initialized');
          toast.success('Notifications enabled for iOS!');
          
          // Process any queued notifications
          await iosNotificationManager.processNotificationQueue();
        }
        return;
      }

      // Step 1: Check service worker support
      if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
        console.warn('⚠️ PWA Manager: Service Worker not supported')
        toast.error('Your browser doesn\'t support background notifications')
        return
      }

      // Step 2: Register service worker with automatic retry
      const registration = await registerServiceWorkerWithRetry()
      if (!registration) {
        console.error('❌ PWA Manager: Failed to register service worker')
        return
      }

      // Step 3: Request notification permission
      const permission = await requestNotificationPermission()
      setNotificationPermission(permission)

      if (permission !== 'granted') {
        console.warn('⚠️ PWA Manager: Notification permission not granted')
        toast.warning('Enable notifications for goal reminders')
        return
      }

      // Step 4: Set up service worker communication
      await setupServiceWorkerCommunication(registration)

      // Step 5: Initialize automatic checking systems
      await initializeAutomaticSystems(registration)

      // Step 6: Start heartbeat and monitoring
      startHeartbeatSystem()
      startVisibilityMonitoring()

      setIsServiceWorkerReady(true)
      console.log('✅ PWA Manager: Comprehensive notification system initialized')
      toast.success('Background notifications enabled!')

    } catch (error) {
      console.error('❌ PWA Manager: Initialization failed:', error)
      toast.error('Failed to initialize notifications')
    }
  }

  // Register service worker with automatic retry
  const registerServiceWorkerWithRetry = async (retries = 0): Promise<ServiceWorkerRegistration | null> => {
    try {
      console.log(`🔄 PWA Manager: Registering service worker (attempt ${retries + 1})`)
      
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none' // Always check for updates
      })

      // Wait for service worker to be ready
      await navigator.serviceWorker.ready

      console.log('✅ PWA Manager: Service worker registered successfully')
      return registration

    } catch (error) {
      console.error(`❌ PWA Manager: Service worker registration failed (attempt ${retries + 1}):`, error)
      
      if (retries < AUTO_CHECK_CONFIG.MAX_RETRIES) {
        console.log(`🔄 PWA Manager: Retrying in ${AUTO_CHECK_CONFIG.RETRY_DELAY}ms...`)
        await new Promise(resolve => setTimeout(resolve, AUTO_CHECK_CONFIG.RETRY_DELAY))
        return registerServiceWorkerWithRetry(retries + 1)
      }
      
      return null
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

  // Public API for scheduling reminders
  const scheduleReminder = async (reminderData: ReminderData): Promise<boolean> => {
    try {
      const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      
      if (isIOS && iosNotificationManager) {
        // Use iOS notification manager for scheduling
        await iosNotificationManager.showNotification({
          title: reminderData.title,
          body: reminderData.description,
          data: reminderData,
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
        return true;
      }

      if (!isServiceWorkerReady) {
        console.warn('⚠️ PWA Manager: Service worker not ready')
        return false
      }

      console.log('📅 PWA Manager: Scheduling automatic reminder:', reminderData.goalId)

      await sendMessageToServiceWorker({
        type: 'SCHEDULE_REMINDER',
        reminder: reminderData
      })

      console.log('✅ PWA Manager: Reminder scheduled successfully')
      return true

    } catch (error) {
      console.error('❌ PWA Manager: Failed to schedule reminder:', error)
      return false
    }
  }

  // Public API for canceling reminders
  const cancelReminder = async (goalId: string): Promise<boolean> => {
    try {
      const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      
      if (isIOS && iosNotificationManager) {
        // iOS notifications are one-time, so no need to cancel
        return true;
      }

      if (!isServiceWorkerReady) {
        console.warn('⚠️ PWA Manager: Service worker not ready')
        return false
      }

      console.log('🚫 PWA Manager: Canceling reminder:', goalId)

      await sendMessageToServiceWorker({
        type: 'CANCEL_REMINDER',
        goalId: goalId
      })

      console.log('✅ PWA Manager: Reminder canceled successfully')
      return true

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
        badgeCount
      }
    }
  }, [isServiceWorkerReady, notificationPermission, badgeCount])

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
    }
  }
}