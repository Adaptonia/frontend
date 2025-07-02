// Simple date utility functions to replace date-fns
export const formatDistanceToNow = (date: Date): string => {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInMinutes < 1) {
    return 'just now'
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }
}

export const formatTime = (date: string | Date): string => {
  try {
    const messageDate = typeof date === 'string' ? new Date(date) : date
    const now = new Date()
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return formatDistanceToNow(messageDate)
    } else {
      return messageDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
  } catch {
    return ''
  }
}

// Schedule reminders based on settings
export const scheduleReminders = async (
  goalId: string,
  reminderSettings: any,
  simpleReminder: string,
  user: any
) => {
  try {
    console.log('🔄 SCHEDULE REMINDERS: Starting for goal:', goalId);
    console.log('📋 SCHEDULE REMINDERS: Full input:', {
      goalId,
      reminderSettings,
      simpleReminder,
      userId: user?.id
    });
    
    // Import the reminder service
    const { reminderService } = await import('@/services/appwrite/reminderService');
    
    if (!user?.id) {
      console.error('❌ SCHEDULE REMINDERS: No user ID provided');
      throw new Error('User ID is required for scheduling reminders');
    }

    // Handle advanced reminder settings
    if (reminderSettings?.enabled) {
      console.log('🎯 SCHEDULE REMINDERS: Processing advanced settings');
      
      const { date, time, interval, count } = reminderSettings;
      console.log('⏰ SCHEDULE REMINDERS: Parsed settings:', { date, time, interval, count });
      
      if (!date || !time) {
        console.error('❌ SCHEDULE REMINDERS: Missing date or time');
        throw new Error('Date and time are required for reminders');
      }

      // Create base reminder date/time
      const [hours, minutes] = time.split(':').map(Number);
      const baseDate = new Date(date);
      baseDate.setHours(hours, minutes, 0, 0);
      
      console.log('📅 SCHEDULE REMINDERS: Base date/time:', baseDate.toISOString());

      // Generate reminders based on interval
      const reminders = [];
      
      for (let i = 0; i < count; i++) {
        const reminderDate = new Date(baseDate);
        
        // Calculate the date for this reminder based on interval
        switch (interval) {
          case 'daily':
            reminderDate.setDate(baseDate.getDate() + i);
            break;
          case 'weekly':
            reminderDate.setDate(baseDate.getDate() + (i * 7));
            break;
          case 'biweekly':
            reminderDate.setDate(baseDate.getDate() + (i * 14));
            break;
          case 'monthly':
            reminderDate.setMonth(baseDate.getMonth() + i);
            break;
          case 'once':
          default:
            if (i > 0) continue;
            break;
        }

        // Only schedule future reminders
        if (reminderDate > new Date()) {
          console.log(`📍 SCHEDULE REMINDERS: Adding reminder ${i + 1}/${count} for:`, reminderDate.toISOString());
          reminders.push({
            goalId: goalId,
            userId: user.id,
            title: `Goal Reminder`,
            description: `Time to work on your goal!`,
            sendDate: reminderDate.toISOString()
          });
        } else {
          console.log(`⚠️ SCHEDULE REMINDERS: Skipping past date for reminder ${i + 1}:`, reminderDate.toISOString());
        }
      }

      console.log('📋 SCHEDULE REMINDERS: Generated reminders:', reminders);

      // Create reminders in the database
      for (const reminderData of reminders) {
        try {
          console.log('💾 SCHEDULE REMINDERS: Creating reminder:', reminderData);
          const createdReminder = await reminderService.createReminder(reminderData);
          console.log('✅ Reminder created:', createdReminder.id);
        } catch (error) {
          console.error('❌ Failed to create reminder:', error);
        }
      }
    } else {
      console.log('ℹ️ SCHEDULE REMINDERS: Advanced reminders not enabled');
    }

    // Handle simple reminder
    if (simpleReminder && simpleReminder.trim()) {
      try {
        console.log('🔄 SCHEDULE REMINDERS: Processing simple reminder:', simpleReminder);
        const reminderDate = new Date(simpleReminder);
        
        if (reminderDate > new Date()) {
          const simpleReminderData = {
            goalId: goalId,
            userId: user.id,
            title: `Goal Reminder`,
            description: `Simple reminder for your goal.`,
            sendDate: reminderDate.toISOString()
          };

          console.log('💾 SCHEDULE REMINDERS: Creating simple reminder:', simpleReminderData);
          const createdReminder = await reminderService.createReminder(simpleReminderData);
          console.log('✅ Simple reminder created:', createdReminder.id);
        } else {
          console.log('⚠️ SCHEDULE REMINDERS: Simple reminder date is in the past:', reminderDate.toISOString());
        }
      } catch (error) {
        console.error('❌ Failed to create simple reminder:', error);
      }
    } else {
      console.log('ℹ️ SCHEDULE REMINDERS: No simple reminder provided');
    }

    return true;
  } catch (error) {
    console.error('❌ Error scheduling reminders:', error);
    throw error;
  }
}; 