'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { reminderService } from '../services/appwrite/reminderService';
import { scheduleReminderNotification, requestNotificationPermission } from '@/app/sw-register';

export const TestReminder = () => {
  const [isLoading, setIsLoading] = useState(false);

  const createTestReminder = async () => {
    try {
      setIsLoading(true);
      
      // Request permission first
      const hasPermission = await requestNotificationPermission();
      if (!hasPermission) {
        toast.error('Please allow notifications to test reminders');
        return;
      }

      // Create a reminder that triggers in 10 seconds
      const reminderTime = new Date();
      reminderTime.setSeconds(reminderTime.getSeconds() + 10);

      console.log('🧪 Creating test reminder for:', reminderTime.toLocaleString());

      // Create in database
      const reminder = await reminderService.createReminder({
        goalId: `test-${Date.now()}`,
        title: 'Test Reminder',
        description: 'This is a test reminder - should trigger in 10 seconds!',
        sendDate: reminderTime.toISOString(),
        userId: 'test-user'
      });

      console.log('✅ Reminder created in database:', reminder);

      // Schedule with service worker
      const scheduled = await scheduleReminderNotification({
        goalId: reminder.goalId,
        title: reminder.title,
        description: reminder.description,
        sendDate: reminder.sendDate
      });

      if (scheduled) {
        toast.success('Test reminder created!', {
          description: 'You should get a notification in 10 seconds'
        });
      } else {
        toast.error('Failed to schedule reminder with service worker');
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create test reminder';
      console.error('❌ Test reminder error:', errorMessage);
      toast.error('Test failed', {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='p-4 border rounded-lg bg-gray-50'>
      <h3 className='font-medium mb-2'>🧪 Test Reminder System</h3>
      <p className='text-sm text-gray-600 mb-4'>
        This will create a test reminder that triggers in 10 seconds
      </p>
      <button
        onClick={createTestReminder}
        disabled={isLoading}
        className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50'
      >
        {isLoading ? 'Creating...' : 'Create Test Reminder'}
      </button>
    </div>
  );
}; 