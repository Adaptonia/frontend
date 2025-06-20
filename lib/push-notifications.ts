/**
 * Push Notifications System for TRUE Background Notifications
 * This enables notifications to fire at exact times even when app is closed
 */

// VAPID keys for push notifications (you'll need to generate these)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'YOUR_VAPID_PUBLIC_KEY';

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface ScheduledNotification {
  id: string;
  userId: string;
  goalId: string;
  title: string;
  message: string;
  scheduledTime: string; // ISO string
  subscription: PushSubscription;
}

/**
 * Subscribe user to push notifications
 * This enables TRUE background notifications
 */
export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  try {
    // Check if service worker and push messaging are supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.error('Push messaging is not supported');
      return null;
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.error('Notification permission denied');
      return null;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Subscribe to push notifications
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });
    }

    // Convert to our format
    const pushSubscription: PushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: arrayBufferToBase64(subscription.getKey('auth')!)
      }
    };

    console.log('✅ Push subscription created:', pushSubscription);
    return pushSubscription;

  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Schedule a notification to be sent by the server at a specific time
 * This is what enables TRUE background notifications
 */
export async function scheduleServerPushNotification(notification: {
  goalId: string;
  title: string;
  message: string;
  scheduledTime: string; // ISO string
  userId?: string;
}): Promise<boolean> {
  try {
    // First, ensure user is subscribed to push notifications
    const subscription = await subscribeToPushNotifications();
    if (!subscription) {
      console.error('Failed to get push subscription');
      return false;
    }

    // Send to your server to schedule the notification
    const response = await fetch('/api/notifications/schedule', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        goalId: notification.goalId,
        title: notification.title,
        message: notification.message,
        scheduledTime: notification.scheduledTime,
        userId: notification.userId,
        subscription: subscription
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to schedule notification: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Server push notification scheduled:', result);
    return true;

  } catch (error) {
    console.error('Failed to schedule server push notification:', error);
    return false;
  }
}

/**
 * Cancel a scheduled notification
 */
export async function cancelServerPushNotification(goalId: string): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ goalId })
    });

    if (!response.ok) {
      throw new Error(`Failed to cancel notification: ${response.status}`);
    }

    console.log('✅ Server push notification cancelled for goal:', goalId);
    return true;

  } catch (error) {
    console.error('Failed to cancel server push notification:', error);
    return false;
  }
}

/**
 * Utility functions
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Check if push notifications are supported and enabled
 */
export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Get current push subscription status
 */
export async function getPushSubscriptionStatus(): Promise<{
  supported: boolean;
  subscribed: boolean;
  permission: NotificationPermission;
}> {
  const supported = isPushNotificationSupported();
  let subscribed = false;
  let permission: NotificationPermission = 'default';

  if (supported) {
    permission = Notification.permission;
    
    if (permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        subscribed = !!subscription;
      } catch (error) {
        console.error('Failed to check subscription status:', error);
      }
    }
  }

  return { supported, subscribed, permission };
} 
