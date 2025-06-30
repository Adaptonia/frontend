'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { requestNotificationPermission as requestFirebasePermission, onMessageListener } from '@/lib/firebase'
import { pushNotificationService } from '@/lib/appwrite/push-notifications'
import { account } from '@/lib/appwrite/config'

interface PWANotificationManagerProps {
  children?: React.ReactNode
}

// Simplified PWA Manager - Firebase messaging only
export default function PWANotificationManager({ children }: PWANotificationManagerProps) {
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default')
  const [badgeCount, setBadgeCount] = useState(0)

  useEffect(() => {
    initializePWA()
  }, [])

  const initializePWA = async () => {
    try {
      console.log('🚀 PWA Manager: Initializing Firebase messaging system')

      // Check if running on iOS
      const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
      
      if (isIOS) {
        console.log('📱 PWA Manager: iOS device detected')
      }

      // Register service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        console.error('❌ PWA Manager: Failed to register service worker');
        return;
      }

      // Set up service worker communication
      setupServiceWorkerCommunication();

      // Request notification permission
      const permission = await requestNotificationPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        console.log('✅ PWA Manager: Notification permission granted');
        setIsServiceWorkerReady(true);
        
        // Only attempt Firebase token generation on non-iOS devices
        if (!isIOS) {
          try {
            const fcmToken = await requestFirebasePermission();
            if (fcmToken) {
              // Store FCM token in Appwrite
              try {
                const user = await account.get();
                await pushNotificationService.storePushToken(user.$id, fcmToken);
                console.log('✅ PWA Manager: FCM token stored in Appwrite');
              } catch (error) {
                console.error('❌ PWA Manager: Failed to store FCM token:', error);
              }
            }
          } catch (error) {
            console.warn('⚠️ PWA Manager: Firebase setup failed:', error);
          }
        }
      } else {
        console.warn('⚠️ PWA Manager: Notification permission denied');
        setIsServiceWorkerReady(true); // Still mark as ready for other PWA features
      }

      // Set up foreground message listener
      try {
        onMessageListener().then((payload: any) => {
          console.log('📱 PWA Manager: Received foreground message:', payload);
          toast(payload.notification.title, {
            description: payload.notification.body,
            duration: 5000
          });
        }).catch(err => console.log('📱 PWA Manager: Foreground messages handled by service worker'));
      } catch (error) {
        console.log('📱 PWA Manager: Foreground messages will be handled by service worker');
      }

    } catch (error) {
      console.error('❌ PWA Manager: Initialization failed:', error)
      toast.error('Failed to initialize notifications')
    }
  }

  const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    try {
      console.log('🔄 PWA Manager: Registering service worker');
      
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      console.log('✅ PWA Manager: Service worker registered');
      
      await navigator.serviceWorker.ready;

      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      
      if (registration.active) {
        registration.active.postMessage({ type: 'ACTIVATE_WORKER' });
      }

      console.log('✅ PWA Manager: Service worker activated');
      return registration;

    } catch (error) {
      console.error('❌ PWA Manager: Service worker registration failed:', error);
      toast.error('Failed to initialize PWA. Please refresh the page.');
      return null;
    }
  }

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
      console.error('❌ PWA Manager: Failed to request permission:', error)
      return 'denied'
    }
  }

  const setupServiceWorkerCommunication = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage)
    }
  }

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    try {
      const { type, count, goalId } = event.data

      // Handle GET_USER_ID requests from service worker
      if (type === 'GET_USER_ID' && event.ports && event.ports[0]) {
        (async () => {
          try {
            const user = await account.get();
            event.ports[0].postMessage({ userId: user.$id });
            console.log('📱 PWA Manager: Sent user ID to service worker:', user.$id);
          } catch (error) {
            console.error('❌ PWA Manager: Failed to get user ID:', error);
            event.ports[0].postMessage({ userId: null });
          }
        })();
        return;
      }

      switch (type) {
        case 'BADGE_COUNT_UPDATED':
          setBadgeCount(count || 0)
          break

        case 'PLAY_NOTIFICATION_SOUND':
          playNotificationSound()
          break

        case 'NOTIFICATION_CLICKED':
          console.log('📱 PWA Manager: Notification clicked for goal:', goalId)
          break

        default:
          console.log('📱 PWA Manager: Unknown message type:', type)
      }

    } catch (error) {
      console.error('❌ PWA Manager: Failed to handle service worker message:', error)
    }
  }

  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/notification.mp3')
      audio.volume = 0.7
      audio.play().catch(error => {
        console.error('❌ PWA Manager: Failed to play notification sound:', error)
      })
    } catch (error) {
      console.error('❌ PWA Manager: Failed to create audio:', error)
    }
  }

  // Expose basic API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.PWANotificationManager = {
        isReady: isServiceWorkerReady,
        permission: notificationPermission,
        badgeCount: badgeCount
      }
    }
  }, [isServiceWorkerReady, notificationPermission, badgeCount])

  return (
    <>
      {children}
    </>
  )
}

// Simplified exports
declare global {
  interface Window {
    PWANotificationManager: {
      isReady: boolean
      permission: NotificationPermission
      badgeCount: number
    }
  }
}

export const getBadgeCount = (): number => {
  return typeof window !== 'undefined' && window.PWANotificationManager ? window.PWANotificationManager.badgeCount : 0
}

export const updateBadgeCount = async (count: number): Promise<void> => {
  try {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'UPDATE_BADGE_COUNT',
        data: { count }
      })
    }
  } catch (error) {
    console.error('❌ Failed to update badge count:', error)
  }
}

export const clearBadgeCount = async (): Promise<void> => {
  return updateBadgeCount(0)
}

export const playNotificationSound = async (): Promise<void> => {
  try {
    const audio = new Audio('/sounds/notification.mp3')
    audio.volume = 0.7
    await audio.play()
  } catch (error) {
    console.error('❌ Failed to play notification sound:', error)
  }
} 