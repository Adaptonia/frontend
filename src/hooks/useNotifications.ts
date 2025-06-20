'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  requestNotificationPermission, 
  scheduleReminderNotification,
  cancelReminderNotification,
  playNotificationSound
} from '@/components/PWANotificationManager';
import { CreateReminderRequest, reminderService } from '../services/appwrite/reminderService';

export interface NotificationState {
  permission: NotificationPermission | null;
  isSupported: boolean;
  isServiceWorkerReady: boolean;
}

export interface UseNotificationsReturn {
  state: NotificationState;
  createReminder: (reminderData: CreateReminderRequest) => Promise<boolean>;
  cancelReminder: (goalId: string) => Promise<boolean>;
  testNotification: () => Promise<boolean>;
  requestPermission: () => Promise<boolean>;
  playSound: () => Promise<void>;
}

export const useNotifications = (): UseNotificationsReturn => {
  const [state, setState] = useState<NotificationState>({
    permission: null,
    isSupported: false,
    isServiceWorkerReady: false
  });

  // Initialize notification state
  useEffect(() => {
    const initializeNotifications = async () => {
      try {
        // Check if notifications are supported
        const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
        
        // Get current permission
        const permission = isSupported ? Notification.permission : null;
        
        // Check if service worker is ready
        let isServiceWorkerReady = false;
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            isServiceWorkerReady = !!registration.active;
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Service worker check failed';
            console.warn('Service worker check failed:', errorMessage);
          }
        }

        setState({
          permission,
          isSupported,
          isServiceWorkerReady
        });

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to initialize notifications';
        console.error('Notification initialization error:', errorMessage);
        
        setState({
          permission: null,
          isSupported: false,
          isServiceWorkerReady: false
        });
      }
    };

    initializeNotifications();

    // Listen for permission changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && 'Notification' in window) {
        setState(prevState => ({
          ...prevState,
          permission: Notification.permission
        }));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    try {
      const granted = await requestNotificationPermission();
      
      setState(prevState => ({
        ...prevState,
        permission: Notification.permission
      }));

      if (granted) {
        toast.success('Notifications enabled', {
          description: 'You\'ll receive reminders for your goals'
        });
      } else {
        toast.error('Notifications disabled', {
          description: 'Please enable notifications in your browser settings'
        });
      }

      return granted;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request notification permission';
      console.error('Permission request error:', errorMessage);
      
      toast.error('Permission request failed', {
        description: 'Unable to request notification permission'
      });
      
      return false;
    }
  }, []);

  // Create a new reminder
  const createReminder = useCallback(async (reminderData: CreateReminderRequest): Promise<boolean> => {
    try {
      // First ensure we have notification permission
      if (state.permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          toast.warning('Reminder created without notifications', {
            description: 'Enable notifications to receive alerts'
          });
          // Still create the reminder in database even without permission
        }
      }

      // Create reminder in database
      const reminder = await reminderService.createReminder(reminderData);
      
      // Schedule notification if service worker is ready
      if (state.isServiceWorkerReady) {
        await scheduleReminderNotification({
          goalId: reminder.goalId,
          title: reminder.title,
          description: reminder.description,
          sendDate: reminder.sendDate
        });
      }

      toast.success('Reminder created', {
        description: `Reminder set for ${reminder.title}`
      });

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create reminder';
      console.error('Create reminder error:', errorMessage);
      
      toast.error('Failed to create reminder', {
        description: errorMessage
      });
      
      return false;
    }
  }, [state.permission, state.isServiceWorkerReady, requestPermission]);

  // Cancel a reminder
  const cancelReminder = useCallback(async (goalId: string): Promise<boolean> => {
    try {
      // Cancel in service worker
      if (state.isServiceWorkerReady) {
        await cancelReminderNotification(goalId);
      }

      // Delete from database
      await reminderService.deleteRemindersByGoalId(goalId);

      toast.success('Reminder cancelled', {
        description: 'The reminder has been removed'
      });

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel reminder';
      console.error('Cancel reminder error:', errorMessage);
      
      toast.error('Failed to cancel reminder', {
        description: errorMessage
      });
      
      return false;
    }
  }, [state.isServiceWorkerReady]);

  // Test notification functionality
  const testNotification = useCallback(async (): Promise<boolean> => {
    try {
      // Request permission if needed
      if (state.permission !== 'granted') {
        const granted = await requestPermission();
        if (!granted) {
          return false;
        }
      }

      // Create test notification
      const testReminder = {
        goalId: 'test',
        title: 'Test Notification',
        description: 'This is a test notification from Adaptonia',
        sendDate: new Date().toISOString()
      };

      const success = await scheduleReminderNotification(testReminder);
      
      if (success) {
        toast.success('Test notification scheduled', {
          description: 'You should receive a notification shortly'
        });
        
        // Also play sound for immediate feedback
        await playSound();
      } else {
        toast.error('Test notification failed', {
          description: 'Unable to schedule test notification'
        });
      }

      return success;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Test notification failed';
      console.error('Test notification error:', errorMessage);
      
      toast.error('Test notification failed', {
        description: errorMessage
      });
      
      return false;
    }
  }, [state.permission, requestPermission]);

  // Play notification sound
  const playSound = useCallback(async (): Promise<void> => {
    try {
      await playNotificationSound();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to play notification sound';
      console.error('Play sound error:', errorMessage);
    }
  }, []);

  return {
    state,
    createReminder,
    cancelReminder,
    testNotification,
    requestPermission,
    playSound
  };
}; 
