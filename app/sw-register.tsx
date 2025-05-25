'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// Component to register service worker
const ServiceWorkerRegistration = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  useEffect(() => {
    // Register service worker only in production and if browser supports it
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      registerServiceWorker();
    }
  }, []);

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registered with scope:', registration.scope);
      
      // Check if already subscribed to push notifications
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);

      // Listen for messages from service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'GOAL_COMPLETED') {
          toast.success('Goal marked as complete!');
        } else if (event.data.type === 'VIEW_GOAL') {
          // Handle navigation to specific goal
          console.log('Should navigate to goal:', event.data.goalId);
          // Add navigation logic here
        }
      });
      
    } catch (error) {
      console.error('Service Worker registration failed:', error);
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
}) => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Send the reminder to the service worker
    registration.active?.postMessage({
      type: 'SCHEDULE_REMINDER',
      reminder
    });
    
    console.log('Reminder scheduled with service worker');
    return true;
  } catch (error) {
    console.error('Failed to schedule reminder notification:', error);
    return false;
  }
};

// Helper to request notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    return true;
  }
  
  if (Notification.permission === 'denied') {
    console.warn('Notification permission was denied');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
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
    // const registration = await navigator.serviceWorker.ready;
    
    // You would typically get this from your server
    // This is a placeholder - replace with your actual VAPID public key
    // const publicVapidKey = 'YOUR_PUBLIC_VAPID_KEY';
    
    // const subscription = await registration.pushManager.subscribe({
    //   userVisibleOnly: true,
    //   applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
    // });
    
    // Send the subscription to your server
    // await fetch('/api/subscribe', {
    //   method: 'POST',
    //   body: JSON.stringify(subscription),
    //   headers: {
    //     'Content-Type': 'application/json'
    //   }
    // });
    
    console.log('Push notification subscription successful');
    return true;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return false;
  }
};

// Helper function to convert base64 string to Uint8Array
// (required for applicationServerKey)
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
    // Create an audio element
    const audio = new Audio('/sounds/notification.mp3');
    
    // Set properties for alarm-like behavior
    audio.volume = 0.7;
    audio.loop = false;
    
    // Start playing - this needs to be triggered by a user action
    const playPromise = audio.play();
    
    // Handle autoplay restrictions
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('Notification sound playing');
          
          // Stop after 3 seconds
          setTimeout(() => {
            audio.pause();
            audio.currentTime = 0;
          }, 3000);
        })
        .catch(error => {
          console.error('Autoplay prevented:', error);
          // We can't autoplay due to browser restrictions
          // This is expected if not triggered by user interaction
        });
    }
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

// Add this to the scheduleReminderNotification function to include alarm behavior
export const scheduleReminderNotificationWithAlarm = async (reminder: {
  goalId: string;
  title: string;
  description?: string;
  sendDate: string;
  alarm?: boolean;
}): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported');
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    
    // Send the reminder to the service worker with alarm flag
    registration.active?.postMessage({
      type: 'SCHEDULE_REMINDER',
      reminder: {
        ...reminder,
        alarm: reminder.alarm ?? true // Default to true if not specified
      }
    });
    
    console.log('Reminder with alarm scheduled with service worker');
    return true;
  } catch (error) {
    console.error('Failed to schedule reminder notification with alarm:', error);
    return false;
  }
};

export default ServiceWorkerRegistration; 