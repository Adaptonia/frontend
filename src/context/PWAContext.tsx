'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { isPWASupported } from '../lib/pwa';
import { registerServiceWorker } from '../lib/pwa';
import { requestNotificationPermission } from '../lib/pwa';
import { subscribeToPushNotifications } from '../lib/pwa';
import { unsubscribeFromPushNotifications } from '../lib/pwa';
import { BeforeInstallPromptEvent } from '../lib/pwa-types';

// Define the context type
type PWAContextType = {
  isPWAInstalled: boolean;
  isNotificationsEnabled: boolean;
  serviceWorkerRegistration: ServiceWorkerRegistration | null;
  promptInstall: () => void;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<boolean>;
  sendTestNotification: () => void;
};

// Create the context
const PWAContext = createContext<PWAContextType | null>(null);

// PWA provider component
export const PWAProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPWAInstalled, setIsPWAInstalled] = useState<boolean>(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState<boolean>(false);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  // Handle the beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent Chrome from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setInstallPrompt(e);
    };

    // Check if the app is already installed by checking display-mode
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        console.log('App is already installed');
        setIsPWAInstalled(true);
      } else {
        console.log('App is not installed');
        setIsPWAInstalled(false);
      }
    };

    // Register service worker
    const initServiceWorker = async () => {
      if (isPWASupported()) {
        const registration = await registerServiceWorker();
        if (registration) {
          setServiceWorkerRegistration(registration);
          
          // Check if notification permission is granted
          if (Notification.permission === 'granted') {
            // Check if we have an active subscription
            const subscription = await registration.pushManager.getSubscription();
            setIsNotificationsEnabled(!!subscription);
          }
        }
      }
    };

    // Add event listener for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', ((e: Event) => {
      // Cast e to BeforeInstallPromptEvent
      const promptEvent = e as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      setInstallPrompt(promptEvent);
    }) as EventListener);
    
    // Add event listener for appinstalled event
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      setIsPWAInstalled(true);
      setInstallPrompt(null);
    });

    // Check if app is already installed
    checkIfInstalled();
    
    // Initialize service worker
    initServiceWorker();

    // Clean up
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    };
  }, []);

  // Function to prompt the user to install the app
  const promptInstall = () => {
    if (installPrompt) {
      // Show the install prompt
      (installPrompt as BeforeInstallPromptEvent).prompt();
      
      // Wait for the user to respond to the prompt
      (installPrompt as BeforeInstallPromptEvent).userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
          setIsPWAInstalled(true);
        } else {
          console.log('User dismissed the install prompt');
        }
        // Clear the saved prompt
        setInstallPrompt(null);
      });
    }
  };

  // Function to enable notifications
  const enableNotifications = async (): Promise<boolean> => {
    try {
      // Request notification permission
      const permission = await requestNotificationPermission();
      
      if (permission !== 'granted') {
        console.log('Notification permission was not granted');
        return false;
      }
      
      // Make sure we have a service worker registration
      if (!serviceWorkerRegistration) {
        const registration = await registerServiceWorker();
        if (!registration) return false;
        setServiceWorkerRegistration(registration);
      }
      
      // Subscribe to push notifications
      // You'll need to replace this with your actual VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
      
      if (!vapidPublicKey) {
        console.error('VAPID public key is missing');
        return false;
      }
      
      const subscription = await subscribeToPushNotifications(
        serviceWorkerRegistration as ServiceWorkerRegistration,
        vapidPublicKey
      );
      
      if (subscription) {
        setIsNotificationsEnabled(true);
        return true;
      }
      
      return false;
    } catch (error : unknown) {
      console.error('Error enabling notifications:', error);
      return false;
    }
  };

  // Function to disable notifications
  const disableNotifications = async (): Promise<boolean> => {
    try {
      if (!serviceWorkerRegistration) {
        return false;
      }
      
      const result = await unsubscribeFromPushNotifications(serviceWorkerRegistration);
      
      if (result) {
        setIsNotificationsEnabled(false);
      }
      
      return result;
    } catch (error : unknown ) {
      console.error('Error disabling notifications:', error);
      return false;
    }
  };

  // Function to send a test notification
  const sendTestNotification = () => {
    if (serviceWorkerRegistration && isNotificationsEnabled) {
      serviceWorkerRegistration.showNotification('Adaptonia', {
        body: 'This is a test notification from Adaptonia',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        // vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          url: window.location.href
        }
      });
    } else {
      console.log('Cannot send notification: service worker or notifications not enabled');
    }
  };

  return (
    <PWAContext.Provider 
      value={{ 
        isPWAInstalled, 
        isNotificationsEnabled, 
        serviceWorkerRegistration,
        promptInstall,
        enableNotifications,
        disableNotifications,
        sendTestNotification
      }}
    >
      {children}
    </PWAContext.Provider>
  );
};

// Custom hook to use the PWA context
export const usePWA = () => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}; 