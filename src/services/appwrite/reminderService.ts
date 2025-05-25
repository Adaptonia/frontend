'use client';

import { ID, Query } from 'appwrite';
import { databases, DATABASE_ID, REMINDERS_COLLECTION_ID } from './client';
import { scheduleReminderNotification } from '@/app/sw-register';

// Interface for creating a reminder
export interface CreateReminderRequest {
  goalId: string;
  userId?: string;
  title: string;
  description?: string;
  sendDate: string;
  dueDate?: string;
}

// Reminder interface for the database
export interface Reminder {
  id: string;
  goalId: string;
  userId: string;
  title: string;
  description?: string;
  sendDate: string;
  dueDate?: string;
  isCompleted: boolean;
  isSent: boolean;
  createdAt: string;
  updatedAt: string;
}

// Reminder service
class ReminderService {
  /**
   * Create a new reminder
   */
  async createReminder(reminderData: CreateReminderRequest): Promise<Reminder> {
    try {
      // First create the reminder in the database
      const response = await databases.createDocument(
        DATABASE_ID,
        REMINDERS_COLLECTION_ID,
        ID.unique(),
        {
          ...reminderData,
          userId: reminderData.userId || 'system',
          isCompleted: false,
          isSent: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      );

      const reminder = {
        id: response.$id,
        goalId: response.goalId,
        userId: response.userId,
        title: response.title,
        description: response.description,
        sendDate: response.sendDate,
        dueDate: response.dueDate,
        isCompleted: response.isCompleted,
        isSent: response.isSent,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
      };

      // Then schedule the notification using service worker
      if (typeof window !== 'undefined') {
        // Check if we're in a browser environment
        try {
          await scheduleReminderNotification({
            goalId: reminder.goalId,
            title: reminder.title,
            description: reminder.description,
            sendDate: reminder.sendDate
          });
        } catch (error) {
          console.error('Failed to schedule notification:', error);
          // Don't throw here - we still created the reminder in the database
        }
      }

      return reminder;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create reminder';
      console.error('Reminder creation error:', errorMessage);
      throw error;
    }
  }

  /**
   * Get all reminders for a user
   */
  async getReminders(userId: string): Promise<Reminder[]> {
    try {
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
        isCompleted: doc.isCompleted,
        isSent: doc.isSent,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch reminders';
      console.error('Reminders fetching error:', errorMessage);
      throw error;
    }
  }

  /**
   * Get reminders for a specific goal
   */
  async getRemindersByGoalId(goalId: string): Promise<Reminder[]> {
    try {
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
        isCompleted: doc.isCompleted,
        isSent: doc.isSent,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      }));
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch reminders';
      console.error('Reminders fetching error:', errorMessage);
      throw error;
    }
  }

  /**
   * Mark a reminder as sent
   */
  async markReminderAsSent(reminderId: string): Promise<Reminder> {
    try {
      const response = await databases.updateDocument(
        DATABASE_ID,
        REMINDERS_COLLECTION_ID,
        reminderId,
        {
          isSent: true,
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
        isCompleted: response.isCompleted,
        isSent: response.isSent,
        createdAt: response.createdAt,
        updatedAt: response.updatedAt
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark reminder as sent';
      console.error('Reminder update error:', errorMessage);
      throw error;
    }
  }

  /**
   * Delete all reminders for a goal
   */
  async deleteRemindersByGoalId(goalId: string): Promise<void> {
    try {
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
}

// Export a singleton instance
export const reminderService = new ReminderService(); 