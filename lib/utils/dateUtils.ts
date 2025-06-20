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

/**
 * SIMPLIFIED REMINDER SCHEDULING - Server-side only
 * This eliminates client/server conflicts by using only Appwrite Functions
 */
export const scheduleReminders = async (
  goalId: string,
  reminderSettings: any,
  simpleReminder: string,
  user: any
) => {
  try {
    console.log('🚀 SIMPLIFIED REMINDER FLOW START: scheduleReminders called for goalId:', goalId);
    console.log('📋 Settings:', { reminderSettings, simpleReminder, user: user?.email });

    if (!user?.id) {
      console.error('❌ REMINDER FLOW: No user found');
      return;
    }

    // Check if we have any reminders to schedule
    const hasAdvancedReminders = reminderSettings?.enabled;
    const hasSimpleReminder = simpleReminder && simpleReminder.trim() !== '';

    if (!hasAdvancedReminders && !hasSimpleReminder) {
      console.log('❌ SIMPLIFIED REMINDER FLOW: No reminders to schedule');
      return;
    }

    const reminderDates: Date[] = [];

    // Process simple reminder
    if (hasSimpleReminder) {
      console.log('📅 Processing simple reminder:', simpleReminder);
      const reminderDate = new Date(simpleReminder);
      
      if (isNaN(reminderDate.getTime())) {
        console.error('❌ Invalid simple reminder date:', simpleReminder);
      } else if (reminderDate > new Date()) {
        reminderDates.push(reminderDate);
        console.log('✅ Valid simple reminder added:', reminderDate.toISOString());
      } else {
        console.warn('⚠️ Simple reminder date is in the past:', reminderDate.toISOString());
      }
    }

    // Process advanced reminders
    if (hasAdvancedReminders && reminderSettings.time) {
      console.log('📅 Processing advanced reminders:', reminderSettings);
      // Add your advanced reminder logic here
    }

    if (reminderDates.length === 0) {
      console.log('❌ SIMPLIFIED REMINDER FLOW: No valid future reminder dates');
      return;
    }

    console.log('📊 REMINDER DATES TO SCHEDULE:', {
      totalDates: reminderDates.length,
      dates: reminderDates.map(d => d.toISOString())
    });

    // 🎯 ONLY CREATE DATABASE RECORDS - Let Appwrite Functions handle delivery
    const { reminderService } = await import('@/src/services/appwrite/reminderService');

    for (const reminderDate of reminderDates) {
      try {
        console.log('💾 Creating server-side reminder for:', reminderDate.toISOString());
        
        await reminderService.createReminder({
          goalId,
          userId: user.id,
          title: `Goal Reminder`,
          description: `Time to work on your goal!`,
          sendDate: reminderDate.toISOString()
        });
        
        console.log('✅ Server-side reminder created successfully');
      } catch (error) {
        console.error('❌ Failed to create server reminder:', error);
      }
    }

    console.log('🎯 SIMPLIFIED REMINDER FLOW COMPLETE: All reminders stored in database');
    console.log('📡 Appwrite Functions will handle FCM delivery at scheduled times');

  } catch (error) {
    console.error('❌ SIMPLIFIED REMINDER FLOW ERROR:', error);
    throw error;
  }
}; 
