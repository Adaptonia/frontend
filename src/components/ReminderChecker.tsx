'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
// import { reminderService } from '@/services/appwrite/reminderService';
import { scheduleReminderNotification, requestNotificationPermission } from '@/app/sw-register';
import { Reminder, reminderService } from '../services/appwrite/reminderService';

export function ReminderChecker() {
  const reminderToastShown = useRef<Set<string>>(new Set());
  const isProcessing = useRef(false);

  const processReminder = async (reminder: Reminder) => {
    try {
      // Try to schedule/trigger the notification
      if (typeof window !== 'undefined') {
        // Request notification permission if not already granted
        const hasPermission = await requestNotificationPermission();
        
        if (hasPermission) {
          // Schedule immediate notification (current time)
          await scheduleReminderNotification({
            goalId: reminder.goalId,
            title: reminder.title,
            description: reminder.description || 'Time for your goal!',
            sendDate: new Date().toISOString() // Send immediately
          });
        }
      }

      // Mark as sent in database
      await reminderService.markReminderAsSent(reminder.id);

      // Show success toast only once per reminder
      if (!reminderToastShown.current.has(reminder.id)) {
        toast.success('Reminder sent', {
          description: `${reminder.title} notification triggered`
        });
        reminderToastShown.current.add(reminder.id);
      }

      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process reminder';
      console.error('Reminder processing error:', errorMessage);
      
      // Update retry count
      const newRetryCount = (reminder.retryCount || 0) + 1;
      
      if (newRetryCount >= 3) {
        // Mark as failed after max retries
        await reminderService.markReminderAsFailed(reminder.id);
        
        if (!reminderToastShown.current.has(reminder.id)) {
          toast.error('Reminder failed', {
            description: `${reminder.title} - maximum retries exceeded`
          });
          reminderToastShown.current.add(reminder.id);
        }
      } else {
        // Update retry count for next attempt
        await reminderService.updateRetryCount(reminder.id, newRetryCount);
        
        if (!reminderToastShown.current.has(`${reminder.id}-retry`)) {
          toast.warning('Reminder retry scheduled', {
            description: `${reminder.title} - attempt ${newRetryCount + 1}/3`
          });
          reminderToastShown.current.add(`${reminder.id}-retry`);
        }
      }
      
      return false;
    }
  };

  const checkAndProcessReminders = async () => {
    // Prevent multiple simultaneous processing
    if (isProcessing.current) {
      return;
    }

    try {
      isProcessing.current = true;

      const dueReminders = await reminderService.getDueReminders();

      if (dueReminders.length === 0) {
        return;
      }

      console.log(`Processing ${dueReminders.length} due reminders`);

      // Process each reminder
      await Promise.allSettled(
        dueReminders.map(reminder => processReminder(reminder))
      );

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to check reminders';
      console.error('Reminder checking error:', errorMessage);
      
      // Don't show toast for general checking errors to avoid spam
      // Only log for debugging purposes
    } finally {
      isProcessing.current = false;
    }
  };

  useEffect(() => {
    // Store ref value to avoid stale closure
    const toastSet = reminderToastShown.current;

    // Initial check after component mounts
    const initialTimeout = setTimeout(() => {
      checkAndProcessReminders();
    }, 1000); // Wait 1 second to ensure everything is loaded

    // Then check every minute
    const interval = setInterval(checkAndProcessReminders, 60 * 1000);

    // Cleanup function
    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
      toastSet.clear();
      isProcessing.current = false;
    };
  }, []);

  // This component doesn't render anything - it's just for background processing
  return null;
} 