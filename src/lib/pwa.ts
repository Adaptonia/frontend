// Check if the browser supports service workers
export const isPWASupported = () => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

// Register service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isPWASupported()) {
    console.log('Service workers are not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });
    
    console.log('Service Worker registered successfully:', registration.scope);
    
    if (registration.installing) {
      console.log('Service Worker installing');
    } else if (registration.waiting) {
      console.log('Service Worker installed but waiting');
      // You can notify the user that there's an update available
    } else if (registration.active) {
      console.log('Service Worker active');
    }
    
    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return null;
  }
};

// Convert a URL-safe base64 string to Uint8Array for the application server key
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
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

// Subscribe to push notifications
export const subscribeToPushNotifications = async (
  registration: ServiceWorkerRegistration,
  publicVapidKey: string
): Promise<PushSubscription | null> => {
  try {
    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('Already subscribed to push notifications');
      return subscription;
    }
    
    // Create new subscription
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
    });
    
    console.log('Subscribed to push notifications:', subscription);
    
    // Here you would typically send the subscription to your backend
    // This depends on your backend setup
    // await sendSubscriptionToBackend(subscription);
    
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async (
  registration: ServiceWorkerRegistration
): Promise<boolean> => {
  try {
    const subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.log('No subscription to unsubscribe from');
      return true;
    }
    
    // Unsubscribe
    const unsubscribed = await subscription.unsubscribe();
    
    if (unsubscribed) {
      console.log('Successfully unsubscribed from push notifications');
      // Here you would typically inform your backend
      // await removeSubscriptionFromBackend(subscription);
    }
    
    return unsubscribed;
  } catch (error) {
    console.error('Failed to unsubscribe from push notifications:', error);
    return false;
  }
};

// Check permission status for notifications
export const checkNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return 'denied';
  }
  
  return Notification.permission;
};

// Request permission for notifications
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return 'denied';
  }
  
  // Check if permission is already granted
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return 'denied';
  }
}; 