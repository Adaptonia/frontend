'use client';

import { ID, Query } from 'appwrite';
import { databases, DATABASE_ID, REMINDERS_COLLECTION_ID } from './client';

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
      console.log('🔧 REMINDER SERVICE: createReminder called with data:', reminderData);
      console.log('🔑 REMINDER SERVICE: Environment variables:', {
        DATABASE_ID: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID,
        REMINDERS_COLLECTION_ID: process.env.NEXT_PUBLIC_APPWRITE_REMINDERS_COLLECTION_ID
      });
      console.log('🔑 REMINDER SERVICE: Using IDs:', {
        DATABASE_ID,
        REMINDERS_COLLECTION_ID
      });
      
      validateConfig();
      console.log('✅ REMINDER SERVICE: Config validation passed');
      console.log('🗃️ REMINDER SERVICE: Using database config:', {
        DATABASE_ID,
        REMINDERS_COLLECTION_ID
      });
      
      const documentData = {
        ...reminderData,
        userId: reminderData.userId || 'system',
        status: 'pending',
        retryCount: 0,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log('💾 REMINDER SERVICE: Creating document in Appwrite with data:', documentData);
      
      // First create the reminder in the database
      const response = await databases.createDocument(
        DATABASE_ID,
        REMINDERS_COLLECTION_ID,
        ID.unique(),
        documentData
      );
      
      console.log('✅ REMINDER SERVICE: Document created successfully in Appwrite:', response);

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

      console.log('🎯 REMINDER SERVICE: Reminder object created:', reminder);
      
      // 🎯 SIMPLIFIED APPROACH: Store in database only
      // Email notifications will be handled via Resend instead of push notifications
      console.log('📡 REMINDER SERVICE: Reminder stored in database');
      console.log('📧 REMINDER SERVICE: Email notifications will be handled via Resend');
      console.log('⏰ REMINDER SERVICE: Scheduled for:', reminder.sendDate);

      console.log('✅ REMINDER SERVICE: createReminder completed successfully');
      return reminder;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create reminder';
      console.error('❌ REMINDER SERVICE: Reminder creation error:', errorMessage);
      console.error('❌ REMINDER SERVICE: Full error details:', error);
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
   * Mark a reminder as completed
   */
  async markReminderCompleted(reminderId: string): Promise<Reminder> {
    try {
      validateConfig();
      
      const response = await databases.updateDocument(
        DATABASE_ID,
        REMINDERS_COLLECTION_ID,
        reminderId,
        {
          isCompleted: true,
          status: 'sent',
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark reminder as completed';
      console.error('Reminder completion error:', errorMessage);
      throw error;
    }
  }

  /**
   * Handle retry logic for failed reminders
   */
  async handleReminderRetry(reminderId: string): Promise<Reminder> {
    try {
      validateConfig();
      
      // First get the current reminder
      const reminder = await databases.getDocument(
        DATABASE_ID,
        REMINDERS_COLLECTION_ID,
        reminderId
      );
      
      const retryCount = reminder.retryCount + 1;
      const nextRetry = new Date(Date.now() + CONFIG.retryDelay).toISOString();
      
      // Update with retry information
      const response = await databases.updateDocument(
        DATABASE_ID,
        REMINDERS_COLLECTION_ID,
        reminderId,
        {
          retryCount,
          nextRetry,
          status: retryCount >= CONFIG.maxRetries ? 'failed' : 'pending',
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to handle reminder retry';
      console.error('Reminder retry error:', errorMessage);
      throw error;
    }
  }

  /**
   * Delete a reminder
   */
  async deleteReminder(reminderId: string): Promise<boolean> {
    try {
      validateConfig();
      
      await databases.deleteDocument(
        DATABASE_ID,
        REMINDERS_COLLECTION_ID,
        reminderId
      );
      
      return true;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete reminder';
      console.error('Reminder deletion error:', errorMessage);
      return false;
    }
  }
}

export const reminderService = new ReminderService(); 
