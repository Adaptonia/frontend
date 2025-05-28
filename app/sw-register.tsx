'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

// Component to register service worker
const ServiceWorkerRegistration = () => {
  useEffect(() => {
    // Register service worker in both production and development for testing
    if ('serviceWorker' in navigator) {
      registerServiceWorker();
    } else {
      console.warn('Service Workers not supported in this browser');
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      // Always register service worker for reminder functionality
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      
      console.log('✅ Service Worker registered successfully with scope:', registration.scope);
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready;
      console.log('✅ Service Worker is ready');
      
      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
      
      // Handle service worker updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('🔄 New service worker available, consider refreshing');
            }
          });
        }
      });
      
      // Show confirmation that service worker is working
      setTimeout(() => {
        console.log('🔔 Reminder system is now active');
      }, 1000);
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Service Worker registration failed';
      console.error('❌ Service Worker registration failed:', errorMessage);
      toast.error('Notification system unavailable', {
        description: 'Service worker failed to register. Reminders may not work.'
      });
    }
  };

  const handleServiceWorkerMessage = (event: MessageEvent) => {
    try {
      const { type, data } = event.data;
      console.log('📨 Service Worker message received:', type, data);
      
      switch (type) {
        case 'GOAL_COMPLETED':
          toast.success('Goal marked as complete!', {
            description: 'Great job on achieving your goal!'
          });
          break;
          
        case 'VIEW_GOAL':
          console.log('🎯 Should navigate to goal:', data?.goalId);
          // Navigation logic can be handled by parent components
          break;
          
        case 'PLAY_NOTIFICATION_SOUND':
          console.log('🔊 Playing notification sound');
          playNotificationSound();
          break;
          
        case 'REMINDER_SNOOZED':
          toast.info('Reminder snoozed', {
            description: 'You\'ll be reminded again in 5 minutes'
          });
          break;
          
        default:
          console.log('❓ Unknown service worker message:', type);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to handle service worker message';
      console.error('❌ Service worker message handling error:', errorMessage);
    }
  };

  return null; // This component doesn't render anything
};

// Helper function to schedule reminders through the service worker
export const scheduleReminderNotification = async (reminder: {
  goalId: string;
  title: string;
  description?: string;
  sendDate: string;
}): Promise<boolean> => {
  console.log('⏰ Scheduling reminder notification:', reminder);
  
  if (!('serviceWorker' in navigator)) {
    console.warn('❌ Service Workers not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (!registration.active) {
      console.warn('❌ No active service worker found');
      return false;
    }
    
    // Send the reminder to the service worker
    registration.active.postMessage({
      type: 'SCHEDULE_REMINDER',
      reminder
    });
    
    console.log('✅ Reminder scheduled with service worker for goal:', reminder.goalId);
    console.log('📅 Reminder will trigger at:', new Date(reminder.sendDate).toLocaleString());
    
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to schedule reminder notification';
    console.error('❌ Failed to schedule reminder notification:', errorMessage);
    return false;
  }
};

// Helper function to cancel a reminder
export const cancelReminderNotification = async (goalId: string): Promise<boolean> => {
  console.log('🚫 Cancelling reminder for goal:', goalId);
  
  if (!('serviceWorker' in navigator)) {
    console.warn('❌ Service Workers not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (!registration.active) {
      console.warn('❌ No active service worker found');
      return false;
    }
    
    registration.active.postMessage({
      type: 'CANCEL_REMINDER',
      goalId
    });
    
    console.log('✅ Reminder cancelled for goal:', goalId);
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to cancel reminder notification';
    console.error('❌ Failed to cancel reminder notification:', errorMessage);
    return false;
  }
};

// Helper to request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  console.log('🔔 Requesting notification permission...');
  
  if (!('Notification' in window)) {
    console.warn('❌ This browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    console.log('✅ Notification permission already granted');
    return true;
  }
  
  if (Notification.permission === 'denied') {
    console.warn('❌ Notification permission was denied');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    
    if (granted) {
      console.log('✅ Notification permission granted');
    } else {
      console.warn('❌ Notification permission not granted:', permission);
    }
    
    return granted;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error requesting notification permission';
    console.error('❌ Error requesting notification permission:', errorMessage);
    return false;
  }
};

// Subscribe to push notifications (for server-sent notifications)
export const subscribeToPushNotifications = async (): Promise<boolean> => {
  if (!('PushManager' in window)) {
    console.warn('Push notifications not supported');
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      console.log('Already subscribed to push notifications');
      return true;
    }
    
    // Note: You would need to implement VAPID keys for production push notifications
    // For now, this is commented out as it requires server-side setup
    
    /*
    const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    
    if (!publicVapidKey) {
      console.warn('VAPID public key not configured');
      return false;
    }
    
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    });
    
    // Send the subscription to your server
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to subscribe on server');
    }
    */
    
    console.log('Push notification subscription setup (VAPID keys needed for production)');
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error subscribing to push notifications';
    console.error('Error subscribing to push notifications:', errorMessage);
    return false;
  }
};

// Helper function to convert base64 string to Uint8Array (for VAPID keys)
// function urlBase64ToUint8Array(base64String: string): Uint8Array {
//   const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
//   const base64 = (base64String + padding)
//     .replace(/-/g, '+')
//     .replace(/_/g, '/');

//   const rawData = window.atob(base64);
//   const outputArray = new Uint8Array(rawData.length);

//   for (let i = 0; i < rawData.length; ++i) {
//     outputArray[i] = rawData.charCodeAt(i);
//   }
  
//   return outputArray;
// }

// Play a notification sound when a reminder is triggered
export const playNotificationSound = async (): Promise<void> => {
  try {
    console.log('🔊 Attempting to play notification sound...');
    
    // Create an audio element with multiple sound options
    const soundSources = [
      '/sounds/notification.wav',
      '/sounds/notification.mp3',
      '/sounds/notification.ogg'
    ];
    
    let audio: HTMLAudioElement | null = null;
    
    // Try each sound source until one works
    for (const source of soundSources) {
      try {
        audio = new Audio(source);
        
        // Test if the audio can be loaded
        const canPlay = audio.canPlayType('audio/wav') || audio.canPlayType('audio/mp3') || audio.canPlayType('audio/ogg');
        if (canPlay) {
          console.log('✅ Found compatible audio source:', source);
          break;
        }
      } catch {
        console.warn('⚠️ Failed to load audio source:', source);
        continue;
      }
    }
    
    if (!audio) {
      console.warn('❌ No compatible audio source found');
      return;
    }
    
    // Set properties for notification sound
    audio.volume = 0.7;
    audio.loop = false;
    
    // Start playing - this needs to be triggered by a user action
    const playPromise = audio.play();
    
    // Handle autoplay restrictions
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('✅ Notification sound playing');
          
          // Stop after 3 seconds to prevent long-running audio
          setTimeout(() => {
            if (audio) {
              audio.pause();
              audio.currentTime = 0;
            }
          }, 3000);
        })
        .catch((error: unknown) => {
          const errorMessage = error instanceof Error ? error.message : 'Autoplay prevented';
          console.warn('⚠️ Autoplay prevented:', errorMessage);
          // This is expected if not triggered by user interaction
        });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error playing notification sound';
    console.error('❌ Error playing notification sound:', errorMessage);
  }
};

// Enhanced function to schedule reminders with alarm support
export const scheduleReminderNotificationWithAlarm = async (reminder: {
  goalId: string;
  title: string;
  description?: string;
  sendDate: string;
  alarm?: boolean;
}): Promise<boolean> => {
  console.log('⏰🔊 Scheduling reminder with alarm:', reminder);
  
  if (!('serviceWorker' in navigator)) {
    console.warn('❌ Service Workers not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    if (!registration.active) {
      console.warn('❌ No active service worker found');
      return false;
    }
    
    // Send the reminder to the service worker with alarm flag
    registration.active.postMessage({
      type: 'SCHEDULE_REMINDER',
      reminder: {
        ...reminder,
        alarm: reminder.alarm ?? true // Default to true if not specified
      }
    });
    
    console.log('✅ Reminder with alarm scheduled for goal:', reminder.goalId);
    return true;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to schedule reminder notification with alarm';
    console.error('❌ Failed to schedule reminder notification with alarm:', errorMessage);
    return false;
  }
};

export default ServiceWorkerRegistration; 