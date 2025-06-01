'use client';

import { ID, Query } from 'appwrite';
import { databases, DATABASE_ID, REMINDERS_COLLECTION_ID } from './client';
// import { scheduleReminderNotification } from '@/app/sw-register';

// Interface for creating a reminder
export interface CreateReminderRequest {
  goalId: string;
  userId?: string;
  title: string;
  description?: string;
  sendDate: string;
  dueDate?: string;
}

// Enhanced reminder interface with status management
export interface Reminder {
  id: string;
  goalId: string;
  userId: string;
  title: string;
  description?: string;
  sendDate: string;
  dueDate?: string;
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  nextRetry?: string;
}

// Configuration for reminder service
const CONFIG = {
  maxRetries: 3,
  retryDelay: 30 * 60 * 1000, // 30 minutes
} as const;

// Validate environment variables
const validateConfig = () => {
  if (!DATABASE_ID || !REMINDERS_COLLECTION_ID) {
    throw new Error(`Reminder service configuration error. 
      Database ID: ${DATABASE_ID}, 
      Collection ID: ${REMINDERS_COLLECTION_ID}`
    );
  }
};

// Enhanced reminder service with professional error handling and retry mechanisms
class ReminderService {
  /**
   * Create a new reminder with enhanced error handling
   */
  async createReminder(reminderData: CreateReminderRequest): Promise<Reminder> {
    try {
      validateConfig();
      
      // First create the reminder in the database
      const response = await databases.createDocument(
        DATABASE_ID,
        REMINDERS_COLLECTION_ID,
        ID.unique(),
        {
          ...reminderData,
          userId: reminderData.userId || 'system',
          status: 'pending',
          retryCount: 0,
          isCompleted: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );

      const reminder: Reminder = {
        id: response.$id,
        goalId: response.goalId,
        userId: response.userId,
        title: response.title,
        description: response.description,
        sendDate: response.sendDate,
        dueDate: response.dueDate,
        status: response.status,
        retryCount: response.retryCount,
        isCompleted: response.isCompleted,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
      };

      // Then schedule the notification using service worker
      // if (typeof window !== 'undefined') {
      //   try {
      //     await scheduleReminderNotification({
      //       goalId: reminder.goalId,
      //       title: reminder.title,
      //       description: reminder.description,
      //       sendDate: reminder.sendDate
      //     });
      //   } catch (error: unknown) {
      //     const errorMessage = error instanceof Error ? error.message : 'Failed to schedule notification';
      //     console.error('Failed to schedule notification:', errorMessage);
      //     // Don't throw here - we still created the reminder in the database
      //   }
      // }

      return reminder;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create reminder';
      console.error('Reminder creation error:', errorMessage);
      throw error;
    }
  }

  /**
   * Get all reminders for a user with enhanced error handling
   */
  async getReminders(userId: string): Promise<Reminder[]> {
    try {
      validateConfig();
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        REMINDERS_COLLECTION_ID,
        [Query.equal('userId', userId)]
      );

      return response.documents.map(doc => ({
        id: doc.$id,
        goalId: doc.goalId,
        userId: doc.userId,
        title: doc.title,
        description: doc.description,
        sendDate: doc.sendDate,
        dueDate: doc.dueDate,
        status: doc.status,
        retryCount: doc.retryCount,
        isCompleted: doc.isCompleted,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        nextRetry: doc.nextRetry
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch reminders';
      console.error('Reminders fetching error:', errorMessage);
      throw error;
    }
  }

  /**
   * Get due reminders that need to be processed
   */
  async getDueReminders(): Promise<Reminder[]> {
    try {
      validateConfig();
      const now = new Date().toISOString();
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        REMINDERS_COLLECTION_ID,
        [
          Query.equal('status', 'pending'),
          Query.lessThanEqual('sendDate', now),
          Query.lessThan('retryCount', CONFIG.maxRetries)
        ]
      );

      return response.documents.map(doc => ({
        id: doc.$id,
        goalId: doc.goalId,
        userId: doc.userId,
        title: doc.title,
        description: doc.description,
        sendDate: doc.sendDate,
        dueDate: doc.dueDate,
        status: doc.status,
        retryCount: doc.retryCount,
        isCompleted: doc.isCompleted,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        nextRetry: doc.nextRetry
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch due reminders';
      console.error('Due reminders fetching error:', errorMessage);
      throw error;
    }
  }

  /**
   * Get reminders for a specific goal
   */
  async getRemindersByGoalId(goalId: string): Promise<Reminder[]> {
    try {
      validateConfig();
      
      const response = await databases.listDocuments(
        DATABASE_ID,
        REMINDERS_COLLECTION_ID,
        [Query.equal('goalId', goalId)]
      );

      return response.documents.map(doc => ({
        id: doc.$id,
        goalId: doc.goalId,
        userId: doc.userId,
        title: doc.title,
        description: doc.description,
        sendDate: doc.sendDate,
        dueDate: doc.dueDate,
        status: doc.status,
        retryCount: doc.retryCount,
        isCompleted: doc.isCompleted,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        nextRetry: doc.nextRetry
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch reminders for goal';
      console.error('Goal reminders fetching error:', errorMessage);
      throw error;
    }
  }

  /**
   * Update reminder status with enhanced tracking
   */
  async updateReminderStatus(
    reminderId: string, 
    status: Reminder['status']
  ): Promise<Reminder> {
    try {
      validateConfig();
      
      const response = await databases.updateDocument(
        DATABASE_ID,
        REMINDERS_COLLECTION_ID,
        reminderId,
        {
          status,
          updatedAt: new Date().toISOString()
        }
      );

      return {
        id: response.$id,
        goalId: response.goalId,
        userId: response.userId,
        title: response.title,
        description: response.description,
        sendDate: response.sendDate,
        dueDate: response.dueDate,
        status: response.status,
        retryCount: response.retryCount,
        isCompleted: response.isCompleted,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        nextRetry: response.nextRetry
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update reminder status';
      console.error('Reminder status update error:', errorMessage);
      throw error;
    }
  }

  /**
   * Update retry count with next retry time
   */
  async updateRetryCount(reminderId: string, retryCount: number): Promise<Reminder> {
    try {
      validateConfig();
      
      const nextRetry = new Date(Date.now() + CONFIG.retryDelay).toISOString();
      
      const response = await databases.updateDocument(
        DATABASE_ID,
        REMINDERS_COLLECTION_ID,
        reminderId,
        {
          retryCount,
          nextRetry,
          updatedAt: new Date().toISOString()
        }
      );

      return {
        id: response.$id,
        goalId: response.goalId,
        userId: response.userId,
        title: response.title,
        description: response.description,
        sendDate: response.sendDate,
        dueDate: response.dueDate,
        status: response.status,
        retryCount: response.retryCount,
        isCompleted: response.isCompleted,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt,
        nextRetry: response.nextRetry
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update retry count';
      console.error('Retry count update error:', errorMessage);
      throw error;
    }
  }

  /**
   * Delete all reminders for a goal
   */
  async deleteRemindersByGoalId(goalId: string): Promise<void> {
    try {
      validateConfig();
      
      // First get all reminders for this goal
      const reminders = await this.getRemindersByGoalId(goalId);
      
      // Then delete them one by one
      const deletePromises = reminders.map(reminder => 
        databases.deleteDocument(
          DATABASE_ID,
          REMINDERS_COLLECTION_ID,
          reminder.id
        )
      );
      
      await Promise.all(deletePromises);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete reminders';
      console.error('Reminders deletion error:', errorMessage);
      throw error;
    }
  }

  /**
   * Mark reminder as sent
   */
  async markReminderAsSent(reminderId: string): Promise<Reminder> {
    return this.updateReminderStatus(reminderId, 'sent');
  }

  /**
   * Mark reminder as failed
   */
  async markReminderAsFailed(reminderId: string): Promise<Reminder> {
    return this.updateReminderStatus(reminderId, 'failed');
  }
}

// Export a singleton instance
export const reminderService = new ReminderService(); 