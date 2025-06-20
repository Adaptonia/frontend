'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

/**
 * BackgroundReminderChecker - Triggers manual reminder checks when app opens
 * This ensures notifications work even when the app was closed on mobile
 */
export function BackgroundReminderChecker() {
  const isInitialized = useRef(false);
  const lastCheckTime = useRef(0);

  const triggerReminderCheck = async () => {
    try {
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Workers not supported');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      
      if (!registration.active) {
        console.warn('No active service worker found');
        return;
      }

      console.log('🔍 Triggering background reminder check...');
      
      // Send message to service worker to check for due reminders
      registration.active.postMessage({
        type: 'CHECK_DUE_REMINDERS'
      });

      // Update last check time
      lastCheckTime.current = Date.now();
      
    } catch (error) {
      console.error('Failed to trigger reminder check:', error);
    }
  };

  const handleVisibilityChange = () => {
    // When app becomes visible, check for due reminders
    if (!document.hidden) {
      console.log('📱 App became visible - checking for missed reminders');
      
      // Only check if it's been more than 30 seconds since last check
      if (Date.now() - lastCheckTime.current > 30000) {
        triggerReminderCheck();
      }
    }
  };

  const handlePageFocus = () => {
    // When page gets focus, check for due reminders
    console.log('🎯 App focused - checking for due reminders');
    
    // Only check if it's been more than 30 seconds since last check
    if (Date.now() - lastCheckTime.current > 30000) {
      triggerReminderCheck();
    }
  };

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Initial check when component mounts
    setTimeout(() => {
      console.log('🚀 Initial background reminder check on app start');
      triggerReminderCheck();
    }, 2000); // Wait 2 seconds for everything to initialize

    // Check when page becomes visible (user switches back to app)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Check when window gets focus
    window.addEventListener('focus', handlePageFocus);

    // Periodic check every 2 minutes while app is open
    const periodicCheckInterval = setInterval(() => {
      if (!document.hidden) {
        console.log('⏰ Periodic reminder check while app is open');
        triggerReminderCheck();
      }
    }, 2 * 60 * 1000); // Every 2 minutes

    // Listen for service worker messages
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      const { type, count } = event.data;
      
      if (type === 'REMINDERS_CHECKED') {
        if (count > 0) {
          console.log(`✅ Background check found ${count} due reminders`);
        }
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    // Cleanup
    return () => {
      clearInterval(periodicCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handlePageFocus);
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  // This component doesn't render anything
  return null;
}

export default BackgroundReminderChecker; 
