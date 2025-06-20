'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Reminder, reminderService } from '../services/appwrite/reminderService';
// import { reminderService, type Reminder } from '@/services/appwrite/reminderService';

interface ReminderStatusProps {
  goalId: string;
  className?: string;
}

export const ReminderStatus = ({ goalId, className = '' }: ReminderStatusProps) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReminders = async () => {
      try {
        setIsLoading(true);
        const goalReminders = await reminderService.getRemindersByGoalId(goalId);
        setReminders(goalReminders);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load reminders';
        console.error('Error loading reminders:', errorMessage);
        setReminders([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadReminders();

    // Refresh reminders every 30 seconds
    const interval = setInterval(loadReminders, 30000);
    
    return () => clearInterval(interval);
  }, [goalId]);

  const getBadgeVariant = (status: Reminder['status']) => {
    switch (status) {
      case 'sent':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'pending':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric'
        }),
        time: date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid date format';
      console.error('Date formatting error:', errorMessage);
      return { date: 'Invalid date', time: '' };
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <div className='w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin'></div>
        <span className='text-sm text-gray-500'>Loading reminders...</span>
      </div>
    );
  }

  if (reminders.length === 0) {
    return (
      <div className={`text-sm text-gray-400 ${className}`}>
        No reminders set
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {reminders.map((reminder) => {
        const { date, time } = formatDateTime(reminder.sendDate);
        const showRetryInfo = reminder.status === 'pending' && reminder.retryCount > 0;
        
        return (
          <div 
            key={reminder.id} 
            className='flex items-center justify-between gap-2 p-2 bg-gray-50 rounded-md'
          >
            <div className='flex items-center gap-2 flex-1 min-w-0'>
              <Badge variant={getBadgeVariant(reminder.status)}>
                {reminder.status}
              </Badge>
              
              <div className='flex-1 min-w-0'>
                <div className='text-sm font-medium truncate'>
                  {reminder.title}
                </div>
                <div className='text-xs text-gray-500'>
                  {date} at {time}
                  {showRetryInfo && (
                    <span className='ml-2 text-orange-600'>
                      (Retry {reminder.retryCount}/3)
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {reminder.status === 'failed' && (
              <div className='text-xs text-red-500'>
                Max retries exceeded
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}; 
