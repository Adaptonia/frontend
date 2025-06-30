import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { account } from '@/lib/appwrite/config';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
let messaging: any = null;

if (typeof window !== 'undefined') {
  messaging = getMessaging(app);
}

// Request permission and get FCM token
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    if (!messaging) {
      console.warn('Firebase messaging not initialized');
      return null;
    }

    // First register service worker
    await registerServiceWorker();

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied');
      return null;
    }

    // Debug VAPID key
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    console.log('🔑 VAPID Key loaded:', vapidKey ? `${vapidKey.substring(0, 20)}...` : 'NOT FOUND');
    
    if (!vapidKey) {
      console.error('❌ VAPID key is missing! Check NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variable');
      return null;
    }

    // Get FCM token
    const currentToken = await getToken(messaging, {
      vapidKey: vapidKey
    });

    if (currentToken) {
      console.log('FCM Token:', currentToken);
      
      // Get current user ID and store token directly using push notification service
      try {
        const user = await account.get();
        console.log('👤 Current user ID:', user.$id);
        
        // Import and use the push notification service directly
        const { pushNotificationService } = await import('@/lib/appwrite/push-notifications');
        await pushNotificationService.storePushToken(user.$id, currentToken);
        console.log('✅ FCM token stored successfully in Appwrite');
      } catch (error) {
        console.error('❌ Failed to get user or store FCM token:', error);
      }
      
      return currentToken;
    } else {
      console.warn('No registration token available');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

// Handle foreground messages
export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) {
      console.warn('Firebase messaging not initialized');
      return;
    }

    onMessage(messaging, (payload) => {
      console.log('Message received:', payload);
      resolve(payload);
    });
  });

// Service Worker registration for FCM (now uses unified service worker)
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      // Use the unified service worker that includes Firebase functionality
      const registration = await navigator.serviceWorker.getRegistration('/');
      
      if (registration) {
        console.log('Using existing unified service worker for Firebase');
        // Send activation message to ensure Firebase is initialized
        if (registration.active) {
          registration.active.postMessage({ type: 'ACTIVATE_WORKER' });
        }
        return registration;
      } else {
        console.warn('No unified service worker found - should be registered by PWANotificationManager');
        return null;
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

// Add this to a useEffect or button click handler
const token = await requestNotificationPermission();
console.log('FCM Token:', token);
