'use client';

import { ID, Query } from 'appwrite';
import { databases, DATABASE_ID, REMINDERS_COLLECTION_ID } from './client';

// Updated reminder data structure for recurring reminders
type ReminderData = {
  goalId: string;
  userId: string;
  userEmail: string;
  userName?: string;
  title: string;
  description?: string;
  sendAt: string;
  status: 'pending' | 'sent' | 'failed';
  retryCount: number;
  // New fields for recurring reminders
  isRecurring?: boolean;
  recurringDuration?: number;  // Total days (e.g., 30)
  currentDay?: number;         // Current day (1, 2, 3...)
  endDate?: string;           // When to stop recurring
  lastSentDate?: string;      // Track last successful send
};

type ReminderInput = Omit<ReminderData, 'status' | 'retryCount'>;

const CONFIG = {
  databaseId: DATABASE_ID,
  collectionId: REMINDERS_COLLECTION_ID,
  maxRetries: 3,
  retryDelay: 30 * 60 * 1000 // 30 minutes
} as const;

const validateConfig = () => {
  if (!CONFIG.databaseId || !CONFIG.collectionId) {
    throw new Error(`Database or Collection ID not configured. 
      Database ID: ${CONFIG.databaseId}, 
      Collection ID: ${CONFIG.collectionId}`
    );
  }
};

// Simple function to create reminder (like Salein)
export const createReminder = async (reminder: ReminderInput) => {
  validateConfig();
  return databases.createDocument(
    CONFIG.databaseId,
    CONFIG.collectionId,
    ID.unique(),
    {
      ...reminder,
      status: 'pending',
      retryCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  );
};

// New function to create a single recurring reminder
export const createRecurringReminder = async (
  reminder: ReminderInput, 
  duration: number = 30
) => {
  validateConfig();
  
  const startDate = new Date(reminder.sendAt);
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + duration - 1);
  
  return databases.createDocument(
    CONFIG.databaseId,
    CONFIG.collectionId,
    ID.unique(),
    {
      ...reminder,
      status: 'pending',
      retryCount: 0,
      isRecurring: true,
      recurringDuration: duration,
      currentDay: 1,
      endDate: endDate.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  );
};

// Function to advance a recurring reminder to the next day
export const advanceRecurringReminder = async (reminderId: string) => {
  validateConfig();
  
  // Get the current reminder
  const reminder = await databases.getDocument(
    CONFIG.databaseId,
    CONFIG.collectionId,
    reminderId
  );
  
  if (!reminder.isRecurring || reminder.currentDay >= reminder.recurringDuration) {
    // Not recurring or reached the end, mark as completed
    return databases.updateDocument(
      CONFIG.databaseId,
      CONFIG.collectionId,
      reminderId,
      {
        status: 'sent',
        updatedAt: new Date().toISOString()
      }
    );
  }
  
  // Calculate next send time (tomorrow at same time)
  const nextSendAt = new Date(reminder.sendAt);
  nextSendAt.setDate(nextSendAt.getDate() + 1);
  
  return databases.updateDocument(
    CONFIG.databaseId,
    CONFIG.collectionId,
    reminderId,
    {
      currentDay: reminder.currentDay + 1,
      sendAt: nextSendAt.toISOString(),
      lastSentDate: new Date().toISOString(),
      status: 'pending', // Reset to pending for next send
      retryCount: 0,     // Reset retry count
      updatedAt: new Date().toISOString()
    }
  );
};

// Simple function to get due reminders (like Salein)
export const getDueReminders = async () => {
  validateConfig();
  const now = new Date().toISOString();
  
  const reminders = await databases.listDocuments(
    CONFIG.databaseId,
    CONFIG.collectionId,
    [
      Query.equal('status', 'pending'),
      Query.lessThanEqual('sendAt', now),
      Query.lessThan('retryCount', CONFIG.maxRetries)
    ]
  );

  return reminders;
};

// Function to get all pending reminders for debugging
export const getAllPendingReminders = async () => {
  validateConfig();
  
  const reminders = await databases.listDocuments(
    CONFIG.databaseId,
    CONFIG.collectionId,
    [
      Query.equal('status', 'pending'),
      Query.lessThan('retryCount', CONFIG.maxRetries)
    ]
  );

  return reminders;
};

// Simple function to update reminder status (like Salein)
export const updateReminderStatus = async (
  reminderId: string, 
  status: ReminderData['status']
) => {
  validateConfig();
  return databases.updateDocument(
    CONFIG.databaseId,
    CONFIG.collectionId,
    reminderId,
    { 
      status,
      updatedAt: new Date().toISOString()
    }
  );
};

// Simple function to update retry count (like Salein)
export const updateRetryCount = async (
  reminderId: string, 
  retryCount: number
) => {
  validateConfig();
  return databases.updateDocument(
    CONFIG.databaseId,
    CONFIG.collectionId,
    reminderId,
    {
      retryCount,
      nextRetry: new Date(Date.now() + CONFIG.retryDelay).toISOString(),
      updatedAt: new Date().toISOString()
    }
  );
};

// Export reminder service object (like Salein)
export const reminderService = {
  createReminder,
  createRecurringReminder,
  advanceRecurringReminder,
  getDueReminders,
  getAllPendingReminders,
  updateReminderStatus,
  updateRetryCount
} as const; 
